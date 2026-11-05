import test from 'node:test';
import assert from 'node:assert/strict';
import { parsearHorario, estaAbierto, proximaApertura, describirHorario } from '../src/horario.js';

const ZONA = 'America/Panama'; // UTC-5, sin horario de verano
const reglas = parsearHorario('lun-vie 09:00-12:00 15:00-19:00');
// 5 de noviembre de 2026 es jueves.
const jueves = (h, m = 0) => new Date(Date.UTC(2026, 10, 5, h + 5, m));

test('abierto en los dos tramos, cerrado al mediodía y de noche', () => {
  assert.equal(estaAbierto(reglas, ZONA, jueves(9)), true);
  assert.equal(estaAbierto(reglas, ZONA, jueves(11, 59)), true);
  assert.equal(estaAbierto(reglas, ZONA, jueves(12)), false);
  assert.equal(estaAbierto(reglas, ZONA, jueves(16)), true);
  assert.equal(estaAbierto(reglas, ZONA, jueves(19)), false);
});

test('próxima apertura: hoy, mañana o el lunes', () => {
  assert.equal(proximaApertura(reglas, ZONA, jueves(13)), 'hoy a las 15:00');
  assert.equal(proximaApertura(reglas, ZONA, jueves(20)), 'mañana a las 9:00');
  // Viernes 6 a las 20:00 → lunes.
  assert.equal(proximaApertura(reglas, ZONA, new Date(Date.UTC(2026, 10, 7, 1, 0))), 'el lunes a las 9:00');
});

test('descripción legible y sábado opcional', () => {
  assert.equal(describirHorario(reglas), 'lunes a viernes de 9:00 a 12:00 y de 15:00 a 19:00');
  const conSabado = parsearHorario('lun-vie 09:00-12:00; sáb 09:00-12:00');
  assert.equal(estaAbierto(conSabado, ZONA, new Date(Date.UTC(2026, 10, 7, 15))), true); // sábado 10:00
});

test('errores de formato con mensaje claro', () => {
  assert.throws(() => parsearHorario('lunes 9-12'), /Tramo no válido/);
  assert.throws(() => parsearHorario('xyz 09:00-12:00'), /Día no válido/);
  assert.throws(() => parsearHorario('lun 12:00-09:00'), /termina antes/);
});
