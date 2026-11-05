// Almacén local: todo el estado en datos/estado.json (solo en este equipo).
import { readFileSync, writeFileSync, renameSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { crearAlmacen, migrarAPrefijos } from './almacen.js';

export function crearAlmacenArchivo(dir) {
  const ruta = path.join(dir, 'estado.json');
  const datos = migrarAPrefijos(existsSync(ruta) ? JSON.parse(readFileSync(ruta, 'utf8')) : {});
  return crearAlmacen(datos, () => {
    mkdirSync(dir, { recursive: true });
    writeFileSync(`${ruta}.tmp`, JSON.stringify(datos, null, 2));
    renameSync(`${ruta}.tmp`, ruta);
  });
}
