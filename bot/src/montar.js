// Arma el bot con sus piezas según la configuración. Lo usan el arranque local y el de la nube.
import { leerConfig } from './config.js';
import { catalogo } from './catalogo.js';
import { crearFuenteConocimiento } from './conocimiento.js';
import { crearIa } from './ia/index.js';
import { crearCanalTelegram } from './canales/telegram.js';
import { crearEnrutador } from './canales/index.js';
import { crearBot } from './nucleo.js';
import { crearRegistroHoja } from './registro-clientes.js';

export function montarBot({ entorno, faq, almacen, registro = console }) {
  const config = leerConfig(entorno);
  const telegram = crearCanalTelegram({ token: config.telegramToken, registro });
  // Aquí se sumará WhatsApp: los dos canales quedan activos a la vez.
  const canal = crearEnrutador([telegram]);
  const bot = crearBot({
    config,
    ia: crearIa(config.ia),
    canal,
    almacen,
    obtenerConocimiento: crearFuenteConocimiento({ catalogo, faq, preciosUrl: config.preciosUrl, registro }),
    registroClientes: crearRegistroHoja({ url: config.preciosUrl, clave: config.hojaClaveBot, registro }),
    registro,
  });
  return { config, bot, telegram };
}
