// Precios compartidos y registro de clientes (Google Apps Script). Ver LEEME.md para instalarlo.
//
// Hoja "Precios": Clave | Producto | Presentación | Precio lista (USD)
//  - GET  → { ok, precios }                                           (lectura pública: los precios no son secretos)
//  - POST { pin, cambios: { clave: número | null } }                  → guarda precios (requiere el PIN)
// Hoja "Clientes": una fila por cliente del bot, actualizada en cada conversación.
//  - POST { accion: "cliente", clave, cliente: {...} }                → la escribe el bot (requiere CLAVE_BOT)
//  - POST { accion: "clientes", pin }                                 → lista para el generador (requiere el PIN)
// El PIN y la CLAVE_BOT se guardan en Propiedades del script, nunca en el código.

const HOJA = 'Precios';
const COL_CLAVE = 1;
const COL_PRECIO = 4;
const CLAVE_VALIDA = /^([a-z0-9-]+:[0-9.]+|kit:recargo)$/;

const HOJA_CLIENTES = 'Clientes';
const COLUMNAS_CLIENTES = ['Id', 'Canal', 'Nombre', 'Usuario', 'Objetivo', 'Productos', 'Estado', 'Atiende', 'Resumen', 'Primer contacto', 'Último mensaje'];
const CANALES = { tg: 'Telegram', wa: 'WhatsApp' };

function doGet() {
  return responder({ ok: true, precios: leerPrecios() });
}

function doPost(e) {
  let datos;
  try {
    datos = JSON.parse(e.postData.contents);
  } catch (err) {
    return responder({ ok: false, error: 'formato' });
  }
  const propiedades = PropertiesService.getScriptProperties();

  if (datos.accion === 'cliente') {
    const clave = propiedades.getProperty('CLAVE_BOT');
    if (!clave || String(datos.clave) !== clave) return responder({ ok: false, error: 'clave' });
    return conBloqueo(() => {
      guardarCliente(datos.cliente || {});
      return responder({ ok: true });
    });
  }

  const pin = propiedades.getProperty('PIN');
  if (!pin || String(datos.pin) !== pin) return responder({ ok: false, error: 'pin' });

  if (datos.accion === 'clientes') return responder({ ok: true, clientes: leerClientes() });

  return conBloqueo(() => {
    const hoja = obtenerHoja();
    const filaDe = {};
    hoja.getDataRange().getValues().forEach((fila, i) => {
      if (i > 0) filaDe[String(fila[COL_CLAVE - 1])] = i + 1;
    });
    Object.keys(datos.cambios || {}).forEach((clave) => {
      if (!CLAVE_VALIDA.test(clave)) return;
      const bruto = datos.cambios[clave];
      const valor = bruto === null || bruto === '' ? '' : Number(bruto);
      if (valor !== '' && !(valor >= 0)) return;
      if (filaDe[clave]) {
        hoja.getRange(filaDe[clave], COL_PRECIO).setValue(valor);
      } else {
        hoja.appendRow([clave, clave, '', valor]);
        filaDe[clave] = hoja.getLastRow();
      }
    });
    return responder({ ok: true, precios: leerPrecios() });
  });
}

function conBloqueo(trabajo) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    return trabajo();
  } finally {
    lock.releaseLock();
  }
}

function leerPrecios() {
  const precios = {};
  obtenerHoja().getDataRange().getValues().slice(1).forEach((fila) => {
    const clave = String(fila[COL_CLAVE - 1]).trim();
    if (!CLAVE_VALIDA.test(clave)) return;
    const valor = fila[COL_PRECIO - 1];
    precios[clave] = valor === '' || valor === null || isNaN(Number(valor)) ? null : Number(valor);
  });
  return precios;
}

function obtenerHoja() {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  return libro.getSheetByName(HOJA) || libro.insertSheet(HOJA);
}

// La pestaña "Clientes" se crea sola la primera vez que el bot escribe.
function obtenerHojaClientes() {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  let hoja = libro.getSheetByName(HOJA_CLIENTES);
  if (!hoja) {
    hoja = libro.insertSheet(HOJA_CLIENTES);
    hoja.getRange(1, 1, 1, COLUMNAS_CLIENTES.length).setValues([COLUMNAS_CLIENTES])
      .setFontWeight('bold').setBackground('#0a1f47').setFontColor('#ffffff');
    hoja.setFrozenRows(1);
    hoja.getRange('A:A').setFontColor('#9aa6ba');
    hoja.getRange('J:K').setNumberFormat('dd/mm/yyyy hh:mm');
  }
  return hoja;
}

function guardarCliente(c) {
  const id = String(c.id || '').trim();
  if (!/^[a-z]+_[-\w]+$/.test(id)) return;
  const fila = [
    id,
    CANALES[id.split('_')[0]] || id.split('_')[0],
    c.nombre || '',
    c.usuario ? `@${c.usuario}` : '',
    c.objetivo || '',
    (c.productos || []).join(', '),
    c.estado || '',
    c.modo === 'humano' ? 'Asesor' : 'Bot',
    c.resumen || '',
    c.creada ? new Date(c.creada) : '',
    c.actualizada ? new Date(c.actualizada) : new Date(),
  ];
  const hoja = obtenerHojaClientes();
  const ids = hoja.getRange(1, 1, Math.max(hoja.getLastRow(), 1), 1).getValues().map((f) => String(f[0]));
  const i = ids.indexOf(id);
  if (i > 0) hoja.getRange(i + 1, 1, 1, fila.length).setValues([fila]);
  else hoja.appendRow(fila);
}

