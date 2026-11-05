// Contenido de cada producto. Textos resumidos del catálogo del proveedor; los de GHK-Cu salen
// del protocolo de ejemplo.
//
// IMPORTANTE: aquí NO hay dosis inventadas. Solo traen etapasSugeridas los productos de los que hay
// una ficha suya (GHK-Cu, Tirzepatide, Retatrutide). Para el resto, la dosis se escribe en cada protocolo.
// Las precauciones son advertencias generales conocidas: conviene que las revise un profesional.
//
// presentaciones[].aguaMl = agua sugerida para reconstituir (se puede cambiar en cada protocolo).
// frecuenciaSugerida: 1 = lunes ... 7 = domingo. null = se elige en cada protocolo.
// estabilidadDias: días que dura el vial ya preparado (28 si no se indica).

window.PRECAUCIONES_GENERALES = [
  'No usar durante el embarazo ni la lactancia.',
  'Descartar el vial si presenta turbidez, partículas o cambio de color.',
  'Refrigerar siempre a 2-8 °C una vez reconstituido. No congelar.',
  'Usar jeringa y aguja nuevas en cada aplicación. No compartir material.',
];

const PRECAUCIONES_COBRE = [
  'No usar si hay hipersensibilidad conocida al cobre o a cualquier componente del péptido.',
  'Evitar en casos de enfermedad de Wilson (acumulación patológica de cobre).',
];

const PRECAUCIONES_REPARACION = [
  'Evitar con cáncer activo o antecedente reciente: BPC-157 y TB-500 estimulan la formación de vasos sanguíneos.',
];

const PRECAUCIONES_INCRETINAS = [
  'No usar con antecedente personal o familiar de carcinoma medular de tiroides o síndrome MEN 2.',
  'No usar con antecedente de pancreatitis. Suspender y consultar ante dolor abdominal intenso y persistente.',
  'Riesgo de hipoglucemia si se combina con insulina o sulfonilureas.',
  'Náuseas, estreñimiento o diarrea son frecuentes al inicio y al subir la dosis: hidratación abundante y comidas pequeñas.',
];

const PRECAUCIONES_GH = [
  'Evitar con cáncer activo: aumenta la hormona de crecimiento y el IGF-1.',
  'Puede elevar la glucosa: precaución en diabetes o resistencia a la insulina.',
  'Posible retención de líquidos, hormigueo en manos o rubor tras la aplicación.',
];

const PRECAUCIONES_SNC = [
  'Precaución si se toman ansiolíticos, antidepresivos u otros fármacos que actúan sobre el sistema nervioso.',
];

const SEMANAL_LUNES = [1];

// Sus preguntas frecuentes: un GLP-1 ya preparado dura como máximo 8 semanas en refrigeración.
const ESTABILIDAD_GLP = 56;

// Sus fichas de GLP-1 diluyen a 10 mg/mL (15 mg en 1.5 mL). Se aplica igual a las demás
// presentaciones; las de 40 y 60 mg quedan en 3 mL para no superar la capacidad del vial.
const aguaIncretina = (mg) => (mg <= 30 ? mg / 10 : 3);

