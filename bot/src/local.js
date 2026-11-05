// Arranque local (pruebas): el bot corre en este equipo y consulta Telegram continuamente.
// OJO: mientras corre, desactiva el webhook de la nube; al terminar hay que volver a configurarlo
// con `npm run nube:webhook`.
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { crearAlmacenArchivo } from './almacen-archivo.js';
import { montarBot } from './montar.js';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const archivoEnv = path.join(raiz, '.env');
if (existsSync(archivoEnv)) process.loadEnvFile(archivoEnv);

const { config, bot, telegram } = montarBot({
  entorno: process.env,
  faq: readFileSync(path.join(raiz, 'conocimiento/preguntas-frecuentes.md'), 'utf8'),
  almacen: crearAlmacenArchivo(path.resolve(raiz, process.env.DATOS_DIR || './datos')),
});

if (!telegram) throw new Error('El modo local solo escucha Telegram: falta TELEGRAM_TOKEN en .env');
console.log(`Bot en marcha (local) · IA ${config.ia.proveedor}/${config.ia.modelo}. Ctrl+C para detener.`);
console.warn('Aviso: el modo local desactiva el webhook de la nube. Al terminar: npm run nube:webhook');
await telegram.escuchar(async (msg) => {
  console.log(`[${new Date().toLocaleTimeString('es-PA')}] ${msg.nombre || msg.chatId}: ${msg.texto.slice(0, 80)}`);
  await bot.recibir(msg);
});
