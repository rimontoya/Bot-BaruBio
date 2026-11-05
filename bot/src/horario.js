// Horario de atención humana. Formato de texto, el mismo que usan los admins con /horario:
//   "lun-vie 09:00-12:00 15:00-19:00; sab 09:00-12:00"
const ORDEN = ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom'];
const NOMBRES = { lun: 'lunes', mar: 'martes', mie: 'miércoles', jue: 'jueves', vie: 'viernes', sab: 'sábado', dom: 'domingo' };
// Índice de Date.getDay() (0 = domingo) → clave.
const POR_INDICE = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'];

const sinAcentos = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function expandirDias(texto) {
  const dias = new Set();
  for (const parte of sinAcentos(texto).split(',')) {
    const [desde, hasta] = parte.split('-').map((d) => d.trim().slice(0, 3));
    const i = ORDEN.indexOf(desde);
    const j = hasta ? ORDEN.indexOf(hasta) : i;
    if (i < 0 || j < 0) throw new Error(`Día no válido: "${parte}". Usa lun, mar, mie, jue, vie, sab, dom.`);
    for (let k = i; ; k = (k + 1) % 7) { dias.add(ORDEN[k]); if (k === j) break; }
  }
  return [...dias];
}

function aMinutos(h, m) {
  const total = Number(h) * 60 + Number(m);
  if (Number(m) > 59 || total > 24 * 60) throw new Error(`Hora no válida: ${h}:${m}`);
  return total;
}

export function parsearHorario(texto) {
  const reglas = [];
  for (const bloque of texto.split(';').map((b) => b.trim()).filter(Boolean)) {
    const [diasTexto, ...rangos] = bloque.split(/\s+/);
    const tramos = rangos.map((r) => {
      const m = r.match(/^(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/);
      if (!m) throw new Error(`Tramo no válido: "${r}". Usa por ejemplo 09:00-12:00.`);
      const inicio = aMinutos(m[1], m[2]);
      const fin = aMinutos(m[3], m[4]);
      if (fin <= inicio) throw new Error(`El tramo ${r} termina antes de empezar.`);
      return [inicio, fin];
    });
    if (!tramos.length) throw new Error(`Faltan las horas en "${bloque}".`);
    reglas.push({ dias: expandirDias(diasTexto), tramos: tramos.sort((a, b) => a[0] - b[0]) });
  }
  if (!reglas.length) throw new Error('El horario está vacío.');
  return reglas;
}

// Día (clave) y minutos desde medianoche en la zona horaria del negocio.
export function momentoLocal(zona, fecha = new Date()) {
  const partes = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: zona, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(fecha).map((p) => [p.type, p.value]));
  const indice = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(partes.weekday);
  return { dia: POR_INDICE[indice], minutos: Number(partes.hour) * 60 + Number(partes.minute) };
}

const tramosDe = (reglas, dia) => reglas.filter((r) => r.dias.includes(dia)).flatMap((r) => r.tramos).sort((a, b) => a[0] - b[0]);

export function estaAbierto(reglas, zona, fecha = new Date()) {
  const { dia, minutos } = momentoLocal(zona, fecha);
  return tramosDe(reglas, dia).some(([ini, fin]) => minutos >= ini && minutos < fin);
}

const hora = (min) => `${Math.floor(min / 60)}:${String(min % 60).padStart(2, '0')}`;

// "hoy a las 15:00", "mañana a las 9:00", "el lunes a las 9:00". null si nunca abre.
export function proximaApertura(reglas, zona, fecha = new Date()) {
  const { dia, minutos } = momentoLocal(zona, fecha);
  const hoy = ORDEN.indexOf(dia);
  for (let d = 0; d <= 7; d++) {
    const clave = ORDEN[(hoy + d) % 7];
    const tramo = tramosDe(reglas, clave).find(([ini]) => d > 0 || ini > minutos);
    if (!tramo) continue;
    const cuando = d === 0 ? 'hoy' : d === 1 ? 'mañana' : `el ${NOMBRES[clave]}`;
    return `${cuando} a las ${hora(tramo[0])}`;
  }
  return null;
}

// "lunes a viernes de 9:00 a 12:00 y de 15:00 a 19:00"
export function describirHorario(reglas) {
  return reglas.map(({ dias, tramos }) => {
    const ordenados = ORDEN.filter((d) => dias.includes(d));
    const seguidos = ordenados.every((d, i) => i === 0 || ORDEN.indexOf(d) === ORDEN.indexOf(ordenados[i - 1]) + 1);
    const nombreDias = ordenados.length > 2 && seguidos
      ? `${NOMBRES[ordenados[0]]} a ${NOMBRES[ordenados.at(-1)]}`
      : ordenados.map((d) => NOMBRES[d]).join(', ');
    return `${nombreDias} ${tramos.map(([i, f]) => `de ${hora(i)} a ${hora(f)}`).join(' y ')}`;
  }).join('; ');
}
