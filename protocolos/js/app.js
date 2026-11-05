(function () {
  const C = window.Calculos;
  const PRODUCTOS = window.PRODUCTOS;
  const AGUA = window.AGUA_BACTERIOSTATICA;
  const KIT = window.KIT;
  const PRECIOS_LISTA = window.PRECIOS_LISTA;
  const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const DIAS_LARGOS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const PRESETS = { lv: [1, 2, 3, 4, 5], diaria: [1, 2, 3, 4, 5, 6, 7], lmv: [1, 3, 5], semanal: [1] };
  const ESTABILIDAD_POR_DEFECTO = 28;
  // v2: ahora se guardan solo los cambios sobre la lista oficial (v1 eran precios de prueba).
  const CLAVE_PRECIOS = 'protocolos.precios.v2';
  const CLAVE_RECARGO = 'kit:recargo';

  const $ = (sel) => document.querySelector(sel);
  const form = $('#form');

  // ---------- Utilidades ----------
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = (n, dec = 2) => (Number.isFinite(n) ? String(Number(n.toFixed(dec))) : '—');
  const dinero = (n) => '$' + n.toFixed(2);
  // Más de 100 UI no cabe en una jeringa: se muestra cómo repartirlo, como en sus fichas.
  const uiTexto = (ui) => {
    const n = C.jeringasPorDosis(ui);
    return `${num(ui, 1)} UI${n > 1 ? ` (${n} × ${num(ui / n, 1)})` : ''}`;
  };
  const PENDIENTE = '<span class="pendiente">—</span>';
  const productoPorId = (id) => PRODUCTOS.find((p) => p.id === id);

  // ---------- Precios ----------
  // Base: la lista oficial (precios.js). Encima van los "cambios", que según config.js son:
  //  - Nube (CONFIG_PRECIOS.url): la copia de la hoja de Google, compartida por todos los dispositivos.
  //    Se guarda una copia local para poder abrir sin conexión.
  //  - Local (sin url): lo editado en la pestaña Precios de este navegador.
  const URL_NUBE = (window.CONFIG_PRECIOS && window.CONFIG_PRECIOS.url) || '';
  const CLAVE_CACHE_NUBE = 'protocolos.precios.nube';
  const CLAVE_PIN = 'protocolos.precios.pin';
  const leerLocal = (clave) => { try { return JSON.parse(localStorage.getItem(clave)); } catch { return null; } };
  const escribirLocal = (clave, valor) => { try { localStorage.setItem(clave, JSON.stringify(valor)); return true; } catch { return false; } };
  let cambios = leerLocal(URL_NUBE ? CLAVE_CACHE_NUBE : CLAVE_PRECIOS) || {};
  const valido = (v) => typeof v === 'number' && v >= 0;
  const clavePrecio = (productoId, presentacion) => `${productoId}:${presentacion}`;
  const precioLista = (productoId, presentacion) => {
    const clave = clavePrecio(productoId, presentacion);
    const v = clave in cambios ? cambios[clave] : PRECIOS_LISTA[clave];
    return valido(v) ? v : null;
  };
  const recargoKit = () => (valido(cambios[CLAVE_RECARGO]) ? cambios[CLAVE_RECARGO] : KIT.recargo);
  const precioKit = (productoId, presentacion) => {
    const lista = precioLista(productoId, presentacion);
    return lista === null ? null : lista + recargoKit();
  };

  // ---------- Construcción del formulario ----------
  function opcionesProductos(incluirAgua) {
    const grupos = {};
    for (const p of PRODUCTOS) (grupos[p.categoria] ||= []).push(p);
    if (incluirAgua) grupos.Otros = [AGUA];
    return Object.entries(grupos)
      .map(([cat, ps]) => `<optgroup label="${esc(cat)}">${ps.map((p) => `<option value="${p.id}">${esc(p.nombre)}</option>`).join('')}</optgroup>`)
      .join('');
  }

  function poblarProductos() {
    $('#sel-producto').innerHTML = opcionesProductos(false);
  }

  function filaEtapa({ semanas = '', valor = '', unidad = 'mg' } = {}) {
    const div = document.createElement('div');
    div.className = 'etapa';
    div.innerHTML = `
      <label>Semanas <input type="number" class="e-semanas" min="1" step="1" value="${semanas}"></label>
      <label>Dosis <input type="number" class="e-valor" min="0" step="any" value="${valor}"></label>
      <label>Unidad <select class="e-unidad">
        ${['mg', 'mcg', 'ui'].map((u) => `<option value="${u}" ${u === unidad ? 'selected' : ''}>${u === 'ui' ? 'UI' : u}</option>`).join('')}
      </select></label>
      <button type="button" class="quitar" title="Quitar etapa">×</button>`;
    return div;
  }

  function ponerEtapas(etapas) {
    const cont = $('#etapas');
    cont.innerHTML = '';
    for (const e of etapas) cont.appendChild(filaEtapa(e));
  }

  function ponerDias(dias) {
    $('#dias').innerHTML = DIAS.map((d, i) =>
      `<label><input type="checkbox" value="${i + 1}" ${dias.includes(i + 1) ? 'checked' : ''}>${d}</label>`).join('');
  }

  function alCambiarProducto() {
    const p = productoPorId(form.producto.value);
    $('#sel-vial').innerHTML = p.presentaciones.map((pr) => `<option value="${pr.mg}">${pr.mg} mg</option>`).join('');
    const sugerida = p.presentaciones.find((pr) => pr.mg === p.presentacionSugerida) || p.presentaciones[0];
    form.vialMg.value = sugerida.mg;
    form.aguaMl.value = sugerida.aguaMl;
    form.objetivo.value = p.objetivo;
    ponerEtapas(p.etapasSugeridas ? p.etapasSugeridas.map((x) => ({ semanas: x.semanas, valor: x.mg, unidad: 'mg' })) : [{}]);
    ponerDias(p.frecuenciaSugerida || []);
    form.estabilidadDias.value = p.estabilidadDias || ESTABILIDAD_POR_DEFECTO;
  }

  function alCambiarVial() {
    const p = productoPorId(form.producto.value);
    const pr = p.presentaciones.find((x) => x.mg === Number(form.vialMg.value));
    if (pr) form.aguaMl.value = pr.aguaMl;
  }

  // ---------- Estado y cálculos ----------
  function leerEstado() {
    const p = productoPorId(form.producto.value);
    const vialMg = Number(form.vialMg.value);
    const aguaMl = Number(form.aguaMl.value);
    const rec = aguaMl > 0 ? C.reconstitucion(vialMg, aguaMl) : null;
    const etapas = [...document.querySelectorAll('.etapa')].map((fila) => {
      const semanas = parseInt(fila.querySelector('.e-semanas').value, 10);
      const valor = parseFloat(fila.querySelector('.e-valor').value);
      const unidad = fila.querySelector('.e-unidad').value;
      const mg = rec && valor > 0 ? C.aMg(valor, unidad, rec.concMgMl) : null;
      return { semanas: semanas > 0 ? semanas : null, mg, d: mg ? C.dosis(mg, rec.concMgMl) : null };
    });
    const dias = [...document.querySelectorAll('#dias input:checked')].map((i) => Number(i.value));
    return {
      p, vialMg, aguaMl, rec, etapas, dias,
      estabilidadDias: parseInt(form.estabilidadDias.value, 10) || ESTABILIDAD_POR_DEFECTO,
      cliente: form.cliente.value.trim(),
      objetivo: form.objetivo.value.trim(),
      notas: form.notas.value.trim(),
      incluirFases: form.incluirFases.checked,
      incluirPresupuesto: form.incluirPresupuesto.checked,
    };
  }

  function calcular(e) {
    const errores = [];
    const avisos = [];
    if (!e.rec) errores.push('Indica el agua de reconstitución.');
    if (e.etapas.some((x) => !x.mg)) errores.push('Falta la dosis en alguna etapa.');
    if (e.etapas.some((x) => !x.semanas)) errores.push('Faltan las semanas en alguna etapa.');
    if (!e.dias.length) errores.push('Elige los días de aplicación.');
    if (e.etapas.some((x) => x.mg && x.mg > e.vialMg)) errores.push('Una dosis supera el contenido del vial.');

    for (const x of e.etapas) if (x.d) avisos.push(...C.avisosDosis(x.d));

    let ciclo = null;
    if (!errores.length) {
      ciclo = C.simularCiclo({
        vialMg: e.vialMg, dias: e.dias, estabilidadDias: e.estabilidadDias,
        etapas: e.etapas.map((x) => ({ semanas: x.semanas, mg: x.mg })),
      });
      if (ciclo.vencidoMg > 0) {
        avisos.push(`Con esta dosis el vial vence (${e.estabilidadDias} días) antes de terminarse: se pierden ~${num(ciclo.vencidoMg)} mg en el ciclo. Considera una presentación menor.`);
      }
      ciclo.jeringas = C.jeringasCiclo(e.etapas.map((x) => ({ semanas: x.semanas, ui: x.d.ui })), e.dias.length);
      const incluidas = ciclo.viales * KIT.jeringasAplicacion;
      if (ciclo.jeringas > incluidas) {
        avisos.push(`El ciclo necesita ${ciclo.jeringas} jeringas de aplicación y ${ciclo.viales === 1 ? 'el kit incluye' : `los ${ciclo.viales} kits incluyen`} ${incluidas}: faltan ${ciclo.jeringas - incluidas}.`);
      }
    }
    // El nombre no afecta los cálculos: se valida después para que el ciclo se vea igual.
    if (!e.cliente) errores.unshift('Falta el nombre del cliente.');
    if (e.incluirPresupuesto && precioLista(e.p.id, e.vialMg) === null) {
      avisos.push(`Falta el precio de ${e.p.nombre} ${e.vialMg} mg (pestaña Precios).`);
    }
    return { errores, avisos, ciclo };
  }

  function etiquetaFrecuencia(dias) {
    const k = dias.join(',');
    if (k === '1,2,3,4,5') return 'Lunes a Viernes';
    if (dias.length === 7) return 'Todos los días';
    if (dias.length === 1) return `Una vez por semana (${DIAS_LARGOS[dias[0] - 1]})`;
    return dias.map((d) => DIAS_LARGOS[d - 1]).join(', ');
  }

  // ---------- Documento ----------
  function documento(e, r) {
    const { p, rec, etapas, dias } = e;
    const unaEtapa = etapas.length === 1;
    const d0 = etapas[0].d;
    const inySem = dias.length;
    const semanasTotal = etapas.reduce((s, x) => s + (x.semanas || 0), 0);
    const hoy = new Date();
    const partes = [];

    const ciclo = r.ciclo;
    const frecCorta = !inySem ? PENDIENTE : dias.join(',') === '1,2,3,4,5' ? 'Lun a Vie'
      : inySem === 7 ? 'Diaria' : inySem === 1 ? 'Semanal' : `${inySem} días/sem.`;
    partes.push(`
      <header class="doc-cabecera">
        <div class="arriba">
          <img class="logo" src="img/logo.png" alt="Barü Bio">
          <span class="tipo">Protocolo personal<br>${hoy.toLocaleDateString('es-PA', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>
        <div class="producto">${esc(p.nombre)}</div>
        <div class="sub">${esc(p.subtitulo)}</div>
        <div class="caja">
          <div class="k">Protocolo para</div>
          <div class="v">${e.cliente ? esc(e.cliente) : PENDIENTE}</div>
          <div class="o">Objetivo: ${esc(e.objetivo)}</div>
        </div>
      </header>
      <div class="resumen">
        <div><div class="k">Dosis</div><div class="v">${!unaEtapa ? 'Escalonada' : d0 ? `${uiTexto(d0.ui)} · ${num(d0.mg, 3)} mg` : PENDIENTE}</div></div>
        <div><div class="k">Frecuencia</div><div class="v">${frecCorta}</div></div>
        <div><div class="k">Duración</div><div class="v">${semanasTotal ? `${semanasTotal} semanas` : PENDIENTE}</div></div>
        <div><div class="k">Viales</div><div class="v">${ciclo ? `${ciclo.viales} × ${num(e.vialMg)} mg` : PENDIENTE}</div></div>
      </div>
      <div class="doc-cuerpo">`);

    partes.push(`
      <h2>Qué es ${esc(p.nombre)} y cómo actúa</h2>
      <p>${esc(p.descripcion)}</p>
      <table><thead><tr><th>Acción</th><th>Efecto esperado</th></tr></thead>
      <tbody>${p.acciones.map(([a, b]) => `<tr><td>${esc(a)}</td><td>${esc(b)}</td></tr>`).join('')}</tbody></table>`);

    if (p.componentes) {
      partes.push(`
        <table><thead><tr><th>Componente</th><th class="centro">% del vial</th><th class="centro">mg por vial</th><th class="centro">mg por dosis${unaEtapa ? '' : ' (etapa 1)'}</th></tr></thead>
        <tbody>${p.componentes.map((c) => `<tr><td class="etiqueta">${esc(c.nombre)}</td><td class="centro">${num(c.fraccion * 100, 1)}%</td>
          <td class="centro">${num(c.fraccion * e.vialMg)} mg</td><td class="centro">${d0 ? num(c.fraccion * d0.mg, 3) + ' mg' : PENDIENTE}</td></tr>`).join('')}</tbody></table>`);
    }

    const filas = (rows) => rows.map(([a, ...rest]) => `<tr><td class="etiqueta">${a}</td>${rest.map((x) => `<td${rest.length > 1 ? ' class="centro"' : ''}>${x}</td>`).join('')}</tr>`).join('');

    partes.push(`
      <h2>Reconstitución del vial</h2>
      <p>El vial contiene <b>${num(e.vialMg)} mg</b> en polvo liofilizado. Se reconstituye completo con <b>${num(e.aguaMl)} mL</b> de agua bacteriostática cada vez que se abre un nuevo vial.</p>
      <table class="oscura"><thead><tr><th>Parámetro</th><th>Valor</th></tr></thead><tbody>${filas([
        ['Cantidad de péptido', `${num(e.vialMg)} mg por vial`],
        ['Agua bacteriostática', `${num(e.aguaMl)} mL`],
        ['Concentración resultante', rec ? `${num(rec.concMgMl, 1)} mg/mL &nbsp;|&nbsp; 1 UI = ${num(rec.mgPorUi, 3)} mg` : PENDIENTE],
        [unaEtapa ? 'Dosis por aplicación' : 'Dosis inicial', d0 ? `${uiTexto(d0.ui)} = ${num(d0.ml)} mL = ${num(d0.mg, 3)} mg` : PENDIENTE],
        ['Almacenamiento', 'Refrigerar 2-8 °C · Proteger de la luz · No congelar'],
        ['Estabilidad post-reconst.', `${e.estabilidadDias} días`],
      ])}</tbody></table>`);

    const filasDosis = [];
    if (unaEtapa) {
      filasDosis.push(['Dosis por aplicación', d0 ? uiTexto(d0.ui) : PENDIENTE, d0 ? `${num(d0.ml)} mL · ${num(d0.mg, 3)} mg` : PENDIENTE]);
    }
    filasDosis.push(['Frecuencia', inySem ? etiquetaFrecuencia(dias) : PENDIENTE, `${inySem} día${inySem === 1 ? '' : 's'}/semana`]);
    if (inySem && inySem < 7) {
      const libres = [1, 2, 3, 4, 5, 6, 7].filter((d) => !dias.includes(d));
      filasDosis.push(['Descanso', libres.length === 2 && libres[0] === 6 ? 'Sábado y Domingo' : libres.map((d) => DIAS[d - 1]).join(', '), `${libres.length} días sin inyección`]);
    }
    if (unaEtapa && d0 && inySem) {
      filasDosis.push(['Consumo semanal', `${num(d0.ui * inySem, 1)} UI`, `${num(d0.ml * inySem)} mL · ${num(d0.mg * inySem, 3)} mg`]);
      const dur = C.duracionVialDias(e.vialMg, d0.mg, inySem);
      const venceAntes = dur.dias > e.estabilidadDias;
      const diasVial = Math.min(dur.dias, e.estabilidadDias);
      filasDosis.push(['Duración del vial', diasVial < 14 ? `${dur.dosisPorVial} aplicaciones (~${Math.round(diasVial)} días)` : `~${num(diasVial / 7, 1)} semanas`,
        venceAntes ? `Vence a los ${e.estabilidadDias} días: desechar sobrante` : `${num(e.aguaMl)} mL / ${num(d0.ml * inySem)} mL por semana`]);
    }
    if (ciclo) {
      filasDosis.push([`Viales para ${semanasTotal} sem.`, `${ciclo.viales} vial${ciclo.viales === 1 ? '' : 'es'}`, `${ciclo.inyecciones} aplicaciones · ${num(ciclo.totalMg, 3)} mg en total`]);
    }

    partes.push('<h2>Dosis y administración</h2>');
    if (!unaEtapa) {
      partes.push(`
        <table><thead><tr><th>Etapa</th><th class="centro">Semanas</th><th class="centro">Dosis</th><th class="centro">UI</th><th class="centro">mL</th></tr></thead>
        <tbody>${(() => {
          let desde = 1;
          return etapas.map((x, i) => {
            const rango = x.semanas ? `${desde}-${desde + x.semanas - 1}` : PENDIENTE;
            desde += x.semanas || 0;
            return `<tr><td class="etiqueta">Etapa ${i + 1}</td><td class="centro">${rango}</td><td class="centro">${x.d ? num(x.d.mg, 3) + ' mg' : PENDIENTE}</td>
              <td class="centro">${x.d ? uiTexto(x.d.ui) : PENDIENTE}</td><td class="centro">${x.d ? num(x.d.ml) : PENDIENTE}</td></tr>`;
          }).join('');
        })()}</tbody></table>`);
    }
    partes.push(`<table><thead><tr><th>Parámetro</th><th class="centro">Valor</th><th class="centro">Detalle</th></tr></thead><tbody>${filas(filasDosis)}</tbody></table>`);

    const dosisTexto = unaEtapa && d0 ? `los ${uiTexto(d0.ui)}` : 'la dosis indicada para la etapa';
    partes.push(`
      <h2>Técnica de inyección subcutánea</h2>
      <table><thead><tr><th class="centro">#</th><th>Paso</th></tr></thead><tbody>${[
        'Lavarse las manos. Limpiar la zona con alcohol y esperar 10 segundos a que seque.',
        'Pellizcar suavemente la piel (abdomen, muslo o zona de interés).',
        'Insertar aguja 29-31G a 45 grados con un movimiento seguro y continuo.',
        `Inyectar lentamente ${dosisTexto}. Retirar la aguja y presionar suave con gasa.`,
        'Rotar las zonas de inyección para evitar lipodistrofia local.',
      ].map((t, i) => `<tr><td class="centro etiqueta">${i + 1}</td><td>${esc(t)}</td></tr>`).join('')}</tbody></table>`);

    partes.push(`
      <h2>Calendario semanal</h2>
      <table class="calendario oscura"><thead><tr>${DIAS.map((d) => `<th class="centro">${d}</th>`).join('')}</tr></thead>
      <tbody><tr>${[1, 2, 3, 4, 5, 6, 7].map((d) => dias.includes(d)
        ? `<td>${unaEtapa && d0 ? uiTexto(d0.ui) : 'Dosis'}<br>SC</td>`
        : '<td class="descanso">Descanso</td>').join('')}</tr></tbody></table>
      ${unaEtapa ? '' : '<p class="ayuda">La dosis de cada día depende de la etapa (ver tabla de dosis).</p>'}`);

    if (e.incluirFases && p.fases.length) {
      partes.push(`
        <h2>Resultados esperados por fase</h2>
        <table><thead><tr><th class="centro">Fase</th><th class="centro">Semanas</th><th>Resultados esperados</th></tr></thead>
        <tbody>${p.fases.map(([f, s, t]) => `<tr><td class="etiqueta centro">${esc(f)}</td><td class="centro">${esc(s)}</td><td>${esc(t)}</td></tr>`).join('')}</tbody></table>`);
    }

    if (e.notas) {
      partes.push(`<h2>Indicaciones adicionales</h2><p>${esc(e.notas).replace(/\n/g, '<br>')}</p>`);
    }

    const precs = [...p.precauciones, ...window.PRECAUCIONES_GENERALES, 'Uso bajo supervisión profesional. No sustituye consejo médico.'];
    partes.push(`
      <h2>Precauciones</h2>
      <table class="precauciones"><tbody>${precs.map((t) => `<tr><td><span>!</span></td><td>${esc(t)}</td></tr>`).join('')}</tbody></table>`);

    if (e.incluirPresupuesto && ciclo) {
      const pk = precioKit(p.id, e.vialMg);
      partes.push(`
        <h2>Presupuesto del ciclo</h2>
        <table><thead><tr><th>Producto</th><th class="centro">Kits</th><th class="centro">Precio por kit</th><th class="centro">Total</th></tr></thead>
        <tbody><tr><td class="etiqueta">Kit ${esc(p.nombre)} ${num(e.vialMg)} mg</td><td class="centro">${ciclo.viales}</td>
          <td class="centro">${pk !== null ? dinero(pk) : PENDIENTE}</td><td class="centro"><b>${pk !== null ? dinero(ciclo.viales * pk) : PENDIENTE}</b></td></tr>
        </tbody></table>
        <p class="ayuda">Cada kit incluye: ${KIT.incluye.map(esc).join(' · ')}.</p>`);
    }

    partes.push(`</div>
      <footer class="doc-pie"><img class="logo" src="img/logo.png" alt="Barü Bio"><span>Protocolo elaborado con fines de investigación. Uso exclusivo bajo supervisión profesional. Research compound — not for human use per regulatory standards.</span></footer>`);
    return partes.join('');
  }

  // Documento de presupuesto (lo usan el botón del protocolo y la pestaña Presupuesto).
  // lineas: [{ descripcion, cantidad, precio (null = pendiente), kit }]
  function documentoPresupuesto(cliente, lineas) {
    const hoy = new Date().toLocaleDateString('es-PA', { day: 'numeric', month: 'long', year: 'numeric' });
    const completo = lineas.every((l) => l.precio !== null);
    const total = lineas.reduce((s, l) => s + (l.precio ?? 0) * l.cantidad, 0);
    return `
      <header class="doc-cabecera">
        <div class="arriba">
          <img class="logo" src="img/logo.png" alt="Barü Bio">
          <span class="tipo">${hoy}</span>
        </div>
        <div class="producto">Presupuesto</div>
        <div class="caja">
          <div class="k">Cliente</div>
          <div class="v">${cliente ? esc(cliente) : PENDIENTE}</div>
        </div>
      </header>
      <div class="doc-cuerpo">
        <h2>Detalle</h2>
        <table><thead><tr><th>Producto</th><th class="centro">Cantidad</th><th class="centro">Precio unitario</th><th class="centro">Subtotal</th></tr></thead>
        <tbody>
          ${lineas.map((l) => `<tr><td class="etiqueta">${esc(l.descripcion)}</td><td class="centro">${l.cantidad}</td>
            <td class="centro">${l.precio !== null ? dinero(l.precio) : PENDIENTE}</td>
            <td class="centro">${l.precio !== null ? dinero(l.precio * l.cantidad) : PENDIENTE}</td></tr>`).join('')}
          <tr><td class="etiqueta">Total</td><td></td><td></td><td class="centro total">${completo ? dinero(total) : PENDIENTE}</td></tr>
        </tbody></table>
        <p class="ayuda">Precios en dólares (USD).</p>
        ${lineas.some((l) => l.kit) ? `<h2>Cada kit incluye</h2>
        <ul class="kit-lista">${KIT.incluye.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
      </div>`;
  }

  // Presupuesto a partir del protocolo: los kits que necesita el ciclo.
  function presupuesto(e, r) {
    const pk = precioKit(e.p.id, e.vialMg);
    if (!r.ciclo || pk === null) return '';
    return documentoPresupuesto(e.cliente, [
      { descripcion: `Kit ${e.p.nombre} ${num(e.vialMg)} mg`, cantidad: r.ciclo.viales, precio: pk, kit: true },
    ]);
  }

  function render() {
    const e = leerEstado();
    const r = calcular(e);
    $('#vista').innerHTML = documento(e, r);
    const cotizacion = presupuesto(e, r);
    $('#vista-presupuesto').innerHTML = cotizacion;
    $('#avisos').innerHTML =
      r.errores.map((t) => `<div class="aviso error">${esc(t)}</div>`).join('') +
      r.avisos.map((t) => `<div class="aviso">${esc(t)}</div>`).join('');
    $('#btn-pdf').disabled = r.errores.length > 0;
    const btn = $('#btn-presupuesto');
    btn.disabled = r.errores.length > 0 || !cotizacion;
    btn.title = !btn.disabled ? '' : r.errores.length ? 'Completa los datos marcados en rojo.' : `Falta el precio de ${e.p.nombre} ${e.vialMg} mg (pestaña Precios).`;
  }

  // El navegador usa el título de la página como nombre sugerido del PDF.
  function imprimirComo(nombreArchivo, modo) {
    const d = new Date();
    const fecha = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    const original = document.title;
    document.title = `${nombreArchivo}_${fecha}`.replace(/\s+/g, '_');
    if (modo) document.body.classList.add(modo);
    window.print();
    if (modo) document.body.classList.remove(modo);
    document.title = original;
  }

  // tipo: 'Protocolo' o 'Presupuesto'. El modo decide qué documento se imprime (ver css).
  function imprimir(tipo) {
    const e = leerEstado();
    imprimirComo(`${e.p.nombre}_${tipo}_${e.cliente}`, tipo === 'Presupuesto' ? 'modo-presupuesto' : null);
  }

  // ---------- Pestaña Presupuesto (entrada manual, sin protocolo) ----------
  const formManual = $('#form-manual');

  function presentacionesDe(id) {
    return id === AGUA.id
      ? AGUA.presentacionesMl.map((ml) => ({ valor: ml, texto: `${ml} mL` }))
      : productoPorId(id).presentaciones.map((pr) => ({ valor: pr.mg, texto: `${pr.mg} mg` }));
  }

  // Los péptidos se venden como kit; el agua suelta, a precio de lista.
  function lineaManual(id, valor, cantidad) {
    if (id === AGUA.id) {
      return { descripcion: `${AGUA.nombre} ${valor} mL`, cantidad, precio: precioLista(id, valor), kit: false };
    }
    return { descripcion: `Kit ${productoPorId(id).nombre} ${valor} mg`, cantidad, precio: precioKit(id, valor), kit: true };
  }

  function poblarPresentaciones(fila) {
    fila.querySelector('.m-pres').innerHTML = presentacionesDe(fila.querySelector('.m-producto').value)
      .map((p) => `<option value="${p.valor}">${p.texto}</option>`).join('');
  }

  function agregarLineaManual() {
    const div = document.createElement('div');
    div.className = 'linea';
    div.innerHTML = `
      <label>Producto <select class="m-producto">${opcionesProductos(true)}</select></label>
      <div class="linea-fila">
        <label>Presentación <select class="m-pres"></select></label>
        <label>Cantidad <input type="number" class="m-cant" min="1" step="1" value="1"></label>
        <button type="button" class="quitar" title="Quitar producto">×</button>
      </div>
      <div class="m-precio ayuda"></div>`;
    $('#lineas-manual').appendChild(div);
    poblarPresentaciones(div);
  }

  function leerLineasManual() {
    return [...document.querySelectorAll('#lineas-manual .linea')].map((fila) => {
      const cantidad = parseInt(fila.querySelector('.m-cant').value, 10);
      const linea = lineaManual(fila.querySelector('.m-producto').value, fila.querySelector('.m-pres').value, cantidad > 0 ? cantidad : 0);
      fila.querySelector('.m-precio').textContent = linea.precio === null
        ? 'Sin precio: complétalo en la pestaña Precios.'
        : `${linea.kit ? 'Precio de kit' : 'Precio'}: ${dinero(linea.precio)} × ${linea.cantidad} = ${dinero(linea.precio * linea.cantidad)}`;
      return linea;
    });
  }

  function renderManual() {
    const cliente = formManual.cliente.value.trim();
    const lineas = leerLineasManual();
    $('#vista-manual').innerHTML = documentoPresupuesto(cliente, lineas);
    const errores = [];
    if (!cliente) errores.push('Falta el nombre del cliente.');
    if (!lineas.length) errores.push('Agrega al menos un producto.');
    if (lineas.some((l) => !l.cantidad)) errores.push('Revisa las cantidades: deben ser 1 o más.');
    if (lineas.some((l) => l.precio === null)) errores.push('Hay productos sin precio (pestaña Precios).');
    $('#avisos-manual').innerHTML = errores.map((t) => `<div class="aviso error">${esc(t)}</div>`).join('');
    $('#btn-manual-pdf').disabled = errores.length > 0;
  }

  formManual.addEventListener('change', (ev) => {
    if (ev.target.classList.contains('m-producto')) poblarPresentaciones(ev.target.closest('.linea'));
    renderManual();
  });
  formManual.addEventListener('input', renderManual);
  formManual.addEventListener('click', (ev) => {
    const quitar = ev.target.closest('.quitar');
    if (quitar) { quitar.closest('.linea').remove(); renderManual(); }
  });
  $('#btn-linea').addEventListener('click', () => { agregarLineaManual(); renderManual(); });
  $('#btn-manual-pdf').addEventListener('click', () => imprimirComo(`Presupuesto_${formManual.cliente.value.trim()}`));

  // ---------- Pestaña de precios ----------
  function filasPrecios() {
    const filas = [];
    for (const p of PRODUCTOS) {
      for (const pr of p.presentaciones) filas.push({ nombre: p.nombre, pres: `${pr.mg} mg`, id: p.id, valor: pr.mg, kit: true });
    }
    for (const ml of AGUA.presentacionesMl) filas.push({ nombre: AGUA.nombre, pres: `${ml} mL`, id: AGUA.id, valor: ml, kit: false });
    return filas;
  }

  // La tabla se construye una vez; luego solo se actualizan valores, para no perder el foco al editar.
  function renderPrecios() {
    $('#precios').innerHTML = filasPrecios().map((f) => `<tr><td>${esc(f.nombre)}</td><td>${f.pres}</td>
        <td><input type="number" min="0" step="0.01" data-clave="${clavePrecio(f.id, f.valor)}" placeholder="Pendiente"></td>
        <td class="precio-kit" data-kit="${f.kit}"></td></tr>`).join('');
    pintarPrecios();
  }

  function pintarPrecios() {
    const recargo = $('#in-recargo');
    if (document.activeElement !== recargo) recargo.value = recargoKit();
    document.querySelectorAll('#precios input[data-clave]').forEach((input) => {
      const [id, valor] = input.dataset.clave.split(':');
      const lista = precioLista(id, valor);
      if (document.activeElement !== input) input.value = lista ?? '';
      const celda = input.closest('tr').querySelector('.precio-kit');
      const pk = precioKit(id, valor);
      celda.textContent = celda.dataset.kit === 'true' ? (pk !== null ? dinero(pk) : '—') : 'No aplica';
    });
  }

  function estadoPrecios(texto) {
    $('#estado-precios').textContent = texto;
  }

  function refrescarPrecios() {
    pintarPrecios();
    render();
    renderManual();
  }

  // nuevos: { clave: valor | null }. null = sin precio (pendiente).
  async function guardarPrecios(nuevos) {
    if (!URL_NUBE) {
      for (const [clave, v] of Object.entries(nuevos)) {
        // Igual a la lista oficial: no hace falta guardarlo como cambio.
        const oficial = clave === CLAVE_RECARGO ? KIT.recargo : PRECIOS_LISTA[clave];
        if (v === oficial) delete cambios[clave];
        else cambios[clave] = v;
      }
      estadoPrecios(escribirLocal(CLAVE_PRECIOS, cambios) ? 'Guardado en este navegador.' : 'No se pudo guardar en este navegador: exporta los precios para no perderlos.');
      refrescarPrecios();
      return;
    }
    const pin = leerLocal(CLAVE_PIN) || prompt('PIN para editar precios:');
    if (!pin) { refrescarPrecios(); return; }
    estadoPrecios('Guardando…');
    try {
      // Sin cabeceras (text/plain) para que el navegador no haga la consulta previa de CORS.
      const datos = await (await fetch(URL_NUBE, { method: 'POST', body: JSON.stringify({ pin, cambios: nuevos }) })).json();
      if (!datos.ok) {
        if (datos.error === 'pin') localStorage.removeItem(CLAVE_PIN);
        estadoPrecios(datos.error === 'pin' ? 'PIN incorrecto: el cambio no se guardó.' : 'La hoja rechazó el cambio.');
        refrescarPrecios();
        return;
      }
      escribirLocal(CLAVE_PIN, pin);
      recibirNube(datos.precios);
      estadoPrecios('Guardado para todos.');
    } catch {
      estadoPrecios('Sin conexión: el cambio no se guardó. Inténtalo de nuevo.');
      refrescarPrecios();
    }
  }

  function recibirNube(precios) {
    cambios = precios;
    escribirLocal(CLAVE_CACHE_NUBE, cambios);
    refrescarPrecios();
  }

  async function cargarNube() {
    if (!URL_NUBE) return;
    try {
      const datos = await (await fetch(URL_NUBE)).json();
      if (!datos.ok) throw new Error();
      recibirNube(datos.precios);
      estadoPrecios(`Precios sincronizados con la hoja (${new Date().toLocaleTimeString('es-PA', { hour: '2-digit', minute: '2-digit' })})`);
    } catch {
      estadoPrecios('Sin conexión con la hoja: se usan los últimos precios descargados.');
    }
  }

  $('#precios').addEventListener('change', (ev) => {
    const input = ev.target.closest('input[data-clave]');
    if (!input) return;
    const v = parseFloat(input.value);
    guardarPrecios({ [input.dataset.clave]: Number.isFinite(v) && v >= 0 ? v : null });
  });

  $('#in-recargo').addEventListener('change', (ev) => {
    const v = parseFloat(ev.target.value);
    guardarPrecios({ [CLAVE_RECARGO]: Number.isFinite(v) && v >= 0 ? v : KIT.recargo });
  });

  // En modo nube la hoja es la lista oficial, así que no hay nada que restaurar.
  $('#btn-restaurar').hidden = Boolean(URL_NUBE);
  $('#btn-restaurar').addEventListener('click', () => {
    if (!confirm('¿Volver a la lista de precios oficial? Se pierden los cambios hechos en este navegador.')) return;
    cambios = {};
    escribirLocal(CLAVE_PRECIOS, cambios);
    estadoPrecios('Lista oficial restaurada.');
    refrescarPrecios();
  });

  $('#btn-exportar').addEventListener('click', () => {
    const vigentes = { [CLAVE_RECARGO]: recargoKit() };
    for (const f of filasPrecios()) vigentes[clavePrecio(f.id, f.valor)] = precioLista(f.id, f.valor);
    const blob = new Blob([JSON.stringify(vigentes, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'precios.json';
    a.click();
    URL.revokeObjectURL(a.href);
  });

  $('#in-importar').addEventListener('change', async (ev) => {
    const archivo = ev.target.files[0];
    if (!archivo) return;
    try {
      const datos = JSON.parse(await archivo.text());
      const limpios = Object.fromEntries(Object.entries(datos).filter(([, v]) => valido(v)));
      await guardarPrecios(limpios);
    } catch {
      estadoPrecios('El archivo no es válido.');
    }
    ev.target.value = '';
  });

  // ---------- Eventos ----------
  document.querySelectorAll('.tabs button').forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll('.tabs button').forEach((x) => x.classList.toggle('activa', x === b));
    document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('oculto', t.id !== `tab-${b.dataset.tab}`));
  }));

  form.addEventListener('input', render);
  form.addEventListener('change', (ev) => {
    if (ev.target === form.producto) alCambiarProducto();
    else if (ev.target === form.vialMg) alCambiarVial();
    render();
  });
  form.addEventListener('click', (ev) => {
    const preset = ev.target.closest('[data-preset]');
    if (preset) { ponerDias(PRESETS[preset.dataset.preset]); render(); }
    const quitar = ev.target.closest('.quitar');
    if (quitar && document.querySelectorAll('.etapa').length > 1) { quitar.closest('.etapa').remove(); render(); }
  });
  $('#btn-etapa').addEventListener('click', () => { $('#etapas').appendChild(filaEtapa()); render(); });
  $('#btn-pdf').addEventListener('click', () => imprimir('Protocolo'));
  $('#btn-presupuesto').addEventListener('click', () => imprimir('Presupuesto'));

  // ---------- Inicio ----------
  poblarProductos();
  alCambiarProducto();
  $('#modo-precios').textContent = URL_NUBE
    ? 'Precios compartidos: se guardan en la hoja de Google y los ven todos los dispositivos. Para editar se pide el PIN la primera vez.'
    : 'Los cambios se guardan solo en este navegador; usa “Exportar” para tener una copia o pasarlos a otro equipo.';
  renderPrecios();
  agregarLineaManual();
  render();
  renderManual();
  cargarNube();
  // Al volver a la pestaña del navegador, se traen los precios que otros hayan cambiado.
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') cargarNube(); });
})();
