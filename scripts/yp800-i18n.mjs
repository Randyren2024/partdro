// Fill es/de/fr translations for landing_content namespace 'yp800-delivery-drone'.
// Reads VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from .env (local Node only).
// Embeds full translation trees with identical key structure to the en row
// (excluding __images/__videos/__layout, which fall back to en).
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const envText = readFileSync(new URL('../.env', import.meta.url), 'utf8')
const env = Object.fromEntries(
  envText
    .split(/\r?\n/)
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=')
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
    }),
)

const url = env.VITE_SUPABASE_URL
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env')
  process.exit(1)
}

const NAMESPACE = 'yp800-delivery-drone'

const contentEs = {
  cta: {
    text: 'Hable con nuestro equipo sobre demostraciones, precios y despliegue para sus rutas de transporte.',
    title: '¿Listo para optimizar su logística de baja altura?',
    visit: 'Volver al inicio',
    eyebrow: 'Comience ahora',
  },
  why: {
    lead: 'Por qué el YP800 se adapta a entornos de transporte complejos.',
    cards: {
      0: {
        desc: 'Estructura envolvente plegable para un transporte cómodo.',
        title: 'Estructura plegable',
      },
      1: {
        desc: 'Estructura construida en aleación de aluminio de grado aeronáutico.',
        title: 'Aluminio de grado aeronáutico',
      },
      2: {
        desc: 'Gancho de liberación, izado inteligente o caja de carga según la misión.',
        title: 'Configuraciones múltiples',
      },
      3: {
        desc: 'Baterías dobles de 34Ah montadas lateralmente con redundancia mutua.',
        title: 'Energía redundante',
      },
      4: {
        desc: 'Un cargador de 12 kW de doble canal refrigerado por aire admite ciclos continuos.',
        title: 'Carga rápida',
      },
      5: {
        desc: 'Situación de vuelo en tiempo real y sincronización de datos con la plataforma.',
        title: 'Operación inteligente',
      },
    },
    title: 'Transporte versátil, una sola plataforma.',
    eyebrow: 'Por qué elegirlo',
  },
  hero: {
    lead: 'Transporte de nueva generación a baja altura con múltiples opciones de energía, diversas configuraciones de carga, gran autonomía y operación inteligente.',
    stats: {
      0: '62 kg',
      1: '6000 m',
      2: '52 L box',
    },
    kicker: 'Partdro Dron de Reparto',
    title1: 'Transporte a baja altura',
    title2: 'YP800 Dron de Reparto',
  },
  spray: {
    lead: 'Cambie entre configuraciones según la carga y la misión.',
    title: 'Tres formas de transportar.',
    eyebrow: 'Configuraciones de transporte',
    nozzles: {
      0: {
        desc: 'Cable estándar de alta resistencia de 15 m con carga útil máxima de 62 kg; estructura sencilla para un mantenimiento cómodo.',
        angle: 'Gancho de liberación al contactar el suelo',
      },
      1: {
        desc: 'Liberación de emergencia con un clic, detección de peso y cable de hasta 30 m.',
        angle: 'Sistema de izado inteligente',
      },
      2: {
        desc: 'Capacidad de 52 L con apertura y cierre cómodos y detección de peso para operaciones seguras.',
        angle: 'Caja de carga',
      },
      3: {
        desc: 'Baterías dobles de 34Ah montadas lateralmente con redundancia mutua.',
        angle: 'Energía redundante',
      },
    },
  },
  strip: {
    0: {
      label: 'Carga útil máxima',
      value: '62 kg',
    },
    1: {
      label: 'Alcance máximo de vuelo',
      value: '6000 m',
    },
    2: {
      label: 'Cable de izado',
      value: '30 m',
    },
    3: {
      label: 'Caja de carga',
      value: '52 L',
    },
    4: {
      label: 'Alcance de doble control',
      value: '30 km',
    },
  },
  safety: {
    lead: 'Sensores de grado automotriz y protección pasiva en cada vuelo.',
    cards: {
      0: {
        desc: 'Duradero y fiable, con alcance máximo de detección de 150 m; escanea proactivamente los cambios del terreno.',
        title: 'Radar 4D de grado automotriz',
      },
      1: {
        desc: 'Se abre de inmediato cuando las hélices se detienen en emergencias, garantizando un aterrizaje seguro.',
        title: 'Sistema de paracaídas',
      },
      2: {
        desc: 'La monitorización continua de la carga evita sobrecargas.',
        title: 'Detección de peso',
      },
    },
    title: 'La seguridad, integrada de serie.',
    eyebrow: 'Seguridad',
  },
  designed: {
    lead: 'Plataforma cuadricóptera diseñada para misiones de transporte en montañas, vías fluviales y entornos urbanos.',
    items: {
      0: {
        desc: 'Disposición sencilla y robusta, fácil de mantener.',
        title: 'Diseño cuadricóptero',
      },
      1: {
        desc: 'Se pliega para un transporte y almacenamiento cómodos.',
        title: 'Plegado envolvente',
      },
      2: {
        desc: 'Estructura ligera y duradera.',
        title: 'Aluminio de grado aeronáutico',
      },
    },
    title: 'Diseñado para entornos complejos.',
    eyebrow: 'Ingeniería',
  },
  intelligence: {
    lead: 'Gestión eficiente de las misiones de transporte con estado de vuelo en tiempo real.',
    items: {
      0: {
        desc: 'Sincronice los datos operativos a través del módulo de red.',
        title: 'Sincronización de datos',
      },
      1: {
        desc: 'Alcance efectivo máximo de 30 km que afronta con facilidad escenarios complejos.',
        title: 'Un dron, doble control',
      },
      2: {
        desc: 'Estado de vuelo en vivo durante toda la misión.',
        title: 'Situación en tiempo real',
      },
      3: {
        desc: 'La monitorización continua de la carga mejora la seguridad operativa.',
        title: 'Detección de peso',
      },
    },
    title: 'Cada misión bajo control.',
    eyebrow: 'Colaboración eficiente',
  },
}

