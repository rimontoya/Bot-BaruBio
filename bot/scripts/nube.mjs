// Tareas de la nube, con los valores del .env:
//   node scripts/nube.mjs secretos   → sube los secretos (TELEGRAM_TOKEN, GEMINI_API_KEY, CLAVE_ADMIN, WEBHOOK_SECRETO, HOJA_CLAVE_BOT)
//   node scripts/nube.mjs importar   → copia datos/estado.json (admins, horario, conversaciones) al bot de la nube
//   node scripts/nube.mjs webhook    → hace que Telegram entregue los mensajes al bot de la nube
//   node scripts/nube.mjs dev-vars   → crea .dev.vars para probar la nube en local (npm run nube:local)
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.loadEnvFile(path.join(raiz, '.env'));
const SECRETOS = ['TELEGRAM_TOKEN', 'GEMINI_API_KEY', 'CLAVE_ADMIN', 'WEBHOOK_SECRETO', 'HOJA_CLAVE_BOT'];

function exigir(...nombres) {
  const faltan = nombres.filter((n) => !process.env[n]);
  if (faltan.length) throw new Error(`Faltan en .env: ${faltan.join(', ')}`);
}

async function llamarNube(ruta, cuerpo) {
  exigir('NUBE_URL', 'CLAVE_ADMIN');
  const r = await fetch(new URL(ruta, process.env.NUBE_URL), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Clave-Admin': process.env.CLAVE_ADMIN },
    body: JSON.stringify(cuerpo ?? {}),
  });
  const texto = await r.text();
  if (!r.ok) throw new Error(`${r.status} ${texto}`);
  return JSON.parse(texto);
}

const tareas = {
  secretos() {
    exigir(...SECRETOS);
    for (const nombre of SECRETOS) {
      const r = spawnSync('npx', ['wrangler', 'secret', 'put', nombre], {
        cwd: raiz, input: process.env[nombre], stdio: ['pipe', 'inherit', 'inherit'], shell: true,
      });
      if (r.status !== 0) throw new Error(`No se pudo subir ${nombre}`);
    }
  },
  async importar() {
    const archivo = path.join(raiz, process.env.DATOS_DIR || './datos', 'estado.json');
    if (!existsSync(archivo)) throw new Error(`No existe ${archivo}`);
    console.log('Importado:', await llamarNube('/admin/importar', JSON.parse(readFileSync(archivo, 'utf8'))));
  },
  async webhook() {
    const info = await llamarNube('/admin/webhook');
    console.log(`Webhook: ${info.url} · pendientes: ${info.pending_update_count}${info.last_error_message ? ` · último error: ${info.last_error_message}` : ''}`);
  },
  'dev-vars'() {
    exigir(...SECRETOS);
    writeFileSync(path.join(raiz, '.dev.vars'), SECRETOS.map((n) => `${n}=${process.env[n]}`).join('\n') + '\n');
    console.log('.dev.vars creado (no se sube al repositorio).');
  },
};

const tarea = tareas[process.argv[2]];
if (!tarea) {
  console.error(`Uso: node scripts/nube.mjs ${Object.keys(tareas).join(' | ')}`);
  process.exit(1);
}
try {
  await tarea();
} catch (e) {
  console.error(`Error: ${e.message}`);
  process.exit(1);
}
