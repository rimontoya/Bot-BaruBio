// Anota cada cliente en la pestaña "Clientes" de la hoja de Google (la misma de los precios).
// Si la hoja no responde, el bot sigue funcionando: solo se deja un aviso en el registro.
export function crearRegistroHoja({ url, clave, fetchFn = (...a) => fetch(...a), registro = console }) {
  if (!url || !clave) return null;
  return {
    async anotar(conv) {
      const cliente = {
        id: conv.chatId,
        nombre: conv.lead?.nombre || conv.nombre || '',
        usuario: conv.usuario || '',
        objetivo: conv.lead?.objetivo || '',
        productos: conv.lead?.productos || [],
        estado: conv.lead?.estado || '',
        modo: conv.modo,
        resumen: conv.lead?.resumen || '',
        creada: conv.creada,
        actualizada: conv.actualizada,
      };
      try {
        // Sin cabeceras (text/plain), igual que el generador, para que Apps Script lo acepte sin rodeos.
        const r = await fetchFn(url, {
          method: 'POST',
          body: JSON.stringify({ accion: 'cliente', clave, cliente }),
          signal: AbortSignal.timeout(20000),
        });
        const datos = await r.json();
        if (!datos.ok) registro.warn(`[hoja] no se anotó ${conv.chatId}: ${datos.error}`);
      } catch (e) {
        registro.warn(`[hoja] no se anotó ${conv.chatId}: ${e.message}`);
      }
    },
  };
}
