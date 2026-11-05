// productos.js y precios.js son scripts del navegador que llenan window.*.
// Este módulo se importa antes que ellos para que funcionen fuera del navegador.
globalThis.window ||= {};
