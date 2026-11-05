// Lo que el bot sabe: catálogo (el mismo del generador de protocolos), precios de kit y preguntas frecuentes.
// Las dosis y precauciones de productos.js NO se incluyen: esas las trata siempre el asesor.
// No toca el disco: el texto de preguntas frecuentes lo entrega quien arranca el bot (local o nube).

const REFRESCO_PRECIOS_MS = 10 * 60 * 1000;

// Devuelve una función que entrega el conocimiento, rehecho cada 10 minutos con los precios de la hoja.
export function crearFuenteConocimiento({ catalogo, faq, preciosUrl, registro = console, ahora = Date.now }) {
  let texto = null;
  let refrescado = 0;
  return async function obtenerConocimiento() {
    if (!texto || ahora() - refrescado > REFRESCO_PRECIOS_MS) {
      const precios = await obtenerPrecios(preciosUrl);
      if (!precios) registro.warn('[precios] no se pudo leer la hoja: se usa la lista oficial');
      texto = construirConocimiento(catalogo, precios, faq);
      refrescado = ahora();
    }
    return texto;
  };
}

// Precios vigentes de la hoja de Google. Si no responde, null (se usa la lista oficial).
export async function obtenerPrecios(url, fetchFn = (...a) => fetch(...a)) {
  if (!url) return null;
  try {
    const r = await fetchFn(url, { signal: AbortSignal.timeout(15000) });
    const datos = await r.json();
    return datos.ok ? datos.precios : null;
  } catch {
    return null;
  }
}

const dinero = (n) => `$${Number(n).toFixed(2).replace(/\.00$/, '')}`;

export function construirConocimiento({ productos, agua, kit, listaOficial }, preciosHoja, faq) {
  const lista = (clave) => {
    const v = preciosHoja && clave in preciosHoja ? preciosHoja[clave] : listaOficial[clave];
    return typeof v === 'number' && v >= 0 ? v : null;
  };
  const recargo = lista('kit:recargo') ?? kit.recargo;

  const partes = [];
  partes.push(`## Precios y kit (USD)

Cada péptido se vende como KIT. El precio de kit ya incluye:
${kit.incluye.map((t) => `- ${t}`).join('\n')}

Agua bacteriostática suelta (sin kit): ${agua.presentacionesMl
    .map((ml) => `${ml} mL ${lista(`agua:${ml}`) !== null ? dinero(lista(`agua:${ml}`)) : 'precio por confirmar'}`).join(' · ')}.
El envío se cobra aparte (ver entregas).`);

  partes.push('## Catálogo');
  const porCategoria = {};
  for (const p of productos) (porCategoria[p.categoria] ||= []).push(p);
  for (const [categoria, lista_] of Object.entries(porCategoria)) {
    partes.push(`### Categoría: ${categoria}`);
    for (const p of lista_) {
      const precios = p.presentaciones.map((pr) => {
        const v = lista(`${p.id}:${pr.mg}`);
        return `${pr.mg} mg: ${v !== null ? `kit ${dinero(v + recargo)}` : 'precio por confirmar con el asesor'}`;
      }).join(' · ');
      partes.push(`#### ${p.nombre} — ${p.subtitulo}
Para: ${p.objetivo}
Presentaciones: ${precios}
${p.descripcion}
Beneficios: ${p.acciones.map(([a, b]) => `${a} (${b})`).join('; ')}.`);
    }
  }

  partes.push(faq);
  return partes.join('\n\n');
}
