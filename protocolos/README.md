# Generador de protocolos

Página web sin servidor ni dependencias. Abrir `index.html` en el navegador.

- **Protocolo:** se elige el cliente, el producto, la presentación, el agua, la dosis (con etapas de escalado) y la frecuencia. El botón *Descargar PDF* abre la impresión: hay que elegir "Guardar como PDF".
- **Presupuesto:** cotización manual sin protocolo. Se eligen tantos productos y cantidades como haga falta (péptidos a precio de kit; agua suelta a precio de lista) y se descarga en PDF. El botón "Generar presupuesto" de la pestaña Protocolo usa el mismo diseño, con los kits que necesita el ciclo.
- **Precios:** parten de la lista oficial (`js/precios.js`, 13 de agosto de 2026). Cada péptido se vende como kit: precio de lista + recargo de $40 (vial, agua, jeringa de 5 mL, 5 jeringas de 100 UI y sobre); el agua suelta no lleva recargo. Los cambios se guardan en el navegador (`localStorage`) y *Exportar/Importar* sirve para respaldarlos. Es una solución temporal hasta pasarlos a Google Sheets.

## Archivos

| Archivo | Contenido |
|---|---|
| `js/productos.js` | Textos, presentaciones, precauciones y dosis sugeridas por producto |
| `js/precios.js` | Lista de precios oficial y contenido del kit |
| `js/calculos.js` | Reconstitución, UI, consumo y simulación de viales (fórmulas fijas, sin IA) |
| `js/app.js` | Formulario, vista previa y precios |
| `tests/calculos.test.js` | `node --test protocolos/tests/calculos.test.js` |

## Pendiente de validar

- Dosis sugeridas: solo GHK-Cu, Tirzepatide y Retatrutide (salen de sus fichas). El resto se escribe en cada protocolo.
- Sin precio todavía: Retatrutide 40 mg, NAD+ 1000 mg, Vilon, Vesugen y Cartalax.
- Las precauciones son advertencias generales: conviene que las revise un profesional de salud.
