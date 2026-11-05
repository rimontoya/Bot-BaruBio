import test from 'node:test';
import assert from 'node:assert/strict';
import { crearBot } from '../src/nucleo.js';
import { crearAlmacenMemoria } from '../src/almacen.js';

const CONFIG = {
  negocio: 'Barü Bio', asesor: 'su asesor personal', horario: 'lun-vie 09:00-12:00 15:00-19:00',
  zonaHoraria: 'America/Panama', claveAdmin: 'secreta',
};
const JUEVES_10AM = new Date(Date.UTC(2026, 10, 5, 15, 0));

function preparar({ respuestas = [], fallaIa = false, reloj = JUEVES_10AM } = {}) {
  const enviados = [];
  let id = 100;
  const canal = {
    async enviar(chatId, texto) {
      id += 1;
      // El id no es enumerable para que deepEqual compare solo destino y texto.
      enviados.push(Object.defineProperty({ chatId, texto }, 'id', { value: id }));
      return id;
    },
  };
  const llamadas = [];
  const ia = {
    async generar(args) {
      llamadas.push(args);
      if (fallaIa) throw new Error('503 saturado');
      return { datos: respuestas.shift(), modelo: 'falso', entrada: 10, salida: 5 };
    },
  };
  const almacen = crearAlmacenMemoria();
  const bot = crearBot({ config: CONFIG, ia, canal, almacen, obtenerConocimiento: async () => 'CATALOGO', reloj: () => reloj, registro: { warn() {}, error() {} } });
  return { bot, enviados, llamadas, almacen };
}

const r = (respuesta, extra = {}) => ({
  respuesta, accion: 'continuar', motivo: '', nombre: '', objetivo: '', productos: [], estado: 'curioso', resumen: '', ...extra,
});
const msg = (chatId, texto, extra = {}) => ({ chatId, nombre: 'Ana', usuario: 'ana', texto, esTexto: true, ...extra });

test('el primer mensaje pide presentarse y /start cuenta como saludo', async () => {
  const { bot, enviados, llamadas } = preparar({ respuestas: [r('Hola, soy el asistente virtual…')] });
  await bot.recibir(msg('1', '/start'));
  assert.match(llamadas[0].contexto, /PRIMER mensaje/);
  assert.equal(llamadas[0].historial[0].texto, 'Hola');
  assert.equal(enviados[0].texto, 'Hola, soy el asistente virtual…');
});

test('al derivar avisa a los admins, y el cliente queda con el asesor', async () => {
  const { bot, enviados, almacen } = preparar({
    respuestas: [r('Le paso con su asesor personal.', { accion: 'derivar', motivo: 'Quiere comprar', estado: 'calificado', objetivo: 'Bajar de peso', productos: ['Tirzepatide'] })],
  });
  await bot.recibir(msg('9', '/admin secreta'));
  enviados.length = 0;

  await bot.recibir(msg('1', 'Quiero comprar Tirzepatide'));
  assert.equal(enviados[0].chatId, '1');
  const aviso = enviados.find((e) => e.chatId === '9');
  assert.match(aviso.texto, /Cliente para atender/);
  assert.match(aviso.texto, /Quiere comprar/);
  assert.match(aviso.texto, /\/reactivar_1/);
  assert.equal(almacen.datos.conversaciones['1'].modo, 'humano');
  assert.equal(almacen.datos.conversaciones['1'].lead.estado, 'calificado');
});

test('con el asesor: el cliente se reenvía al admin y la respuesta del admin llega al cliente', async () => {
  const { bot, enviados, llamadas } = preparar({ respuestas: [r('Le paso.', { accion: 'derivar', motivo: 'Comprar' })] });
  await bot.recibir(msg('9', '/admin secreta'));
  await bot.recibir(msg('1', 'Quiero comprar'));
  enviados.length = 0;

  await bot.recibir(msg('1', '¿Aceptan Yappy?'));
  assert.equal(llamadas.length, 1, 'no se llama a la IA mientras atiende el asesor');
  const reenvio = enviados.find((e) => e.chatId === '9');
  assert.match(reenvio.texto, /Yappy/);

  // El admin responde al mensaje reenviado.
  enviados.length = 0;
  await bot.recibir(msg('9', 'Sí, aceptamos Yappy', { respuestaA: reenvio.id }));
  assert.deepEqual(enviados, [{ chatId: '1', texto: 'Su asesor personal:\nSí, aceptamos Yappy' }]);
});