const contentDe = {
  cta: {
    text: 'Sprechen Sie mit unserem Team über Demo-Vorführungen, Preise und den Einsatz auf Ihren Transportrouten.',
    title: 'Bereit, Ihre Logistik in niedriger Flughöhe zu optimieren?',
    visit: 'Zurück zur Startseite',
    eyebrow: 'Jetzt starten',
  },
  why: {
    lead: 'Warum der YP800 für komplexe Transportumgebungen geeignet ist.',
    cards: {
      0: {
        desc: 'Der Rahmen lässt sich um den Rumpf falten – ideal für den Transport.',
        title: 'Faltbare Struktur',
      },
      1: {
        desc: 'Rahmen gefertigt aus einer Aluminiumlegierung der Luftfahrtklasse.',
        title: 'Luftfahrttaugliches Aluminium',
      },
      2: {
        desc: 'Auslösehaken, intelligentes Heben oder Transportbox passend zum Einsatz.',
        title: 'Mehrere Konfigurationen',
      },
      3: {
        desc: 'Seitlich montierte doppelte 34Ah-Akkus mit gegenseitiger Redundanz.',
        title: 'Redundante Stromversorgung',
      },
      4: {
        desc: 'Ein 12-kW-Ladegerät mit zwei Kanälen und Luftkühlung ermöglicht kontinuierliche Ladezyklen.',
        title: 'Schnelles Laden',
      },
      5: {
        desc: 'Flugstatus in Echtzeit und Synchronisation der Daten mit der Plattform.',
        title: 'Intelligenter Betrieb',
      },
    },
    title: 'Vielseitiger Transport, eine Plattform.',
    eyebrow: 'Warum sie überzeugt',
  },
  hero: {
    lead: 'Transportlösung der nächsten Generation in niedriger Flughöhe mit mehreren Energieoptionen, vielfältigen Transportkonfigurationen, langer Flugdauer und intelligentem Betrieb.',
    stats: {
      0: '62 kg',
      1: '6000 m',
      2: '52 L box',
    },
    kicker: 'Partdro Lieferdrohne',
    title1: 'Transport in niedriger Flughöhe',
    title2: 'YP800 Lieferdrohne',
  },
  spray: {
    lead: 'Wechseln Sie zwischen Konfigurationen, passend zu Nutzlast und Einsatz.',
    title: 'Drei Arten zu transportieren.',
    eyebrow: 'Transportkonfigurationen',
    nozzles: {
      0: {
        desc: 'Standard-Hochlastseil mit 15 m Länge und maximal 62 kg Nutzlast; einfacher Aufbau für unkomplizierte Wartung.',
        angle: 'Auslösehaken bei Bodenkontakt',
      },
      1: {
        desc: 'Notauslösung per Knopfdruck, Gewichtserkennung und Seillänge von bis zu 30 m.',
        angle: 'Intelligentes Hebesystem',
      },
      2: {
        desc: '52 L Volumen mit komfortabler Öffnung und Schließung sowie Gewichtserkennung für sichere Einsätze.',
        angle: 'Transportbox',
      },
      3: {
        desc: 'Seitlich montierte doppelte 34Ah-Akkus mit gegenseitiger Redundanz.',
        angle: 'Redundante Stromversorgung',
      },
    },
  },
  strip: {
    0: {
      label: 'Maximale Nutzlast',
      value: '62 kg',
    },
    1: {
      label: 'Maximale Flugreichweite',
      value: '6000 m',
    },
    2: {
      label: 'Hebeseil',
      value: '30 m',
    },
    3: {
      label: 'Transportbox',
      value: '52 L',
    },
    4: {
      label: 'Reichweite Doppelsteuerung',
      value: '30 km',
    },
  },
  safety: {
    lead: 'Sensorik in Automobilqualität und passiver Schutz bei jedem Flug.',
    cards: {
      0: {
        desc: 'Langlebig und zuverlässig, mit maximal 150 m Erkennungsreichweite; scannt proaktiv Geländeveränderungen.',
        title: '4D-Radar in Automobilqualität',
      },
      1: {
        desc: 'Öffnet sich im Notfall sofort, wenn die Propeller stoppen, und gewährleistet eine sichere Landung.',
        title: 'Fallschirmsystem',
      },
      2: {
        desc: 'Kontinuierliche Nutzlastüberwachung verhindert Überladung.',
        title: 'Gewichtserkennung',
      },
    },
    title: 'Sicherheit ab Werk integriert.',
    eyebrow: 'Sicherheit',
  },
  designed: {
    lead: 'Eine Quadrocopter-Plattform, speziell entwickelt für Transporteinsätze in Bergen, an Wasserwegen und im städtischen Raum.',
    items: {
      0: {
        desc: 'Einfacher, robuster Aufbau, leicht zu warten.',
        title: 'Quadrocopter-Design',
      },
      1: {
        desc: 'Klappt sich für Transport und Lagerung bequem zusammen.',
        title: 'Faltung um den Rumpf',
      },
      2: {
        desc: 'Leichter, robuster Rahmenbau.',
        title: 'Luftfahrttaugliches Aluminium',
      },
    },
    title: 'Entwickelt für komplexe Umgebungen.',
    eyebrow: 'Engineering',
  },
  intelligence: {
    lead: 'Effizientes Einsatzmanagement mit Flugstatus in Echtzeit.',
    items: {
      0: {
        desc: 'Synchronisieren Sie Betriebsdaten über das Netzwerkmodul.',
        title: 'Datensynchronisation',
      },
      1: {
        desc: 'Maximal 30 km effektive Reichweite meistern mühelos komplexe Szenarien.',
        title: 'Eine Drohne, Doppelsteuerung',
      },
      2: {
        desc: 'Live-Flugstatus während des gesamten Einsatzes.',
        title: 'Echtzeit-Überblick',
      },
      3: {
        desc: 'Kontinuierliche Nutzlastüberwachung erhöht die Betriebssicherheit.',
        title: 'Gewichtserkennung',
      },
    },
    title: 'Jeder Einsatz unter Kontrolle.',
    eyebrow: 'Effiziente Zusammenarbeit',
  },
}

