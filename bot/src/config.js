// Toda la configuración sale de variables de entorno: el archivo .env en local, las variables y
// secretos de Cloudflare en la nube. Cambiar de canal, de IA o de cuentas es cambiar estos valores.
// Este módulo no toca el disco para poder usarse también en la nube.

export function leerConfig(entorno) {
  const c = {
    telegramToken: entorno.TELEGRAM_TOKEN || '',
    // WhatsApp queda activo si están sus credenciales; convive con Telegram.
    whatsapp: {
      token: entorno.WHATSAPP_TOKEN || '',
      numeroId: entorno.WHATSAPP_NUMERO_ID || '',
      secretoApp: entorno.WHATSAPP_SECRETO_APP || '',
      verificacion: entorno.WHATSAPP_VERIFICACION || '',
      version: entorno.WHATSAPP_API_VERSION || 'v23.0',
    },
    ia: {
      proveedor: entorno.IA_PROVEEDOR || 'gemini',
      modelo: entorno.IA_MODELO || 'gemini-3.5-flash-lite',
      // Lista separada por comas: se usan, en orden, si el principal falla.
      respaldos: (entorno.IA_MODELOS_RESPALDO || '').split(',').map((m) => m.trim()).filter(Boolean),
      geminiClave: entorno.GEMINI_API_KEY || '',
      anthropicClave: entorno.ANTHROPIC_API_KEY || '',
    },
    negocio: entorno.NEGOCIO || 'Barü Bio',
    asesor: entorno.ASESOR || 'su asesor personal',
    horario: entorno.HORARIO || 'lun-vie 09:00-12:00 15:00-19:00',
    zonaHoraria: entorno.ZONA_HORARIA || 'America/Panama',
    preciosUrl: entorno.PRECIOS_URL || '',
    claveAdmin: entorno.CLAVE_ADMIN || '',
    // Clave con la que el bot escribe en la pestaña Clientes (propiedad CLAVE_BOT del Apps Script).
    hojaClaveBot: entorno.HOJA_CLAVE_BOT || '',
  };

  const faltan = [];
  const w = c.whatsapp;
  if (!c.telegramToken && !w.token) faltan.push('TELEGRAM_TOKEN o WHATSAPP_TOKEN');
  if (w.token) for (const [clave, nombre] of [['numeroId', 'WHATSAPP_NUMERO_ID'], ['secretoApp', 'WHATSAPP_SECRETO_APP'], ['verificacion', 'WHATSAPP_VERIFICACION']]) {
    if (!w[clave]) faltan.push(nombre);
  }
  if (c.ia.proveedor === 'gemini' && !c.ia.geminiClave) faltan.push('GEMINI_API_KEY');
  if (!c.claveAdmin) faltan.push('CLAVE_ADMIN');
  if (faltan.length) throw new Error(`Faltan variables de configuración: ${faltan.join(', ')}`);
  return c;
}