test('/reactivar devuelve el cliente al bot y la IA ve los mensajes del asesor como del negocio', async () => {
  const { bot, enviados, llamadas, almacen } = preparar({ respuestas: [r('Le paso.', { accion: 'derivar' }), r('Con gusto.')] });
  await bot.recibir(msg('9', '/admin secreta'));
  await bot.recibir(msg('1', 'Quiero comprar'));
  const aviso = enviados.find((e) => e.chatId === '9' && /Cliente para atender/.test(e.texto));
  await bot.recibir(msg('9', 'Ya le escribo', { respuestaA: aviso.id }));
  await bot.recibir(msg('9', '/reactivar_1'));
  assert.equal(almacen.datos.conversaciones['1'].modo, 'bot');

  await bot.recibir(msg('1', 'Gracias, otra pregunta'));
  const ultimo = llamadas.at(-1).historial;
  assert.equal(ultimo.find((h) => h.texto.includes('Ya le escribo')).rol, 'bot');
  assert.doesNotMatch(llamadas.at(-1).contexto, /PRIMER mensaje/);
});

test('si la IA falla, el cliente recibe aviso y pasa a una persona', async () => {
  const { bot, enviados, almacen } = preparar({ fallaIa: true });
  await bot.recibir(msg('9', '/admin secreta'));
  await bot.recibir(msg('1', 'Hola'));
  assert.match(enviados.find((e) => e.chatId === '1').texto, /problema técnico/);
  assert.equal(almacen.datos.conversaciones['1'].modo, 'humano');
});

test('una respuesta vacía de la IA se trata como fallo: el cliente pasa a una persona', async () => {
  const { bot, enviados, almacen } = preparar({ respuestas: [{}] });
  await bot.recibir(msg('1', 'Hola'));
  assert.match(enviados[0].texto, /problema técnico/);
  assert.equal(almacen.datos.conversaciones['1'].modo, 'humano');
});

test('fuera de horario el contexto lo indica con la próxima apertura', async () => {
  const juevesUnaPm = new Date(Date.UTC(2026, 10, 5, 18, 0));
  const { bot, llamadas } = preparar({ respuestas: [r('Hola')], reloj: juevesUnaPm });
  await bot.recibir(msg('1', 'Hola'));
  assert.match(llamadas[0].contexto, /FUERA DE HORARIO/);
  assert.match(llamadas[0].contexto, /hoy a las 15:00/);
});

test('admins: clave incorrecta, cambio de horario y mensajes que no son texto', async () => {
  const { bot, enviados, almacen } = preparar();
  await bot.recibir(msg('9', '/admin otra'));
  assert.equal(enviados.at(-1).texto, 'Clave incorrecta.');
  await bot.recibir(msg('9', '/admin secreta'));
  await bot.recibir(msg('9', '/horario lun-sab 09:00-12:00'));
  assert.equal(almacen.datos.horario, 'lun-sab 09:00-12:00');
  await bot.recibir(msg('9', '/horario 9 a 12'));
  assert.match(enviados.at(-1).texto, /No pude leer el horario/);
  await bot.recibir({ chatId: '2', texto: '', esTexto: false });
  assert.match(enviados.at(-1).texto, /solo puedo leer mensajes de texto/);
});

test('cada respuesta anota al cliente en la hoja, con su estado y quién le atiende', async () => {
  const anotados = [];
  const almacen = crearAlmacenMemoria();
  const respuestas = [
    r('Hola, ¿qué busca?', { estado: 'curioso' }),
    r('Le paso con su asesor personal.', { accion: 'derivar', estado: 'calificado', nombre: 'Ana', objetivo: 'Piel' }),
  ];
  const bot = crearBot({
    config: CONFIG,
    ia: { generar: async () => ({ datos: respuestas.shift(), modelo: 'falso' }) },
    canal: { enviar: async () => 1 },
    almacen,
    obtenerConocimiento: async () => '',
    registroClientes: { anotar: async (conv) => anotados.push({ estado: conv.lead.estado, modo: conv.modo, nombre: conv.lead.nombre }) },
    reloj: () => JUEVES_10AM,
    registro: { warn() {}, error() {} },
  });
  await bot.recibir(msg('tg_1', 'Hola'));
  await bot.recibir(msg('tg_1', 'Quiero comprar'));
  assert.deepEqual(anotados, [
    { estado: 'curioso', modo: 'bot', nombre: '' },
    { estado: 'calificado', modo: 'humano', nombre: 'Ana' },
  ]);
});