const contentFr = {
  cta: {
    text: "Parlez à notre équipe des démonstrations, des tarifs et du déploiement sur vos routes de transport.",
    title: 'Prêt à fluidifier votre logistique à basse altitude ?',
    visit: "Retour à l'accueil",
    eyebrow: 'Commencer',
  },
  why: {
    lead: "Pourquoi le YP800 s'adapte aux environnements de transport complexes.",
    cards: {
      0: {
        desc: 'Cellule repliable autour du fuselage pour un transport pratique.',
        title: 'Structure pliable',
      },
      1: {
        desc: "Cellule construite en alliage d'aluminium de qualité aéronautique.",
        title: 'Aluminium aéronautique',
      },
      2: {
        desc: 'Crochet de largage, levage intelligent ou caisse de charge selon la mission.',
        title: 'Configurations multiples',
      },
      3: {
        desc: 'Double batterie de 34Ah montée latéralement avec redondance mutuelle.',
        title: 'Alimentation redondante',
      },
      4: {
        desc: 'Un chargeur 12 kW double canal refroidi par air prend en charge les cycles continus.',
        title: 'Charge rapide',
      },
      5: {
        desc: "Suivi de l'état de vol en temps réel et synchronisation des données avec la plateforme.",
        title: 'Exploitation intelligente',
      },
    },
    title: 'Transport polyvalent, une seule plateforme.',
    eyebrow: 'Pourquoi le choisir',
  },
  hero: {
    lead: "Le transport de nouvelle génération à basse altitude : multiples options d'alimentation, configurations de transport variées, longue endurance et exploitation intelligente.",
    stats: {
      0: '62 kg',
      1: '6000 m',
      2: '52 L box',
    },
    kicker: 'Partdro Drone de Livraison',
    title1: 'Transport à basse altitude',
    title2: 'YP800 Drone de Livraison',
  },
  spray: {
    lead: 'Changez de configuration selon la charge et la mission.',
    title: 'Trois façons de transporter.',
    eyebrow: 'Configurations de transport',
    nozzles: {
      0: {
        desc: 'Câble haute résistance standard de 15 m avec charge utile maximale de 62 kg ; structure simple pour un entretien facile.',
        angle: 'Crochet de largage au contact du sol',
      },
      1: {
        desc: "Largage d'urgence en un clic, détection du poids et câble allant jusqu'à 30 m.",
        angle: 'Système de levage intelligent',
      },
      2: {
        desc: 'Capacité de 52 L avec ouverture et fermeture pratiques et détection du poids pour des opérations sûres.',
        angle: 'Caisse de charge',
      },
      3: {
        desc: 'Double batterie de 34Ah montée latéralement avec redondance mutuelle.',
        angle: 'Alimentation redondante',
      },
    },
  },
  strip: {
    0: {
      label: 'Charge utile maximale',
      value: '62 kg',
    },
    1: {
      label: 'Portée de vol maximale',
      value: '6000 m',
    },
    2: {
      label: 'Câble de levage',
      value: '30 m',
    },
    3: {
      label: 'Caisse de charge',
      value: '52 L',
    },
    4: {
      label: 'Portée double commande',
      value: '30 km',
    },
  },
  safety: {
    lead: 'Capteurs de qualité automobile et protection passive à chaque vol.',
    cards: {
      0: {
        desc: 'Durable et fiable, avec une portée de détection maximale de 150 m ; scanne activement les changements de terrain.',
        title: 'Radar 4D qualité automobile',
      },
      1: {
        desc: "S'ouvre immédiatement en cas d'urgence lorsque les hélices s'arrêtent, garantissant un atterrissage en toute sécurité.",
        title: 'Système parachute',
      },
      2: {
        desc: 'La surveillance continue de la charge évite les surcharges.',
        title: 'Détection du poids',
      },
    },
    title: 'La sécurité, intégrée de série.',
    eyebrow: 'Sécurité',
  },
  designed: {
    lead: 'Une plateforme quadricoptère conçue pour les missions de transport en montagne, sur les voies navigables et en milieu urbain.',
    items: {
      0: {
        desc: 'Architecture simple et robuste, facile à entretenir.',
        title: 'Design quadricoptère',
      },
      1: {
        desc: 'Se replie pour un transport et un stockage pratiques.',
        title: 'Pliage autour du fuselage',
      },
      2: {
        desc: 'Cellule légère et durable.',
        title: 'Aluminium aéronautique',
      },
    },
    title: 'Conçu pour les environnements complexes.',
    eyebrow: 'Ingénierie',
  },
  intelligence: {
    lead: "Gestion efficace des missions de transport avec suivi de l'état de vol en temps réel.",
    items: {
      0: {
        desc: 'Synchronisez les données opérationnelles via le module réseau.',
        title: 'Synchronisation des données',
      },
      1: {
        desc: 'Portée effective maximale de 30 km pour affronter facilement les scénarios complexes.',
        title: 'Un drone, double commande',
      },
      2: {
        desc: 'État de vol en direct pendant toute la mission.',
        title: 'Suivi en temps réel',
      },
      3: {
        desc: 'La surveillance continue de la charge renforce la sécurité opérationnelle.',
        title: 'Détection du poids',
      },
    },
    title: 'Chaque mission sous contrôle.',
    eyebrow: 'Collaboration efficace',
  },
}

