// Catálogo y lista de precios oficial: los mismos archivos que usa el generador de protocolos.
import './ventana.js';
import '../../protocolos/js/productos.js';
import '../../protocolos/js/precios.js';

const w = globalThis.window;

export const catalogo = {
  productos: w.PRODUCTOS,
  agua: w.AGUA_BACTERIOSTATICA,
  kit: w.KIT,
  listaOficial: w.PRECIOS_LISTA,
};
