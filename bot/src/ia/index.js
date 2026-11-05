// Elige el adaptador de IA según la configuración (IA_PROVEEDOR).
import { crearIaGemini } from './gemini.js';

export function crearIa(ia) {
  switch (ia.proveedor) {
    case 'gemini':
      return crearIaGemini({ clave: ia.geminiClave, modelo: ia.modelo, respaldos: ia.respaldos });
    // case 'claude': adaptador con el SDK oficial de Anthropic (@anthropic-ai/sdk), en la migración a producción.
    default:
      throw new Error(`Proveedor de IA no soportado todavía: ${ia.proveedor}`);
  }
}
