/**
 * Y160 配送无人机：landing_content es/de/fr 翻译行写入（一次性脚本）。
 * 仅在本地 Node 环境使用 service_role（服务端语义，绝不进入前端代码/VITE_*）。
 * 键结构与 en 行完全一致（数组用数字字符串键）；非 en 行不含 __images/__videos/__layout。
 * 禁止在翻译字符串中出现 vue-i18n 特殊字符：@ { } |
 * 运行：node scripts/y160-i18n.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const env = readFileSync(new URL('../.env', import.meta.url), 'utf8')
const get = (k) => env.match(new RegExp(`^${k}=(.*)$`, 'm'))?.[1].trim()
const supabase = createClient(get('VITE_SUPABASE_URL'), get('SUPABASE_SERVICE_ROLE_KEY'))

const NS = 'y160-delivery-drone'
const en = JSON.parse(readFileSync(new URL('./y160-en.json', import.meta.url), 'utf8'))

const contentEs = {
  cta: {
    text: "Hable con nuestro equipo sobre demostraciones, precios y despliegue para sus rutas de transporte.",
    title: "¿Listo para transportar carga pesada por vía aérea?",
    visit: "Volver al inicio",
    eyebrow: "Comience ahora",
  },
  why: {
    lead: "Seis razones por las que los operadores eligen el Y160 para misiones de carga exigentes.",
    cards: {
      0: {
        desc: "Estabilización rápida y vuelo estacionario preciso para detenerse y soltar la carga al instante.",
        title: "Antibalanceo inteligente",
      },
      1: {
        desc: "La suelta de carga en tierra simplifica la descarga y agiliza las operaciones.",
        title: "Liberación automática del gancho",
      },
      2: {
        desc: "La medición de la carga en vivo evita sobrecargas y hace las operaciones más seguras.",
        title: "Pesaje en tiempo real",
      },
      3: {
        desc: "Una plataforma de misión integral orquesta flotas enteras de drones.",
        title: "Coordinación de múltiples drones",
      },
      4: {
        desc: "Sincronización de datos con el backend y control de emergencia remoto.",
        title: "Comunicación por red 4G",
      },
      5: {
        desc: "Traspaso del control con un clic y un alcance efectivo de 30 km.",
        title: "Operación con doble mando",
      },
    },
    title: "Carga pesada, bajo control.",
    eyebrow: "Por qué elegirlo",
  },
  hero: {
    lead: "Dron de reparto industrial con cable de elevación de 15 m y capacidad profesional de elevación de 165 kg: fuselaje de doble rotor coaxial para operaciones de carga estables y precisas.",
    stats: { 0: "165 kg", 1: "Cable de 15 m", 2: "Alcance de 30 km" },
    kicker: "Dron de reparto Partdro",
    title1: "Carga bajo control",
    title2: "Dron de reparto Y160",
  },
  strip: {
    0: { label: "Carga útil máxima", value: "165 kg" },
    1: { label: "Cable de elevación", value: "15 m" },
    2: { label: "Percepción LiDAR", value: "360°" },
    3: { label: "Alcance del doble mando", value: "30 km" },
    4: { label: "Comunicación de flota", value: "4G" },
  },
  safety: {
    lead: "El LiDAR y el radar mmWave de antenas en fase se combinan en un sistema de percepción donde uno más uno es mayor que dos.",
    cards: {
      0: {
        desc: "Campo de visión hemisférico ultraamplio con 850.000 puntos por segundo de nubes de puntos de alta precisión.",
        title: "LiDAR de 360°",
      },
      1: {
        desc: "Detecta con precisión las variaciones del terreno; fiable en niebla y barro.",
        title: "Radar mmWave de antenas en fase",
      },
      2: {
        desc: "Estabilización rápida y vuelo estacionario preciso para detenerse y soltar la carga al instante.",
        title: "Antibalanceo inteligente",
      },
    },
    title: "Percepción omnidireccional, decisiones inteligentes.",
    eyebrow: "Seguridad",
  },
  designed: {
    lead: "Un fuselaje de doble rotor coaxial diseñado para la estabilidad y la seguridad con cargas pesadas.",
    items: {
      0: {
        desc: "Mayor estabilidad y seguridad con un empuje de un solo eje de hasta 150 kg.",
        title: "Diseño de doble rotor coaxial",
      },
      1: {
        desc: "Packs de 34000 mAh 18S con respaldo mutuo entre versiones.",
        title: "Baterías inteligentes de alto voltaje",
      },
      2: {
        desc: "Una refrigeración eficiente sostiene misiones de alta intensidad.",
        title: "Disipación térmica de rejilla",
      },
    },
    title: "Diseñado para elevar.",
    eyebrow: "Ingeniería",
  },
  intelligence: {
    lead: "Planifique, monitoree y controle cada entrega desde una sola plataforma.",
    items: {
      0: {
        desc: "Despache y supervise múltiples aeronaves en un solo flujo de trabajo.",
        title: "Coordinación de múltiples drones",
      },
      1: {
        desc: "Conectividad fiable mucho más allá de la línea de visión.",
        title: "Comunicación por red 4G",
      },
      2: {
        desc: "El estado de vuelo y los datos de misión fluyen hacia su centro de operaciones.",
        title: "Sincronización de datos con el backend",
      },
      3: {
        desc: "Intervención inmediata desde cualquier punto de la misión.",
        title: "Control de emergencia remoto",
      },
    },
    title: "Plataforma de misión integral.",
    eyebrow: "Autonomía",
  },
}

const contentDe = {
  cta: {
    text: "Sprechen Sie mit unserem Team über Demonstrationen, Preise und den Einsatz für Ihre Transportrouten.",
    title: "Bereit, schwere Lasten durch die Luft zu transportieren?",
    visit: "Zurück zur Startseite",
    eyebrow: "Jetzt starten",
  },
  why: {
    lead: "Sechs Gründe, warum Betreiber die Y160 für anspruchsvolle Lastenmissionen wählen.",
    cards: {
      0: {
        desc: "Schnelle Stabilisierung und präzises Schweben für sofortiges Stoppen und Absetzen.",
        title: "Intelligente Schwingungsdämpfung",
      },
      1: {
        desc: "Die Unterstützung der Bodenabgabe vereinfacht das Entladen und optimiert die Abläufe.",
        title: "Automatische Hakenauslösung",
      },
      2: {
        desc: "Die Live-Messung der Last verhindert Überladung für sicherere Einsätze.",
        title: "Wiegung in Echtzeit",
      },
      3: {
        desc: "Eine umfassende Missionsplattform orchestriert ganze Drohnenflotten.",
        title: "Multi-Drohnen-Koordination",
      },
      4: {
        desc: "Datensynchronisation mit dem Backend und Fernnotfallsteuerung.",
        title: "4G-Netzwerkkommunikation",
      },
      5: {
        desc: "Übernahme der Steuerung per Klick bei 30 km effektiver Reichweite.",
        title: "Betrieb mit Doppel-Fernsteuerung",
      },
    },
    title: "Schwere Lasten, voll unter Kontrolle.",
    eyebrow: "Ihre Vorteile",
  },
  hero: {
    lead: "Industrielle Lieferdrohne mit 15 m Hebekabel und 165 kg professioneller Hubkraft - ein Luftfahrzeug mit koaxialen Doppelrotoren für stabile, präzise Lasteneinsätze.",
    stats: { 0: "165 kg", 1: "15 m Kabel", 2: "30 km Reichweite" },
    kicker: "Partdro Lieferdrohne",
    title1: "Fracht unter Kontrolle",
    title2: "Y160 Lieferdrohne",
  },
  strip: {
    0: { label: "Max. Nutzlast", value: "165 kg" },
    1: { label: "Hebekabel", value: "15 m" },
    2: { label: "LiDAR-Wahrnehmung", value: "360°" },
    3: { label: "Reichweite der Doppel-Fernsteuerung", value: "30 km" },
    4: { label: "Flottenkommunikation", value: "4G" },
  },
  safety: {
    lead: "LiDAR und mmWave-Phased-Array-Radar vereinen sich zu einem Wahrnehmungssystem, bei dem eins und eins mehr als zwei ergibt.",
    cards: {
      0: {
        desc: "Ultraweites hemisphärisches Sichtfeld mit 850.000 Punkten pro Sekunde an hochpräzisen Punktwolken.",
        title: "360°-LiDAR",
      },
      1: {
        desc: "Erkennt Geländeveränderungen präzise; zuverlässig bei Nebel und Schlamm.",
        title: "mmWave-Phased-Array-Radar",
      },
      2: {
        desc: "Schnelle Stabilisierung mit präzisem Schweben für sofortiges Stoppen und Absetzen.",
        title: "Intelligente Schwingungsdämpfung",
      },
    },
    title: "Omnidirektionale Wahrnehmung, intelligente Entscheidungen.",
    eyebrow: "Sicherheit",
  },
  designed: {
    lead: "Ein Luftfahrzeug mit koaxialen Doppelrotoren, ausgelegt für Stabilität und Sicherheit unter schweren Lasten.",
    items: {
      0: {
        desc: "Mehr Stabilität und Sicherheit mit bis zu 150 kg Schub pro Achse.",
        title: "Koaxiale Doppelrotor-Bauweise",
      },
      1: {
        desc: "34000-mAh-18S-Akkupacks mit gegenseitiger Redundanz über alle Varianten.",
        title: "Intelligente Hochvolt-Akkus",
      },
      2: {
        desc: "Effiziente Kühlung hält intensive Einsätze durch.",
        title: "Wärmeabfuhr über Gitter",
      },
    },
    title: "Gebaut zum Heben.",
    eyebrow: "Technik",
  },
  intelligence: {
    lead: "Planen, überwachen und steuern Sie jede Lieferung über eine einzige Plattform.",
    items: {
      0: {
        desc: "Mehrere Luftfahrzeuge in einem Workflow dispatchen und überwachen.",
        title: "Multi-Drohnen-Koordination",
      },
      1: {
        desc: "Zuverlässige Konnektivität weit über die Sichtlinie hinaus.",
        title: "4G-Netzwerkkommunikation",
      },
      2: {
        desc: "Flugstatus und Missionsdaten fließen in Ihr Einsatzzentrum.",
        title: "Backend-Datensynchronisation",
      },
      3: {
        desc: "Sofortiges Eingreifen von überall im Einsatz.",
        title: "Fernnotfallsteuerung",
      },
    },
    title: "Missionsplattform aus einem Guss.",
    eyebrow: "Autonomie",
  },
}

const contentFr = {
  cta: {
    text: "Parlez à notre équipe de démonstrations, de tarifs et du déploiement de vos routes de transport.",
    title: "Prêt à déplacer des charges lourdes par les airs ?",
    visit: "Retour à l'accueil",
    eyebrow: "Commencer",
  },
  why: {
    lead: "Six raisons pour lesquelles les opérateurs choisissent le Y160 pour des missions de fret exigeantes.",
    cards: {
      0: {
        desc: "Stabilisation rapide et vol stationnaire précis pour un arrêt et une libération instantanés.",
        title: "Antibalancement intelligent",
      },
      1: {
        desc: "Le largage au sol simplifie le déchargement et fluidifie les opérations.",
        title: "Libération automatique du crochet",
      },
      2: {
        desc: "La mesure de la charge en direct évite les surcharges pour des opérations plus sûres.",
        title: "Pesée en temps réel",
      },
      3: {
        desc: "Une plateforme de mission tout-en-un orchestre des flottes entières de drones.",
        title: "Coordination multi-drones",
      },
      4: {
        desc: "Synchronisation des données avec le backend et contrôle d'urgence à distance.",
        title: "Communication par réseau 4G",
      },
      5: {
        desc: "Passation de contrôle en un clic avec une portée effective de 30 km.",
        title: "Pilotage à double télécommande",
      },
    },
    title: "Le levage lourd, sous contrôle.",
    eyebrow: "Pourquoi le choisir",
  },
  hero: {
    lead: "Drone de livraison industriel avec un câble de levage de 15 m et une capacité de levage professionnelle de 165 kg - une cellule à double rotor coaxial pour des opérations de fret stables et précises.",
    stats: { 0: "165 kg", 1: "Câble de 15 m", 2: "Portée de 30 km" },
    kicker: "Drone de livraison Partdro",
    title1: "Le fret sous contrôle",
    title2: "Drone de livraison Y160",
  },
  strip: {
    0: { label: "Charge utile maximale", value: "165 kg" },
    1: { label: "Câble de levage", value: "15 m" },
    2: { label: "Perception LiDAR", value: "360°" },
    3: { label: "Portée de la double télécommande", value: "30 km" },
    4: { label: "Communication de flotte", value: "4G" },
  },
  safety: {
    lead: "Le LiDAR et le radar mmWave à réseau phasé se combinent en un système de perception où un plus un valent plus que deux.",
    cards: {
      0: {
        desc: "Champ de vision hémisphérique ultra-large avec 850 000 points par seconde de nuages de points haute précision.",
        title: "LiDAR 360°",
      },
      1: {
        desc: "Détecte avec précision les variations du terrain ; fiable dans le brouillard et la boue.",
        title: "Radar mmWave à réseau phasé",
      },
      2: {
        desc: "Stabilisation rapide et vol stationnaire précis pour un arrêt et une libération instantanés.",
        title: "Antibalancement intelligent",
      },
    },
    title: "Perception omnidirectionnelle, décisions intelligentes.",
    eyebrow: "Sécurité",
  },
  designed: {
    lead: "Une cellule à double rotor coaxial conçue pour la stabilité et la sécurité sous de lourdes charges.",
    items: {
      0: {
        desc: "Stabilité et sécurité accrues avec une poussée allant jusqu'à 150 kg par axe.",
        title: "Double rotor coaxial",
      },
      1: {
        desc: "Packs de 34000 mAh 18S avec secours mutuel entre les versions.",
        title: "Batteries intelligentes haute tension",
      },
      2: {
        desc: "Un refroidissement efficace soutient les missions de haute intensité.",
        title: "Dissipation thermique par grille",
      },
    },
    title: "Conçu pour lever.",
    eyebrow: "Ingénierie",
  },
  intelligence: {
    lead: "Planifiez, surveillez et contrôlez chaque livraison depuis une plateforme unique.",
    items: {
      0: {
        desc: "Expéditez et supervisez plusieurs aéronefs dans un flux de travail unique.",
        title: "Coordination multi-drones",
      },
      1: {
        desc: "Connectivité fiable bien au-delà de la ligne de vue.",
        title: "Communication par réseau 4G",
      },
      2: {
        desc: "L'état de vol et les données de mission affluent vers votre centre d'opérations.",
        title: "Synchronisation des données backend",
      },
      3: {
        desc: "Intervention immédiate depuis n'importe quel point de la mission.",
        title: "Contrôle d'urgence à distance",
      },
    },
    title: "Plateforme de mission tout-en-un.",
    eyebrow: "Autonomie",
  },
}

// ---- 结构校验：叶子键路径必须与 en（去掉 __ 前缀键）完全一致；且禁用 vue-i18n 特殊字符 ----
const flatten = (obj, prefix = '') => {
  const out = []
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k
    if (v && typeof v === 'object') out.push(...flatten(v, p))
    else out.push(p)
  }
  return out
}
const enPaths = flatten(Object.fromEntries(Object.entries(en).filter(([k]) => !k.startsWith('__')))).sort()

const forbidden = /[@{}|]/
const trees = [
  ['es', contentEs],
  ['de', contentDe],
  ['fr', contentFr],
]
for (const [lang, tree] of trees) {
  const paths = flatten(tree).sort()
  const missing = enPaths.filter((p) => !paths.includes(p))
  const extra = paths.filter((p) => !enPaths.includes(p))
  if (missing.length || extra.length) {
    console.error(`STRUCT MISMATCH ${lang} -> missing:`, missing, 'extra:', extra)
    process.exit(1)
  }
  const bad = flatten(tree).filter((p) => {
    let v = tree
    for (const k of p.split('.')) v = v?.[k]
    return typeof v === 'string' && forbidden.test(v)
  })
  if (bad.length) {
    console.error(`FORBIDDEN CHARS (@{}|) in ${lang}:`, bad)
    process.exit(1)
  }
}
console.log('Structure check OK: en leaves =', enPaths.length)

// ---- Upsert 三行 ----
for (const [lang, content] of trees) {
  const { error } = await supabase
    .from('landing_content')
    .upsert({ namespace: NS, lang, content }, { onConflict: 'namespace,lang' })
  if (error) { console.error(`UPSERT ERROR (${lang}):`, error.message); process.exit(1) }
  console.log(`Upserted ${lang}, top-level keys =`, Object.keys(content).length)
}

// ---- 验证：该 ns 行应为 en,de,es,fr，各语言 hero.title1 存在且互不相同 ----
const { data: rows, error: selErr } = await supabase
  .from('landing_content')
  .select('namespace,lang,content')
  .eq('namespace', NS)
if (selErr) { console.error('SELECT ERROR:', selErr.message); process.exit(1) }

const langs = rows.map((r) => r.lang).sort()
console.log('Rows for', NS, '->', langs.join(','))
const titles = {}
for (const r of rows) titles[r.lang] = r.content?.hero?.title1 ?? null
for (const l of langs.sort()) console.log(`  ${l}: hero.title1 = ${JSON.stringify(titles[l])}, top-level keys = ${Object.keys(rows.find((r) => r.lang === l).content).length}`)

const need = ['en', 'de', 'es', 'fr']
const okRows = need.every((l) => langs.includes(l))
const okTitles = need.every((l) => titles[l]) && new Set(need.map((l) => titles[l])).size === need.length
const okNoMeta = rows.filter((r) => r.lang !== 'en').every((r) => !('__images' in r.content || '__videos' in r.content || '__layout' in r.content))
if (!okRows || !okTitles || !okNoMeta) {
  console.error('VERIFY FAILED:', { okRows, okTitles, okNoMeta })
  process.exit(1)
}
console.log('VERIFY OK: langs = en,de,es,fr; hero.title1 present and distinct; no __images/__videos/__layout in non-en rows')
