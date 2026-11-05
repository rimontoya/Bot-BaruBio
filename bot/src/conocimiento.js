// Lo que el bot sabe: catálogo (el mismo del generador de protocolos), precios de kit y preguntas frecuentes.
// Las dosis y precauciones de productos.js NO se incluyen: esas las trata siempre el asesor.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { RAIZ_BOT } from './config.js';

const RAIZ_PROYECTO = path.resolve(RAIZ_BOT, '..');

// productos.js y precios.js son scripts del navegador que llenan window.*; se cargan una vez.
export function cargarCatalogo() {
  globalThis.window ||= {};
  const require = createRequire(import.meta.url);
  require(path.join(RAIZ_PROYECTO, 'protocolos/js/productos.js'));
  require(path.join(RAIZ_PROYECTO, 'protocolos/js/precios.js'));
  const w = globalThis.window;
  return { productos: w.PRODUCTOS, agua: w.AGUA_BACTERIOSTATICA, kit: w.KIT, listaOficial: w.PRECIOS_LISTA };
}

// Precios vigentes de la hoja de Google. Si no responde, null (se usa la lista oficial).
export async function obtenerPrecios(url, fetchFn = globalThis.fetch) {
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

export function construirConocimiento({ productos, agua, kit, listaOficial }, preciosHoja) {
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

  partes.push(readFileSync(path.join(RAIZ_BOT, 'conocimiento/preguntas-frecuentes.md'), 'utf8'));
  return partes.join('\n\n');
}
