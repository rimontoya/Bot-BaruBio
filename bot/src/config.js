// Toda la configuración sale de variables de entorno (archivo .env en local, secretos en la nube).
// Cambiar de canal, de IA o de cuentas es cambiar estos valores, no el código.
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const RAIZ_BOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function cargarConfig(entorno = process.env) {
  const archivo = path.join(RAIZ_BOT, '.env');
  if (entorno === process.env && existsSync(archivo)) process.loadEnvFile(archivo);

  const c = {
    canal: entorno.CANAL || 'telegram',
    telegramToken: entorno.TELEGRAM_TOKEN || '',
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
    datosDir: path.resolve(RAIZ_BOT, entorno.DATOS_DIR || './datos'),
  };

  const faltan = [];
  if (c.canal === 'telegram' && !c.telegramToken) faltan.push('TELEGRAM_TOKEN');
  if (c.ia.proveedor === 'gemini' && !c.ia.geminiClave) faltan.push('GEMINI_API_KEY');
  if (!c.claveAdmin) faltan.push('CLAVE_ADMIN');
  if (faltan.length) throw new Error(`Faltan variables en .env: ${faltan.join(', ')}`);
  return c;
}