window.PRODUCTOS = [
  {
    id: 'ghk-cu',
    nombre: 'GHK-Cu',
    subtitulo: 'Gly-His-Lys · Péptido de Cobre',
    categoria: 'Piel y cabello',
    objetivo: 'Piel · Cabello · Colágeno · Antiaging',
    descripcion:
      'GHK-Cu (Gly-His-Lys-Cu) es un tripéptido de cobre endógeno presente en plasma humano cuya concentración declina con la edad. Activa más de 4,000 genes relacionados con reparación tisular, síntesis de colágeno/elastina y respuesta antioxidante. Es uno de los péptidos antiaging con mayor respaldo científico para regeneración cutánea y capilar.',
    acciones: [
      ['Síntesis de colágeno tipo I y III', 'Mayor firmeza y elasticidad cutánea'],
      ['Síntesis de elastina y glicosaminoglicanos', 'Reducción de arrugas y flacidez'],
      ['Activación folicular (Wnt/beta-catenina)', 'Estimulación del crecimiento capilar'],
      ['Superóxido dismutasa + catalasa', 'Reducción del estrés oxidativo dérmico'],
      ['VEGF y angiogénesis', 'Mejor irrigación y nutrición de la piel'],
      ['Modulación IL-6, TNF-alfa', 'Efecto antiinflamatorio local y sistémico'],
    ],
    presentaciones: [{ mg: 50, aguaMl: 3 }, { mg: 100, aguaMl: 3 }],
    presentacionSugerida: 100,
    etapasSugeridas: [{ semanas: 8, mg: 5 }], // sus fichas: 5 mg L-V (15 UI con 100 mg o 30 UI con 50 mg, en 3 mL)
    frecuenciaSugerida: [1, 2, 3, 4, 5],
    fases: [
      ['Adaptación', '1-2', 'Mejor hidratación cutánea, piel más luminosa. Posible leve rubor local.'],
      ['Activa', '3-5', 'Mejora visible en textura. Reducción de líneas finas. Inicio de respuesta capilar.'],
      ['Consolidación', '6-8', 'Firmeza notable, reducción de arrugas, cabello más denso y resistente.'],
      ['Post-ciclo', 'Descanso 2-4 sem.', 'Los efectos se mantienen. Descanso para evitar down-regulation de receptores.'],
    ],
    precauciones: PRECAUCIONES_COBRE,
  },
  {
    id: 'ahk-cu',
    nombre: 'AHK-Cu',
    subtitulo: 'Ala-His-Lys · Tripéptido de Cobre · Folículo',
    categoria: 'Piel y cabello',
    objetivo: 'Cabello · Densidad · Anti-caída',
    descripcion:
      'AHK-Cu es cobre unido a alanina-histidina-lisina. Su terreno es el folículo: estimula los fibroblastos del cuero cabelludo, mejora el riego en la raíz y alarga la fase de crecimiento del cabello. Menos pelo fino y más anclaje.',
    acciones: [
      ['Prolonga la fase anágena', 'Folículos débiles se reactivan; hebra más densa'],
      ['Colágeno alrededor de la raíz', 'Mejor anclaje, menos caída'],
      ['Microcirculación folicular', 'Más oxígeno y nutrientes en la raíz'],
      ['Acción antioxidante del cobre', 'Menos inflamación crónica del cuero cabelludo'],
      ['Freno a la miniaturización', 'Mantiene diámetro y color de la hebra'],
    ],
    presentaciones: [{ mg: 50, aguaMl: 3 }],
    frecuenciaSugerida: null,
    fases: [],
    precauciones: PRECAUCIONES_COBRE,
  },
  {
    id: 'glow',
    nombre: 'GLOW',
    subtitulo: 'GHK-Cu 70% · TB-500 15% · BPC-157 15%',
    categoria: 'Piel y cabello',
    objetivo: 'Piel · Colágeno · Recuperación',
    descripcion:
      'GLOW combina en un solo vial el GHK-Cu (70%), responsable del colágeno, el tono y el apoyo capilar, con el dúo clásico de reparación: TB-500 lleva células al sitio dañado y BPC-157 repara el foco. Piel que tensa y tejido que cierra.',
    componentes: [
      { nombre: 'GHK-Cu', fraccion: 0.7 },
      { nombre: 'TB-500', fraccion: 0.15 },
      { nombre: 'BPC-157', fraccion: 0.15 },
    ],
    acciones: [
      ['GHK-Cu: colágeno I y III', 'Menos flacidez, mejor textura y apoyo capilar'],
      ['BPC-157: reparación local', 'Tendón, mucosa e intestino; nuevos vasos en la zona'],
      ['TB-500: migración celular', 'Menos fibrosis y más rango de movimiento'],
      ['Acción antiinflamatoria', 'Recuperación entre entrenamientos'],
    ],
    presentaciones: [{ mg: 70, aguaMl: 3 }],
    frecuenciaSugerida: null,
    fases: [],
    precauciones: [...PRECAUCIONES_COBRE, ...PRECAUCIONES_REPARACION],
  },
  {
    id: 'klow',
    nombre: 'KLOW',
    subtitulo: 'GHK-Cu 50 mg · BPC-157 10 mg · TB-500 10 mg · KPV 10 mg',
    categoria: 'Piel y cabello',
    objetivo: 'Piel · Reparación · Antiinflamatorio',
    descripcion:
      'KLOW es el stack de reparación en un solo liofilizado. GHK-Cu tensa y remodela la piel, BPC-157 repara tendón, mucosa e intestino, TB-500 lleva células al foco y reduce la fibrosis, y KPV apaga la inflamación para que lo anterior funcione mejor.',
    componentes: [
      { nombre: 'GHK-Cu', fraccion: 50 / 80 },
      { nombre: 'BPC-157', fraccion: 10 / 80 },
      { nombre: 'TB-500', fraccion: 10 / 80 },
      { nombre: 'KPV', fraccion: 10 / 80 },
    ],
    acciones: [
      ['GHK-Cu: colágeno I y III', 'Menos flacidez, mejor textura, apoyo a cicatriz y cabello'],
      ['BPC-157: reparación local', 'Tendón, ligamento, estómago y nervio'],
      ['TB-500: migración celular', 'Menos cicatriz dura, más rango de movimiento'],
      ['KPV: vía inflamatoria', 'Calma intestino y piel reactiva; barrera que cierra'],
    ],
    presentaciones: [{ mg: 80, aguaMl: 3 }],
    frecuenciaSugerida: null,
    fases: [],
    precauciones: [...PRECAUCIONES_COBRE, ...PRECAUCIONES_REPARACION],
  },
  {
    id: 'glutation',
    nombre: 'Glutatión',
    subtitulo: 'Antioxidante maestro · Glu-Cys-Gly',
    categoria: 'Piel y cabello',
    objetivo: 'Piel · Tono · Antioxidante',
    descripcion:
      'El glutatión es el tripéptido que las células fabrican para no oxidarse (glutamato, cisteína, glicina). Neutraliza radicales libres, apoya al hígado en la eliminación de toxinas y reduce la inflamación de fondo, lo que se refleja en una piel más uniforme.',
    acciones: [
      ['Neutraliza radicales libres', 'Menos desgaste celular e inflamación de fondo'],
      ['Detox hepático fase II', 'Apoya la eliminación de toxinas'],
      ['Soporte inmunitario', 'Linfocitos y macrófagos funcionan mejor'],
      ['Menos inflamación cutánea', 'Tono más uniforme y luminoso'],
      ['Energía celular', 'Mitocondria más eficiente, menos fatiga'],
    ],
    presentaciones: [{ mg: 600, aguaMl: 3 }],
    frecuenciaSugerida: null,
    fases: [],
    precauciones: [
      'No usar si hay hipersensibilidad conocida al glutatión.',
      'Precaución en personas con asma.',
    ],
  },
  {
    id: 'tirzepatide',
    nombre: 'Tirzepatide',
    subtitulo: 'Agonista dual · GIP + GLP-1',
    categoria: 'Adelgazar',
    objetivo: 'Pérdida de peso · Control del apetito',
    descripcion:
      'Tirzepatide activa dos receptores: GLP-1 (saciedad, vaciado gástrico más lento, insulina) y GIP (mejor uso de nutrientes y mejor tolerancia). Se aplica una vez por semana. Reduce el apetito, la grasa visceral y ordena la glucosa.',
    acciones: [
      ['GLP-1: saciedad central', 'Menos apetito y menos antojos'],
      ['GIP: manejo de nutrientes', 'Mejor control de glucosa y grasa, mejor tolerancia'],
      ['Vaciado gástrico más lento', 'Saciedad que dura más'],
      ['Efecto cardiometabólico', 'Mejor presión, triglicéridos y cintura'],
    ],
    presentaciones: [5, 10, 15, 20, 30, 60].map((mg) => ({ mg, aguaMl: aguaIncretina(mg) })),
    presentacionSugerida: 15,
    // Su ficha "Tirzepatide 15 mg / 1.5 mL": escalado mensual de 2.5 a 15 mg.
    etapasSugeridas: [2.5, 5, 7.5, 10, 12.5, 15].map((mg) => ({ semanas: 4, mg })),
    estabilidadDias: ESTABILIDAD_GLP,
    frecuenciaSugerida: SEMANAL_LUNES,
    fases: [],
    precauciones: [
      ...PRECAUCIONES_INCRETINAS,
      'Puede reducir la eficacia de los anticonceptivos orales: usar un método adicional (barrera) las primeras 4 semanas y tras cada aumento de dosis.',
    ],
  },
  {
    id: 'retatrutide',
    nombre: 'Retatrutide',
    subtitulo: 'Triple agonista · GIP + GLP-1 + Glucagón',
    categoria: 'Adelgazar',
    objetivo: 'Pérdida de peso · Grasa visceral',
    descripcion:
      'Retatrutide es un triple agonista semanal: GIP, GLP-1 y glucagón en una sola molécula. Reduce el apetito, mejora el uso de nutrientes y aumenta el gasto energético, con efecto sobre la grasa visceral y hepática.',
    acciones: [
      ['GLP-1: saciedad', 'Menos hambre y vaciado gástrico más lento'],
      ['GIP: calidad de la pérdida', 'Mejor manejo de glucosa y grasa, mejor tolerancia'],
      ['Glucagón: gasto energético', 'Más quema en reposo, ataca grasa visceral e hígado'],
      ['Perfil metabólico', 'Menos grasa hepática y perímetro abdominal'],
    ],
    presentaciones: [5, 10, 15, 20, 30, 40, 60].map((mg) => ({ mg, aguaMl: aguaIncretina(mg) })),
    presentacionSugerida: 15,
    // Su ficha "Retatrutide 15 mg / 1.5 mL": 2 → 4 → 8 → 12 mg, un mes por escalón.
    etapasSugeridas: [2, 4, 8, 12].map((mg) => ({ semanas: 4, mg })),
    estabilidadDias: ESTABILIDAD_GLP,
    frecuenciaSugerida: SEMANAL_LUNES,
    fases: [],
    precauciones: PRECAUCIONES_INCRETINAS,
  },
  {
    id: 'cagrilintide',
    nombre: 'Cagrilintide',
    subtitulo: 'Análogo de amilina · Amilina + Calcitonina',
    categoria: 'Adelgazar',
    objetivo: 'Saciedad · Control del apetito',
    descripcion:
      'Cagrilintide es amilina de acción larga que se aplica una vez por semana. Activa los receptores de amilina y calcitonina del tronco encefálico, la señal de "ya comí". Actúa por una vía distinta al GLP-1 y apaga el "ruido de comida".',
    acciones: [
      ['Receptores de amilina', 'Plenitud real, menos picoteo y antojos'],
      ['Vaciado gástrico lento', 'Saciedad duradera, glucosa más estable'],
      ['Vía distinta al GLP-1', 'Complementa a Tirzepatide o Retatrutide'],
      ['Menos glucagón postcomida', 'Menos picos y bajones de glucosa'],
    ],
    presentaciones: [{ mg: 5, aguaMl: 2 }],
    estabilidadDias: ESTABILIDAD_GLP,
    frecuenciaSugerida: SEMANAL_LUNES,
    fases: [],
    precauciones: [
      'Riesgo de hipoglucemia si se combina con insulina o sulfonilureas.',
      'Náuseas o malestar digestivo son frecuentes al inicio: hidratación abundante y comidas pequeñas.',
    ],
  },
  {
    id: 'glp5',
    nombre: 'GLP5',
    subtitulo: 'Retatrutide 12.5 mg + Cagrilintide 2.5 mg',
    categoria: 'Adelgazar',
    objetivo: 'Pérdida de peso · Control del apetito',
    descripcion:
      'GLP5 combina en un solo vial Retatrutide (GLP-1, GIP y glucagón) y Cagrilintide (amilina y calcitonina): cinco vías hormonales. Tres reducen el hambre y suben el gasto; dos cierran el "ruido de comida" que el GLP-1 solo no apaga.',
    componentes: [
      { nombre: 'Retatrutide', fraccion: 12.5 / 15 },
      { nombre: 'Cagrilintide', fraccion: 2.5 / 15 },
    ],
    acciones: [
      ['GLP-1: saciedad', 'Come menos sin negociar cada bocado'],
      ['GIP: uso de nutrientes', 'Pérdida mejor tolerada'],
      ['Glucagón: gasto energético', 'Quema en reposo, grasa visceral e hígado'],
      ['Amilina + calcitonina', 'Corta antojos y hambre de rebote'],
    ],
    presentaciones: [{ mg: 15, aguaMl: aguaIncretina(15) }],
    estabilidadDias: ESTABILIDAD_GLP,
    frecuenciaSugerida: SEMANAL_LUNES,
    fases: [],
    precauciones: PRECAUCIONES_INCRETINAS,
  },
  {
    id: 'aod-9604',
    nombre: 'AOD-9604',
    subtitulo: 'Fragmento 176-191 de GH · Lipólisis sin crecimiento',
    categoria: 'Adelgazar',
    objetivo: 'Definición · Grasa localizada',
    descripcion:
      'AOD-9604 es el extremo C-terminal de la hormona de crecimiento: conserva la función de movilizar grasa sin el efecto de crecimiento ni IGF-1. Apoya la definición cuando ya hay entrenamiento y déficit calórico; no los sustituye.',
    acciones: [
      ['Estimula la lipólisis', 'Moviliza grasa almacenada resistente a la dieta'],
      ['Frena la lipogénesis', 'Menos formación de grasa nueva'],
      ['Sin efecto sobre glucosa', 'No actúa sobre insulina ni páncreas'],
      ['Sin efecto somatotrópico', 'No eleva IGF-1 ni produce crecimiento'],
    ],
    presentaciones: [{ mg: 10, aguaMl: 2 }],
    frecuenciaSugerida: null,
    fases: [],
    precauciones: ['Funciona como apoyo a dieta y entrenamiento; no sustituye el déficit calórico.'],
  },
  {
    id: 'mots-c',
    nombre: 'MOTS-c',
    subtitulo: 'Péptido mitocondrial · Mimético del ejercicio',
    categoria: 'Adelgazar',
    objetivo: 'Metabolismo · Energía · Composición corporal',
    descripcion:
      'MOTS-c es un péptido que fabrica la propia mitocondria. Activa AMPK, mejora la sensibilidad a la insulina y enseña a la célula a usar grasa y glucosa con más eficiencia. Reproduce parte de las adaptaciones del ejercicio.',
    acciones: [
      ['Activa AMPK', 'Más oxidación de grasa y mejor control de glucosa'],
      ['Flexibilidad metabólica', 'Usa azúcar o grasa según la necesidad; menos bajones'],
      ['Adaptación tipo ejercicio', 'Mejor resistencia y conservación de masa magra'],
      ['Mitocondria más eficiente', 'Energía estable, menos fatiga de fondo'],
    ],
    presentaciones: [{ mg: 10, aguaMl: 2 }, { mg: 40, aguaMl: 3 }],
    frecuenciaSugerida: null,
    fases: [],
    precauciones: ['Puede bajar la glucosa: precaución si se usan fármacos para la diabetes.'],
  },
  {
    id: '5-amino-1mq',
    nombre: '5-Amino-1MQ',
    subtitulo: 'Inhibidor de NNMT · Activador metabólico',
    categoria: 'Adelgazar',
    objetivo: 'Grasa corporal · Metabolismo',
    descripcion:
      '5-Amino-1MQ es una molécula sintética que inhibe la enzima NNMT en la célula de grasa. Al frenarla sube el NAD+ intracelular, se reactiva la mitocondria del adipocito y aumenta el gasto de grasa blanca.',
    acciones: [
      ['Inhibe NNMT', 'Desbloquea el gasto energético del tejido adiposo'],
      ['Más NAD+ en la célula', 'Mitocondria con más capacidad de oxidar grasa'],
      ['Lipólisis de grasa blanca', 'Reduce reservas subcutáneas y viscerales'],
      ['Protege masa magra', 'El músculo se sostiene mejor en déficit'],
    ],
    presentaciones: [{ mg: 50, aguaMl: 3 }],
    frecuenciaSugerida: null,
    fases: [],
    precauciones: [],
  },
  {
    id: 'tesamorelin',
    nombre: 'Tesamorelin',
    subtitulo: 'Análogo de GHRH · Grasa visceral',
    categoria: 'Adelgazar',
    objetivo: 'Grasa abdominal · Composición corporal',
    descripcion:
      'Tesamorelin es un análogo de GHRH que estimula a la hipófisis a liberar su propia hormona de crecimiento. Es el péptido con más estudios sobre grasa intraabdominal, la que envuelve los órganos y altera el metabolismo.',
    acciones: [
      ['Reduce grasa visceral', 'Menos abdomen metabólico'],
      ['GH endógena', 'Más IGF-1 fisiológico, mejor retención de músculo'],
      ['Metabolismo más limpio', 'Apoya la sensibilidad a la insulina'],
      ['Composición, no solo peso', 'Baja la grasa profunda y sostiene la masa magra'],
    ],
    presentaciones: [{ mg: 5, aguaMl: 2 }, { mg: 10, aguaMl: 2 }],
    frecuenciaSugerida: null,
    fases: [],
    precauciones: PRECAUCIONES_GH,
  },

  // ---------- Recuperación y lesiones ----------
  {
    id: 'bpc-157',
    nombre: 'BPC-157',
    subtitulo: 'Péptido de reparación · 15 aminoácidos',
    categoria: 'Recuperación y lesiones',
    objetivo: 'Tendón · Ligamento · Intestino',
    descripcion:
      'BPC-157 es un fragmento sintético de una proteína del jugo gástrico humano. Acelera la formación de vasos nuevos, organiza los fibroblastos y protege la mucosa. Actúa en tendón, intestino, músculo y nervio.',
    acciones: [
      ['Tendón y ligamento', 'Lleva fibroblastos a la lesión; recuperación más rápida'],
      ['Intestino y mucosa', 'Estabiliza la barrera y ayuda a cerrar úlceras'],
      ['Angiogénesis local', 'Más oxígeno y nutrientes en el tejido dañado'],
      ['Menos inflamación', 'Menos dolor y más movimiento'],
      ['Nervio periférico', 'Apoya la regeneración neural'],
    ],
    presentaciones: [{ mg: 10, aguaMl: 2 }],
    frecuenciaSugerida: null,
    fases: [],
    precauciones: PRECAUCIONES_REPARACION,
  },
  {
    id: 'tb-500',
    nombre: 'TB-500',
    subtitulo: 'Fragmento de timosina beta-4',
    categoria: 'Recuperación y lesiones',
    objetivo: 'Músculo · Ligamento · Movilidad',
    descripcion:
      'TB-500 es la versión sintética de la timosina beta-4, la proteína que moviliza células hacia el sitio del daño. Circula por el cuerpo y organiza la reparación de músculo, ligamento y fascia, con menos cicatriz rígida.',
    acciones: [
      ['Migración celular', 'Células reparadoras llegan a la lesión'],
      ['Menos inflamación', 'Menos dolor celular y articular'],
      ['Limita la fibrosis', 'Más elasticidad y rango de movimiento'],
      ['Nueva red capilar', 'Mejor irrigación del área afectada'],
    ],
    presentaciones: [{ mg: 5, aguaMl: 2 }],
    frecuenciaSugerida: null,
    fases: [],
    precauciones: PRECAUCIONES_REPARACION,
  },
  {
    id: 'wolverine',
    nombre: 'Wolverine',
    subtitulo: 'BPC-157 + TB-500',
    categoria: 'Recuperación y lesiones',
    objetivo: 'Lesiones · Recuperación',
    descripcion:
      'Wolverine es el stack clásico de reparación. BPC-157 actúa en el punto de la lesión (tendón, mucosa, vasos, nervio) y TB-500 en todo el sistema, llevando células al foco y frenando la cicatriz rígida. Para músculo, ligamento y articulación.',
    acciones: [
      ['BPC-157: reparación local', 'Angiogénesis y fibroblastos en el tendón'],
      ['TB-500: migración celular', 'Menos fibrosis, más rango al cerrar'],
      ['Recuperación más rápida', 'Lesión, sobreuso o post-esfuerzo'],
      ['Menos inflamación', 'Menos dolor articular y muscular'],
    ],
    presentaciones: [{ mg: 10, aguaMl: 2 }, { mg: 20, aguaMl: 2 }],
    frecuenciaSugerida: null,
    fases: [],
    precauciones: PRECAUCIONES_REPARACION,
  },
  {
    id: 'kpv',
    nombre: 'KPV',
    subtitulo: 'Lys-Pro-Val · Antiinflamatorio de α-MSH',
    categoria: 'Recuperación y lesiones',
    objetivo: 'Intestino · Piel · Inflamación',
    descripcion:
      'KPV son los tres aminoácidos del extremo de la hormona estimulante de melanocitos. Entra en la célula e inhibe la vía inflamatoria que mantiene el intestino y la piel en alarma. Complementa a BPC-157: uno reconstruye, el otro apaga la inflamación.',
    acciones: [
      ['Inhibe la vía inflamatoria', 'Menos citoquinas e irritación crónica'],
      ['Barrera intestinal', 'Mejor integridad y digestión más tranquila'],
      ['Piel e inflamación local', 'Menos brotes, mejor cierre de tejido irritado'],
    ],
    presentaciones: [{ mg: 10, aguaMl: 2 }],
    frecuenciaSugerida: null,
    fases: [],
    precauciones: [],
  },
  {
    id: 'ara-290',
    nombre: 'ARA-290',
    subtitulo: 'Cibinetida · Receptor innato de reparación',
    categoria: 'Recuperación y lesiones',
    objetivo: 'Dolor neuropático · Inflamación',
    descripcion:
      'ARA-290 es un fragmento sintético de eritropoyetina diseñado para reparar, no para producir sangre. Actúa sobre el receptor innato de reparación, reduce la inflamación del tejido y protege la fibra nerviosa sin elevar el hematocrito.',
    acciones: [
      ['Modula el dolor neuropático', 'Útil cuando el problema es el nervio'],
      ['Menos inflamación tisular', 'Apoyo en inflamación crónica local'],
      ['Protección neuronal', 'Más supervivencia de la fibra bajo estrés'],
      ['Reparación de nervio periférico', 'Recuperación de la sensibilidad'],
    ],
    presentaciones: [{ mg: 10, aguaMl: 2 }],
    frecuenciaSugerida: null,
    fases: [],
    precauciones: [],
  },
  {
    id: 'cartalax',
    nombre: 'Cartalax',
    subtitulo: 'Tripéptido de cartílago · Ala-Glu-Asp (AED)',
    categoria: 'Recuperación y lesiones',
    objetivo: 'Articulaciones · Cartílago · Movilidad',
    descripcion:
      'Cartalax es un bioregulador de Khavinson para cartílago, hueso y movilidad. Estimula a los condrocitos a reconstruir la matriz y frena las enzimas que la degradan. Rodilla, columna y disco.',
    acciones: [
      ['Activa condrocitos', 'Más colágeno y proteoglicanos en el cartílago'],
      ['Inhibe MMP-9', 'Menos degradación de la matriz'],
      ['Sube IGF-1 local', 'Apoyo a la reparación de tejido'],
      ['Hueso y disco', 'Mejor soporte musculoesquelético'],
    ],
    presentaciones: [{ mg: 20, aguaMl: 2 }],
    frecuenciaSugerida: null,
    fases: [],
    precauciones: [],
  },

  // ---------- Hormona de crecimiento ----------
  {
    id: 'cjc-ipamorelin',
    nombre: 'CJC-1295 sin DAC + Ipamorelin',
    subtitulo: 'GHRH + GHRP · Blend 5 mg / 5 mg',
    categoria: 'Hormona de crecimiento',
    objetivo: 'Recomposición · Sueño · Recuperación',
    descripcion:
      'Este blend estimula a la hipófisis a liberar su propio pulso de hormona de crecimiento: CJC-1295 sin DAC da la señal GHRH e Ipamorelin la señal de grelina, sin disparar cortisol ni prolactina. Más GH, más IGF-1 y sueño más profundo.',
    componentes: [
      { nombre: 'CJC-1295 sin DAC', fraccion: 0.5 },
      { nombre: 'Ipamorelin', fraccion: 0.5 },
    ],
    acciones: [
      ['Pulso fisiológico de GH', 'Picos como los nocturnos, sin saturar el receptor'],
      ['Recomposición', 'Menos grasa visceral, mejor retención de músculo'],
      ['Sueño profundo', 'Más fases lentas y mejor recuperación'],
      ['Ipamorelin selectivo', 'Sin el hambre ni el cortisol de otros GHRP'],
    ],
    presentaciones: [{ mg: 10, aguaMl: 2 }],
    frecuenciaSugerida: null,
    fases: [],
    precauciones: PRECAUCIONES_GH,
  },
  {
    id: 'ipamorelin',
    nombre: 'Ipamorelin',
    subtitulo: 'GHRP selectivo · Pulso limpio de GH',
    categoria: 'Hormona de crecimiento',
    objetivo: 'Recomposición · Sueño',
    descripcion:
      'Ipamorelin estimula la liberación de hormona de crecimiento propia como agonista selectivo de grelina: sube GH e IGF-1 sin alterar cortisol ni prolactina y sin el hambre intensa de GHRP-6. Se suele aplicar de noche.',
    acciones: [
      ['GH endógena', 'Pico de crecimiento propio, sin eje alterado'],
      ['Recomposición', 'Menos grasa visceral, mejor retención de magra'],
      ['Sueño reparador', 'La dosis nocturna favorece el sueño profundo'],
      ['Sin hambre de GHRP-6', 'Compatible con déficit calórico'],
    ],
    presentaciones: [{ mg: 10, aguaMl: 2 }],
    frecuenciaSugerida: null,
    fases: [],
    precauciones: PRECAUCIONES_GH,
  },

  // ---------- Sueño y mente ----------
  {
    id: 'dsip',
    nombre: 'DSIP',
    subtitulo: 'Péptido inductor de sueño delta',
    categoria: 'Sueño y mente',
    objetivo: 'Sueño profundo · Recuperación',
    descripcion:
      'DSIP es un péptido cerebral asociado al sueño profundo (ondas delta). No es un sedante: ordena la noche con más fase lenta, menos cortisol de madrugada y mejor pulso de hormona de crecimiento.',
    acciones: [
      ['Sueño delta', 'Fases más profundas; se despierta más descansado'],
      ['Cortisol nocturno bajo control', 'Menos despertares de madrugada'],
      ['GH y recuperación', 'Mejor reparación física y mental'],
      ['Menos carga de estrés', 'Ánimo e inmunidad más estables'],
    ],
    presentaciones: [{ mg: 10, aguaMl: 2 }],
    frecuenciaSugerida: null,
    fases: [],
    precauciones: ['Puede causar somnolencia: no conducir ni operar maquinaria tras la aplicación.', ...PRECAUCIONES_SNC],
  },
  {
    id: 'selank',
    nombre: 'Selank',
    subtitulo: 'Análogo de tuftsina · Ansiolítico sin sedación',
    categoria: 'Sueño y mente',
    objetivo: 'Ansiedad · Foco · Ánimo',
    descripcion:
      'Selank es un péptido derivado de la tuftsina. Modula GABA y encefalinas, sube BDNF y reduce la ansiedad sin sedar: la mente se calma y sigue rindiendo.',
    acciones: [
      ['Menos ansiedad', 'Menos estrés y rumiación, sin somnolencia'],
      ['Mejor concentración', 'Memoria de trabajo y claridad bajo exigencia'],
      ['BDNF y plasticidad', 'Soporte neuronal a mediano plazo'],
      ['Ánimo estable', 'Más equilibrio bajo presión'],
    ],
    presentaciones: [{ mg: 10, aguaMl: 2 }],
    frecuenciaSugerida: null,
    fases: [],
    precauciones: PRECAUCIONES_SNC,
  },
  {
    id: 'n-acetyl-selank',
    nombre: 'N-Acetyl Selank Amidate',
    subtitulo: 'Selank estabilizado · Acetil + Amida',
    categoria: 'Sueño y mente',
    objetivo: 'Ansiedad · Foco sostenido',
    descripcion:
      'Es Selank con dos modificaciones (acetilo y amida) que lo protegen de la degradación. Llega más intacto al cerebro y su efecto dura más, con la misma lógica: menos ansiedad, más foco y más BDNF.',
    acciones: [
      ['Mayor estabilidad', 'Más péptido útil por dosis y más horas de efecto'],
      ['Calma sin sedación', 'Menos ansiedad y estrés de fondo'],
      ['Foco sostenido', 'Claridad en bloques de trabajo largos'],
      ['BDNF prolongado', 'Soporte neuronal más duradero'],
    ],
    presentaciones: [{ mg: 10, aguaMl: 2 }],
    frecuenciaSugerida: null,
    fases: [],
    precauciones: PRECAUCIONES_SNC,
  },
  {
    id: 'focus-blend',
    nombre: 'Focus Blend',
    subtitulo: 'Selank 10 mg + Semax 10 mg',
    categoria: 'Sueño y mente',
    objetivo: 'Foco · Calma · Rendimiento mental',
    descripcion:
      'Focus combina Selank, que reduce la ansiedad sin sedar, con Semax (análogo de ACTH 4-10), que mejora la atención, el BDNF y la velocidad mental. Juntos dan calma y foco a la vez.',
    componentes: [
      { nombre: 'Selank', fraccion: 0.5 },
      { nombre: 'Semax', fraccion: 0.5 },
    ],
    acciones: [
      ['Selank: calma útil', 'Menos rumiación sin efecto sedante'],
      ['Semax: atención', 'Procesamiento y memoria de trabajo'],
      ['BDNF de ambos', 'Más plasticidad neuronal'],
      ['Ánimo estable bajo carga', 'Rendimiento en presión'],
    ],
    presentaciones: [{ mg: 20, aguaMl: 2 }],
    frecuenciaSugerida: null,
    fases: [],
    precauciones: PRECAUCIONES_SNC,
  },
  {
    id: 'pinealon',
    nombre: 'Pinealon',
    subtitulo: 'Tripéptido cerebral · Glu-Asp-Arg (EDR)',
    categoria: 'Sueño y mente',
    objetivo: 'Memoria · Foco · Ritmo de sueño',
    descripcion:
      'Pinealon es un bioregulador de Khavinson para neurona y glándula pineal. Reduce el daño oxidativo, ordena el ritmo biológico y aumenta la resistencia al desgaste mental. No es estimulante.',
    acciones: [
      ['Protección neuronal', 'Menos daño oxidativo bajo estrés'],
      ['Foco y memoria', 'Mejor aprendizaje y retención'],
      ['Pineal y sueño', 'Noches más ordenadas'],
      ['Menos fatiga intelectual', 'Útil en etapas de alta carga mental'],
    ],
    presentaciones: [{ mg: 10, aguaMl: 2 }],
    frecuenciaSugerida: null,
    fases: [],
    precauciones: [],
  },

  // ---------- Longevidad ----------
  {
    id: 'epitalon',
    nombre: 'Epitalon',
    subtitulo: 'Tetrapéptido pineal · Ala-Glu-Asp-Gly (AEDG)',
    categoria: 'Longevidad',
    objetivo: 'Longevidad · Ritmo de sueño · Vitalidad',
    descripcion:
      'Epitalon es el citógeno pineal de Khavinson, de cuatro aminoácidos. Activa la telomerasa, protege los extremos de los cromosomas y regula el reloj biológico y la curva de melatonina. No es estimulante.',
    acciones: [
      ['Activa la telomerasa', 'Menos acortamiento de telómeros'],
      ['Regula la pineal', 'Melatonina y sueño en su horario'],
      ['Menos estrés oxidativo', 'Menor desgaste de mitocondria y ADN'],
      ['Eje neuroendocrino e inmune', 'Mejor resistencia de fondo'],
    ],
    presentaciones: [{ mg: 50, aguaMl: 3 }],
    frecuenciaSugerida: null,
    fases: [],
    precauciones: ['Evitar con cáncer activo o antecedente reciente: activa la telomerasa.'],
  },
  {
    id: 'nad',
    nombre: 'NAD+',
    subtitulo: 'Coenzima de energía y reparación',
    categoria: 'Longevidad',
    objetivo: 'Energía · Claridad mental · Longevidad',
    descripcion:
      'El NAD+ es el combustible de las sirtuinas y de la mitocondria, y sus niveles bajan con la edad. Al reponerlo, la célula vuelve a producir ATP, reparar ADN y activar las vías de envejecimiento saludable.',
    acciones: [
      ['ATP y vitalidad', 'Menos fatiga de fondo, energía sostenida'],
      ['Sirtuinas y ADN', 'Activa la reparación celular'],
      ['Claridad mental', 'Menos niebla y mejor foco'],
      ['Metabolismo', 'Mejor uso de nutrientes y grasa almacenada'],
    ],
    presentaciones: [{ mg: 500, aguaMl: 5 }, { mg: 1000, aguaMl: 10 }],
    frecuenciaSugerida: null,
    fases: [],
    precauciones: ['La aplicación puede causar rubor, náuseas, presión en el pecho o calambres: inyectar despacio.'],
  },
  {
    id: 'ss-31',
    nombre: 'SS-31',
    subtitulo: 'Elamipretida · Cardiolipina mitocondrial',
    categoria: 'Longevidad',
    objetivo: 'Energía celular · Resistencia',
    descripcion:
      'SS-31 entra en la mitocondria y se une a la cardiolipina, el lípido que sostiene la cadena de producción de energía. Estabiliza esa membrana, mejora la producción de ATP y reduce los radicales libres en su origen.',
    acciones: [
      ['Estabiliza la cardiolipina', 'Más ATP por el mismo oxígeno'],
      ['Menos radicales libres', 'Protege la mitocondria desde dentro'],
      ['Corazón y músculo', 'Más reserva y menos fatiga'],
      ['Energía neuronal', 'Más claridad ante desgaste mitocondrial'],
    ],
    presentaciones: [{ mg: 50, aguaMl: 3 }],
    frecuenciaSugerida: null,
    fases: [],
    precauciones: ['Las reacciones leves en el sitio de inyección son frecuentes.'],
  },
  {
    id: 'vilon',
    nombre: 'Vilon',
    subtitulo: 'Dipéptido tímico · Lys-Glu (KE)',
    categoria: 'Longevidad',
    objetivo: 'Inmunidad · Reparación · Longevidad',
    descripcion:
      'Vilon es el bioregulador más pequeño de la escuela Khavinson: dos aminoácidos aislados del extracto tímico. Estimula la inmunidad, la reparación de tejidos y genes asociados a la longevidad.',
    acciones: [
      ['Inmunidad tímica', 'Estimula la maduración de células T'],
      ['Reparación de tejido', 'Cierre más rápido con menos fibrosis'],
      ['Hígado e intestino', 'Apoya la regeneración celular'],
      ['Genes de longevidad', 'Activa sirtuinas (SIRT1, SIRT6)'],
    ],
    presentaciones: [{ mg: 20, aguaMl: 2 }],
    frecuenciaSugerida: null,
    fases: [],
    precauciones: [],
  },
  {
    id: 'vesugen',
    nombre: 'Vesugen',
    subtitulo: 'Tripéptido vascular · Lys-Glu-Asp (KED)',
    categoria: 'Longevidad',
    objetivo: 'Vasos · Células madre · Longevidad',
    descripcion:
      'Vesugen es un bioregulador de Khavinson aislado de extracto vascular. Estimula la proliferación de las células madre propias, retrasa su envejecimiento y las dirige al tejido dañado: vasos, cerebro, piel y hueso.',
    acciones: [
      ['Células madre propias', 'Más proliferación y menos senescencia'],
      ['Reclutamiento al daño', 'La reserva celular llega al tejido correcto'],
      ['Salud vascular', 'Endotelio más joven y resistente'],
      ['Cerebro y memoria', 'Apoyo a la diferenciación neuronal'],
    ],
    presentaciones: [{ mg: 10, aguaMl: 2 }],
    frecuenciaSugerida: null,
    fases: [],
    precauciones: [],
  },

  // ---------- Salud sexual ----------
  {
    id: 'pt-141',
    nombre: 'PT-141',
    subtitulo: 'Bremelanotida · Agonista de melanocortina',
    categoria: 'Salud sexual',
    objetivo: 'Libido · Deseo',
    descripcion:
      'PT-141 (bremelanotida) actúa en el cerebro, no en los vasos: activa los receptores de melanocortina (MC3/MC4) relacionados con el deseo. Sirve para hombres y mujeres cuando el problema es la falta de ganas, no de riego.',
    acciones: [
      ['Libido central', 'El deseo parte del cerebro'],
      ['Hombres y mujeres', 'Misma vía en ambos'],
      ['Independiente del riego', 'No actúa como los vasodilatadores'],
      ['Respuesta al estímulo', 'Más presencia y excitación'],
    ],
    presentaciones: [{ mg: 10, aguaMl: 2 }],
    frecuenciaSugerida: null,
    fases: [],
    precauciones: [
      'No usar con hipertensión no controlada o enfermedad cardiovascular: eleva la presión de forma transitoria.',
      'Náuseas y rubor son frecuentes tras la aplicación.',
      'No aplicar más de una dosis en 24 horas.',
    ],
  },
  {
    id: 'kisspeptin',
    nombre: 'Kisspeptin',
    subtitulo: 'Interruptor del eje reproductivo · GnRH',
    categoria: 'Salud sexual',
    objetivo: 'Eje hormonal · Libido · Fertilidad',
    descripcion:
      'La kisspeptina es la señal con la que el cerebro ordena a la hipófisis liberar GnRH, de donde salen LH, FSH y las hormonas sexuales propias. No es testosterona: reactiva el eje cuando se ha quedado dormido.',
    acciones: [
      ['Activa GnRH', 'El eje hormonal vuelve a comunicarse'],
      ['LH y FSH endógenas', 'Testículo u ovario trabajan por sí mismos'],
      ['Hormona sexual propia', 'Apoya testosterona y estradiol naturales'],
      ['Libido desde el eje', 'Cuando el deseo bajó por un eje apagado'],
    ],
    presentaciones: [{ mg: 10, aguaMl: 2 }],
    frecuenciaSugerida: null,
    fases: [],
    precauciones: ['Precaución con condiciones hormono-dependientes: idealmente con control médico y analítica.'],
  },
];

window.AGUA_BACTERIOSTATICA = { id: 'agua', nombre: 'Agua bacteriostática', presentacionesMl: [3, 10] };
