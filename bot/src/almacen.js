// Estado del bot: admins, horario, conversaciones y clientes. Se trabaja en memoria y, al guardar,
// se persiste lo que cambió. Dónde se persiste lo decide quien lo crea:
//   - local:  almacen-archivo.js (archivo JSON)
//   - nube:   worker.js (Durable Object de Cloudflare)
//   - tests:  crearAlmacenMemoria()
const MAX_HISTORIAL = 30;
const MAX_ENLACES = 500;

export function datosVacios() {
  return { admins: [], horario: null, conversaciones: {}, enlaces: {}, uso: {} };
}

export function crearAlmacenMemoria() {
  return crearAlmacen(datosVacios(), () => {});
}

// persistir(datos, { tocadas, borradas }) recibe los chatId de conversaciones modificadas o borradas
// desde el último guardado, para que el almacén de la nube escriba solo eso.
export function crearAlmacen(datos, persistir) {
  let tocadas = new Set();
  let borradas = new Set();
  const tocar = (chatId) => { tocadas.add(chatId); borradas.delete(chatId); };

  return {
    datos,
    guardar() {
      const cambios = { tocadas, borradas };
      tocadas = new Set();
      borradas = new Set();
      return persistir(datos, cambios);
    },

    esAdmin: (chatId) => datos.admins.includes(chatId),
    agregarAdmin(chatId) { if (!datos.admins.includes(chatId)) datos.admins.push(chatId); this.guardar(); },
    quitarAdmin(chatId) { datos.admins = datos.admins.filter((a) => a !== chatId); this.guardar(); },

    // Devuelve la conversación (la crea si no existe) y la marca para guardarla.
    conversacion(chatId, inicial = {}) {
      datos.conversaciones[chatId] ||= {
        chatId, modo: 'bot', historial: [], lead: {}, creada: new Date().toISOString(), ...inicial,
      };
      tocar(chatId);
      return datos.conversaciones[chatId];
    },
    // Como conversacion(), pero sin crearla: undefined si no existe.
    conversacionExistente(chatId) {
      if (!datos.conversaciones[chatId]) return undefined;
      tocar(chatId);
      return datos.conversaciones[chatId];
    },
    reiniciar(chatId) {
      delete datos.conversaciones[chatId];
      tocadas.delete(chatId);
      borradas.add(chatId);
      this.guardar();
    },
    agregarMensaje(conv, rol, texto) {
      conv.historial.push({ rol, texto, fecha: new Date().toISOString() });
      if (conv.historial.length > MAX_HISTORIAL) conv.historial.splice(0, conv.historial.length - MAX_HISTORIAL);
      conv.actualizada = new Date().toISOString();
      tocar(conv.chatId);
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

// Convierte el estado guardado por la versión anterior (chatId solo con números, sin canal)
// al formato con prefijo de canal ("tg_…"). Lo que ya tiene prefijo no se toca.
export function migrarAPrefijos(datos, prefijo = 'tg') {
  const p = (id) => (/^-?\d+$/.test(String(id)) ? `${prefijo}_${id}` : String(id));
  const conversaciones = {};
  for (const [id, conv] of Object.entries(datos.conversaciones || {})) conversaciones[p(id)] = { ...conv, chatId: p(conv.chatId ?? id) };
  const enlaces = {};
  for (const [clave, cliente] of Object.entries(datos.enlaces || {})) {
    const [admin, mensaje] = clave.split(':');
    enlaces[`${p(admin)}:${mensaje}`] = p(cliente);
  }
  return { ...datosVacios(), ...datos, admins: (datos.admins || []).map(p), conversaciones, enlaces };
}
