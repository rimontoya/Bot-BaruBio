// Ejecutar con: node --test protocolos/tests/calculos.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../js/calculos.js');

const cerca = (a, b, tol = 1e-3) => assert.ok(Math.abs(a - b) < tol, `${a} ≉ ${b}`);
const LV = [1, 2, 3, 4, 5];

test('GHK-Cu del protocolo de ejemplo: 100 mg + 3 mL, 15 UI', () => {
  const r = C.reconstitucion(100, 3);
  cerca(r.concMgMl, 33.333);
  cerca(r.mgPorUi, 0.333);

  const mg = C.aMg(15, 'ui', r.concMgMl);
  cerca(mg, 5);
  const d = C.dosis(mg, r.concMgMl);
  cerca(d.ml, 0.15);
  cerca(d.ui, 15);

  const dur = C.duracionVialDias(100, 5, 5);
  assert.equal(dur.dosisPorVial, 20);
  cerca(dur.dias, 28);
});

test('GHK-Cu: 20 semanas L-V = 5 viales (como el ejemplo), 8 semanas = 2', () => {
  const base = { vialMg: 100, dias: LV, estabilidadDias: 28 };
  assert.equal(C.simularCiclo({ ...base, etapas: [{ semanas: 20, mg: 5 }] }).viales, 5);
  const ocho = C.simularCiclo({ ...base, etapas: [{ semanas: 8, mg: 5 }] });
  assert.equal(ocho.viales, 2);
  assert.equal(ocho.inyecciones, 40);
  assert.equal(ocho.vencidoMg, 0);
});

test('Escalado semanal: 2.5 mg x4 + 5 mg x4 con vial de 10 mg = 3 viales', () => {
  const r = C.simularCiclo({
    vialMg: 10, dias: [1], estabilidadDias: 28,
    etapas: [{ semanas: 4, mg: 2.5 }, { semanas: 4, mg: 5 }],
  });
  assert.equal(r.viales, 3);
  cerca(r.totalMg, 30);
});

test('Vial que vence antes de terminarse abre uno nuevo y reporta lo perdido', () => {
  const r = C.simularCiclo({ vialMg: 10, dias: [1], estabilidadDias: 28, etapas: [{ semanas: 8, mg: 1 }] });
  assert.equal(r.viales, 2);
  cerca(r.vencidoMg, 6);
});

test('Dosis mayor que el vial lanza error', () => {
  assert.throws(() => C.simularCiclo({ vialMg: 5, dias: [1], estabilidadDias: 28, etapas: [{ semanas: 1, mg: 6 }] }));
});

test('Unidades: mcg y avisos de medición', () => {
  cerca(C.aMg(300, 'mcg'), 0.3);
  assert.equal(C.avisosDosis({ ui: 1.5 }).length, 1);
  assert.equal(C.avisosDosis({ ui: 120 }).length, 1);
  assert.equal(C.avisosDosis({ ui: 15 }).length, 0);
});

test('Jeringas: más de 100 UI se reparte en varias aplicaciones', () => {
  assert.equal(C.jeringasPorDosis(25), 1);
  assert.equal(C.jeringasPorDosis(100), 1);
  assert.equal(C.jeringasPorDosis(125), 2);
  // Escalado de su ficha de Tirzepatide (10 mg/mL): 25, 50, 75, 100, 125, 150 UI, 4 semanas cada uno.
  const etapas = [25, 50, 75, 100, 125, 150].map((ui) => ({ semanas: 4, ui }));
  assert.equal(C.jeringasCiclo(etapas, 1), 4 * 4 + 4 * 2 * 2);
});

test('Tirzepatide 15 mg en 1.5 mL con estabilidad de 8 semanas: el primer vial cubre 5 semanas', () => {
  const r = C.reconstitucion(15, 1.5);
  cerca(r.concMgMl, 10);
  cerca(C.dosis(2.5, r.concMgMl).ui, 25);
  // 4 semanas a 2.5 mg + 1 semana a 5 mg = 15 mg: justo un vial, como dicen sus preguntas frecuentes.
  const ciclo = C.simularCiclo({
    vialMg: 15, dias: [1], estabilidadDias: 56,
    etapas: [{ semanas: 4, mg: 2.5 }, { semanas: 1, mg: 5 }],
  });
  assert.equal(ciclo.viales, 1);
});
