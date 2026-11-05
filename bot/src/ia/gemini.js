// Adaptador de IA para Google Gemini (nivel gratuito, solo para pruebas).
// Interfaz común de los adaptadores de IA:
//   generar({ sistema, contexto, historial: [{ rol: 'cliente'|'bot', texto }], esquema }) →
//     { datos (objeto según esquema), modelo, entrada, salida }

const URL_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

// JSON Schema estándar → formato de esquema de Gemini (tipos en mayúsculas).
function aEsquemaGemini(esquema) {
  const r = { type: esquema.type.toUpperCase() };
  if (esquema.description) r.description = esquema.description;
  if (esquema.enum) r.enum = esquema.enum;
  if (esquema.properties) r.properties = Object.fromEntries(Object.entries(esquema.properties).map(([k, v]) => [k, aEsquemaGemini(v)]));
  if (esquema.required) r.required = esquema.required;
  if (esquema.items) r.items = aEsquemaGemini(esquema.items);
  return r;
}

const esperar = (ms) => new Promise((ok) => setTimeout(ok, ms));
const MAX_INTENTOS = 5;

export function crearIaGemini({ clave, modelo, respaldos = [], fetchFn = globalThis.fetch, pausaReintento = 1000, registro = console }) {
  async function llamar(nombreModelo, cuerpo) {
    let r;
    try {
      r = await fetchFn(`${URL_BASE}/${nombreModelo}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': clave },
        body: JSON.stringify(cuerpo),
        signal: AbortSignal.timeout(25000),
      });
    } catch (e) {
      // Sin respuesta a tiempo o fallo de red: vale la pena reintentar.
      const error = new Error(`Gemini ${nombreModelo}: ${e.name === 'TimeoutError' ? 'sin respuesta en 25 s' : e.message}`);
      error.reintentable = true;
      throw error;
    }
    const datos = await r.json();
    if (!r.ok) {
      const error = new Error(`Gemini ${nombreModelo}: ${r.status} ${datos.error?.message || ''}`.trim());
      error.reintentable = r.status === 429 || r.status >= 500;
      throw error;
    }
    const texto = datos.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
    return {
      datos: JSON.parse(texto),
      modelo: datos.modelVersion || nombreModelo,
      entrada: datos.usageMetadata?.promptTokenCount,
      salida: (datos.usageMetadata?.candidatesTokenCount || 0) + (datos.usageMetadata?.thoughtsTokenCount || 0),
    };
  }

  return {
    nombre: 'gemini',
    async generar({ sistema, contexto, historial, esquema }) {
      const cuerpo = {
        systemInstruction: { parts: [{ text: `${sistema}\n\n${contexto}` }] },
        contents: historial.map((h) => ({ role: h.rol === 'bot' ? 'model' : 'user', parts: [{ text: h.texto }] })),
        generationConfig: { responseMimeType: 'application/json', responseSchema: aEsquemaGemini(esquema) },
      };
      // El nivel gratuito rechaza a menudo con 503 ("alta demanda"), pero rápido: se alterna entre el
      // modelo principal y los de respaldo hasta MAX_INTENTOS veces.
      const modelos = [modelo, ...respaldos];
      let ultimo;
      for (let i = 0; i < MAX_INTENTOS; i++) {
        const m = modelos[i % modelos.length];
        try {
          return await llamar(m, cuerpo);
        } catch (e) {
          ultimo = e;
          if (!e.reintentable && !(e instanceof SyntaxError)) throw e;
          registro.warn(`[ia] intento ${i + 1}/${MAX_INTENTOS} fallido: ${e.message.slice(0, 120)}`);
          if (i < MAX_INTENTOS - 1) await esperar(pausaReintento);
        }
      }
      throw ultimo;
    },
  };
}
