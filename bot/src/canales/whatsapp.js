// Canal WhatsApp (API oficial de Meta, "Cloud API"). Misma interfaz que el canal Telegram.
// Meta entrega cada mensaje a la URL del bot (webhook) firmado con el secreto de la aplicación.
// Ojo: fuera de las 24 h desde el último mensaje del cliente, WhatsApp solo deja enviar plantillas
// aprobadas; por eso los admins conviene que estén en Telegram.
const LIMITE_TEXTO = 4000;
export const PREFIJO_WHATSAPP = 'wa';

const idWhatsapp = (chatId) => String(chatId).replace(`${PREFIJO_WHATSAPP}_`, '');

// Un aviso de Meta puede traer varios mensajes, y también estados (entregado, leído) que no interesan.
export function mensajesDeAviso(aviso) {
  const mensajes = [];
  for (const entrada of aviso?.entry || []) {
    for (const cambio of entrada.changes || []) {
      const v = cambio.value || {};
      const nombres = Object.fromEntries((v.contacts || []).map((c) => [c.wa_id, c.profile?.name || '']));
      for (const m of v.messages || []) {
        const texto = m.text?.body ?? m.image?.caption ?? m.video?.caption ?? m.document?.caption ?? '';
        mensajes.push({
          chatId: `${PREFIJO_WHATSAPP}_${m.from}`,
          nombre: nombres[m.from] || '',
          usuario: `+${m.from}`,
          texto: texto.trim(),
          esTexto: m.type === 'text',
          respuestaA: m.context?.id,
          idMensaje: m.id,
        });
      }
    }
  }
  return mensajes;
}

// Comprueba la cabecera X-Hub-Signature-256 (HMAC-SHA256 del cuerpo con el secreto de la aplicación).
export async function firmaValida(cuerpo, firma, secreto) {
  if (!firma?.startsWith('sha256=') || !secreto) return false;
  const clave = await crypto.subtle.importKey('raw', new TextEncoder().encode(secreto), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', clave, new TextEncoder().encode(cuerpo)));
  const esperada = [...mac].map((b) => b.toString(16).padStart(2, '0')).join('');
  const recibida = firma.slice('sha256='.length);
  if (recibida.length !== esperada.length) return false;
  let distinto = 0;
  for (let i = 0; i < esperada.length; i++) distinto |= esperada.charCodeAt(i) ^ recibida.charCodeAt(i);
  return distinto === 0;
}

export function crearCanalWhatsapp({ token, numeroId, version = 'v23.0', fetchFn = (...a) => fetch(...a) }) {
  async function api(datos) {
    const r = await fetchFn(`https://graph.facebook.com/${version}/${numeroId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ messaging_product: 'whatsapp', ...datos }),
      signal: AbortSignal.timeout(15000),
    });
    const j = await r.json();
    if (!r.ok) throw new Error(`WhatsApp: ${j.error?.message || r.status}`);
    return j;
  }

  return {
    nombre: 'whatsapp',
    prefijo: PREFIJO_WHATSAPP,

    async enviar(chatId, texto, { responderA } = {}) {
      let ultimoId;
      for (let i = 0; i < texto.length; i += LIMITE_TEXTO) {
        const enviado = await api({
          to: idWhatsapp(chatId),
          type: 'text',
          text: { body: texto.slice(i, i + LIMITE_TEXTO) },
          ...(responderA && i === 0 ? { context: { message_id: responderA } } : {}),
        });
        ultimoId = enviado.messages?.[0]?.id;
      }
      return ultimoId;
    },

    // Marca el mensaje del cliente como leído (doble check azul) y muestra "escribiendo…".
    async escribiendo(chatId, idMensaje) {
      if (!idMensaje) return;
      try { await api({ status: 'read', message_id: idMensaje, typing_indicator: { type: 'text' } }); } catch { /* no es crítico */ }
    },
  };
}
