/**
 * SL80 配送无人机：为 landing_content 命名空间 'sl80-delivery-drone' 补齐 es/de/fr 三行翻译。
 * 仅在本地 Node 环境使用 service_role（服务端语义，绝不进入前端代码/VITE_*）。
 * 非英文行只含文本树：不含 __images / __videos / __layout（图片走 en 回退）。
 * 运行：node scripts/sl80-i18n.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const env = readFileSync(new URL('../.env', import.meta.url), 'utf8')
const get = (k) => env.match(new RegExp(`^${k}=(.*)$`, 'm'))?.[1].trim()
const supabase = createClient(get('VITE_SUPABASE_URL'), get('SUPABASE_SERVICE_ROLE_KEY'))

const NS = 'sl80-delivery-drone'

// en 参考树（步骤1 已落盘），用于键结构校验
const en = JSON.parse(readFileSync(new URL('./sl80-en.json', import.meta.url), 'utf8'))

// ===== Spanish =====
const contentEs = {
  hero: {
    kicker: 'Dron de reparto Partdro',
    title1: 'Carga pesada, larga autonomía',
    title2: 'Dron de reparto SL80',
    lead: 'Cuatro baterías semisólidas de alta densidad energética de serie, una capacidad de carga de 80 kg y hasta 30 minutos de autonomía de vuelo para el transporte en zonas montañosas y la entrega de suministros de emergencia.',
    stats: { 0: '80 kg', 1: '30 min', 2: '4 baterías' },
  },
  strip: {
    0: { value: '80 kg', label: 'Carga máxima' },
    1: { value: '30 min', label: 'Autonomía de vuelo' },
    2: { value: '4 x 56Ah', label: 'Baterías semisólidas' },
    3: { value: '360°', label: 'Percepción LiDAR' },
    4: { value: '12 kW', label: 'Cargador inteligente' },
  },
  why: {
    eyebrow: 'Por qué elegirlo',
    title: 'Ventajas sólidas donde más importan.',
    lead: 'Por qué los operadores eligen el SL80 para misiones de transporte exigentes.',
    cards: {
      0: { title: 'Control de doble operador', desc: 'Mayor seguridad operativa gracias a la capacidad de operación coordinada.' },
      1: { title: 'Gran autonomía', desc: 'Cuatro baterías semisólidas de 56Ah 18S de serie.' },
      2: { title: 'Largo alcance', desc: 'Alcance sitios remotos mucho más allá de la línea de vista visual.' },
      3: { title: 'LiDAR 360°', desc: 'Campo de visión hemisférico ultraamplio con 850.000 puntos por segundo.' },
      4: { title: 'Protección con paracaídas', desc: 'Despliegue automático para un aterrizaje más seguro en situaciones anómalas.' },
      5: { title: 'Listo para todo terreno', desc: 'Operación precisa en terrenos complejos y clima adverso.' },
    },
  },
  designed: {
    eyebrow: 'Ingeniería',
    title: 'Energía avanzada, operación eficiente.',
    lead: 'Un diseño de bahía de 4 baterías concebido para una larga autonomía.',
    items: {
      0: { title: 'Bahía de cuatro baterías', desc: 'Configuración de serie con cuatro baterías semisólidas de 56Ah 18S.' },
      1: { title: 'Celdas de alta densidad', desc: 'Tecnología de baterías de alta densidad para un rendimiento mejorado.' },
      2: { title: 'Refrigeración por rejilla', desc: 'Estructura en rejilla para una disipación de calor eficiente.' },
    },
  },
  spray: {
    eyebrow: 'Capacidad principal',
    title: 'Módulos listos para la misión.',
    lead: 'El hardware y los sistemas que hacen cada misión de transporte eficiente y segura.',
    nozzles: {
      0: { angle: 'Control de doble operador', desc: 'Dos operadores comparten una misma misión para mayor seguridad y fiabilidad.' },
      1: { angle: 'Gran autonomía', desc: 'Cuatro baterías semisólidas impulsan largos ciclos de transporte.' },
      2: { angle: 'Largo alcance', desc: 'Enlaces de larga distancia mantienen conectados los sitios remotos.' },
      3: { angle: 'Protección con paracaídas', desc: 'Las hélices se detienen, el paracaídas se despliega y la carga aterriza de forma segura.' },
    },
  },
  intelligence: {
    eyebrow: 'Autonomía',
    title: 'Control de vuelo inteligente.',
    lead: 'Tecnología madura de control de vuelo para una operación precisa en condiciones complejas.',
    items: {
      0: { title: 'Antibalanceo inteligente', desc: 'Estabilización rápida y suspensión precisa para detenerse y soltar la carga al instante.' },
      1: { title: 'Liberación automática del gancho', desc: 'Simplifica la descarga y agiliza las operaciones.' },
      2: { title: 'Pesaje en tiempo real', desc: 'Evita la sobrecarga para unas operaciones más seguras.' },
      3: { title: 'Plataforma de misión todo en uno', desc: 'Coordinación de varios drones con comunicación 4G y control remoto de emergencia.' },
    },
  },
  safety: {
    eyebrow: 'Seguridad',
    title: 'Percepción omnidireccional, decisiones inteligentes.',
    lead: 'El LiDAR y el radar milimétrico de antena en fase se combinan en un sistema de percepción donde uno más uno es mayor que dos.',
    cards: {
      0: { title: 'Radar milimétrico de antena en fase', desc: 'Detecta variaciones del terreno para un vuelo estable; fiable en niebla y barro.' },
      1: { title: 'LiDAR 360°', desc: 'Campo de visión de 360° horizontal y 90° vertical con 850.000 puntos por segundo.' },
      2: { title: 'Sistema de paracaídas', desc: 'El despliegue automático al detenerse las hélices garantiza un aterrizaje más seguro.' },
    },
  },
  cta: {
    eyebrow: 'Comience ahora',
    title: '¿Listo para entregar en lugares de difícil acceso?',
    text: 'Hable con nuestro equipo sobre demostraciones, precios y despliegue para sus rutas de transporte.',
    visit: 'Volver al inicio',
  },
}

// ===== German =====
const contentDe = {
  hero: {
    kicker: 'Partdro Lieferdrohne',
    title1: 'Schwere Fracht, lange Reichweite',
    title2: 'SL80 Lieferdrohne',
    lead: 'Vier halbfeste Batterien mit hoher Energiedichte serienmäßig, 80 kg Nutzlastkapazität und bis zu 30 Minuten Flugdauer für Transport in Gebirgsregionen und Notfalllieferungen.',
    stats: { 0: '80 kg', 1: '30 min', 2: '4 Batterien' },
  },
  strip: {
    0: { value: '80 kg', label: 'Max. Nutzlast' },
    1: { value: '30 min', label: 'Flugdauer' },
    2: { value: '4 x 56Ah', label: 'Halbfeste Batterien' },
    3: { value: '360°', label: 'LiDAR-Wahrnehmung' },
    4: { value: '12 kW', label: 'Intelligentes Ladegerät' },
  },
  why: {
    eyebrow: 'Warum es sich lohnt',
    title: 'Starke Vorteile, wo es darauf ankommt.',
    lead: 'Warum Betreiber das SL80 für anspruchsvolle Transportmissionen wählen.',
    cards: {
      0: { title: 'Steuerung mit zwei Operatoren', desc: 'Mehr Sicherheit im Betrieb durch koordinierte Steuerung.' },
      1: { title: 'Starke Ausdauer', desc: 'Vier halbfeste 56Ah-18S-Batterien serienmäßig.' },
      2: { title: 'Große Reichweite', desc: 'Erreichen Sie abgelegene Standorte weit außerhalb der Sichtlinie.' },
      3: { title: '360°-LiDAR', desc: 'Ultrabreites hemisphärisches Sichtfeld mit 850.000 Punkten pro Sekunde.' },
      4: { title: 'Fallschirmschutz', desc: 'Automatische Auslösung für eine sicherere Landung in Ausnahmesituationen.' },
      5: { title: 'Für jedes Gelände bereit', desc: 'Präziser Betrieb in komplexem Gelände und bei rauem Wetter.' },
    },
  },
  designed: {
    eyebrow: 'Technik',
    title: 'Fortschrittliche Energie, effizienter Betrieb.',
    lead: 'Ein 4-Batterie-Schacht-Design für lange Einsatzdauer.',
    items: {
      0: { title: 'Vier-Batterie-Schacht', desc: 'Standardausstattung mit vier halbfesten 56Ah-18S-Batterien.' },
      1: { title: 'Zellen mit hoher Dichte', desc: 'Hochdichte Batterietechnologie für verbesserte Leistung.' },
      2: { title: 'Gitterkühlung', desc: 'Gitterstruktur-Design für effiziente Wärmeableitung.' },
    },
  },
  spray: {
    eyebrow: 'Kernfähigkeit',
    title: 'Missionsbereite Module.',
    lead: 'Die Hardware und Systeme, die jede Transportmission effizient und sicher machen.',
    nozzles: {
      0: { angle: 'Steuerung mit zwei Operatoren', desc: 'Zwei Operatoren teilen sich eine Mission für mehr Sicherheit und Zuverlässigkeit.' },
      1: { angle: 'Starke Ausdauer', desc: 'Vier halbfeste Batterien versorgen lange Transportzyklen mit Energie.' },
      2: { angle: 'Große Reichweite', desc: 'Weitreichende Verbindungen halten abgelegene Standorte erreichbar.' },
      3: { angle: 'Fallschirmschutz', desc: 'Die Propeller stoppen, der Fallschirm öffnet sich, die Fracht landet sicher.' },
    },
  },
  intelligence: {
    eyebrow: 'Autonomie',
    title: 'Intelligente Flugsteuerung.',
    lead: 'Ausgereifte Flugsteuerungstechnologie für präzise Einsätze unter komplexen Bedingungen.',
    items: {
      0: { title: 'Intelligente Schlingerunterdrückung', desc: 'Schnelle Stabilisierung und präzises Schweben für sofortiges Stoppen und Absetzen.' },
      1: { title: 'Automatische Hakenauslösung', desc: 'Vereinfacht das Entladen und optimiert die Abläufe.' },
      2: { title: 'Gewichtsmessung in Echtzeit', desc: 'Verhindert Überlastung für sicherere Einsätze.' },
      3: { title: 'Missionsplattform aus einer Hand', desc: 'Multi-Drohnen-Koordination mit 4G-Kommunikation und Fernnotsteuerung.' },
    },
  },
  safety: {
    eyebrow: 'Sicherheit',
    title: 'Omnidirektionale Wahrnehmung, intelligente Entscheidungen.',
    lead: 'LiDAR und Millimeterwellen-Phased-Array-Radar vereinen sich zu einem Wahrnehmungssystem, in dem eins plus eins mehr als zwei ergibt.',
    cards: {
      0: { title: 'Millimeterwellen-Phased-Array-Radar', desc: 'Erkennt Geländevariationen für stabilen Flug; zuverlässig bei Nebel und Schlamm.' },
      1: { title: '360°-LiDAR', desc: '360° horizontales und 90° vertikales Sichtfeld mit 850.000 Punkten pro Sekunde.' },
      2: { title: 'Fallschirmsystem', desc: 'Automatische Auslösung beim Propellerstopp sorgt für eine sicherere Landung.' },
    },
  },
  cta: {
    eyebrow: 'Jetzt starten',
    title: 'Bereit, an schwer zugängliche Orte zu liefern?',
    text: 'Sprechen Sie mit unserem Team über Demos, Preise und den Einsatz auf Ihren Transportrouten.',
    visit: 'Zurück zur Startseite',
  },
}

// ===== French =====
const contentFr = {
  hero: {
    kicker: 'Drone de livraison Partdro',
    title1: 'Charge lourde, longue autonomie',
    title2: 'Drone de livraison SL80',
    lead: 'Quatre batteries semi-solides à haute densité énergétique de série, une capacité de charge de 80 kg et jusqu\'à 30 minutes d\'autonomie de vol pour le transport en zone montagneuse et la livraison de fournitures d\'urgence.',
    stats: { 0: '80 kg', 1: '30 min', 2: '4 batteries' },
  },
  strip: {
    0: { value: '80 kg', label: 'Charge maximale' },
    1: { value: '30 min', label: 'Autonomie de vol' },
    2: { value: '4 x 56Ah', label: 'Batteries semi-solides' },
    3: { value: '360°', label: 'Perception LiDAR' },
    4: { value: '12 kW', label: 'Chargeur intelligent' },
  },
  why: {
    eyebrow: 'Pourquoi le choisir',
    title: 'Des avantages solides là où cela compte.',
    lead: 'Pourquoi les opérateurs choisissent le SL80 pour les missions de transport exigeantes.',
    cards: {
      0: { title: 'Pilotage à deux opérateurs', desc: 'Sécurité opérationnelle renforcée grâce au pilotage coordonné.' },
      1: { title: 'Grande autonomie', desc: 'Quatre batteries semi-solides 56Ah 18S de série.' },
      2: { title: 'Longue portée', desc: 'Atteignez des sites isolés bien au-delà de la ligne de vue.' },
      3: { title: 'LiDAR 360°', desc: 'Champ de vision hémisphérique ultra-large avec 850 000 points par seconde.' },
      4: { title: 'Protection parachute', desc: 'Déploiement automatique pour un atterrissage plus sûr en situation anormale.' },
      5: { title: 'Prêt pour tout terrain', desc: 'Opération précise en terrain complexe et par météo difficile.' },
    },
  },
  designed: {
    eyebrow: 'Ingénierie',
    title: 'Énergie avancée, exploitation efficace.',
    lead: 'Une conception à baie de 4 batteries pensée pour la longue autonomie.',
    items: {
      0: { title: 'Baie de quatre batteries', desc: 'Configuration de série avec quatre batteries semi-solides 56Ah 18S.' },
      1: { title: 'Cellules haute densité', desc: 'Technologie de batteries haute densité pour des performances accrues.' },
      2: { title: 'Refroidissement par grille', desc: 'Structure en grille pour une dissipation thermique efficace.' },
    },
  },
  spray: {
    eyebrow: 'Capacité principale',
    title: 'Des modules prêts pour la mission.',
    lead: 'Le matériel et les systèmes qui rendent chaque mission de transport efficace et sûre.',
    nozzles: {
      0: { angle: 'Pilotage à deux opérateurs', desc: 'Deux opérateurs partagent une même mission pour plus de sécurité et de fiabilité.' },
      1: { angle: 'Grande autonomie', desc: 'Quatre batteries semi-solides alimentent de longs cycles de transport.' },
      2: { angle: 'Longue portée', desc: 'Des liaisons à longue distance maintiennent les sites isolés connectés.' },
      3: { angle: 'Protection parachute', desc: 'Les hélices s\'arrêtent, le parachute se déploie, la cargaison se pose en toute sécurité.' },
    },
  },
  intelligence: {
    eyebrow: 'Autonomie',
    title: 'Contrôle de vol intelligent.',
    lead: 'Une technologie de contrôle de vol éprouvée pour une exploitation précise en conditions complexes.',
    items: {
      0: { title: 'Anti-oscillation intelligent', desc: 'Stabilisation rapide et vol stationnaire précis pour un arrêt et un largage instantanés.' },
      1: { title: 'Libération automatique du crochet', desc: 'Simplifie le déchargement et rationalise les opérations.' },
      2: { title: 'Pesée en temps réel', desc: 'Évite la surcharge pour des opérations plus sûres.' },
      3: { title: 'Plateforme de mission tout-en-un', desc: 'Coordination multi-drones avec communication 4G et contrôle d\'urgence à distance.' },
    },
  },
  safety: {
    eyebrow: 'Sécurité',
    title: 'Perception omnidirectionnelle, décisions intelligentes.',
    lead: 'Le LiDAR et le radar millimétrique à balayage électronique se combinent en un système de perception où un plus un vaut plus que deux.',
    cards: {
      0: { title: 'Radar millimétrique à balayage électronique', desc: 'Détecte les variations du terrain pour un vol stable ; fiable dans le brouillard et la boue.' },
      1: { title: 'LiDAR 360°', desc: 'Champ de vision de 360° horizontal et 90° vertical avec 850 000 points par seconde.' },
      2: { title: 'Système parachute', desc: 'Le déploiement automatique à l\'arrêt des hélices assure un atterrissage plus sûr.' },
    },
  },
  cta: {
    eyebrow: 'Commencer',
    title: 'Prêt à livrer dans les endroits difficiles d\'accès ?',
    text: 'Parlez à notre équipe des démonstrations, des tarifs et du déploiement sur vos routes de transport.',
    visit: 'Retour à l\'accueil',
  },
}

// ===== 校验 =====

// 收集结构路径：节点以 '/' 结尾，叶子为完整路径
function structure(obj, prefix = '', out = []) {
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k
    if (v && typeof v === 'object') {
      out.push(p + '/')
      structure(v, p, out)
    } else {
      out.push(p)
    }
  }
  return out.sort()
}

// 收集所有叶子字符串
function leafStrings(obj, out = []) {
  for (const v of Object.values(obj)) {
    if (v && typeof v === 'object') leafStrings(v, out)
    else out.push(String(v))
  }
  return out
}

// vue-i18n 特殊字符禁止出现在翻译字符串中
const FORBIDDEN = /[@{}|]/

const enRef = { ...en }
delete enRef.__images
delete enRef.__videos
delete enRef.__layout
const enStruct = structure(enRef).join('\n')

const trees = { es: contentEs, de: contentDe, fr: contentFr }
let failed = false
for (const [lang, tree] of Object.entries(trees)) {
  const langStruct = structure(tree).join('\n')
  if (langStruct !== enStruct) {
    failed = true
    const enSet = new Set(enStruct.split('\n'))
    const langSet = new Set(langStruct.split('\n'))
    const missing = [...enSet].filter((k) => !langSet.has(k))
    const extra = [...langSet].filter((k) => !enSet.has(k))
    console.error(`[${lang}] KEY STRUCTURE MISMATCH — missing: ${JSON.stringify(missing)} extra: ${JSON.stringify(extra)}`)
  }
  const bad = leafStrings(tree).filter((s) => FORBIDDEN.test(s))
  if (bad.length) {
    failed = true
    console.error(`[${lang}] FORBIDDEN vue-i18n chars (@ { } |) in:`, bad)
  }
}
if (failed) process.exit(1)
console.log('Validation OK: key structure matches en; no @ { } | in any translated string')

// ===== upsert es/de/fr =====
for (const [lang, tree] of Object.entries(trees)) {
  const { error } = await supabase
    .from('landing_content')
    .upsert({ namespace: NS, lang, content: tree }, { onConflict: 'namespace,lang' })
  if (error) {
    console.error(`landing_content ${NS}/${lang} upsert FAILED:`, error.message)
    process.exit(1)
  }
  console.log(`landing_content ${NS}/${lang} upserted (${Object.keys(tree).length} top-level keys, ${leafStrings(tree).length} text leaves)`)
}

// ===== 验证：查询该 ns 全部行，检查 lang 集合与 hero.title1 =====
const { data: rows, error: verr } = await supabase
  .from('landing_content')
  .select('lang,content')
  .eq('namespace', NS)
if (verr) {
  console.error('VERIFY QUERY FAILED:', verr.message)
  process.exit(1)
}

const byLang = Object.fromEntries(rows.map((r) => [r.lang, r.content]))
const langs = rows.map((r) => r.lang).sort()
console.log(`landing_content rows for ${NS}: ${langs.join(', ')}`)

const expected = ['de', 'en', 'es', 'fr']
if (JSON.stringify(langs) !== JSON.stringify(expected)) {
  console.error(`VERIFY FAILED: expected langs ${expected.join(', ')} but got ${langs.join(', ')}`)
  process.exit(1)
}

for (const lang of expected) {
  const c = byLang[lang] || {}
  console.log(`  ${lang} | top-level keys=${Object.keys(c).length} | has __images=${'__images' in c} | hero.title1=${JSON.stringify(c?.hero?.title1 ?? null)}`)
}

const titles = expected.map((l) => byLang[l]?.hero?.title1)
if (titles.some((t) => !t)) {
  console.error('VERIFY FAILED: hero.title1 missing in at least one lang')
  process.exit(1)
}
if (new Set(titles).size !== titles.length) {
  console.error('VERIFY FAILED: hero.title1 values are not all distinct:', titles)
  process.exit(1)
}
console.log('VERIFY OK: langs = en,de,es,fr; hero.title1 present in all 4 and pairwise distinct')
