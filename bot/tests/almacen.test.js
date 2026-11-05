import test from 'node:test';
import assert from 'node:assert/strict';
import { crearAlmacen, datosVacios, migrarAPrefijos } from '../src/almacen.js';
import { crearEnrutador } from '../src/canales/index.js';
import { normalizarTelegram } from '../src/canales/telegram.js';

test('migración al formato con canal: chats, admins y enlaces de la versión anterior', () => {
  const viejo = {
    admins: ['111'],
    horario: 'lun-sab 09:00-12:00',
    conversaciones: { 222: { chatId: '222', modo: 'humano', historial: [], lead: {} } },
    enlaces: { '111:55': '222' },
    uso: { m: { llamadas: 1 } },
  };
  const nuevo = migrarAPrefijos(viejo);
  assert.deepEqual(nuevo.admins, ['tg_111']);
  assert.equal(nuevo.conversaciones.tg_222.chatId, 'tg_222');
  assert.equal(nuevo.enlaces['tg_111:55'], 'tg_222');
  assert.equal(nuevo.horario, 'lun-sab 09:00-12:00');
  // Aplicarla dos veces no cambia nada.
  assert.deepEqual(migrarAPrefijos(nuevo), nuevo);
});

test('el almacén informa qué conversaciones cambiaron o se borraron desde el último guardado', () => {
  const guardados = [];
  const almacen = crearAlmacen(datosVacios(), (_d, cambios) => guardados.push({ tocadas: [...cambios.tocadas], borradas: [...cambios.borradas] }));
  const conv = almacen.conversacion('tg_1');
  almacen.agregarMensaje(conv, 'cliente', 'hola');
  almacen.conversacion('tg_2');
  almacen.guardar();
  assert.deepEqual(guardados.at(-1), { tocadas: ['tg_1', 'tg_2'], borradas: [] });
  almacen.reiniciar('tg_2');
  assert.deepEqual(guardados.at(-1), { tocadas: [], borradas: ['tg_2'] });
  assert.equal(almacen.conversacionExistente('tg_2'), undefined);
});

test('el enrutador envía cada mensaje por el canal de su chat', async () => {
  const enviados = [];
  const canal = (prefijo) => ({ prefijo, enviar: async (chatId, texto) => enviados.push(`${prefijo}:${chatId}:${texto}`) });
  const enrutador = crearEnrutador([canal('tg'), canal('wa')]);
  await enrutador.enviar('tg_5', 'hola');
  await enrutador.enviar('wa_50760001111', 'buenas');
  assert.deepEqual(enviados, ['tg:tg_5:hola', 'wa:wa_50760001111:buenas']);
  assert.throws(() => enrutador.enviar('xx_1', 'nada'), /No hay canal/);
});

test('Telegram: el chatId lleva el prefijo del canal', () => {
  const msg = normalizarTelegram({ chat: { id: 123, type: 'private' }, from: { first_name: 'Ana' }, text: 'hola' });
  assert.equal(msg.chatId, 'tg_123');
});
