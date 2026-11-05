// Canal Telegram. Interfaz común de los canales:
//   enviar(chatId, texto, { responderA }) → id del mensaje enviado
//   escribiendo(chatId)                    → indicador "escribiendo…" (opcional)
//   escuchar(alRecibir)                    → entrega mensajes normalizados:
//     { chatId, nombre, usuario, texto, esTexto, respuestaA }
const LIMITE_TEXTO = 4000;

export function normalizarTelegram(mensaje) {
  return {
    chatId: String(mensaje.chat.id),
    nombre: [mensaje.from?.first_name, mensaje.from?.last_name].filter(Boolean).join(' '),
    usuario: mensaje.from?.username || '',
    texto: (mensaje.text ?? mensaje.caption ?? '').trim(),
    esTexto: typeof mensaje.text === 'string',
    respuestaA: mensaje.reply_to_message?.message_id,
  };
}

export function crearCanalTelegram({ token, fetchFn = globalThis.fetch, registro = console }) {
  async function api(metodo, datos = {}, tiempo = 15000) {
    const r = await fetchFn(`https://api.telegram.org/bot${token}/${metodo}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos),
      signal: AbortSignal.timeout(tiempo),
    });
    const j = await r.json();
    if (!j.ok) throw new Error(`Telegram ${metodo}: ${j.description}`);
    return j.result;
  }

  return {
    nombre: 'telegram',

    async enviar(chatId, texto, { responderA } = {}) {
      let ultimoId;
      for (let i = 0; i < texto.length; i += LIMITE_TEXTO) {
        const enviado = await api('sendMessage', {
          chat_id: chatId,
          text: texto.slice(i, i + LIMITE_TEXTO),
          ...(responderA && i === 0 ? { reply_parameters: { message_id: responderA, allow_sending_without_reply: true } } : {}),
        });
        ultimoId = enviado.message_id;
      }
      return ultimoId;
    },

    async escribiendo(chatId) {
      try { await api('sendChatAction', { chat_id: chatId, action: 'typing' }); } catch { /* no es crítico */ }
    },

    // Modo local: consulta continua a Telegram (no hace falta servidor público).
    async escuchar(alRecibir) {
      await api('deleteWebhook');
      let desde = 0;
      for (;;) {
        let novedades = [];
        try {
          novedades = await api('getUpdates', { offset: desde, timeout: 30, allowed_updates: ['message'] }, 40000);
        } catch (e) {
          registro.error(`[telegram] ${e.message}; reintento en 5 s`);
          await new Promise((ok) => setTimeout(ok, 5000));
          continue;
        }
        for (const n of novedades) {
          desde = n.update_id + 1;
          if (!n.message || n.message.chat.type !== 'private') continue;
          try {
            await alRecibir(normalizarTelegram(n.message));
          } catch (e) {
            registro.error(`[bot] error procesando mensaje de ${n.message.chat.id}: ${e.stack || e.message}`);
          }
        }
      }
    },
  };
}
