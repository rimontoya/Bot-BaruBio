// Estado persistente del bot: admins, horario, conversaciones y clientes.
// En local es un archivo JSON. Al pasar a la nube se cambia por otro almacén con la misma interfaz.
import { readFileSync, writeFileSync, renameSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';

const MAX_HISTORIAL = 30;
const MAX_ENLACES = 500;

function datosVacios() {
  return { admins: [], horario: null, conversaciones: {}, enlaces: {}, uso: {} };
}

export function crearAlmacenArchivo(dir) {
  const ruta = path.join(dir, 'estado.json');
  let datos = datosVacios();
  if (existsSync(ruta)) datos = { ...datosVacios(), ...JSON.parse(readFileSync(ruta, 'utf8')) };
  return crearAlmacen(datos, () => {
    mkdirSync(dir, { recursive: true });
    writeFileSync(`${ruta}.tmp`, JSON.stringify(datos, null, 2));
    renameSync(`${ruta}.tmp`, ruta);
  });
}

// Almacén en memoria (tests).
export function crearAlmacenMemoria() {
  return crearAlmacen(datosVacios(), () => {});
}

function crearAlmacen(datos, persistir) {
  return {
    datos,
    guardar: persistir,

    esAdmin: (chatId) => datos.admins.includes(chatId),
    agregarAdmin(chatId) { if (!datos.admins.includes(chatId)) datos.admins.push(chatId); persistir(); },
    quitarAdmin(chatId) { datos.admins = datos.admins.filter((a) => a !== chatId); persistir(); },

    conversacion(chatId, inicial = {}) {
      datos.conversaciones[chatId] ||= {
        chatId, modo: 'bot', historial: [], lead: {}, creada: new Date().toISOString(), ...inicial,
      };
      return datos.conversaciones[chatId];
    },
    reiniciar(chatId) { delete datos.conversaciones[chatId]; persistir(); },
    agregarMensaje(conv, rol, texto) {
      conv.historial.push({ rol, texto, fecha: new Date().toISOString() });
      if (conv.historial.length > MAX_HISTORIAL) conv.historial.splice(0, conv.historial.length - MAX_HISTORIAL);
      conv.actualizada = new Date().toISOString();
    },

    // Mensajes enviados a un admin que, al responderlos, deben llegar a un cliente.
    enlazar(adminChatId, mensajeId, clienteChatId) {
      datos.enlaces[`${adminChatId}:${mensajeId}`] = clienteChatId;
      const claves = Object.keys(datos.enlaces);
      if (claves.length > MAX_ENLACES) for (const k of claves.slice(0, claves.length - MAX_ENLACES)) delete datos.enlaces[k];
    },
    clienteEnlazado: (adminChatId, mensajeId) => datos.enlaces[`${adminChatId}:${mensajeId}`],

    registrarUso(modelo, entrada, salida) {
      const u = (datos.uso[modelo] ||= { llamadas: 0, entrada: 0, salida: 0 });
      u.llamadas += 1; u.entrada += entrada || 0; u.salida += salida || 0;
    },
  };
}