// Structural validation: same keys as en (minus __images/__videos/__layout),
// all leaves strings, no vue-i18n special characters.
function validateTree(tree, ref, path = '$') {
  const refKeys = Object.keys(ref).sort()
  const treeKeys = Object.keys(tree).sort()
  const missing = refKeys.filter((k) => !treeKeys.includes(k))
  const extra = treeKeys.filter((k) => !refKeys.includes(k))
  if (missing.length || extra.length) {
    throw new Error(`Key mismatch at ${path}: missing [${missing}] extra [${extra}]`)
  }
  for (const k of refKeys) {
    const p = `${path}.${k}`
    if (typeof ref[k] === 'object' && ref[k] !== null) {
      validateTree(tree[k], ref[k], p)
    } else if (typeof tree[k] !== 'string') {
      throw new Error(`Non-string leaf at ${p}`)
    } else if (/[@{|]/.test(tree[k])) {
      throw new Error(`Forbidden vue-i18n character at ${p}: "${tree[k]}"`)
    }
  }
}

const en = JSON.parse(readFileSync(new URL('./yp800-en.json', import.meta.url), 'utf8'))
for (const k of ['__images', '__videos', '__layout']) delete en[k]

for (const [lang, tree] of [
  ['es', contentEs],
  ['de', contentDe],
  ['fr', contentFr],
]) {
  validateTree(tree, en, `$(${lang})`)
}
console.log('Validation OK: es/de/fr trees match en key structure, no forbidden characters.')

const supabase = createClient(url, serviceKey)

for (const [lang, content] of [
  ['es', contentEs],
  ['de', contentDe],
  ['fr', contentFr],
]) {
  const { error } = await supabase
    .from('landing_content')
    .upsert({ namespace: NAMESPACE, lang, content }, { onConflict: 'namespace,lang' })
  if (error) {
    console.error(`Upsert failed for lang=${lang}:`, error.message)
    process.exit(1)
  }
  console.log(`Upserted lang=${lang}, top-level keys=${Object.keys(content).length}`)
}

// Verify: list all rows for this namespace and print hero.title1 per lang.
const { data, error: verifyErr } = await supabase
  .from('landing_content')
  .select('lang,content')
  .eq('namespace', NAMESPACE)

if (verifyErr) {
  console.error('Verify query failed:', verifyErr.message)
  process.exit(1)
}

const rows = data ?? []
console.log(`Namespace ${NAMESPACE}: ${rows.length} row(s), langs = ${rows.map((r) => r.lang).sort().join(',')}`)
const titles = rows.map((r) => `${r.lang}: "${r.content?.hero?.title1 ?? '(missing)'}"`)
console.log('hero.title1 per lang:\n  ' + titles.join('\n  '))
const langs = new Set(rows.map((r) => r.lang))
const expected = ['en', 'de', 'es', 'fr']
const distinct = new Set(rows.map((r) => r.content?.hero?.title1))
if (expected.every((l) => langs.has(l)) && distinct.size === rows.length && rows.every((r) => r.content?.hero?.title1)) {
  console.log('VERIFY PASS: en,de,es,fr present, hero.title1 exists everywhere and all distinct.')
} else {
  console.error('VERIFY FAIL')
  process.exit(1)
}
