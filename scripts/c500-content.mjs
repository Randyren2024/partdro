/**
 * C500 重载运输无人机：产品行 + 多语言卡片 + 落地页内容写入（一次性脚本）。
 * 仅在本地 Node 环境使用 service_role（服务端语义，绝不进入前端代码/VITE_*）。
 * 运行：node scripts/c500-content.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const env = readFileSync(new URL('../.env', import.meta.url), 'utf8')
const get = (k) => env.match(new RegExp(`^${k}=(.*)$`, 'm'))?.[1].trim()
const supabase = createClient(get('VITE_SUPABASE_URL'), get('SUPABASE_SERVICE_ROLE_KEY'))

const NS = 'c500-delivery-drone'

const content = {
  __layout: [
    { id: 'hero', visible: true },
    { id: 'strip', visible: true },
    { id: 'why', visible: true },
    { id: 'designed', visible: true },
    { id: 'output', visible: true },
    { id: 'intelligence', visible: true },
    { id: 'safety', visible: true },
    { id: 'multiangle', visible: true },
    { id: 'compare', visible: true },
    { id: 'scenarios', visible: true },
    { id: 'specs', visible: true },
    { id: 'cta', visible: true },
  ],
  __images: {
    'c500-delivery-drone.hero.mainImg': 'hero.png',
    'c500-delivery-drone.designed.img': 'energy-altitude.png',
    'c500-delivery-drone.intelligence.img': 'tech-alt.jpg',
    'c500-delivery-drone.multiangle.img': 'cluster-quad.png',
    'c500-delivery-drone.scenarios.0.img': 'app-solar.png',
    'c500-delivery-drone.scenarios.1.img': 'app-timber.png',
    'c500-delivery-drone.scenarios.2.img': 'app-steel.png',
    'c500-delivery-drone.scenarios.3.img': 'app-emergency.png',
  },

  hero: {
    kicker: 'Heavy-Lift Cargo Drone',
    title1: 'Heavy Payload,',
    title2: 'Intelligent Flight',
    lead:
      'The Partdro C500 heavy-lift flight robot carries up to 240 kg on a single aircraft. Quad-axis eight-propeller design delivers 720 kg total thrust, while end-to-end autonomous decision-making and multi-drone cluster lifting redefine aerial transport.',
    ctaPrimary: 'Get a Quote',
    ctaSecondary: 'Contact Sales',
    badgeTitle: 'Factory direct',
    badgeText: 'Worldwide shipping and support',
    stats: { 0: '240 kg', 1: '720 kg', 2: '35 km' },
  },
  strip: {
    0: { value: '240 kg', label: 'Max payload (single)' },
    1: { value: '90 km/h', label: 'Max flight speed' },
    2: { value: '35 km', label: 'Max flight distance' },
    3: { value: '7 min', label: 'Fastest full charge' },
    4: { value: 'IP55', label: 'Ingress protection' },
  },
  why: {
    eyebrow: 'Why choose it',
    title: 'Built for heavy transport jobs.',
    lead: 'Six reasons operators pick the C500 for cargo missions that ground vehicles and cranes cannot cover.',
    cards: {
      0: { title: '240 kg single-aircraft payload', desc: 'The heaviest in its class — 240 kg at sea level, still 160 kg at 6,000 m elevation.' },
      1: { title: 'Cluster lifting up to 720 kg', desc: 'Two drones lift 400 kg, four drones lift 720 kg in coordinated flight.' },
      2: { title: 'Dual / quad battery flexibility', desc: '50 Ah CTB ultra-fast batteries switch between two- and four-pack modes; 5.5C charging fills in 7 minutes.' },
      3: { title: 'Nine-eye vision + multi-source radar', desc: '360° surround view fused with 920,000-point LiDAR and dual millimeter-wave radar, 150 m detection range.' },
      4: { title: '30 km 4G+ image transmission', desc: 'Fly far with confidence; single-aircraft dual control and 8-hour relay-station endurance.' },
      5: { title: 'All-weather readiness', desc: 'IP55 protection, level-6 wind resistance and -20°C to 50°C operating temperature.' },
    },
  },
  designed: {
    eyebrow: 'Engineering',
    title: 'Stable structure, powerful propulsion.',
    lead:
      'Every part of the C500 is engineered around one mission: moving heavy cargo safely through demanding terrain and altitude.',
    items: {
      0: { title: 'Integrated cast frame', desc: 'Front-and-rear one-piece die-cast beams keep the airframe rigid under full load.' },
      1: { title: 'Quad-axis eight-propeller power', desc: '73-inch carbon-fiber folding propellers on new flat-wire motors deliver 720 kg total thrust.' },
      2: { title: 'High-altitude capability', desc: '240 kg payload at 3,000 m, 200 kg at 4,500 m and 160 kg at the 6,000 m service ceiling.' },
    },
  },
  output: {
    eyebrow: 'Performance',
    title: 'Output that scales.',
    bigNumber: '240 kg',
    unitTitle: 'Max single-aircraft payload',
    note: 'Measured figures for the C500 heavy-lift cargo platform.',
    rows: {
      0: { label: 'Max payload (single aircraft)', value: '240 kg' },
      1: { label: 'Total thrust (quad-axis)', value: '720 kg' },
      2: { label: 'Max flight distance', value: '35 km' },
      3: { label: 'Max flight speed', value: '90 km/h' },
      4: { label: 'Perception detection range', value: '150 m' },
    },
  },
  intelligence: {
    eyebrow: 'Autonomy',
    title: 'It sees, decides and flies.',
    lead: 'An end-to-end neural network rebuilds aerial transport around autonomy — trillion-level on-device operations per second.',
    items: {
      0: { title: 'End-to-end large model', desc: 'Expert trajectory imitation, Flow Matching and world-model pretraining power full-domain perception.' },
      1: { title: 'Smart routes', desc: 'Routes keep optimizing the more you fly, getting faster over time.' },
      2: { title: 'Trajectory replay', desc: 'Recall proven efficient routes with one tap to reduce workload.' },
      3: { title: 'Cargo-aware flight', desc: 'Nine-eye + radar sensing detects cargo swing and obstacles, auto-damping for stable carries.' },
    },
  },
  safety: {
    eyebrow: 'Safety',
    title: 'Operator protection first.',
    lead: 'Layered safeguards keep people, cargo and aircraft protected through every phase of the mission.',
    cards: {
      0: { title: 'Cyclic smart-carry solution', desc: 'Human-machine separation keeps the operator away from the lift zone for safer operations.' },
      1: { title: 'Equipped parachute', desc: 'Reduces landing impact to lower risk and loss in emergencies.' },
      2: { title: 'Full-domain awareness', desc: 'Airframe status, power system and cargo are monitored in real time to cut risks early.' },
    },
  },
  multiangle: {
    eyebrow: 'In the field',
    title: 'Every angle covered.',
    lead: 'From single-aircraft precision lifts to four-drone cluster transport, the C500 adapts to the mission.',
    items: {
      0: { title: 'Dual-drone cluster', desc: 'Two coordinated aircraft carry up to 400 kg.' },
      1: { title: 'Quad-drone cluster', desc: 'Four coordinated aircraft lift up to 720 kg across wide sites.' },
      2: { title: 'Electric smart-hoist', desc: 'Motorized winch freely pays out and reels in the cargo line.' },
      3: { title: 'Smart voice control', desc: 'Voice wake-up and voice commands keep hands on the mission.' },
    },
  },
  compare: {
    eyebrow: 'Comparison',
    title: 'Drone vs. ground transport.',
    colD15r: 'Partdro C500',
    colManual: 'Ground method',
    rows: {
      0: { label: 'Load per trip', d15r: 'Up to 240 kg', manual: 'Porter or small vehicle limits' },
      1: { label: 'Terrain access', d15r: 'Mountains, plateaus, islands — direct line', manual: 'Requires roads or tracks' },
      2: { label: 'Build time on site', d15r: 'No roads, towers or cranes needed', manual: 'Road works or crane setup' },
      3: { label: 'Safety risk', d15r: 'No crew on the ground path', manual: 'Workers in hazardous terrain' },
      4: { label: 'Weather window', d15r: 'Level-6 wind, -20°C to 50°C', manual: 'Often delayed by terrain and weather' },
      5: { label: 'Fleet scalability', d15r: 'Cluster lifting to 720 kg', manual: 'Adds vehicles and crews linearly' },
    },
  },
  scenarios: {
    0: { title: 'Solar Farm Transport', desc: 'Fly panels and equipment straight onto mountain slopes where vehicles cannot go.' },
    1: { title: 'Timber Transport', desc: 'Lift logs out of steep forest terrain without cutting new roads.' },
    2: { title: 'Steel & Construction', desc: 'Move steel beams and materials across sites with precision hoisting.' },
    3: { title: 'Emergency Supplies', desc: 'Deliver relief cargo to cut-off areas within minutes of takeoff.' },
  },
  specs: {
    eyebrow: 'Specifications',
    title: 'Technical specifications.',
    lead: 'Key figures for the C500 heavy-lift flight robot.',
    items: {
      0: { label: 'Max payload', value: '240 kg' },
      1: { label: 'Empty weight (excl. batteries)', value: '120 kg' },
      2: { label: 'Power configuration', value: 'Quad-axis eight-propeller, dual redundancy' },
      3: { label: 'Propellers', value: '73-inch carbon-fiber folding' },
      4: { label: 'Total thrust (quad-axis)', value: '720 kg' },
      5: { label: 'Max flight speed', value: '90 km/h' },
      6: { label: 'Wind resistance', value: 'Level 6' },
      7: { label: 'Ingress protection', value: 'IP55' },
      8: { label: 'Operating temperature', value: '-20°C to 50°C' },
      9: { label: 'Battery configuration', value: '50 Ah CTB ultra-fast, dual/quad modes' },
      10: { label: 'Charging performance', value: '5.5C ultra-fast, 7 min full' },
      11: { label: 'Max flight distance', value: '35 km' },
      12: { label: 'Perception system', value: 'Nine-eye vision + 920k-point LiDAR + dual mmWave radar' },
      13: { label: 'Detection range', value: '150 m' },
      14: { label: 'Image transmission', value: 'Up to 30 km 4G+' },
      15: { label: 'Cluster lifting', value: '400 kg (dual) / 720 kg (quad)' },
      16: { label: 'Service ceiling', value: '6,000 m' },
      17: { label: 'FPV camera', value: '4K' },
      18: { label: 'Flight autonomy', value: 'End-to-end neural network' },
    },
  },
  cta: {
    eyebrow: 'Get started',
    title: 'Ready to see it lift?',
    text: 'Talk to our team about demos, pricing and deployment for your transport routes and sites.',
    visit: 'Back to home',
  },
}

const langs = [
  {
    lang: 'en',
    name: 'Partdro C500 Heavy-Lift Cargo Drone',
    short_desc:
      'Heavy-lift cargo drone — 240 kg single-aircraft payload, 720 kg cluster lifting and 35 km range for solar, timber, steel and emergency logistics.',
  },
  {
    lang: 'es',
    name: 'Partdro C500 Dron de Carga Pesada',
    short_desc:
      'Dron de carga pesada: 240 kg de carga por aeronave, traslado en enjambre de 720 kg y 35 km de alcance para logística solar, maderera, siderúrgica y de emergencia.',
  },
  {
    lang: 'de',
    name: 'Partdro C500 Schwerlast-Cargo-Drohne',
    short_desc:
      'Schwerlast-Cargo-Drohne: 240 kg Nutzlast pro Fluggerät, 720 kg Cluster-Heben und 35 km Reichweite für Solar-, Holz-, Stahl- und Notfalllogistik.',
  },
  {
    lang: 'fr',
    name: 'Partdro C500 Drone de Fret Lourd',
    short_desc:
      "Drone de fret lourd : 240 kg de charge par appareil, levage en essaim de 720 kg et 35 km d'autonomie pour la logistique solaire, bois, acier et urgence.",
  },
]

// ===== 1. products 行（已存在则复用） =====
let prodId
const { data: existing } = await supabase.from('products').select('id').eq('slug', NS).maybeSingle()
if (existing) {
  prodId = existing.id
  console.log('product row exists, reuse id=', prodId)
} else {
  const { data: inserted, error: ierr } = await supabase
    .from('products')
    .insert({
      slug: NS,
      category: 'cargo',
      sort_order: 13,
      published: true,
      image_url: `/images/${NS}/hero.png`,
    })
    .select('id')
    .single()
  if (ierr) {
    console.error('products insert FAILED:', ierr.message)
    process.exit(1)
  }
  prodId = inserted.id
  console.log('products row created id=', prodId)
}

// ===== 2. product_langs 四语言（复合主键 product_id+lang，直接 upsert） =====
for (const l of langs) {
  const { error } = await supabase
    .from('product_langs')
    .upsert(
      { product_id: prodId, lang: l.lang, name: l.name, short_desc: l.short_desc },
      { onConflict: 'product_id,lang' },
    )
  if (error) {
    console.error(`product_langs ${l.lang} FAILED:`, error.message)
    process.exit(1)
  }
  console.log(`product_langs ${l.lang} ok`)
}

// ===== 3. landing_content 落地页内容 =====
const { error: lerr } = await supabase
  .from('landing_content')
  .upsert({ namespace: NS, lang: 'en', content }, { onConflict: 'namespace,lang' })
if (lerr) {
  console.error('landing_content upsert FAILED:', lerr.message)
  process.exit(1)
}
console.log(`landing_content ${NS}/en upserted (${Object.keys(content).length} top-level keys)`)
// ===== 4. es/de/fr 落地页翻译（文本行；图片/布局经 ensureMediaFromEn/ensureLayoutFromEn 回退 en） =====
const contentEs = {
  hero: {
    kicker: 'Dron de carga pesada',
    title1: 'Carga pesada,',
    title2: 'Vuelo inteligente',
    lead: 'El robot volador de carga pesada Partdro C500 transporta hasta 240 kg en una sola aeronave. La configuración de cuatro ejes y ocho hélices ofrece 720 kg de empuje total, mientras que la toma de decisiones autónoma de extremo a extremo y el traslado en enjambre redefinen el transporte aéreo.',
    ctaPrimary: 'Solicitar presupuesto',
    ctaSecondary: 'Contactar ventas',
    badgeTitle: 'Venta directa de fábrica',
    badgeText: 'Envíos y soporte mundial',
    stats: { 0: '240 kg', 1: '720 kg', 2: '35 km' },
  },
  strip: {
    0: { value: '240 kg', label: 'Carga máxima (individual)' },
    1: { value: '90 km/h', label: 'Velocidad máxima' },
    2: { value: '35 km', label: 'Distancia máxima' },
    3: { value: '7 min', label: 'Carga completa más rápida' },
    4: { value: 'IP55', label: 'Protección de ingreso' },
  },
  why: {
    eyebrow: 'Por qué elegirlo',
    title: 'Diseñado para trabajos de transporte pesado.',
    lead: 'Seis razones por las que los operadores eligen el C500 para misiones de carga que los vehículos terrestres y las grúas no pueden cubrir.',
    cards: {
      0: { title: '240 kg de carga por aeronave', desc: 'La más alta de su clase: 240 kg a nivel del mar, y aún 160 kg a 6.000 m de altitud.' },
      1: { title: 'Traslado en enjambre de hasta 720 kg', desc: 'Dos drones levantan 400 kg; cuatro drones levantan 720 kg en vuelo coordinado.' },
      2: { title: 'Flexibilidad de baterías dobles/cuádruples', desc: 'Las baterías ultrarrápidas CTB de 50 Ah alternan entre modos de dos y cuatro unidades; la carga 5.5C se completa en 7 minutos.' },
      3: { title: 'Visión de nueve ojos + radar de múltiples fuentes', desc: 'Visión envolvente 360° fusionada con LiDAR de 920.000 puntos y radar milimétrico dual, con 150 m de alcance de detección.' },
      4: { title: 'Transmisión de imágenes 4G+ de 30 km', desc: 'Vuele lejos con confianza; control dual de una sola aeronave y 8 horas de autonomía de la estación repetidora.' },
      5: { title: 'Listo para todo tipo de clima', desc: 'Protección IP55, resistencia al viento de nivel 6 y temperatura de operación de -20 °C a 50 °C.' },
    },
  },
  designed: {
    eyebrow: 'Ingeniería',
    title: 'Estructura estable, propulsión potente.',
    lead: 'Cada componente del C500 está diseñado para una sola misión: transportar carga pesada de forma segura por terrenos exigentes y en grandes altitudes.',
    items: {
      0: { title: 'Chasis fundido integrado', desc: 'Las vigas fundidas a presión de una sola pieza, delanteras y traseras, mantienen el fuselaje rígido con carga completa.' },
      1: { title: 'Propulsión de cuatro ejes y ocho hélices', desc: 'Hélices plegables de fibra de carbono de 73 pulgadas en nuevos motores de alambre plano brindan 720 kg de empuje total.' },
      2: { title: 'Capacidad en gran altitud', desc: '240 kg de carga a 3.000 m, 200 kg a 4.500 m y 160 kg en el techo de servicio de 6.000 m.' },
    },
  },
  output: {
    eyebrow: 'Rendimiento',
    title: 'Un rendimiento que escala.',
    bigNumber: '240 kg',
    unitTitle: 'Carga máxima por aeronave',
    note: 'Cifras medidas de la plataforma de carga pesada C500.',
    rows: {
      0: { label: 'Carga máxima (aeronave individual)', value: '240 kg' },
      1: { label: 'Empuje total (cuatro ejes)', value: '720 kg' },
      2: { label: 'Distancia máxima de vuelo', value: '35 km' },
      3: { label: 'Velocidad máxima de vuelo', value: '90 km/h' },
      4: { label: 'Alcance de detección', value: '150 m' },
    },
  },
  intelligence: {
    eyebrow: 'Autonomía',
    title: 'Ve, decide y vuela.',
    lead: 'Una red neuronal de extremo a extremo transforma el transporte aéreo en autonomía pura: billones de operaciones por segundo directamente en el dispositivo.',
    items: {
      0: { title: 'Modelo grande de extremo a extremo', desc: 'La imitación de trayectorias de expertos, Flow Matching y el preentrenamiento con modelos del mundo impulsan la percepción de dominio completo.' },
      1: { title: 'Rutas inteligentes', desc: 'Las rutas se optimizan cuanto más vuela, y se vuelven más rápidas con el tiempo.' },
      2: { title: 'Repetición de trayectorias', desc: 'Recupera rutas eficientes y probadas con un solo toque para reducir la carga de trabajo.' },
      3: { title: 'Vuelo consciente de la carga', desc: 'La percepción de nueve ojos y radar detecta el balanceo de la carga y los obstáculos, con amortiguación automática para un transporte estable.' },
    },
  },
  safety: {
    eyebrow: 'Seguridad',
    title: 'Primero, la protección del operador.',
    lead: 'Salvaguardas por capas mantienen a las personas, la carga y la aeronave protegidas en cada fase de la misión.',
    cards: {
      0: { title: 'Solución de transporte inteligente cíclica', desc: 'La separación persona-máquina mantiene al operador alejado de la zona de izado para operaciones más seguras.' },
      1: { title: 'Paracaídas incorporado', desc: 'Reduce el impacto de aterrizaje para disminuir riesgos y pérdidas en emergencias.' },
      2: { title: 'Conciencia de dominio completo', desc: 'El estado del fuselaje, el sistema de energía y la carga se monitorean en tiempo real para reducir riesgos a tiempo.' },
    },
  },
  multiangle: {
    eyebrow: 'En el campo',
    title: 'Cubierto desde todos los ángulos.',
    lead: 'Desde izados de precisión con una sola aeronave hasta el transporte en enjambre de cuatro drones, el C500 se adapta a la misión.',
    items: {
      0: { title: 'Enjambre de dos drones', desc: 'Dos aeronaves coordinadas transportan hasta 400 kg.' },
      1: { title: 'Enjambre de cuatro drones', desc: 'Cuatro aeronaves coordinadas levantan hasta 720 kg en sitios amplios.' },
      2: { title: 'Izado inteligente eléctrico', desc: 'El cabrestante motorizado libera y recoge el cable de carga con total libertad.' },
      3: { title: 'Control por voz inteligente', desc: 'El despertar por voz y los comandos de voz mantienen las manos en la misión.' },
    },
  },
  compare: {
    eyebrow: 'Comparación',
    title: 'Dron vs. transporte terrestre.',
    colD15r: 'Partdro C500',
    colManual: 'Método terrestre',
    rows: {
      0: { label: 'Carga por viaje', d15r: 'Hasta 240 kg', manual: 'Límites de carguero o vehículo pequeño' },
      1: { label: 'Acceso al terreno', d15r: 'Montañas, mesetas, islas: línea directa', manual: 'Requiere caminos o pistas' },
      2: { label: 'Preparación en sitio', d15r: 'Sin carreteras, torres ni grúas', manual: 'Obras viales o montaje de grúa' },
      3: { label: 'Riesgo de seguridad', d15r: 'Sin personal en la ruta terrestre', manual: 'Trabajadores en terreno peligroso' },
      4: { label: 'Ventana meteorológica', d15r: 'Viento nivel 6, -20 °C a 50 °C', manual: 'A menudo retrasado por terreno y clima' },
      5: { label: 'Escalabilidad de flota', d15r: 'Izado en enjambre hasta 720 kg', manual: 'Agrega vehículos y equipos linealmente' },
    },
  },
  scenarios: {
    0: { title: 'Transporte solar', desc: 'Lleve paneles y equipos directamente a laderas de montaña donde no llegan los vehículos.' },
    1: { title: 'Transporte de madera', desc: 'Extraiga troncos de terrenos forestales empinados sin abrir nuevos caminos.' },
    2: { title: 'Acero y construcción', desc: 'Mueva vigas de acero y materiales por los sitios con izado de precisión.' },
    3: { title: 'Suministros de emergencia', desc: 'Entregue ayuda a zonas aisladas minutos después del despegue.' },
  },
  specs: {
    eyebrow: 'Especificaciones',
    title: 'Especificaciones técnicas.',
    lead: 'Cifras clave del robot volador de carga pesada C500.',
    items: {
      0: { label: 'Carga máxima', value: '240 kg' },
      1: { label: 'Peso en vacío (sin baterías)', value: '120 kg' },
      2: { label: 'Configuración de potencia', value: 'Cuatro ejes, ocho hélices, doble redundancia' },
      3: { label: 'Hélices', value: 'Plegables de fibra de carbono de 73 pulgadas' },
      4: { label: 'Empuje total (cuatro ejes)', value: '720 kg' },
      5: { label: 'Velocidad máxima', value: '90 km/h' },
      6: { label: 'Resistencia al viento', value: 'Nivel 6' },
      7: { label: 'Protección de ingreso', value: 'IP55' },
      8: { label: 'Temperatura de operación', value: '-20 °C a 50 °C' },
      9: { label: 'Configuración de baterías', value: 'CTB ultrarrápida de 50 Ah, modos dual/cuádruple' },
      10: { label: 'Rendimiento de carga', value: '5.5C ultrarrápida, completa en 7 min' },
      11: { label: 'Distancia máxima de vuelo', value: '35 km' },
      12: { label: 'Sistema de percepción', value: 'Visión de nueve ojos + LiDAR de 920k puntos + radar milimétrico dual' },
      13: { label: 'Alcance de detección', value: '150 m' },
      14: { label: 'Transmisión de imágenes', value: 'Hasta 30 km 4G+' },
      15: { label: 'Izado en enjambre', value: '400 kg (doble) / 720 kg (cuádruple)' },
      16: { label: 'Techo de servicio', value: '6.000 m' },
      17: { label: 'Cámara FPV', value: '4K' },
      18: { label: 'Autonomía de vuelo', value: 'Red neuronal de extremo a extremo' },
    },
  },
  cta: {
    eyebrow: 'Comience ahora',
    title: '¿Listo para verlo levantar?',
    text: 'Hable con nuestro equipo sobre demostraciones, precios y despliegue para sus rutas y sitios de transporte.',
    visit: 'Volver al inicio',
  },
}

const contentDe = {
  hero: {
    kicker: 'Schwerlast-Cargo-Drohne',
    title1: 'Hohe Nutzlast,',
    title2: 'Intelligenter Flug',
    lead: 'Der Partdro C500 Schwerlast-Flugroboter transportiert bis zu 240 kg pro Fluggerät. Der Vierachsen-Antrieb mit acht Propellern liefert 720 kg Gesamtschub, während autonome End-to-End-Entscheidungen und Schwarm-Heben den Lufttransport neu definieren.',
    ctaPrimary: 'Angebot anfordern',
    ctaSecondary: 'Vertrieb kontaktieren',
    badgeTitle: 'Direkt ab Werk',
    badgeText: 'Weltweite Lieferung und Support',
    stats: { 0: '240 kg', 1: '720 kg', 2: '35 km' },
  },
  strip: {
    0: { value: '240 kg', label: 'Max. Nutzlast (einzel)' },
    1: { value: '90 km/h', label: 'Max. Fluggeschwindigkeit' },
    2: { value: '35 km', label: 'Max. Flugdistanz' },
    3: { value: '7 Min.', label: 'Schnellste Vollladung' },
    4: { value: 'IP55', label: 'Schutzart' },
  },
  why: {
    eyebrow: 'Warum es sich lohnt',
    title: 'Gebaut für schwere Transportaufgaben.',
    lead: 'Sechs Gründe, warum Betreiber das C500 für Transportmissionen wählen, die Bodenfahrzeuge und Krane nicht abdecken.',
    cards: {
      0: { title: '240 kg Nutzlast pro Fluggerät', desc: 'Die höchste seiner Klasse: 240 kg auf Meereshöhe, immer noch 160 kg auf 6.000 m Höhe.' },
      1: { title: 'Schwarm-Heben bis 720 kg', desc: 'Zwei Drohnen heben 400 kg, vier Drohnen heben 720 kg im koordinierten Flug.' },
      2: { title: 'Doppel-/Vierfach-Akku-Flexibilität', desc: '50-Ah-CTB-Ultraschnellakkus wechseln zwischen Zwei- und Vier-Modi; 5.5C-Laden ist in 7 Minuten voll.' },
      3: { title: 'Neun-Augen-Vision + Multisensor-Radar', desc: '360°-Rundumsicht fusioniert mit 920.000-Punkte-LiDAR und dualem Millimeterwellen-Radar, 150 m Erkennungsbereich.' },
      4: { title: '30 km 4G+-Bildübertragung', desc: 'Fliegen Sie weit mit Vertrauen; Ein-Flugzeug-Doppelsteuerung und 8 Stunden Relaisstation-Ausdauer.' },
      5: { title: 'Bei jedem Wetter einsatzbereit', desc: 'IP55-Schutzart, Windwiderstand Klasse 6 und Betriebstemperatur von -20 °C bis 50 °C.' },
    },
  },
  designed: {
    eyebrow: 'Technik',
    title: 'Stabile Struktur, starke Propulsion.',
    lead: 'Jedes Teil des C500 ist auf eine Mission ausgelegt: schwere Fracht sicher durch anspruchsvolles Gelände und große Höhen zu bewegen.',
    items: {
      0: { title: 'Integrierter Gussrahmen', desc: 'Vorder- und rückseitige einteilige Druckgussbalken halten den Rumpf unter Volllast steif.' },
      1: { title: 'Vierachsen-Achtpropeller-Antrieb', desc: '73-Zoll-Kohlenfaser-Faltpropeller auf neuen Flachdraht-Motoren liefern 720 kg Gesamtschub.' },
      2: { title: 'Höhenleistung', desc: '240 kg Nutzlast auf 3.000 m, 200 kg auf 4.500 m und 160 kg am 6.000 m Dienstgipfel.' },
    },
  },
  output: {
    eyebrow: 'Leistung',
    title: 'Leistung, die skaliert.',
    bigNumber: '240 kg',
    unitTitle: 'Max. Nutzlast pro Fluggerät',
    note: 'Gemessene Werte der C500 Schwerlast-Plattform.',
    rows: {
      0: { label: 'Max. Nutzlast (einzelnes Fluggerät)', value: '240 kg' },
      1: { label: 'Gesamtschub (Vierachsen)', value: '720 kg' },
      2: { label: 'Max. Flugdistanz', value: '35 km' },
      3: { label: 'Max. Fluggeschwindigkeit', value: '90 km/h' },
      4: { label: 'Erkennungsbereich', value: '150 m' },
    },
  },
  intelligence: {
    eyebrow: 'Autonomie',
    title: 'Es sieht, entscheidet und fliegt.',
    lead: 'Ein End-to-End-Neuronalnetz baut Lufttransport auf Autonomie um — Billionen von On-Device-Operationen pro Sekunde.',
    items: {
      0: { title: 'End-to-End-Großmodell', desc: 'Experten-Trajektorien-Imitation, Flow Matching und Weltmodell-Vortraining ermöglichen Ganzbereichs-Wahrnehmung.' },
      1: { title: 'Intelligente Routen', desc: 'Routen optimieren sich weiter, je mehr Sie fliegen, und werden mit der Zeit schneller.' },
      2: { title: 'Trajektorien-Wiedergabe', desc: 'Bewährte, effiziente Routen mit einem Tastendruck abrufen, um die Arbeitslast zu senken.' },
      3: { title: 'Lastbewusster Flug', desc: 'Neun-Augen- und Radarwahrnehmung erkennt Lastschwingungen und Hindernisse, mit automatischer Dämpfung für stabile Transporte.' },
    },
  },
  safety: {
    eyebrow: 'Sicherheit',
    title: 'Schutz des Bedieners zuerst.',
    lead: 'Mehrschichtige Schutzmaßnahmen halten Menschen, Fracht und Fluggerät in jeder Missionsphase geschützt.',
    cards: {
      0: { title: 'Zyklische Smart-Carry-Lösung', desc: 'Mensch-Maschine-Trennung hält den Bediener vom Hubbereich fern für sicherere Einsätze.' },
      1: { title: 'Fallschirm an Bord', desc: 'Reduziert die Landestoßwirkung, um Risiko und Verlust im Notfall zu verringern.' },
      2: { title: 'Ganzbereichs-Bewusstsein', desc: 'Rumpfstatus, Energiesystem und Fracht werden in Echtzeit überwacht, um Risiken früh zu erkennen.' },
    },
  },
  multiangle: {
    eyebrow: 'Im Einsatz',
    title: 'Jeder Winkel abgedeckt.',
    lead: 'Vom Präzisionsheben mit einem Fluggerät bis zum Schwarmtransport mit vier Drohnen: das C500 passt sich der Mission an.',
    items: {
      0: { title: 'Zweier-Schwarm', desc: 'Zwei koordinierte Fluggeräte tragen bis zu 400 kg.' },
      1: { title: 'Vierer-Schwarm', desc: 'Vier koordinierte Fluggeräte heben bis zu 720 kg auf großen Flächen.' },
      2: { title: 'Elektrische Smartwinde', desc: 'Die motorisierte Winde gibt das Lastenseil frei auf und spult es ein.' },
      3: { title: 'Intelligente Sprachsteuerung', desc: 'Sprachweckung und Sprachbefehle halten die Hände frei für die Mission.' },
    },
  },
  compare: {
    eyebrow: 'Vergleich',
    title: 'Drohne vs. Bodentransport.',
    colD15r: 'Partdro C500',
    colManual: 'Bodenmethode',
    rows: {
      0: { label: 'Last pro Fahrt', d15r: 'Bis zu 240 kg', manual: 'Grenzen von Träger oder Kleinfahrzeug' },
      1: { label: 'Geländezugang', d15r: 'Berge, Hochebenen, Inseln — direkte Linie', manual: 'Erfordert Straßen oder Wege' },
      2: { label: 'Aufbau vor Ort', d15r: 'Keine Straßen, Türme oder Krane nötig', manual: 'Straßenarbeiten oder Kraninstallation' },
      3: { label: 'Sicherheitsrisiko', d15r: 'Kein Personal auf dem Bodenweg', manual: 'Arbeiter in gefährlichem Gelände' },
      4: { label: 'Wetterfenster', d15r: 'Wind Klasse 6, -20 °C bis 50 °C', manual: 'Oft durch Gelände und Wetter verzögert' },
      5: { label: 'Flottenskalierung', d15r: 'Schwarm-Heben bis 720 kg', manual: 'Fügt Fahrzeuge und Crews linear hinzu' },
    },
  },
  scenarios: {
    0: { title: 'Solarpark-Transport', desc: 'Fliegen Sie Paneele und Ausrüstung direkt auf Berghänge, wo Fahrzeuge nicht hinkommen.' },
    1: { title: 'Holztransport', desc: 'Heben Sie Stämme aus steilem Waldgelände, ohne neue Wege zu schneiden.' },
    2: { title: 'Stahl & Bau', desc: 'Bewegen Sie Stahlträger und Materialien mit präzisem Heben über die Baustelle.' },
    3: { title: 'Notfalllieferungen', desc: 'Liefern Sie Hilfsgüter in abgeschnittene Gebiete, Minuten nach dem Start.' },
  },
  specs: {
    eyebrow: 'Spezifikationen',
    title: 'Technische Daten.',
    lead: 'Kennzahlen des C500 Schwerlast-Flugroboters.',
    items: {
      0: { label: 'Max. Nutzlast', value: '240 kg' },
      1: { label: 'Leergewicht (ohne Akkus)', value: '120 kg' },
      2: { label: 'Antriebskonfiguration', value: 'Vierachsen-Achtpropeller, doppelte Redundanz' },
      3: { label: 'Propeller', value: '73-Zoll-Kohlenfaser-Faltpropeller' },
      4: { label: 'Gesamtschub (Vierachsen)', value: '720 kg' },
      5: { label: 'Max. Fluggeschwindigkeit', value: '90 km/h' },
      6: { label: 'Windwiderstand', value: 'Klasse 6' },
      7: { label: 'Schutzart', value: 'IP55' },
      8: { label: 'Betriebstemperatur', value: '-20 °C bis 50 °C' },
      9: { label: 'Akkukonfiguration', value: '50-Ah-CTB-Ultraschnell, Doppel-/Vierfach-Modi' },
      10: { label: 'Ladeleistung', value: '5.5C ultraschnell, 7 Min. voll' },
      11: { label: 'Max. Flugdistanz', value: '35 km' },
      12: { label: 'Wahrnehmungssystem', value: 'Neun-Augen-Vision + 920k-Punkte-LiDAR + Dual-mmWave-Radar' },
      13: { label: 'Erkennungsbereich', value: '150 m' },
      14: { label: 'Bildübertragung', value: 'Bis zu 30 km 4G+' },
      15: { label: 'Schwarm-Heben', value: '400 kg (dual) / 720 kg (quad)' },
      16: { label: 'Dienstgipfel', value: '6.000 m' },
      17: { label: 'FPV-Kamera', value: '4K' },
      18: { label: 'Flugautonomie', value: 'End-to-End-Neuronalnetz' },
    },
  },
  cta: {
    eyebrow: 'Loslegen',
    title: 'Bereit, ihn heben zu sehen?',
    text: 'Sprechen Sie mit unserem Team über Demos, Preise und Einsatz für Ihre Transportrouten und Standorte.',
    visit: 'Zurück zur Startseite',
  },
}

const contentFr = {
  hero: {
    kicker: 'Drone de fret lourd',
    title1: 'Charge lourde,',
    title2: 'Vol intelligent',
    lead: "Le robot volant de fret lourd Partdro C500 transporte jusqu'à 240 kg sur un seul appareil. La conception quadri-axes à huit hélices délivre 720 kg de poussée totale, tandis que la prise de décision autonome de bout en bout et le levage en essaim redéfinissent le transport aérien.",
    ctaPrimary: 'Demander un devis',
    ctaSecondary: 'Contacter les ventes',
    badgeTitle: 'Vente directe usine',
    badgeText: 'Expédition et support mondiaux',
    stats: { 0: '240 kg', 1: '720 kg', 2: '35 km' },
  },
  strip: {
    0: { value: '240 kg', label: 'Charge max (unitaire)' },
    1: { value: '90 km/h', label: 'Vitesse max' },
    2: { value: '35 km', label: 'Distance max' },
    3: { value: '7 min', label: 'Recharge complète la plus rapide' },
    4: { value: 'IP55', label: 'Indice de protection' },
  },
  why: {
    eyebrow: 'Pourquoi le choisir',
    title: 'Conçu pour le transport lourd.',
    lead: "Six raisons pour lesquelles les opérateurs choisissent le C500 pour des missions de fret que les véhicules terrestres et les grues ne peuvent pas couvrir.",
    cards: {
      0: { title: '240 kg de charge par appareil', desc: "Le plus élevé de sa catégorie : 240 kg au niveau de la mer, encore 160 kg à 6 000 m d'altitude." },
      1: { title: "Levage en essaim jusqu'à 720 kg", desc: 'Deux drones soulèvent 400 kg, quatre drones soulèvent 720 kg en vol coordonné.' },
      2: { title: 'Flexibilité double/quadruple batterie', desc: 'Les batteries ultra-rapides CTB de 50 Ah passent du mode double au mode quadruple ; la charge 5.5C se termine en 7 minutes.' },
      3: { title: 'Vision neuf-yeux + radar multi-sources', desc: 'Vue environnante 360° fusionnée avec un LiDAR de 920 000 points et un double radar millimétrique, portée de détection de 150 m.' },
      4: { title: "Transmission d'images 4G+ de 30 km", desc: "Volez loin en confiance ; double commande d'un seul appareil et 8 heures d'autonomie de la station relais." },
      5: { title: 'Prêt par tous les temps', desc: 'Protection IP55, résistance au vent niveau 6 et température de fonctionnement de -20 °C à 50 °C.' },
    },
  },
  designed: {
    eyebrow: 'Ingénierie',
    title: 'Structure stable, propulsion puissante.',
    lead: "Chaque élément du C500 est conçu autour d'une seule mission : déplacer des charges lourdes en toute sécurité sur des terrains exigeants et en altitude.",
    items: {
      0: { title: 'Cadre moulé intégré', desc: "Des poutres moulées sous pression d'une seule pièce à l'avant et à l'arrière maintiennent le fuselage rigide à pleine charge." },
      1: { title: 'Propulsion quadri-axes huit hélices', desc: 'Des hélices repliables en fibre de carbone de 73 pouces sur des moteurs à fil plat neufs délivrent 720 kg de poussée totale.' },
      2: { title: 'Capacité en haute altitude', desc: '240 kg de charge à 3 000 m, 200 kg à 4 500 m et 160 kg au plafond de service de 6 000 m.' },
    },
  },
  output: {
    eyebrow: 'Performance',
    title: 'Une performance qui évolue.',
    bigNumber: '240 kg',
    unitTitle: 'Charge max par appareil',
    note: 'Chiffres mesurés de la plateforme de fret lourd C500.',
    rows: {
      0: { label: 'Charge max (appareil unique)', value: '240 kg' },
      1: { label: 'Poussée totale (quadri-axes)', value: '720 kg' },
      2: { label: 'Distance de vol max', value: '35 km' },
      3: { label: 'Vitesse de vol max', value: '90 km/h' },
      4: { label: 'Portée de détection', value: '150 m' },
    },
  },
  intelligence: {
    eyebrow: 'Autonomie',
    title: 'Il voit, décide et vole.',
    lead: "Un réseau neuronal de bout en bout réinvente le transport aérien autour de l'autonomie — mille milliards d'opérations embarquées par seconde.",
    items: {
      0: { title: 'Grand modèle de bout en bout', desc: "L'imitation de trajectoires d'experts, le Flow Matching et le pré-entraînement par modèle monde alimentent la perception globale." },
      1: { title: 'Routes intelligentes', desc: "Les routes s'optimisent au fil des vols et deviennent plus rapides." },
      2: { title: 'Rejeu de trajectoire', desc: "Rappelez des routes éprouvées et efficaces en une seule pression pour réduire la charge de travail." },
      3: { title: 'Vol conscient de la charge', desc: "La perception neuf-yeux et radar détecte le balancement de la charge et les obstacles, avec amortissement automatique pour un transport stable." },
    },
  },
  safety: {
    eyebrow: 'Sécurité',
    title: "La protection de l'opérateur d'abord.",
    lead: "Des sauvegardes en couches maintiennent les personnes, la charge et l'appareil protégés à chaque phase de la mission.",
    cards: {
      0: { title: 'Solution de transport intelligent cyclique', desc: "La séparation homme-machine maintient l'opérateur à l'écart de la zone de levage pour des opérations plus sûres." },
      1: { title: 'Parachute embarqué', desc: "Réduit l'impact d'atterrissage pour diminuer les risques et les pertes en cas d'urgence." },
      2: { title: 'Conscience globale', desc: "L'état du fuselage, du système d'énergie et de la charge est surveillé en temps réel pour réduire les risques à temps." },
    },
  },
  multiangle: {
    eyebrow: 'Sur le terrain',
    title: 'Tous les angles couverts.',
    lead: "Du levage de précision à un seul appareil au transport en essaim de quatre drones, le C500 s'adapte à la mission.",
    items: {
      0: { title: 'Essaim de deux drones', desc: "Deux appareils coordonnés transportent jusqu'à 400 kg." },
      1: { title: 'Essaim de quatre drones', desc: "Quatre appareils coordonnés soulèvent jusqu'à 720 kg sur de vastes sites." },
      2: { title: 'Treuil intelligent électrique', desc: 'Le treuil motorisé libère et rembobine librement le câble de charge.' },
      3: { title: 'Commande vocale intelligente', desc: 'Le réveil vocal et les commandes vocales gardent les mains sur la mission.' },
    },
  },
  compare: {
    eyebrow: 'Comparaison',
    title: 'Drone vs. transport terrestre.',
    colD15r: 'Partdro C500',
    colManual: 'Méthode terrestre',
    rows: {
      0: { label: 'Charge par trajet', d15r: "Jusqu'à 240 kg", manual: 'Limites du porteur ou du petit véhicule' },
      1: { label: 'Accès au terrain', d15r: 'Montagnes, plateaux, îles — ligne directe', manual: 'Nécessite des routes ou pistes' },
      2: { label: 'Installation sur site', d15r: 'Aucune route, tour ni grue nécessaires', manual: 'Travaux routiers ou montage de grue' },
      3: { label: 'Risque pour la sécurité', d15r: 'Personnel absent du trajet terrestre', manual: 'Travailleurs en terrain dangereux' },
      4: { label: 'Fenêtre météo', d15r: 'Vent niveau 6, -20 °C à 50 °C', manual: 'Souvent retardé par le terrain et la météo' },
      5: { label: 'Évolutivité de la flotte', d15r: "Levage en essaim jusqu'à 720 kg", manual: 'Ajoute véhicules et équipages linéairement' },
    },
  },
  scenarios: {
    0: { title: 'Transport solaire', desc: 'Emportez panneaux et équipements directement sur les pentes de montagne où les véhicules ne passent pas.' },
    1: { title: 'Transport de bois', desc: 'Sortez les grumes des terrains forestiers escarpés sans ouvrir de nouvelles pistes.' },
    2: { title: 'Acier & construction', desc: 'Déplacez poutres en acier et matériaux avec un levage de précision.' },
    3: { title: "Fournitures d'urgence", desc: 'Livrez des secours dans des zones coupées quelques minutes après le décollage.' },
  },
  specs: {
    eyebrow: 'Spécifications',
    title: 'Spécifications techniques.',
    lead: 'Chiffres clés du robot volant de fret lourd C500.',
    items: {
      0: { label: 'Charge maximale', value: '240 kg' },
      1: { label: 'Poids à vide (sans batteries)', value: '120 kg' },
      2: { label: 'Configuration de propulsion', value: 'Quadri-axes huit hélices, double redondance' },
      3: { label: 'Hélices', value: 'Repliables en fibre de carbone de 73 pouces' },
      4: { label: 'Poussée totale (quadri-axes)', value: '720 kg' },
      5: { label: 'Vitesse de vol max', value: '90 km/h' },
      6: { label: 'Résistance au vent', value: 'Niveau 6' },
      7: { label: 'Indice de protection', value: 'IP55' },
      8: { label: 'Température de fonctionnement', value: '-20 °C à 50 °C' },
      9: { label: 'Configuration des batteries', value: 'CTB ultra-rapide 50 Ah, modes double/quadruple' },
      10: { label: 'Performance de charge', value: '5.5C ultra-rapide, pleine en 7 min' },
      11: { label: 'Distance de vol max', value: '35 km' },
      12: { label: 'Système de perception', value: 'Vision neuf-yeux + LiDAR 920k points + double radar mmWave' },
      13: { label: 'Portée de détection', value: '150 m' },
      14: { label: "Transmission d'images", value: "Jusqu'à 30 km 4G+" },
      15: { label: 'Levage en essaim', value: '400 kg (double) / 720 kg (quadruple)' },
      16: { label: 'Plafond de service', value: '6 000 m' },
      17: { label: 'Caméra FPV', value: '4K' },
      18: { label: 'Autonomie de vol', value: 'Réseau neuronal de bout en bout' },
    },
  },
  cta: {
    eyebrow: 'Commencer',
    title: 'Prêt à le voir soulever ?',
    text: 'Parlez à notre équipe des démonstrations, des tarifs et du déploiement pour vos routes et sites de transport.',
    visit: "Retour à l'accueil",
  },
}

for (const [lang, tree] of [['es', contentEs], ['de', contentDe], ['fr', contentFr]]) {
  const { error } = await supabase
    .from('landing_content')
    .upsert({ namespace: NS, lang, content: tree }, { onConflict: 'namespace,lang' })
  if (error) {
    console.error(`landing_content ${NS}/${lang} FAILED:`, error.message)
    process.exit(1)
  }
  console.log(`landing_content ${NS}/${lang} upserted`)
}

console.log('done.')
