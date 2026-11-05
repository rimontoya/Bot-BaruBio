// Arranque en la nube (Cloudflare Workers).
// - El Worker recibe los mensajes de Telegram y WhatsApp (webhooks), comprueba la firma y responde enseguida.
// - El Durable Object "EstadoBot" guarda el estado y procesa los mensajes de uno en uno.
import { DurableObject } from 'cloudflare:workers';
import faq from '../conocimiento/preguntas-frecuentes.md';
import { crearAlmacen, datosVacios, migrarAPrefijos } from './almacen.js';
import { mensajeDeUpdate } from './canales/telegram.js';
import { mensajesDeAviso, firmaValida } from './canales/whatsapp.js';
import { montarBot } from './montar.js';

const CLAVE_META = 'meta';
const PREFIJO_CONV = 'conv:';

export class EstadoBot extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.cola = Promise.resolve();
    this.listo = null;
  }

  // Carga el estado guardado y arma el bot (una vez por cada vez que el objeto despierta).
  iniciar() {
    this.listo ||= (async () => {
      const storage = this.ctx.storage;
      const datos = { ...datosVacios(), ...((await storage.get(CLAVE_META)) || {}), conversaciones: {} };
      for (const [clave, conv] of await storage.list({ prefix: PREFIJO_CONV })) datos.conversaciones[clave.slice(PREFIJO_CONV.length)] = conv;

      const almacen = crearAlmacen(datos, (d, { tocadas, borradas }) => {
        const { conversaciones, ...meta } = d;
        const escrituras = { [CLAVE_META]: meta };
        for (const id of tocadas) if (conversaciones[id]) escrituras[PREFIJO_CONV + id] = conversaciones[id];
        // Las escrituras del Durable Object quedan confirmadas antes de responder; no hace falta esperarlas.
        storage.put(escrituras);
        if (borradas.size) storage.delete([...borradas].map((id) => PREFIJO_CONV + id));
      });
      return montarBot({ entorno: this.env, faq, almacen });
    })();
    return this.listo;
  }

  // Los mensajes se procesan en orden, uno detrás de otro, para que ninguna conversación se mezcle.
  recibir(msg) {
    const tarea = this.cola.then(async () => {
      const { bot } = await this.iniciar();
      await bot.recibir(msg);
    });
    this.cola = tarea.catch((e) => console.error(`[bot] ${e.stack || e.message}`));
    return tarea;
  }

  // Trae el estado de la versión local (admins, horario, conversaciones). Reemplaza lo que haya.
  async importar(datosLocales) {
    const d = migrarAPrefijos(datosLocales);
    await this.ctx.storage.deleteAll();
    const { conversaciones, ...meta } = d;
    const escrituras = { [CLAVE_META]: meta };
    for (const [id, conv] of Object.entries(conversaciones)) escrituras[PREFIJO_CONV + id] = conv;
    // put() acepta hasta 128 claves por llamada.
    const claves = Object.keys(escrituras);
    for (let i = 0; i < claves.length; i += 100) {
      await this.ctx.storage.put(Object.fromEntries(claves.slice(i, i + 100).map((k) => [k, escrituras[k]])));
    }
    this.listo = null;
    return { admins: meta.admins.length, conversaciones: Object.keys(conversaciones).length };
  }

  async configurarWebhook(url) {
    const { telegram } = await this.iniciar();
    await telegram.configurarWebhook(url, this.env.WEBHOOK_SECRETO);
    return telegram.estadoWebhook();
  }
}

const estado = (env) => env.ESTADO.get(env.ESTADO.idFromName('principal'));
const esAdminAutorizado = (request, env) => request.headers.get('X-Clave-Admin') === env.CLAVE_ADMIN;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === 'POST' && url.pathname === '/telegram') {
      if (request.headers.get('X-Telegram-Bot-Api-Secret-Token') !== env.WEBHOOK_SECRETO) {
        return new Response('No autorizado', { status: 401 });
      }
      const msg = mensajeDeUpdate(await request.json());
      // Se responde a Telegram enseguida; el mensaje se procesa en segundo plano.
      if (msg) ctx.waitUntil(estado(env).recibir(msg).catch((e) => console.error(e)));
      return new Response('ok');
    }

    // WhatsApp: Meta comprueba la URL una vez con un GET y luego entrega los mensajes con POST firmados.
    if (url.pathname === '/whatsapp') {
      if (request.method === 'GET') {
        const p = url.searchParams;
        const ok = p.get('hub.mode') === 'subscribe' && env.WHATSAPP_VERIFICACION && p.get('hub.verify_token') === env.WHATSAPP_VERIFICACION;
        return ok ? new Response(p.get('hub.challenge')) : new Response('No autorizado', { status: 403 });
      }
      if (request.method === 'POST') {
        const cuerpo = await request.text();
        if (!(await firmaValida(cuerpo, request.headers.get('X-Hub-Signature-256'), env.WHATSAPP_SECRETO_APP))) {
          return new Response('No autorizado', { status: 401 });
        }
        const mensajes = mensajesDeAviso(JSON.parse(cuerpo));
        if (mensajes.length) ctx.waitUntil(Promise.all(mensajes.map((m) => estado(env).recibir(m).catch((e) => console.error(e)))));
        return new Response('ok');
      }
    }

    // Tareas de administración (las usan los scripts de npm), protegidas con CLAVE_ADMIN.
    if (request.method === 'POST' && url.pathname === '/admin/importar') {
      if (!esAdminAutorizado(request, env)) return new Response('No autorizado', { status: 401 });
      return Response.json(await estado(env).importar(await request.json()));
    }
    if (request.method === 'POST' && url.pathname === '/admin/webhook') {
      if (!esAdminAutorizado(request, env)) return new Response('No autorizado', { status: 401 });
      return Response.json(await estado(env).configurarWebhook(`${url.origin}/telegram`));
    }

    return new Response('Bot activo');
  },
};
