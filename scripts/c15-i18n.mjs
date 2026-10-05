/**
 * C15 落地页 landing_content 补齐 es/de/fr 三行翻译（一次性脚本）。
 * service_role 仅在本地 Node 使用，绝不进前端/VITE_*。
 *
 * 说明：DB 的 c15/en 行当前只含 __images/__layout/__videos（媒体/布局覆盖），
 * 文本基底在 src/i18n/en.json 的 c15 树（页面渲染时 deepMerge）。因此三语行的
 * 键结构与 src/i18n/en.json 的 c15 文本树完全一致（含 "0"/"1" 数字字符串键），
 * 且不含 __images/__videos/__layout（媒体有 en 行按键级回退机制）。
 * de 树复用 src/i18n/de.json 的既有完整翻译。
 *
 * 运行：node scripts/c15-i18n.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const env = readFileSync(new URL('../.env', import.meta.url), 'utf8')
const get = (k) => env.match(new RegExp(`^${k}=(.*)$`, 'm'))?.[1].trim()
const supabase = createClient(get('VITE_SUPABASE_URL'), get('SUPABASE_SERVICE_ROLE_KEY'))

const VIDEO_URL =
  'https://txgcloud.obs.cn-east-3.myhuaweicloud.com/Overseas/%E6%B5%B7%E5%A4%96%E7%8B%AC%E7%AB%8B%E7%AB%99%E5%BB%BA%E7%AB%99%E7%B4%A0%E6%9D%90/C15/C15%E6%B8%85%E6%B4%97%E7%89%87%E6%AE%B5.mp4'

// ---------------------------------------------------------------- es ----
const contentEs = {
  hero: {
    kicker: 'Limpieza aérea',
    title1: 'Limpieza aérea integral,',
    title2: 'Más segura e inteligente',
    lead:
      'El dron de limpieza Partdro C15 ofrece lavado a alta presión de 16 MPa en fachadas, muros cortina y palas de aerogeneradores — con una manguera de alta presión de 120 m y hasta 100 m de altura de trabajo, todo controlado por un solo operador.',
    ctaPrimary: 'Solicitar presupuesto',
    ctaSecondary: 'Contactar ventas',
    badgeTitle: 'Venta directa de fábrica',
    badgeText: 'Envío y soporte a todo el mundo',
    stats: { 0: '21 kg', 1: '16 MPa', 2: '100 m' },
  },
  strip: {
    0: { value: '21 kg', label: 'Peso del dron (con batería)' },
    1: { value: '16 MPa', label: 'Presión nominal' },
    2: { value: '20 L/min', label: 'Caudal nominal' },
    3: { value: '120 m', label: 'Manguera de alta presión' },
    4: { value: '100 m', label: 'Altura máxima de trabajo' },
  },
  why: {
    eyebrow: 'Por qué elegirlo',
    title: 'Diseñado para trabajos de limpieza exigentes.',
    lead: 'Seis razones por las que las empresas eligen la C15 frente a andamios y equipos de acceso por cuerda.',
    cards: {
      0: { title: 'Suministro de agua conectado', desc: 'La toma externa de agua permite una operación continua sin recargas frecuentes.' },
      1: { title: 'Limpieza de alta presión', desc: 'La presión máxima de 16 MPa elimina fácilmente la suciedad más resistente a 20 L/min.' },
      2: { title: 'Radio de acción extralargo', desc: '120 m de manguera y hasta 100 m de altura de trabajo cubren fachadas de gran superficie.' },
      3: { title: 'Operación ligera de una sola persona', desc: 'La estructura de 21 kg es fácil de transportar y pilotar por un solo operador.' },
      4: { title: 'Sistema de lavado resistente a la corrosión', desc: 'Compatible con múltiples agentes de limpieza y se mantiene como nuevo.' },
      5: { title: 'Protección con certificación IP67', desc: 'Resistente al viento, la lluvia y el polvo para un trabajo fiable en exteriores.' },
    },
  },
  designed: {
    eyebrow: 'Ingeniería',
    title: 'Ligero y flexible, fácil de operar.',
    lead: 'Una estructura compacta diseñada en torno a la realidad del trabajo en fachadas: montaje rápido, mantenimiento sencillo y fácil posicionamiento en espacios reducidos.',
    items: {
      0: { title: 'Diseño ligero', desc: '21 kg con batería incluida para una cómoda operación por una sola persona.' },
      1: { title: 'Estructura modular', desc: 'Montaje rápido y mantenimiento fácil entre trabajos.' },
      2: { title: 'Cuerpo compacto', desc: 'Operación fluida en espacios estrechos o complejos.' },
    },
  },
  output: {
    eyebrow: 'Rendimiento',
    title: 'Un rendimiento que escala.',
    bigNumber: '100 m',
    unitTitle: 'Altura máxima de trabajo',
    note: 'Cifras medidas del sistema de lavado a alta presión de la C15.',
    rows: {
      0: { label: 'Presión nominal', value: '16 MPa' },
      1: { label: 'Caudal nominal', value: '20 L/min' },
      2: { label: 'Longitud del brazo pulverizador', value: '1.6 m' },
      3: { label: 'Manguera de alta presión', value: '120 m' },
      4: { label: 'Velocidad máxima de vuelo', value: '10 m/s' },
    },
  },
  safety: {
    eyebrow: 'Seguridad',
    title: 'Visión total para operaciones más seguras.',
    lead: 'La sensorización por capas mantiene el dron a una distancia segura mientras ofrece al operador una visión clara de cada mancha.',
    cards: {
      0: { title: 'Radar de ondas milimétricas', desc: 'Detecta con precisión la distancia al edificio para mantener un posicionamiento estable.' },
      1: { title: 'Emisión FPV en tiempo real', desc: 'Hace visibles para el operador incluso las manchas de difícil acceso.' },
      2: { title: 'Posicionamiento RTK de alta precisión', desc: 'Precisión centimétrica para un control total del vuelo.' },
    },
  },
  multiangle: {
    eyebrow: 'Sobre el terreno',
    title: 'Todos los ángulos cubiertos.',
    lead: 'Desde el brazo pulverizador hasta el módulo de sensores, cada parte de la C15 está hecha para el trabajo en fachadas.',
    items: {
      0: { title: 'Frontal', desc: 'La boquilla de alta presión sigue la línea de suciedad a lo largo de la fachada.' },
      1: { title: 'Lateral', desc: 'El brazo pulverizador de 1.6 m barre una trayectoria de lavado amplia y uniforme.' },
      2: { title: 'Superior', desc: 'La manguera conectada aporta agua continua desde el suministro en tierra.' },
      3: { title: 'Detalle', desc: 'Módulos con certificación IP67 que resisten viento, lluvia y polvo.' },
    },
  },
  compare: {
    eyebrow: 'Comparativa',
    title: 'Dron frente a limpieza manual de fachadas.',
    colD15r: 'Partdro C15',
    colManual: 'Método manual',
    rows: {
      0: { label: 'Eficiencia', d15r: 'Fachadas grandes en minutos', manual: 'Lento, sección por sección' },
      1: { label: 'Coste por m²', d15r: 'Sin necesidad de andamios', manual: 'Alquiler de andamios y góndolas' },
      2: { label: 'Riesgo de seguridad', d15r: 'El operador permanece en el suelo', manual: 'Trabajadores en altura' },
      3: { label: 'Constancia de la calidad', d15r: 'Chorro estable de 16 MPa', manual: 'Varía según el equipo' },
      4: { label: 'Acceso a alturas', d15r: 'Hasta 100 m de altura de trabajo', manual: 'Limitado por el equipo' },
      5: { label: 'Tiempo de montaje', d15r: 'Minutos', manual: 'Horas de preparación' },
    },
  },
  scenarios: {
    0: { title: 'Limpieza de edificios de gran altura', desc: 'Lava fachadas y muros cortina sin góndolas ni acceso por cuerda.' },
    1: { title: 'Mantenimiento de aerogeneradores', desc: 'Limpia palas y góndolas en todo el parque eólico.' },
    2: { title: 'Limpieza de muros cortina de vidrio', desc: 'El suministro de agua conectado mantiene el chorro estable a toda altura.' },
    3: { title: 'Puntería precisa con FPV', desc: 'La cámara en tiempo real hace claramente visibles las manchas de difícil acceso.' },
  },
  video: {
    eyebrow: 'Véalo en acción',
    title: 'La C15 en acción.',
    url: VIDEO_URL,
  },
  specs: {
    eyebrow: 'Especificaciones',
    title: 'Especificaciones técnicas.',
    lead: 'Cifras clave de la plataforma de limpieza aérea C15.',
    items: {
      0: { label: 'Peso del dron (con batería)', value: '21 kg' },
      1: { label: 'Longitud del brazo pulverizador', value: '1.6 m' },
      2: { label: 'Velocidad máxima de vuelo', value: '10 m/s' },
      3: { label: 'Longitud de la manguera de alta presión', value: '120 m' },
      4: { label: 'Altura máxima de trabajo', value: '100 m' },
      5: { label: 'Capacidad de la batería', value: '20 Ah' },
      6: { label: 'Presión nominal', value: '16 MPa' },
      7: { label: 'Caudal nominal', value: '20 L/min' },
      8: { label: 'Grado de protección', value: 'IP67' },
      9: { label: 'Posicionamiento', value: 'RTK de alta precisión' },
      10: { label: 'Detección de obstáculos', value: 'Radar de ondas milimétricas' },
      11: { label: 'Conciencia situacional', value: 'Cámara FPV en tiempo real' },
      12: { label: 'Estructura', value: 'Aluminio de alta resistencia' },
      13: { label: 'Montaje', value: 'Modular, de liberación rápida' },
      14: { label: 'Suministro de agua', value: 'Toma externa mediante manguera' },
      15: { label: 'Agentes de limpieza', value: 'Compatible con varios agentes' },
      16: { label: 'Operación', value: 'Una sola persona' },
      17: { label: 'Sistema de lavado', value: 'Resistente a la corrosión' },
      18: { label: 'Aplicaciones', value: 'Fachadas y aerogeneradores' },
    },
  },
  cta: {
    eyebrow: 'Empieza ahora',
    title: '¿Listo para verla limpiar?',
    text: 'Hable con nuestro equipo sobre demos, precios y despliegue para sus edificios o parques eólicos.',
    visit: 'Volver al inicio',
  },
}

// ---------------------------------------------------------------- de ----
// 复用 src/i18n/de.json 的既有 c15 完整翻译（避免覆盖回归）
const contentDe = {
  hero: {
    kicker: 'Reinigung aus der Luft',
    title1: 'Allround-Reinigung aus der Luft,',
    title2: 'Sicherer & intelligenter',
    lead:
      'Die Partdro C15 Reinigungsdrohne liefert 16-MPa-Hochdruckreinigung für Fassaden, Glasvorhangfassaden und Rotorblätter von Windkraftanlagen — mit einem 120-m-Hochdruckschlauch und bis zu 100 m Arbeitshöhe, gesteuert von nur einer Person.',
    ctaPrimary: 'Angebot einholen',
    ctaSecondary: 'Vertrieb kontaktieren',
    badgeTitle: 'Direkt ab Werk',
    badgeText: 'Weltweiter Versand und Support',
    stats: { 0: '21 kg', 1: '16 MPa', 2: '100 m' },
  },
  strip: {
    0: { value: '21 kg', label: 'Drohnengewicht (inkl. Akku)' },
    1: { value: '16 MPa', label: 'Nenndruck' },
    2: { value: '20 L/min', label: 'Nenndurchfluss' },
    3: { value: '120 m', label: 'Hochdruckschlauch' },
    4: { value: '100 m', label: 'Max. Arbeitshöhe' },
  },
  why: {
    eyebrow: 'Ihre Vorteile',
    title: 'Gebaut für anspruchsvolle Reinigungsaufgaben.',
    lead: 'Sechs Gründe, warum Fachbetriebe die C15 statt Gerüst- und Seilzugteams wählen.',
    cards: {
      0: { title: 'Schlauchgebundene Wasserversorgung', desc: 'Externer Wasseranschluss ermöglicht Dauerbetrieb ohne häufiges Nachfüllen.' },
      1: { title: 'Hochdruckreinigung', desc: '16 MPa Maximaldruck entfernt hartnäckigen Schmutz mühelos bei 20 L/min.' },
      2: { title: 'Extra grosser Aktionsradius', desc: '120 m Schlauch und bis zu 100 m Arbeitshöhe decken grossflächige Fassaden ab.' },
      3: { title: 'Leichter Ein-Personen-Betrieb', desc: 'Die 21-kg-Zelle lässt sich von einer Person leicht transportieren und fliegen.' },
      4: { title: 'Korrosionsbeständiges Waschsystem', desc: 'Kompatibel mit mehreren Reinigungsmitteln und bleibt wie neu.' },
      5: { title: 'IP67-Schutzklasse', desc: 'Widerstandsfähig gegen Wind, Regen und Staub für zuverlässige Aussenarbeit.' },
    },
  },
  designed: {
    eyebrow: 'Engineering',
    title: 'Leicht und flexibel, einfach zu bedienen.',
    lead: 'Eine kompakte Zelle, konzipiert für die Realität der Fassadenarbeit: schnell aufgebaut, einfach zu warten, leicht in engen Bereichen zu positionieren.',
    items: {
      0: { title: 'Leichtes Design', desc: '21 kg inklusive Akku für komfortablen Ein-Personen-Betrieb.' },
      1: { title: 'Modulare Struktur', desc: 'Schnellaufbau und einfache Wartung zwischen den Einsätzen.' },
      2: { title: 'Kompakter Rumpf', desc: 'Problemlose Bedienung in engen oder komplexen Bereichen.' },
    },
  },
  output: {
    eyebrow: 'Leistung',
    title: 'Reinigungsleistung, die skaliert.',
    bigNumber: '100 m',
    unitTitle: 'Max. Arbeitshöhe',
    note: 'Gemessene Werte des C15-Hochdruckwaschsystems.',
    rows: {
      0: { label: 'Nenndruck', value: '16 MPa' },
      1: { label: 'Nenndurchfluss', value: '20 L/min' },
      2: { label: 'Sprüharmlänge', value: '1,6 m' },
      3: { label: 'Hochdruckschlauch', value: '120 m' },
      4: { label: 'Max. Fluggeschwindigkeit', value: '10 m/s' },
    },
  },
  safety: {
    eyebrow: 'Sicherheit',
    title: 'Volle Übersicht für sicherere Einsätze.',
    lead: 'Mehrschichtige Sensorik hält die Drohne auf sicherem Abstand und gibt dem Bediener eine klare Sicht auf jeden Fleck.',
    cards: {
      0: { title: 'Millimeterwellen-Radar', desc: 'Erkennt den Gebäudeabstand präzise für einen stabilen Sicherheitsabstand.' },
      1: { title: 'Echtzeit-FPV-Feed', desc: 'Macht auch schwer erreichbare Flecken für den Bediener klar sichtbar.' },
      2: { title: 'RTK-Hochpräzisionspositionierung', desc: 'Zentimetergenaue Präzision für volle Flugkontrolle.' },
    },
  },
  multiangle: {
    eyebrow: 'Im Einsatz',
    title: 'Jeder Winkel abgedeckt.',
    lead: 'Vom Sprüharm bis zum Sensorbehälter ist jedes Teil der C15 für die Fassadenarbeit gebaut.',
    items: {
      0: { title: 'Vorne', desc: 'Die Hochdruckdüse folgt der Verschmutzungslinie über die Fassade.' },
      1: { title: 'Seitlich', desc: 'Der 1,6-m-Sprüharm überstreicht eine breite, gleichmässige Waschbahn.' },
      2: { title: 'Oben', desc: 'Der Schlauch liefert kontinuierlich Wasser von der Bodenversorgung.' },
      3: { title: 'Detail', desc: 'IP67-Module widerstehen Wind, Regen und Staub.' },
    },
  },
  compare: {
    eyebrow: 'Vergleich',
    title: 'Drohne vs. manuelle Fassadenreinigung.',
    colD15r: 'Partdro C15',
    colManual: 'Manuelle Methode',
    rows: {
      0: { label: 'Effizienz', d15r: 'Grosse Fassaden in Minuten', manual: 'Langsam, Abschnitt für Abschnitt' },
      1: { label: 'Kosten pro m²', d15r: 'Kein Gerüst erforderlich', manual: 'Gerüst- und Gondelmiete' },
      2: { label: 'Sicherheitsrisiko', d15r: 'Bediener bleibt am Boden', manual: 'Arbeiter in der Höhe' },
      3: { label: 'Konstante Qualität', d15r: 'Stabiler 16-MPa-Strahl', manual: 'Je nach Team unterschiedlich' },
      4: { label: 'Erreichbare Höhen', d15r: 'Bis zu 100 m Arbeitshöhe', manual: 'Durch Ausrüstung begrenzt' },
      5: { label: 'Aufbauzeit', d15r: 'Minuten', manual: 'Stunden des Aufbaus' },
    },
  },
  scenarios: {
    0: { title: 'Hochhausreinigung', desc: 'Fassaden und Vorhangfassaden waschen ohne Gondeln oder Seilzug.' },
    1: { title: 'Windkraftanlagen-Wartung', desc: 'Rotorblätter und Gondeln im gesamten Windpark reinigen.' },
    2: { title: 'Glasvorhangfassaden-Reinigung', desc: 'Schlauchgebundene Wasserversorgung hält den Strahl in voller Höhe stabil.' },
    3: { title: 'FPV-Präzisionszielung', desc: 'Der Echtzeit-Kamerafeed macht schwer erreichbare Flecken klar sichtbar.' },
  },
  video: {
    eyebrow: 'Sehen Sie es in Aktion',
    title: 'C15 im Einsatz.',
    url: VIDEO_URL,
  },
  specs: {
    eyebrow: 'Spezifikationen',
    title: 'Technische Spezifikationen.',
    lead: 'Wichtige Kenndaten der C15 Reinigungsplattform für die Luft.',
    items: {
      0: { label: 'Drohnengewicht (inkl. Akku)', value: '21 kg' },
      1: { label: 'Sprüharmlänge', value: '1,6 m' },
      2: { label: 'Max. Fluggeschwindigkeit', value: '10 m/s' },
      3: { label: 'Hochdruckschlauchlänge', value: '120 m' },
      4: { label: 'Max. Arbeitshöhe', value: '100 m' },
      5: { label: 'Akkukapazität', value: '20 Ah' },
      6: { label: 'Nenndruck', value: '16 MPa' },
      7: { label: 'Nenndurchfluss', value: '20 L/min' },
      8: { label: 'Schutzklasse', value: 'IP67' },
      9: { label: 'Positionierung', value: 'RTK-Hochpräzision' },
      10: { label: 'Hinderniswahrnehmung', value: 'Millimeterwellen-Radar' },
      11: { label: 'Lagebewusstsein', value: 'Echtzeit-FPV-Kamera' },
      12: { label: 'Zelle', value: 'Hochfestes Aluminium' },
      13: { label: 'Montage', value: 'Modular, Schnellverschluss' },
      14: { label: 'Wasserversorgung', value: 'Schlauchgebundener Anschluss' },
      15: { label: 'Reinigungsmittel', value: 'Mehrere Typen kompatibel' },
      16: { label: 'Bedienung', value: 'Ein-Personen' },
      17: { label: 'Waschsystem', value: 'Korrosionsbeständig' },
      18: { label: 'Anwendungen', value: 'Fassaden & Windkraftanlagen' },
    },
  },
  cta: {
    eyebrow: 'Jetzt starten',
    title: 'Bereit, es in Aktion zu sehen?',
    text: 'Sprechen Sie mit unserem Team über Demos, Preise und den Einsatz für Ihre Gebäude oder Windparks.',
    visit: 'Zurück zur Startseite',
  },
}

// ---------------------------------------------------------------- fr ----
const contentFr = {
  hero: {
    kicker: 'Nettoyage aérien',
    title1: 'Le nettoyage aérien complet,',
    title2: 'Plus sûr et plus intelligent',
    lead:
      "Le drone de nettoyage Partdro C15 assure un lavage haute pression de 16 MPa sur les façades, murs-rideaux et pales d'éoliennes — avec un flexible haute pression de 120 m et jusqu'à 100 m de hauteur de travail, le tout piloté par une seule personne.",
    ctaPrimary: 'Demander un devis',
    ctaSecondary: 'Nous contacter',
    badgeTitle: 'Vente directe usine',
    badgeText: 'Expédition et assistance dans le monde entier',
    stats: { 0: '21 kg', 1: '16 MPa', 2: '100 m' },
  },
  strip: {
    0: { value: '21 kg', label: 'Poids du drone (batterie incluse)' },
    1: { value: '16 MPa', label: 'Pression nominale' },
    2: { value: '20 L/min', label: 'Débit nominal' },
    3: { value: '120 m', label: 'Flexible haute pression' },
    4: { value: '100 m', label: 'Hauteur de travail maximale' },
  },
  why: {
    eyebrow: 'Pourquoi le choisir',
    title: 'Conçu pour les travaux de nettoyage exigeants.',
    lead: "Six raisons pour lesquelles les entreprises choisissent la C15 plutôt que les échafaudages et les équipes d'accès sur cordes.",
    cards: {
      0: { title: 'Alimentation en eau par flexible', desc: 'Le raccordement extérieur à eau permet un fonctionnement continu sans remplissages fréquents.' },
      1: { title: 'Nettoyage haute pression', desc: 'Une pression maximale de 16 MPa élimine facilement les saletés tenaces à 20 L/min.' },
      2: { title: 'Rayon d\u2019action extra-long', desc: '120 m de flexible et jusqu\u2019à 100 m de hauteur de travail pour couvrir les grandes façades.' },
      3: { title: 'Fonctionnement léger à une seule personne', desc: 'Sa structure de 21 kg est facile à transporter et à piloter par un seul opérateur.' },
      4: { title: 'Système de lavage résistant à la corrosion', desc: 'Compatible avec plusieurs agents de nettoyage, il reste comme neuf.' },
      5: { title: 'Protection certifiée IP67', desc: 'Résiste au vent, à la pluie et à la poussière pour un travail fiable en extérieur.' },
    },
  },
  designed: {
    eyebrow: 'Ingénierie',
    title: 'Léger et flexible, facile à piloter.',
    lead: 'Une structure compacte pensée pour la réalité du travail sur façade : montage rapide, entretien simple, positionnement facile dans les espaces restreints.',
    items: {
      0: { title: 'Design léger', desc: '21 kg batterie incluse pour un confort d\u2019utilisation à une seule personne.' },
      1: { title: 'Structure modulaire', desc: 'Montage rapide et entretien facile entre les chantiers.' },
      2: { title: 'Corps compact', desc: 'Manœuvre aisée dans les espaces étroits ou complexes.' },
    },
  },
  output: {
    eyebrow: 'Performance',
    title: 'Un rendement qui passe à l\u2019échelle.',
    bigNumber: '100 m',
    unitTitle: 'Hauteur de travail maximale',
    note: 'Chiffres mesurés du système de lavage haute pression de la C15.',
    rows: {
      0: { label: 'Pression nominale', value: '16 MPa' },
      1: { label: 'Débit nominal', value: '20 L/min' },
      2: { label: 'Longueur du bras de pulvérisation', value: '1.6 m' },
      3: { label: 'Flexible haute pression', value: '120 m' },
      4: { label: 'Vitesse de vol maximale', value: '10 m/s' },
    },
  },
  safety: {
    eyebrow: 'Sécurité',
    title: 'Une vision totale pour des opérations plus sûres.',
    lead: 'La détection multicouche maintient le drone à distance de sécurité tout en offrant à l\u2019opérateur une vue claire de chaque salissure.',
    cards: {
      0: { title: 'Radar à ondes millimétriques', desc: 'Détecte avec précision la distance au bâtiment pour un maintien en position stable.' },
      1: { title: 'Flux FPV en temps réel', desc: 'Rend visibles pour l\u2019opérateur même les salissures difficiles d\u2019accès.' },
      2: { title: 'Positionnement RTK haute précision', desc: 'Une précision centimétrique pour un contrôle total du vol.' },
    },
  },
  multiangle: {
    eyebrow: 'Sur le terrain',
    title: 'Tous les angles couverts.',
    lead: 'Du bras de pulvérisation au module de capteurs, chaque élément de la C15 est conçu pour le travail sur façade.',
    items: {
      0: { title: 'Face', desc: 'La buse haute pression suit la ligne de salissure le long de la façade.' },
      1: { title: 'Profil', desc: 'Le bras de pulvérisation de 1.6 m balaye une large trajectoire de lavage uniforme.' },
      2: { title: 'Dessus', desc: 'Le flexible raccordé alimente en eau en continu depuis le sol.' },
      3: { title: 'Détail', desc: 'Les modules certifiés IP67 résistent au vent, à la pluie et à la poussière.' },
    },
  },
  compare: {
    eyebrow: 'Comparatif',
    title: 'Drone contre nettoyage manuel de façade.',
    colD15r: 'Partdro C15',
    colManual: 'Méthode manuelle',
    rows: {
      0: { label: 'Efficacité', d15r: 'Grandes façades en quelques minutes', manual: 'Lent, section par section' },
      1: { label: 'Coût par m²', d15r: 'Aucun échafaudage requis', manual: 'Location d\u2019échafaudages et de nacelles' },
      2: { label: 'Risque pour la sécurité', d15r: 'L\u2019opérateur reste au sol', manual: 'Travailleurs en hauteur' },
      3: { label: 'Régularité de la qualité', d15r: 'Jet stable de 16 MPa', manual: 'Variable selon l\u2019équipe' },
      4: { label: 'Accès en hauteur', d15r: 'Jusqu\u2019à 100 m de hauteur de travail', manual: 'Limité par l\u2019équipement' },
      5: { label: 'Temps d\u2019installation', d15r: 'Quelques minutes', manual: 'Des heures de montage' },
    },
  },
  scenarios: {
    0: { title: 'Nettoyage de bâtiments de grande hauteur', desc: 'Lavez façades et murs-rideaux sans nacelles ni accès sur cordes.' },
    1: { title: 'Maintenance des éoliennes', desc: 'Nettoyez pales et nacelles sur l\u2019ensemble du parc éolien.' },
    2: { title: 'Nettoyage des murs-rideaux en verre', desc: 'L\u2019alimentation en eau par flexible maintient le jet stable à pleine hauteur.' },
    3: { title: 'Ciblage de précision par FPV', desc: 'Le flux caméra en temps réel rend clairement visibles les salissures difficiles d\u2019accès.' },
  },
  video: {
    eyebrow: 'Voyez-le à l\u2019œuvre',
    title: 'La C15 en action.',
    url: VIDEO_URL,
  },
  specs: {
    eyebrow: 'Caractéristiques',
    title: 'Caractéristiques techniques.',
    lead: 'Chiffres clés de la plateforme de nettoyage aérien C15.',
    items: {
      0: { label: 'Poids du drone (batterie incluse)', value: '21 kg' },
      1: { label: 'Longueur du bras de pulvérisation', value: '1.6 m' },
      2: { label: 'Vitesse de vol maximale', value: '10 m/s' },
      3: { label: 'Longueur du flexible haute pression', value: '120 m' },
      4: { label: 'Hauteur de travail maximale', value: '100 m' },
      5: { label: 'Capacité de la batterie', value: '20 Ah' },
      6: { label: 'Pression nominale', value: '16 MPa' },
      7: { label: 'Débit nominal', value: '20 L/min' },
      8: { label: 'Indice de protection', value: 'IP67' },
      9: { label: 'Positionnement', value: 'RTK haute précision' },
      10: { label: 'Détection d\u2019obstacles', value: 'Radar à ondes millimétriques' },
      11: { label: 'Connaissance de la situation', value: 'Caméra FPV en temps réel' },
      12: { label: 'Structure', value: 'Aluminium haute résistance' },
      13: { label: 'Assemblage', value: 'Modulaire, à libération rapide' },
      14: { label: 'Alimentation en eau', value: 'Raccordement extérieur par flexible' },
      15: { label: 'Agents de nettoyage', value: 'Compatible multi-agents' },
      16: { label: 'Exploitation', value: 'Une seule personne' },
      17: { label: 'Système de lavage', value: 'Résistant à la corrosion' },
      18: { label: 'Applications', value: 'Façades et éoliennes' },
    },
  },
  cta: {
    eyebrow: 'Commencer',
    title: 'Prêt à la voir à l\u2019œuvre ?',
    text: 'Parlez à notre équipe des démonstrations, des tarifs et du déploiement pour vos bâtiments ou parcs éoliens.',
    visit: "Retour à l'accueil",
  },
}

// ------------------------------------------------------ 校验 + 写入 ----
const enStatic = JSON.parse(readFileSync(new URL('../src/i18n/en.json', import.meta.url), 'utf8')).c15

function keyPaths(obj, prefix = '') {
  const out = new Set()
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k
    if (v !== null && typeof v === 'object') {
      out.add(p + '.*')
      for (const sub of keyPaths(v, p)) out.add(sub)
    } else {
      out.add(p)
    }
  }
  return out
}

function fail(msg) {
  console.error('VALIDATION FAILED:', msg)
  process.exit(1)
}

const forbidden = /[@{}|]/
function checkForbidden(tree, lang) {
  for (const [k, v] of Object.entries(tree)) {
    if (typeof v === 'string') {
      if (forbidden.test(v)) fail(`${lang} ${k} 含 vue-i18n 特殊字符 (@ { } |): ${v}`)
    } else if (v !== null && typeof v === 'object') {
      checkForbidden(v, `${lang}.${k}`)
    }
  }
}

const rows = [
  ['es', contentEs],
  ['de', contentDe],
  ['fr', contentFr],
]

for (const [lang, tree] of rows) {
  // 不含特殊键
  for (const bad of ['__images', '__videos', '__layout']) {
    if (bad in tree) fail(`${lang} 行不得包含 ${bad}`)
  }
  // 键结构与 en 完全一致
  const enKeys = keyPaths(enStatic)
  const langKeys = keyPaths(tree)
  const missing = [...enKeys].filter((k) => !k.endsWith('.*') && !langKeys.has(k))
  const extra = [...langKeys].filter((k) => !k.endsWith('.*') && !enKeys.has(k))
  if (missing.length) fail(`${lang} 缺少键: ${missing.join(', ')}`)
  if (extra.length) fail(`${lang} 多出键: ${extra.join(', ')}`)
  checkForbidden(tree, lang)
  console.log(`${lang}: ${Object.keys(tree).length} top-level keys, structure OK, no forbidden chars`)
}

for (const [lang, content] of rows) {
  const { error } = await supabase
    .from('landing_content')
    .upsert({ namespace: 'c15', lang, content }, { onConflict: 'namespace,lang' })
  if (error) {
    console.error(`UPSERT FAILED (${lang}):`, error.message)
    process.exit(1)
  }
  console.log(`upserted: c15/${lang}`)
}

// -------------------------------------------------------- 验证 ----
// 注：c15 的 en 行是媒体/布局覆盖行（hero 等文本基底在 src/i18n/en.json），
// 故 en 的 hero.title1 取静态 en 树，de/es/fr 取 DB 行。
const { data, error: qerr } = await supabase
  .from('landing_content')
  .select('lang,content')
  .eq('namespace', 'c15')
if (qerr) {
  console.error('VERIFY QUERY FAILED:', qerr.message)
  process.exit(1)
}
const langs = data.map((r) => r.lang).sort()
console.log('c15 landing_content rows:', langs.join(','))
const titles = { en: enStatic.hero.title1 }
for (const r of data) if (r.lang !== 'en') titles[r.lang] = r.content?.hero?.title1 ?? '(missing)'
for (const [lang, t] of Object.entries(titles)) console.log(`  ${lang}.hero.title1 = ${t}`)
const distinct = new Set(Object.values(titles)).size === langs.length
if (!(langs.length === 4 && langs.join(',') === 'de,en,es,fr' && distinct && !Object.values(titles).includes('(missing)'))) {
  console.error('VERIFICATION FAILED')
  process.exit(1)
}
console.log('VERIFIED: 4 rows (de,en,es,fr), hero.title1 present and distinct in every language')
