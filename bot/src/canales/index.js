// Varios canales a la vez (Telegram y, más adelante, WhatsApp): cada mensaje sale por el canal
// al que pertenece el chat, según el prefijo de su chatId ("tg_…", "wa_…").
export function crearEnrutador(canales) {
  const porPrefijo = Object.fromEntries(canales.map((c) => [c.prefijo, c]));
  const canalDe = (chatId) => {
    const canal = porPrefijo[String(chatId).split('_')[0]];
    if (!canal) throw new Error(`No hay canal para el chat ${chatId}`);
    return canal;
  };
  return {
    enviar: (chatId, texto, opciones) => canalDe(chatId).enviar(chatId, texto, opciones),
    escribiendo: (chatId) => canalDe(chatId).escribiendo?.(chatId),
  };
}
