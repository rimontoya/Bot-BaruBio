// Arranque local (pruebas): el bot corre en este equipo y consulta Telegram continuamente.
// En producción se reemplaza por un punto de arranque en la nube que recibe los mensajes por webhook.
import { cargarConfig } from './config.js';
import { crearIa } from './ia/index.js';
import { crearCanalTelegram } from './canales/telegram.js';
import { crearAlmacenArchivo } from './almacen.js';
import { cargarCatalogo, obtenerPrecios, construirConocimiento } from './conocimiento.js';
import { crearBot } from './nucleo.js';

const REFRESCO_PRECIOS_MS = 10 * 60 * 1000;

const config = cargarConfig();
const catalogo = cargarCatalogo();

// El conocimiento se rehace cada 10 minutos para tomar los precios nuevos de la hoja.
let conocimiento = null;
let refrescado = 0;
async function obtenerConocimiento() {
  if (!conocimiento || Date.now() - refrescado > REFRESCO_PRECIOS_MS) {
    const precios = await obtenerPrecios(config.preciosUrl);
    if (!precios) console.warn('[precios] no se pudo leer la hoja: se usa la lista oficial');
    conocimiento = construirConocimiento(catalogo, precios);
    refrescado = Date.now();
  }
  return conocimiento;
}

const canal = crearCanalTelegram({ token: config.telegramToken });
const bot = crearBot({
  config,
  ia: crearIa(config.ia),
  canal,
  almacen: crearAlmacenArchivo(config.datosDir),
  obtenerConocimiento,
});

await obtenerConocimiento();
console.log(`Bot en marcha · canal ${config.canal} · IA ${config.ia.proveedor}/${config.ia.modelo}. Ctrl+C para detener.`);
await canal.escuchar(async (msg) => {
  console.log(`[${new Date().toLocaleTimeString('es-PA')}] ${msg.nombre || msg.chatId}: ${msg.texto.slice(0, 80)}`);
  await bot.recibir(msg);
});
