// Cálculos del protocolo. Todo es aritmética fija: aquí no interviene ninguna IA.
// Convención: jeringa de insulina U-100 (100 UI = 1 mL). Internamente las dosis van en mg.
(function (root) {
  const UI_POR_ML = 100;
  const EPS = 1e-9;

  function aMg(valor, unidad, concMgMl) {
    if (unidad === 'mg') return valor;
    if (unidad === 'mcg') return valor / 1000;
    if (unidad === 'ui') return (valor / UI_POR_ML) * concMgMl;
    throw new Error('Unidad desconocida: ' + unidad);
  }

  function reconstitucion(vialMg, aguaMl) {
    const concMgMl = vialMg / aguaMl;
    return { concMgMl, mgPorUi: concMgMl / UI_POR_ML };
  }

  function dosis(mg, concMgMl) {
    const ml = mg / concMgMl;
    return { mg, ml, ui: ml * UI_POR_ML };
  }

  // Días (aprox.) que dura un vial a dosis constante.
  function duracionVialDias(vialMg, mgPorDosis, inyeccionesPorSemana) {
    const dosisPorVial = Math.floor(vialMg / mgPorDosis + EPS);
    return { dosisPorVial, dias: (dosisPorVial / inyeccionesPorSemana) * 7 };
  }

  // Recorre el ciclo día a día. Abre un vial nuevo cuando el actual no alcanza para la
  // dosis o cuando ya superó su estabilidad tras reconstituir.
  // etapas: [{ semanas, mg }]   dias: [1..7] (1 = lunes)
  function simularCiclo({ vialMg, etapas, dias, estabilidadDias }) {
    let viales = 0, inyecciones = 0, totalMg = 0, vencidoMg = 0;
    let restante = 0, abiertoEl = -Infinity, dia = 0;

    for (const etapa of etapas) {
      if (etapa.mg > vialMg + EPS) throw new Error('La dosis supera el contenido del vial');
      for (let s = 0; s < etapa.semanas; s++) {
        for (let d = 1; d <= 7; d++, dia++) {
          if (!dias.includes(d)) continue;
          const vencido = dia - abiertoEl >= estabilidadDias;
          if (vencido && restante >= etapa.mg - EPS) vencidoMg += restante;
          if (vencido || restante < etapa.mg - EPS) {
            viales++;
            restante = vialMg;
            abiertoEl = dia;
          }
          restante -= etapa.mg;
          totalMg += etapa.mg;
          inyecciones++;
        }
      }
    }
    return { viales, inyecciones, totalMg, vencidoMg };
  }

  // Una jeringa de insulina carga 100 UI: las dosis mayores se dividen en varias aplicaciones el mismo día.
  function jeringasPorDosis(ui) {
    return Math.max(1, Math.ceil(ui / UI_POR_ML - EPS));
  }

  // Jeringas de aplicación para todo el ciclo. etapas: [{ semanas, ui }]
  function jeringasCiclo(etapas, inyeccionesPorSemana) {
    return etapas.reduce((total, e) => total + e.semanas * inyeccionesPorSemana * jeringasPorDosis(e.ui), 0);
  }

  // Advertencias de medición para una dosis ya convertida.
  function avisosDosis(d) {
    const avisos = [];
    if (d.ui < 2) avisos.push(`La dosis equivale a ${d.ui.toFixed(1)} UI: es difícil de medir con precisión. Usa más agua al reconstituir.`);
    const n = jeringasPorDosis(d.ui);
    if (n > 1) avisos.push(`La dosis equivale a ${Number(d.ui.toFixed(1))} UI: no cabe en una jeringa de 100 UI. Se aplica en ${n} inyecciones el mismo día, en zonas distintas.`);
    return avisos;
  }

  const api = { UI_POR_ML, aMg, reconstitucion, dosis, duracionVialDias, simularCiclo, jeringasPorDosis, jeringasCiclo, avisosDosis };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Calculos = api;
})(this);
