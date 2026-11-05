// Cerebro del bot: no sabe de Telegram ni de WhatsApp, ni de qué IA usa.
// Recibe mensajes normalizados del canal y decide: responder, pasar a una persona o atender un comando de admin.
import { instrucciones, contextoTurno } from './prompt.js';
import { parsearHorario, estaAbierto, proximaApertura, describirHorario } from './horario.js';

export const ESQUEMA_RESPUESTA = {
  type: 'object',
  properties: {
    respuesta: { type: 'string', description: 'Mensaje para el cliente.' },
    accion: { type: 'string', enum: ['continuar', 'derivar'] },
    motivo: { type: 'string', description: 'Si derivas, por qué; si no, vacío.' },
    nombre: { type: 'string' },
    objetivo: { type: 'string' },
    productos: { type: 'array', items: { type: 'string' } },
    estado: { type: 'string', enum: ['curioso', 'interesado', 'calificado'] },
    resumen: { type: 'string', description: 'Resumen breve para el asesor.' },
  },
  required: ['respuesta', 'accion', 'motivo', 'nombre', 'objetivo', 'productos', 'estado', 'resumen'],
};

const capital = (t) => t.charAt(0).toUpperCase() + t.slice(1);

export function crearBot({ config, ia, canal, almacen, obtenerConocimiento, reloj = () => new Date(), registro = console }) {
  const reglasHorario = () => parsearHorario(almacen.datos.horario || config.horario);

  function momento() {
    const reglas = reglasHorario();
    const ahora = reloj();
    return {
      reglas,
      abierto: estaAbierto(reglas, config.zonaHoraria, ahora),
      proxima: proximaApertura(reglas, config.zonaHoraria, ahora),
      horarioTexto: describirHorario(reglas),
      ahora: new Intl.DateTimeFormat('es-PA', { timeZone: config.zonaHoraria, dateStyle: 'full', timeStyle: 'short' }).format(ahora),
    };
  }

  async function avisarAdmins(texto, clienteChatId) {
    const admins = almacen.datos.admins;
    if (!admins.length) registro.warn('[bot] no hay admins registrados: nadie recibe el aviso');
    for (const admin of admins) {
      try {
        const id = await canal.enviar(admin, texto);
        if (clienteChatId) almacen.enlazar(admin, id, clienteChatId);
      } catch (e) {
        registro.error(`[bot] no se pudo avisar al admin ${admin}: ${e.message}`);
      }
    }
    almacen.guardar();
  }

  const etiquetaCliente = (conv) => `${conv.lead?.nombre || conv.nombre || 'Cliente'}${conv.usuario ? ` (@${conv.usuario})` : ''}`;

  async function derivar(conv, motivo) {
    conv.modo = 'humano';
    conv.derivada = reloj().toISOString();
    const m = momento();
    const ultimos = conv.historial.slice(-6).map((h) => `${h.rol === 'bot' ? '🤖' : '👤'} ${h.texto}`).join('\n');
    await avisarAdmins(
      `🔔 Cliente para atender${m.abierto ? '' : ' (llegó fuera de horario)'}\n\n`
      + `Cliente: ${etiquetaCliente(conv)}\n`
      + `Objetivo: ${conv.lead.objetivo || '—'}\n`
      + `Productos: ${(conv.lead.productos || []).join(', ') || '—'}\n`
      + `Estado: ${conv.lead.estado || '—'}\n`
      + `Motivo: ${motivo || '—'}\n`
      + `Resumen: ${conv.lead.resumen || '—'}\n\n`
      + `Últimos mensajes:\n${ultimos}\n\n`
      + `↩️ Responde a este mensaje para escribirle.\n▶️ /reactivar_${conv.chatId} para que el bot vuelva a atenderle.`,
      conv.chatId,
    );
  }

  // La IA ve los mensajes del asesor como turnos propios del negocio, y el historial empieza por el cliente.
  function historialParaIa(historial) {
    const lista = historial.map((h) => (h.rol === 'asesor' ? { rol: 'bot', texto: `(Mensaje de ${config.asesor}) ${h.texto}` } : h));
    while (lista.length && lista[0].rol !== 'cliente') lista.shift();
    return lista;
  }

  async function atenderCliente(msg) {
    const conv = almacen.conversacion(msg.chatId, { nombre: msg.nombre, usuario: msg.usuario });

    if (conv.modo === 'humano') {
      almacen.agregarMensaje(conv, 'cliente', msg.texto);
      await avisarAdmins(`💬 ${etiquetaCliente(conv)}:\n${msg.texto}\n\n↩️ Responde a este mensaje para contestarle.`, conv.chatId);
      return;
    }

    const primerMensaje = conv.historial.length === 0;
    almacen.agregarMensaje(conv, 'cliente', msg.texto);
    await canal.escribiendo?.(msg.chatId);

    const m = momento();
    let resultado;
    try {
      resultado = await ia.generar({
        sistema: instrucciones({ negocio: config.negocio, asesor: config.asesor, conocimiento: await obtenerConocimiento() }),
        contexto: contextoTurno({ ...m, primerMensaje }),
        historial: historialParaIa(conv.historial),
        esquema: ESQUEMA_RESPUESTA,
      });
      if (!resultado?.datos?.respuesta?.trim()) throw new Error('la IA devolvió una respuesta vacía');
    } catch (e) {
      registro.error(`[ia] ${e.message}`);
      // Si la IA falla, el cliente no se pierde: pasa a una persona.
      const aviso = `Disculpe, tuve un problema técnico. Le paso con ${config.asesor}, que le escribirá ${m.abierto ? 'en breve' : m.proxima || 'en el próximo horario de atención'}.`;
      almacen.agregarMensaje(conv, 'bot', aviso);
      await canal.enviar(msg.chatId, aviso);
      await derivar(conv, `Error técnico del bot (${e.message.slice(0, 80)})`);
      almacen.guardar();
      return;
    }

    const r = resultado.datos;
    almacen.registrarUso(resultado.modelo, resultado.entrada, resultado.salida);
    conv.lead = {
      nombre: r.nombre || conv.lead.nombre || '',
      objetivo: r.objetivo || conv.lead.objetivo || '',
      productos: r.productos?.length ? r.productos : conv.lead.productos || [],
      estado: r.estado || conv.lead.estado || 'curioso',
      resumen: r.resumen || conv.lead.resumen || '',
    };
    almacen.agregarMensaje(conv, 'bot', r.respuesta);
    await canal.enviar(msg.chatId, r.respuesta);
    if (r.accion === 'derivar') await derivar(conv, r.motivo);
    almacen.guardar();
  }

  const AYUDA_ADMIN = `Comandos de admin:
• Responde a un aviso del bot para escribirle a ese cliente.
• /reactivar_ID — el bot vuelve a atender a ese cliente.
• /clientes — últimos clientes y su estado.
• /horario — ver el horario de atención.
• /horario lun-vie 09:00-12:00 15:00-19:00; sab 09:00-12:00 — cambiarlo.
• /horario original — volver al horario configurado.
• /salir — dejar de ser admin.
Si escribes sin responder a un aviso, hablas con el bot como un cliente (sirve para probar).`;

  async function comandoAdmin(msg) {
    const texto = msg.texto;
    const responder = (t) => canal.enviar(msg.chatId, t);
    const listo = async (t) => { await responder(t); return true; };

    const reactivar = texto.match(/^\/reactivar_(\S+)/);
    if (reactivar) {
      const conv = almacen.conversacionExistente(reactivar[1]);
      if (!conv) return listo('No encuentro ese cliente.');
      conv.modo = 'bot';
      almacen.guardar();
      return listo(`✅ El bot vuelve a atender a ${etiquetaCliente(conv)}.`);
    }
    if (texto === '/clientes') {
      const lista = Object.values(almacen.datos.conversaciones)
        .sort((a, b) => (b.actualizada || '').localeCompare(a.actualizada || ''))
        .slice(0, 10)
        .map((c) => `• ${etiquetaCliente(c)} — ${c.lead?.estado || 'sin datos'}${c.modo === 'humano' ? ' — con asesor' : ''}\n  ${c.lead?.objetivo || ''}`);
      return listo(lista.length ? `Últimos clientes:\n${lista.join('\n')}` : 'Todavía no hay clientes.');
    }
    if (texto.startsWith('/horario')) {
      const nuevo = texto.slice('/horario'.length).trim();
      if (!nuevo) return listo(`Horario actual: ${describirHorario(reglasHorario())} (hora de Panamá).`);
      if (nuevo === 'original') {
        almacen.datos.horario = null;
      } else {
        try { parsearHorario(nuevo); } catch (e) { return listo(`No pude leer el horario: ${e.message}`); }
        almacen.datos.horario = nuevo;
      }
      almacen.guardar();
      return listo(`✅ Horario actualizado: ${describirHorario(reglasHorario())}.`);
    }
    if (texto === '/salir') {
      almacen.quitarAdmin(msg.chatId);
      return listo('Ya no eres admin.');
    }
    if (texto === '/ayuda') return listo(AYUDA_ADMIN);

    // Respuesta a un aviso → se reenvía al cliente.
    const cliente = msg.respuestaA && almacen.clienteEnlazado(msg.chatId, msg.respuestaA);
    if (cliente) {
      const conv = almacen.conversacion(cliente);
      conv.modo = 'humano';
      almacen.agregarMensaje(conv, 'asesor', msg.texto);
      await canal.enviar(cliente, `${capital(config.asesor)}:\n${msg.texto}`);
      almacen.guardar();
      return true;
    }
    return false;
  }

  return {
    async recibir(msg) {
      if (!msg.esTexto || !msg.texto) {
        await canal.enviar(msg.chatId, 'Por ahora solo puedo leer mensajes de texto. ¿Me cuenta por escrito en qué le puedo ayudar?');
        return;
      }
      if (msg.texto.startsWith('/admin')) {
        const clave = msg.texto.slice('/admin'.length).trim();
        if (clave && clave === config.claveAdmin) {
          almacen.agregarAdmin(msg.chatId);
          await canal.enviar(msg.chatId, `✅ Registrado como admin. Recibirás los clientes que el bot pase a una persona.\n\n${AYUDA_ADMIN}`);
        } else {
          await canal.enviar(msg.chatId, 'Clave incorrecta.');
        }
        return;
      }
      if (almacen.esAdmin(msg.chatId) && await comandoAdmin(msg)) return;

      if (msg.texto === '/reiniciar') {
        almacen.reiniciar(msg.chatId);
        await canal.enviar(msg.chatId, 'Conversación reiniciada. Escriba "hola" para empezar de nuevo.');
        return;
      }
      // /start de Telegram = saludo.
      await atenderCliente({ ...msg, texto: msg.texto === '/start' ? 'Hola' : msg.texto });
    },
  };
}