// Para el generador: nombre y datos útiles, del más reciente al más antiguo.
function leerClientes() {
  const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA_CLIENTES);
  if (!hoja) return [];
  return hoja.getDataRange().getValues().slice(1)
    .filter((f) => f[2])
    .map((f) => ({
      nombre: String(f[2]),
      usuario: String(f[3]),
      canal: String(f[1]),
      objetivo: String(f[4]),
      productos: String(f[5]),
      estado: String(f[6]),
      actualizada: f[10] instanceof Date ? f[10].toISOString() : '',
    }))
    .sort((a, b) => b.actualizada.localeCompare(a.actualizada));
}

function responder(objeto) {
  return ContentService.createTextOutput(JSON.stringify(objeto)).setMimeType(ContentService.MimeType.JSON);
}

// Ejecutar UNA vez: crea la hoja "Precios" con la lista oficial (13 de agosto de 2026).
function inicializar() {
  const hoja = obtenerHoja();
  if (hoja.getLastRow() > 1) throw new Error('La hoja "Precios" ya tiene datos: no se sobrescribe.');
  const filas = [['Clave', 'Producto', 'Presentación', 'Precio lista (USD)']].concat(LISTA_INICIAL);
  hoja.getRange(1, 1, filas.length, 4).setValues(filas);
  hoja.getRange(1, 1, 1, 4).setFontWeight('bold').setBackground('#0a1f47').setFontColor('#ffffff');
  hoja.getRange(2, 1, filas.length - 1, 1).setFontColor('#9aa6ba');
  hoja.getRange(2, 4, filas.length - 1, 1).setNumberFormat('$#,##0.00');
  hoja.setFrozenRows(1);
  hoja.autoResizeColumns(1, 4);
}

// [clave, producto, presentación, precio | ''] — '' = sin precio todavía.
const LISTA_INICIAL = [
  ["kit:recargo", "Recargo por kit", "", 40],
  ["ghk-cu:50", "GHK-Cu", "50 mg", 130],
  ["ghk-cu:100", "GHK-Cu", "100 mg", 160],
  ["ahk-cu:50", "AHK-Cu", "50 mg", 138],
  ["glow:70", "GLOW", "70 mg", 165],
  ["klow:80", "KLOW", "80 mg", 175],
  ["glutation:600", "Glutatión", "600 mg", 160],
  ["tirzepatide:5", "Tirzepatide", "5 mg", 110],
  ["tirzepatide:10", "Tirzepatide", "10 mg", 135],
  ["tirzepatide:15", "Tirzepatide", "15 mg", 150],
  ["tirzepatide:20", "Tirzepatide", "20 mg", 166],
  ["tirzepatide:30", "Tirzepatide", "30 mg", 183],
  ["tirzepatide:60", "Tirzepatide", "60 mg", 260],
  ["retatrutide:5", "Retatrutide", "5 mg", 135],
  ["retatrutide:10", "Retatrutide", "10 mg", 145],
  ["retatrutide:15", "Retatrutide", "15 mg", 165],
  ["retatrutide:20", "Retatrutide", "20 mg", 180],
  ["retatrutide:30", "Retatrutide", "30 mg", 225],
  ["retatrutide:40", "Retatrutide", "40 mg", ""],
  ["retatrutide:60", "Retatrutide", "60 mg", 350],
  ["cagrilintide:5", "Cagrilintide", "5 mg", 150],
  ["glp5:15", "GLP5", "15 mg", 209],
  ["aod-9604:10", "AOD-9604", "10 mg", 160],
  ["mots-c:10", "MOTS-c", "10 mg", 145],
  ["mots-c:40", "MOTS-c", "40 mg", 210],
  ["5-amino-1mq:50", "5-Amino-1MQ", "50 mg", 145],
  ["tesamorelin:5", "Tesamorelin", "5 mg", 140],
  ["tesamorelin:10", "Tesamorelin", "10 mg", 180],
  ["bpc-157:10", "BPC-157", "10 mg", 130],
  ["tb-500:5", "TB-500", "5 mg", 125],
  ["wolverine:10", "Wolverine", "10 mg", 145],
  ["wolverine:20", "Wolverine", "20 mg", 170],
  ["kpv:10", "KPV", "10 mg", 135],
  ["ara-290:10", "ARA-290", "10 mg", 160],
  ["cartalax:20", "Cartalax", "20 mg", ""],
  ["cjc-ipamorelin:10", "CJC-1295 sin DAC + Ipamorelin", "10 mg", 145],
  ["ipamorelin:10", "Ipamorelin", "10 mg", 140],
  ["dsip:10", "DSIP", "10 mg", 130],
  ["selank:10", "Selank", "10 mg", 135],
  ["n-acetyl-selank:10", "N-Acetyl Selank Amidate", "10 mg", 140],
  ["focus-blend:20", "Focus Blend", "20 mg", 155],
  ["pinealon:10", "Pinealon", "10 mg", 130],
  ["epitalon:50", "Epitalon", "50 mg", 160],
  ["nad:500", "NAD+", "500 mg", 135],
  ["nad:1000", "NAD+", "1000 mg", ""],
  ["ss-31:50", "SS-31", "50 mg", 275],
  ["vilon:20", "Vilon", "20 mg", ""],
  ["vesugen:10", "Vesugen", "10 mg", ""],
  ["pt-141:10", "PT-141", "10 mg", 130],
  ["kisspeptin:10", "Kisspeptin", "10 mg", 150],
  ["agua:3", "Agua bacteriostática", "3 mL", 15],
  ["agua:10", "Agua bacteriostática", "10 mL", 30],
];
