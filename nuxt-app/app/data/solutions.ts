// 商业意图 hub 页内容（/solutions/*）。
//
// 为什么单独建 hub：GSC 里农业信息型博客有展示但排名 47–90、几乎 0 点击，
// 而 "facade cleaning drone" / "solar panel cleaning drone" / "heavy lift cargo drone"
// 这类商业查询没有可承接的产品集群页。hub 用真实规格 + 应用 + FAQ 承接这些意图，
// 并把内链收敛到 D15R/C15/D50R/C500/SL80/Y160/YP800。
//
// 文案约束：只写产品页已有的事实（压力/流量/载荷/航程/软管长度），
// 不编造价格、节水比例、客户数量或认证。价格一律引导到询价。
import type { Lang } from '../types'

export interface SolutionOutcome {
  value: string
  label: string
  desc: string
}

export interface SolutionApplication {
  title: string
  desc: string
}

export interface SolutionFaq {
  q: string
  a: string
}

export interface SolutionCopy {
  metaTitle: string
  metaDescription: string
  eyebrow: string
  title: string
  lead: string
  heroImage: string
  productSlugs: string[]
  outcomes: SolutionOutcome[]
  applications: SolutionApplication[]
  faq: SolutionFaq[]
  cta: { title: string; body: string; button: string }
}

export interface SolutionUi {
  browseSolutions: string
  products: string
  applications: string
  faq: string
  quote: string
  viewProduct: string
  home: string
  productsCrumb: string
  solutionsCrumb: string
}

export const SOLUTION_SLUGS = [
  'facade-cleaning',
  'solar-panel-cleaning',
  'heavy-lift-logistics',
] as const

export type SolutionSlug = (typeof SOLUTION_SLUGS)[number]

export const SOLUTION_UI: Record<Lang, SolutionUi> = {
  en: {
    browseSolutions: 'Browse by application',
    products: 'Recommended products',
    applications: 'Typical applications',
    faq: 'Frequently asked questions',
    quote: 'Request a quote',
    viewProduct: 'View product',
    home: 'Home',
    productsCrumb: 'Products',
    solutionsCrumb: 'Solutions',
  },
  es: {
    browseSolutions: 'Explorar por aplicación',
    products: 'Productos recomendados',
    applications: 'Aplicaciones típicas',
    faq: 'Preguntas frecuentes',
    quote: 'Solicitar cotización',
    viewProduct: 'Ver producto',
    home: 'Inicio',
    productsCrumb: 'Productos',
    solutionsCrumb: 'Soluciones',
  },
  de: {
    browseSolutions: 'Nach Anwendung',
    products: 'Empfohlene Produkte',
    applications: 'Typische Anwendungen',
    faq: 'Häufige Fragen',
    quote: 'Angebot anfordern',
    viewProduct: 'Produkt ansehen',
    home: 'Startseite',
    productsCrumb: 'Produkte',
    solutionsCrumb: 'Lösungen',
  },
  fr: {
    browseSolutions: 'Par application',
    products: 'Produits recommandés',
    applications: 'Applications typiques',
    faq: 'Questions fréquentes',
    quote: 'Demander un devis',
    viewProduct: 'Voir le produit',
    home: 'Accueil',
    productsCrumb: 'Produits',
    solutionsCrumb: 'Solutions',
  },
}

export const SOLUTIONS: Record<SolutionSlug, Record<Lang, SolutionCopy>> = {
  'facade-cleaning': {
    en: {
      metaTitle: 'Facade & Window Cleaning Drones | D15R & C15 | Partdro',
      metaDescription:
        'Tethered drone cleaning for glass facades, curtain walls, stadiums and wind turbine blades. Up to 20 MPa, 1,000 m²/h and 100 m working height. No scaffolding.',
      eyebrow: 'Facade & window cleaning',
      title: 'Clean high-rise facades without scaffolding or rope access',
      lead:
        'Partdro tethered cleaning drones wash glass curtain walls, windows, stadium exteriors and wind turbine blades while the operator stays on the ground. High-pressure water, one operator, no working-at-height crew.',
      heroImage: '/d15r/images/page001_img001.png',
      productSlugs: ['d15r', 'c15'],
      outcomes: [
        {
          value: '20 MPa',
          label: 'High-pressure washing',
          desc: 'D15R delivers up to 20 MPa; C15 delivers 16 MPa for facades, glass and wind blades.',
        },
        {
          value: '1,000 m²/h',
          label: 'Cleaning output',
          desc: 'D15R covers up to 1,000 m² per hour on large facade areas.',
        },
        {
          value: '100 m',
          label: 'Working height',
          desc: 'D15R uses a 100 m hose; C15 reaches up to 100 m with a 120 m hose.',
        },
      ],
      applications: [
        { title: 'Glass curtain walls', desc: 'High-rise office and commercial facades.' },
        { title: 'Windows and stadium exteriors', desc: 'Difficult elevations without rope access.' },
        { title: 'Wind turbine blades', desc: 'C15 high-pressure washing at height.' },
        { title: 'Building maintenance', desc: 'Recurring cleaning for facility teams and contractors.' },
      ],
      faq: [
        {
          q: 'What can a facade cleaning drone clean?',
          a: 'Glass curtain walls, windows, metal and painted facades, stadium exteriors and, with the C15, wind turbine blades. Surface suitability is confirmed from your building details before quoting.',
        },
        {
          q: 'How high can it reach?',
          a: 'The D15R uses a 100 m hose and the C15 a 120 m hose with up to 100 m working height. Reach depends on building access, wind and the chosen configuration.',
        },
        {
          q: 'Does it replace scaffolding or rope access?',
          a: 'The operator stays on the ground and the drone is tethered to a water supply, so routine facade washing does not require scaffolding or rope-access crews.',
        },
        {
          q: 'Which model should I choose?',
          a: 'D15R for large facades where output and 20 MPa pressure matter; C15 for higher reach and wind turbine blades with a 120 m hose.',
        },
        {
          q: 'Do you ship internationally?',
          a: 'Yes. Quotes include configuration, shipping, training and spare parts. Lithium batteries ship separately under dangerous-goods rules; local import and flight approvals remain the buyer’s responsibility.',
        },
      ],
      cta: {
        title: 'Send your building details',
        body: 'Share height, area, surface type and location. We will recommend D15R or C15 and send a configuration quote.',
        button: 'Request a quote',
      },
    },
    es: {
      metaTitle: 'Drones de limpieza de fachadas y ventanas | D15R y C15 | Partdro',
      metaDescription:
        'Limpieza con dron para fachadas de vidrio, muros cortina, estadios y palas de aerogeneradores. Hasta 20 MPa, 1.000 m²/h y 100 m de altura. Sin andamios.',
      eyebrow: 'Limpieza de fachadas y ventanas',
      title: 'Limpie fachadas de gran altura sin andamios ni trabajos verticales',
      lead:
        'Los drones de limpieza cautivos de Partdro lavan muros cortina de vidrio, ventanas, exteriores de estadios y palas de aerogeneradores mientras el operador permanece en el suelo. Agua a alta presión, un solo operador y sin equipos de trabajo en altura.',
      heroImage: '/d15r/images/page001_img001.png',
      productSlugs: ['d15r', 'c15'],
      outcomes: [
        {
          value: '20 MPa',
          label: 'Lavado a alta presión',
          desc: 'El D15R alcanza 20 MPa; el C15 ofrece 16 MPa para fachadas, vidrio y palas.',
        },
        {
          value: '1.000 m²/h',
          label: 'Rendimiento',
          desc: 'El D15R cubre hasta 1.000 m² por hora en grandes fachadas.',
        },
        {
          value: '100 m',
          label: 'Altura de trabajo',
          desc: 'El D15R usa una manguera de 100 m; el C15 llega hasta 100 m con 120 m de manguera.',
        },
      ],
      applications: [
        { title: 'Muros cortina de vidrio', desc: 'Fachadas de oficinas y edificios comerciales.' },
        { title: 'Ventanas y exteriores de estadios', desc: 'Alturas difíciles sin trabajos verticales.' },
        { title: 'Palas de aerogeneradores', desc: 'Lavado a alta presión con el C15.' },
        { title: 'Mantenimiento de edificios', desc: 'Limpieza recurrente para facility management y contratistas.' },
      ],
      faq: [
        {
          q: '¿Qué puede limpiar un dron de fachadas?',
          a: 'Muros cortina de vidrio, ventanas, fachadas metálicas y pintadas, exteriores de estadios y, con el C15, palas de aerogeneradores. La idoneidad de la superficie se confirma con los datos del edificio antes de cotizar.',
        },
        {
          q: '¿Hasta qué altura llega?',
          a: 'El D15R usa una manguera de 100 m y el C15 una de 120 m con hasta 100 m de altura de trabajo. El alcance depende del acceso al edificio, el viento y la configuración elegida.',
        },
        {
          q: '¿Sustituye a los andamios o al trabajo vertical?',
          a: 'El operador permanece en el suelo y el dron está conectado a un suministro de agua, por lo que la limpieza habitual de fachadas no requiere andamios ni equipos de trabajo vertical.',
        },
        {
          q: '¿Qué modelo debo elegir?',
          a: 'D15R para grandes fachadas donde importan el rendimiento y los 20 MPa; C15 para mayor alcance y palas de aerogeneradores con manguera de 120 m.',
        },
        {
          q: '¿Envían a otros países?',
          a: 'Sí. La cotización incluye configuración, envío, formación y repuestos. Las baterías de litio se envían por separado según la normativa de mercancías peligrosas; la importación y los permisos de vuelo locales son responsabilidad del comprador.',
        },
      ],
      cta: {
        title: 'Envíenos los datos de su edificio',
        body: 'Indique altura, superficie, tipo de fachada y ubicación. Le recomendaremos D15R o C15 y enviaremos una cotización de configuración.',
        button: 'Solicitar cotización',
      },
    },
    de: {
      metaTitle: 'Fassaden- und Fensterreinigungsdrohnen | D15R & C15 | Partdro',
      metaDescription:
        'Drohnenreinigung für Glasfassaden, Vorhangfassaden, Stadien und Rotorblätter. Bis 20 MPa, 1.000 m²/h und 100 m Arbeitshöhe. Ohne Gerüst.',
      eyebrow: 'Fassaden- und Fensterreinigung',
      title: 'Hochhäuser ohne Gerüst oder Seilzugang reinigen',
      lead:
        'Die gefesselten Reinigungsdrohnen von Partdro waschen Glasfassaden, Fenster, Stadionaußenhüllen und Rotorblätter, während der Bediener am Boden bleibt. Hochdruckwasser, eine Person, kein Höhenarbeitsteam.',
      heroImage: '/d15r/images/page001_img001.png',
      productSlugs: ['d15r', 'c15'],
      outcomes: [
        {
          value: '20 MPa',
          label: 'Hochdruckreinigung',
          desc: 'D15R liefert bis zu 20 MPa; C15 liefert 16 MPa für Fassaden, Glas und Rotorblätter.',
        },
        {
          value: '1.000 m²/h',
          label: 'Reinigungsleistung',
          desc: 'D15R schafft auf großen Fassadenflächen bis zu 1.000 m² pro Stunde.',
        },
        {
          value: '100 m',
          label: 'Arbeitshöhe',
          desc: 'D15R nutzt einen 100-m-Schlauch; C15 erreicht mit einem 120-m-Schlauch bis zu 100 m.',
        },
      ],
      applications: [
        { title: 'Glasvorhangfassaden', desc: 'Büro- und Gewerbefassaden in großer Höhe.' },
        { title: 'Fenster und Stadionaußenhüllen', desc: 'Schwierige Höhen ohne Seilzugang.' },
        { title: 'Rotorblätter', desc: 'Hochdruckreinigung mit dem C15.' },
        { title: 'Gebäudewartung', desc: 'Wiederkehrende Reinigung für Facility-Teams und Dienstleister.' },
      ],
      faq: [
        {
          q: 'Was kann eine Fassadenreinigungsdrohne reinigen?',
          a: 'Glasvorhangfassaden, Fenster, Metall- und Lackfassaden, Stadionaußenhüllen und mit dem C15 Rotorblätter. Die Eignung der Oberfläche wird anhand Ihrer Gebäudedaten vor dem Angebot geprüft.',
        },
        {
          q: 'Wie hoch reicht die Drohne?',
          a: 'Der D15R nutzt einen 100-m-Schlauch, der C15 einen 120-m-Schlauch mit bis zu 100 m Arbeitshöhe. Die Reichweite hängt von Gebäudezugang, Wind und Konfiguration ab.',
        },
        {
          q: 'Ersetzt das Gerüst oder Seilzugang?',
          a: 'Der Bediener bleibt am Boden und die Drohne ist an eine Wasserversorgung angeschlossen. Für die routinemäßige Fassadenreinigung sind daher weder Gerüst noch Seilzugangsteams erforderlich.',
        },
        {
          q: 'Welches Modell soll ich wählen?',
          a: 'D15R für große Fassaden, bei denen Leistung und 20 MPa zählen; C15 für größere Reichweite und Rotorblätter mit 120-m-Schlauch.',
        },
        {
          q: 'Liefern Sie international?',
          a: 'Ja. Angebote umfassen Konfiguration, Versand, Schulung und Ersatzteile. Lithiumbatterien werden gemäß Gefahrgutvorschriften separat versandt; lokale Einfuhr- und Fluggenehmigungen liegen in der Verantwortung des Käufers.',
        },
      ],
      cta: {
        title: 'Senden Sie uns Ihre Gebäudedaten',
        body: 'Nennen Sie Höhe, Fläche, Fassadentyp und Standort. Wir empfehlen D15R oder C15 und senden ein Konfigurationsangebot.',
        button: 'Angebot anfordern',
      },
    },
    fr: {
      metaTitle: 'Drones de nettoyage de façades et vitres | D15R & C15 | Partdro',
      metaDescription:
        'Nettoyage par drone des façades vitrées, murs-rideaux, stades et pales d’éoliennes. Jusqu’à 20 MPa, 1 000 m²/h et 100 m de hauteur. Sans échafaudage.',
      eyebrow: 'Nettoyage de façades et vitres',
      title: 'Nettoyez les façades en hauteur sans échafaudage ni cordiste',
      lead:
        'Les drones de nettoyage captifs Partdro lavent les murs-rideaux vitrés, les vitres, les façades de stades et les pales d’éoliennes pendant que l’opérateur reste au sol. Eau haute pression, un seul opérateur, aucune équipe de travail en hauteur.',
      heroImage: '/d15r/images/page001_img001.png',
      productSlugs: ['d15r', 'c15'],
      outcomes: [
        {
          value: '20 MPa',
          label: 'Lavage haute pression',
          desc: 'Le D15R atteint 20 MPa ; le C15 délivre 16 MPa pour les façades, le verre et les pales.',
        },
        {
          value: '1 000 m²/h',
          label: 'Rendement',
          desc: 'Le D15R couvre jusqu’à 1 000 m² par heure sur les grandes façades.',
        },
        {
          value: '100 m',
          label: 'Hauteur de travail',
          desc: 'Le D15R utilise un flexible de 100 m ; le C15 atteint 100 m avec un flexible de 120 m.',
        },
      ],
      applications: [
        { title: 'Murs-rideaux vitrés', desc: 'Façades de bureaux et de bâtiments commerciaux.' },
        { title: 'Vitres et façades de stades', desc: 'Hauteurs difficiles sans cordistes.' },
        { title: 'Pales d’éoliennes', desc: 'Lavage haute pression avec le C15.' },
        { title: 'Maintenance des bâtiments', desc: 'Nettoyage récurrent pour les équipes techniques et les prestataires.' },
      ],
      faq: [
        {
          q: 'Que peut nettoyer un drone de façade ?',
          a: 'Les murs-rideaux vitrés, les vitres, les façades métalliques et peintes, les façades de stades et, avec le C15, les pales d’éoliennes. La compatibilité de la surface est confirmée à partir des données du bâtiment avant le devis.',
        },
        {
          q: 'Jusqu’à quelle hauteur peut-il monter ?',
          a: 'Le D15R utilise un flexible de 100 m et le C15 un flexible de 120 m avec jusqu’à 100 m de hauteur de travail. La portée dépend de l’accès au bâtiment, du vent et de la configuration choisie.',
        },
        {
          q: 'Remplace-t-il l’échafaudage ou le cordiste ?',
          a: 'L’opérateur reste au sol et le drone est relié à une alimentation en eau. Le nettoyage courant des façades ne nécessite donc ni échafaudage ni équipe de cordistes.',
        },
        {
          q: 'Quel modèle choisir ?',
          a: 'Le D15R pour les grandes façades où le rendement et les 20 MPa comptent ; le C15 pour une portée plus élevée et les pales d’éoliennes avec un flexible de 120 m.',
        },
        {
          q: 'Livrez-vous à l’international ?',
          a: 'Oui. Les devis incluent la configuration, le transport, la formation et les pièces de rechange. Les batteries lithium sont expédiées séparément selon la réglementation sur les marchandises dangereuses ; l’importation et les autorisations de vol locales restent à la charge de l’acheteur.',
        },
      ],
      cta: {
        title: 'Envoyez-nous les données de votre bâtiment',
        body: 'Indiquez la hauteur, la surface, le type de façade et la localisation. Nous recommanderons le D15R ou le C15 et enverrons un devis de configuration.',
        button: 'Demander un devis',
      },
    },
  },

  'solar-panel-cleaning': {
    en: {
      metaTitle: 'Solar Panel Cleaning Drone | D50R Photovoltaic Cleaning | Partdro',
      metaDescription:
        'Autonomous solar panel cleaning drone with a 50 L tank, dual RTK positioning and route planning for utility-scale and rooftop PV plants.',
      eyebrow: 'Solar panel cleaning',
      title: 'Clean solar arrays without sending crews onto the roof',
      lead:
        'The D50R combines a 50 L water tank, dual RTK positioning and automated route planning to clean photovoltaic arrays. For mixed sites, the D15R adds high-pressure washing for facades and solar panels.',
      heroImage: '/images/d50r/hero.jpg',
      productSlugs: ['d50r', 'd15r'],
      outcomes: [
        {
          value: '50 L',
          label: 'Water tank',
          desc: 'On-board tank for continuous cleaning passes across panel rows.',
        },
        {
          value: 'Dual RTK',
          label: 'Centimetre-level positioning',
          desc: 'Keeps the drone aligned with panel rows during automated routes.',
        },
        {
          value: '8–10 MPa',
          label: 'High-pressure nozzles',
          desc: 'Lifts dust and soiling without manual work at height.',
        },
        {
          value: 'Automated',
          label: 'Route planning',
          desc: 'Repeatable coverage for large photovoltaic plants.',
        },
      ],
      applications: [
        { title: 'Utility-scale PV plants', desc: 'Large ground-mounted arrays with repeatable routes.' },
        { title: 'Industrial and rooftop solar', desc: 'Commercial roofs where manual access is slow or unsafe.' },
        { title: 'Dusty and agricultural regions', desc: 'Frequent soiling from dust, pollen and crop work.' },
        { title: 'O&M contractors', desc: 'Scheduled cleaning as part of PV maintenance contracts.' },
      ],
      faq: [
        {
          q: 'What does the D50R clean?',
          a: 'Photovoltaic panels on ground-mounted and rooftop arrays. The D15R is the high-pressure option for mixed sites that also include facades or other surfaces.',
        },
        {
          q: 'Does it need a water supply?',
          a: 'The D50R carries a 50 L tank and is refilled from a ground vehicle or a fixed water point. Consumption depends on panel soiling, cleaning speed and the selected nozzle set.',
        },
        {
          q: 'Can it handle large solar farms?',
          a: 'Yes. Automated route planning and dual RTK positioning are designed for large PV plants; the practical daily area depends on layout, water logistics, wind and panel access.',
        },
        {
          q: 'Could high pressure damage the panels?',
          a: 'The D50R uses 8–10 MPa nozzles for photovoltaic cleaning. We confirm the nozzle set and cleaning procedure for your panel type and soiling before delivery.',
        },
        {
          q: 'Is training included?',
          a: 'Commissioning and operator training are included in the quote. Local import, flight permissions and site safety rules remain the buyer’s responsibility.',
        },
      ],
      cta: {
        title: 'Plan a solar cleaning route',
        body: 'Tell us the array size, panel layout, water access and location. We will recommend D50R or D15R and send a configuration quote.',
        button: 'Request a quote',
      },
    },
    es: {
      metaTitle: 'Dron de limpieza de paneles solares | D50R fotovoltaico | Partdro',
      metaDescription:
        'Dron autónomo de limpieza de paneles solares con depósito de 50 L, doble RTK y planificación de rutas para plantas fotovoltaicas utilities y cubiertas.',
      eyebrow: 'Limpieza de paneles solares',
      title: 'Limpie los paneles solares sin enviar equipos a la cubierta',
      lead:
        'El D50R combina un depósito de 50 L, posicionamiento RTK dual y planificación automática de rutas para limpiar parques fotovoltaicos. Para instalaciones mixtas, el D15R añade lavado a alta presión para fachadas y paneles.',
      heroImage: '/images/d50r/hero.jpg',
      productSlugs: ['d50r', 'd15r'],
      outcomes: [
        {
          value: '50 L',
          label: 'Depósito de agua',
          desc: 'Depósito a bordo para pasadas continuas por las filas de paneles.',
        },
        {
          value: 'RTK dual',
          label: 'Posicionamiento centimétrico',
          desc: 'Mantiene el dron alineado con las filas durante las rutas automáticas.',
        },
        {
          value: '8–10 MPa',
          label: 'Boquillas de alta presión',
          desc: 'Retira polvo y suciedad sin trabajos manuales en altura.',
        },
        {
          value: 'Automático',
          label: 'Planificación de rutas',
          desc: 'Cobertura repetible en grandes plantas fotovoltaicas.',
        },
      ],
      applications: [
        { title: 'Plantas fotovoltaicas utility-scale', desc: 'Grandes instalaciones en suelo con rutas repetibles.' },
        { title: 'Solar industrial y en cubierta', desc: 'Cubiertas comerciales donde el acceso manual es lento o inseguro.' },
        { title: 'Zonas polvorientas y agrícolas', desc: 'Suciedad frecuente por polvo, polen y labores agrícolas.' },
        { title: 'Contratistas O&M', desc: 'Limpieza programada dentro de contratos de mantenimiento fotovoltaico.' },
      ],
      faq: [
        {
          q: '¿Qué limpia el D50R?',
          a: 'Paneles fotovoltaicos en instalaciones en suelo y en cubierta. El D15R es la opción de alta presión para instalaciones mixtas que también incluyen fachadas u otras superficies.',
        },
        {
          q: '¿Necesita suministro de agua?',
          a: 'El D50R lleva un depósito de 50 L que se rellena desde un vehículo o un punto de agua fijo. El consumo depende de la suciedad, la velocidad de limpieza y el juego de boquillas.',
        },
        {
          q: '¿Puede trabajar en grandes plantas solares?',
          a: 'Sí. La planificación automática y el RTK dual están pensados para grandes plantas fotovoltaicas; la superficie diaria práctica depende del layout, la logística de agua, el viento y el acceso a los paneles.',
        },
        {
          q: '¿La alta presión puede dañar los paneles?',
          a: 'El D50R utiliza boquillas de 8–10 MPa para limpieza fotovoltaica. Confirmamos el juego de boquillas y el procedimiento según el tipo de panel y la suciedad antes de la entrega.',
        },
        {
          q: '¿Incluye formación?',
          a: 'La puesta en marcha y la formación de operadores están incluidas en la cotización. La importación, los permisos de vuelo y las normas de seguridad locales son responsabilidad del comprador.',
        },
      ],
      cta: {
        title: 'Planifique una ruta de limpieza solar',
        body: 'Indique el tamaño de la planta, el layout de los paneles, el acceso al agua y la ubicación. Le recomendaremos D50R o D15R y enviaremos una cotización.',
        button: 'Solicitar cotización',
      },
    },
    de: {
      metaTitle: 'Solarmodul-Reinigungsdrohne | D50R Photovoltaik | Partdro',
      metaDescription:
        'Autonome Reinigungsdrohne für Solarmodule mit 50-L-Tank, dualem RTK und Routenplanung für große PV-Anlagen und Dachflächen.',
      eyebrow: 'Solarmodulreinigung',
      title: 'Solarmodule reinigen, ohne Teams aufs Dach zu schicken',
      lead:
        'Die D50R kombiniert einen 50-L-Wassertank, duale RTK-Positionierung und automatische Routenplanung für die Reinigung von Photovoltaikflächen. Für gemischte Standorte ergänzt die D15R die Hochdruckreinigung von Fassaden und Modulen.',
      heroImage: '/images/d50r/hero.jpg',
      productSlugs: ['d50r', 'd15r'],
      outcomes: [
        {
          value: '50 L',
          label: 'Wassertank',
          desc: 'Bordtank für kontinuierliche Reinigungsbahnen über die Modulreihen.',
        },
        {
          value: 'Duales RTK',
          label: 'Zentimetergenaue Positionierung',
          desc: 'Hält die Drohne während automatischer Routen an den Modulreihen ausgerichtet.',
        },
        {
          value: '8–10 MPa',
          label: 'Hochdruckdüsen',
          desc: 'Entfernt Staub und Verschmutzung ohne manuelle Arbeit in der Höhe.',
        },
        {
          value: 'Automatisch',
          label: 'Routenplanung',
          desc: 'Wiederholbare Abdeckung großer Photovoltaikanlagen.',
        },
      ],
      applications: [
        { title: 'Große PV-Kraftwerke', desc: 'Große Freiflächenanlagen mit wiederholbaren Routen.' },
        { title: 'Industrie- und Dachanlagen', desc: 'Gewerbedächer, bei denen manueller Zugang langsam oder unsicher ist.' },
        { title: 'Staubige und landwirtschaftliche Regionen', desc: 'Häufige Verschmutzung durch Staub, Pollen und Feldarbeit.' },
        { title: 'O&M-Dienstleister', desc: 'Geplante Reinigung im Rahmen von PV-Wartungsverträgen.' },
      ],
      faq: [
        {
          q: 'Was reinigt die D50R?',
          a: 'Photovoltaikmodule auf Freiflächen- und Dachanlagen. Die D15R ist die Hochdruckoption für gemischte Standorte mit Fassaden oder anderen Oberflächen.',
        },
        {
          q: 'Braucht sie eine Wasserversorgung?',
          a: 'Die D50R führt einen 50-L-Tank und wird von einem Bodenfahrzeug oder einer festen Wasserstelle nachgefüllt. Der Verbrauch hängt von Verschmutzung, Reinigungsgeschwindigkeit und Düsensatz ab.',
        },
        {
          q: 'Kann sie große Solarparks bewältigen?',
          a: 'Ja. Automatische Routenplanung und duales RTK sind für große PV-Anlagen ausgelegt; die praktische Tagesfläche hängt von Layout, Wasserlogistik, Wind und Modulzugang ab.',
        },
        {
          q: 'Kann Hochdruck die Module beschädigen?',
          a: 'Die D50R nutzt 8–10-MPa-Düsen für die Photovoltaikreinigung. Düsensatz und Reinigungsverfahren werden vor der Lieferung für Ihren Modultyp und Ihre Verschmutzung bestätigt.',
        },
        {
          q: 'Ist eine Schulung enthalten?',
          a: 'Inbetriebnahme und Bedienerschulung sind im Angebot enthalten. Import, Fluggenehmigungen und lokale Sicherheitsvorschriften liegen in der Verantwortung des Käufers.',
        },
      ],
      cta: {
        title: 'Planen Sie eine Solarreinigungsroute',
        body: 'Nennen Sie Anlagengröße, Modullayout, Wasserzugang und Standort. Wir empfehlen D50R oder D15R und senden ein Konfigurationsangebot.',
        button: 'Angebot anfordern',
      },
    },
    fr: {
      metaTitle: 'Drone de nettoyage de panneaux solaires | D50R photovoltaïque | Partdro',
      metaDescription:
        'Drone autonome de nettoyage de panneaux solaires avec réservoir de 50 L, double RTK et planification de trajets pour centrales photovoltaïques et toitures.',
      eyebrow: 'Nettoyage de panneaux solaires',
      title: 'Nettoyez les panneaux solaires sans envoyer d’équipes sur le toit',
      lead:
        'Le D50R associe un réservoir de 50 L, un positionnement RTK double et une planification automatique des trajets pour nettoyer les centrales photovoltaïques. Pour les sites mixtes, le D15R ajoute le lavage haute pression des façades et des panneaux.',
      heroImage: '/images/d50r/hero.jpg',
      productSlugs: ['d50r', 'd15r'],
      outcomes: [
        {
          value: '50 L',
          label: 'Réservoir d’eau',
          desc: 'Réservoir embarqué pour des passes continues sur les rangées de panneaux.',
        },
        {
          value: 'RTK double',
          label: 'Positionnement centimétrique',
          desc: 'Maintient le drone aligné sur les rangées pendant les trajets automatiques.',
        },
        {
          value: '8–10 MPa',
          label: 'Buses haute pression',
          desc: 'Élimine la poussière et les salissures sans travail manuel en hauteur.',
        },
        {
          value: 'Automatique',
          label: 'Planification des trajets',
          desc: 'Couverture répétable des grandes centrales photovoltaïques.',
        },
      ],
      applications: [
        { title: 'Centrales photovoltaïques utilitaires', desc: 'Grandes installations au sol avec trajets répétables.' },
        { title: 'Solaire industriel et en toiture', desc: 'Toitures commerciales où l’accès manuel est lent ou dangereux.' },
        { title: 'Zones poussiéreuses et agricoles', desc: 'Salissures fréquentes dues à la poussière, au pollen et aux travaux agricoles.' },
        { title: 'Prestataires O&M', desc: 'Nettoyage programmé dans le cadre des contrats de maintenance PV.' },
      ],
      faq: [
        {
          q: 'Que nettoie le D50R ?',
          a: 'Les panneaux photovoltaïques au sol et en toiture. Le D15R est l’option haute pression pour les sites mixtes qui comprennent aussi des façades ou d’autres surfaces.',
        },
        {
          q: 'A-t-il besoin d’une alimentation en eau ?',
          a: 'Le D50R embarque un réservoir de 50 L rempli depuis un véhicule au sol ou un point d’eau fixe. La consommation dépend de la salissure, de la vitesse de nettoyage et du jeu de buses.',
        },
        {
          q: 'Peut-il couvrir de grandes centrales solaires ?',
          a: 'Oui. La planification automatique et le RTK double sont conçus pour les grandes centrales ; la surface journalière pratique dépend de l’implantation, de la logistique d’eau, du vent et de l’accès aux panneaux.',
        },
        {
          q: 'La haute pression peut-elle endommager les panneaux ?',
          a: 'Le D50R utilise des buses de 8–10 MPa pour le nettoyage photovoltaïque. Le jeu de buses et la procédure sont confirmés pour votre type de panneau et votre salissure avant livraison.',
        },
        {
          q: 'La formation est-elle incluse ?',
          a: 'La mise en service et la formation des opérateurs sont incluses dans le devis. L’importation, les autorisations de vol et les règles de sécurité locales restent à la charge de l’acheteur.',
        },
      ],
      cta: {
        title: 'Planifiez un trajet de nettoyage solaire',
        body: 'Indiquez la taille de la centrale, l’implantation des panneaux, l’accès à l’eau et la localisation. Nous recommanderons le D50R ou le D15R et enverrons un devis.',
        button: 'Demander un devis',
      },
    },
  },

  'heavy-lift-logistics': {
    en: {
      metaTitle: 'Heavy-Lift Cargo Drones | 80–240 kg Payload | Partdro',
      metaDescription:
        'Cargo drones for construction, power-line, mountain and emergency logistics: C500 240 kg / 720 kg cluster, SL80 80 kg, Y160 165 kg tethered lift.',
      eyebrow: 'Heavy-lift logistics',
      title: 'Move heavy payloads where trucks and cranes cannot reach',
      lead:
        'Partdro cargo drones cover 62–240 kg payloads, cluster lifting up to 720 kg and tethered lifting for precise placement in construction, power-line, mountain and emergency operations.',
      heroImage: '/images/c500-delivery-drone/hero.png',
      productSlugs: ['c500-delivery-drone', 'sl80-delivery-drone', 'y160-delivery-drone', 'yp800-delivery-drone'],
      outcomes: [
        {
          value: '240 kg',
          label: 'Single-aircraft payload',
          desc: 'C500 carries up to 240 kg per flight with 720 kg total thrust.',
        },
        {
          value: '720 kg',
          label: 'Cluster lift',
          desc: 'Multiple C500 aircraft lift a shared load of up to 720 kg.',
        },
        {
          value: '80 kg / 30 min',
          label: 'Long endurance',
          desc: 'SL80 with four semi-solid-state batteries for remote resupply.',
        },
        {
          value: '165 kg',
          label: 'Tethered lift',
          desc: 'Y160 with a 15 m lifting cable for precise placement.',
        },
      ],
      applications: [
        { title: 'Construction materials', desc: 'Move tools and materials to floors or sites without crane access.' },
        { title: 'Power tower components', desc: 'Transport hardware in mountainous and remote terrain.' },
        { title: 'Timber and bamboo', desc: 'Extract loads from forests to collection points.' },
        { title: 'Emergency supplies', desc: 'Deliver medical, food and relief loads when roads are blocked.' },
      ],
      faq: [
        {
          q: 'Which drone fits my payload?',
          a: 'C500 for up to 240 kg per aircraft; SL80 for 80 kg with up to 30 minutes of endurance; Y160 for 165 kg tethered lifting; YP800 for 62 kg with a 6 km range and multiple transport configurations.',
        },
        {
          q: 'What is cluster lifting?',
          a: 'Multiple C500 aircraft can lift a shared load of up to 720 kg. The configuration is planned for the load shape, route and landing site.',
        },
        {
          q: 'What range can the cargo drones achieve?',
          a: 'The C500 reaches up to 35 km and the YP800 up to 6 km. Actual range depends on payload, wind and battery configuration.',
        },
        {
          q: 'How are batteries shipped?',
          a: 'Lithium batteries ship separately under dangerous-goods rules. We confirm the route, packaging and documentation with the quote.',
        },
        {
          q: 'What about regulations and training?',
          a: 'Operators must follow local aviation rules. Commissioning and operator training are included, and we provide the product documentation needed for your local approval process.',
        },
      ],
      cta: {
        title: 'Tell us the payload and route',
        body: 'Share the load, distance, terrain and landing constraints. We will recommend the airframe and battery configuration and send a quote.',
        button: 'Request a quote',
      },
    },
    es: {
      metaTitle: 'Drones de carga de gran capacidad | 80–240 kg | Partdro',
      metaDescription:
        'Drones de carga para construcción, líneas eléctricas, montaña y emergencias: C500 240 kg / 720 kg en clúster, SL80 80 kg, Y160 165 kg con cable.',
      eyebrow: 'Logística de gran carga',
      title: 'Mueva cargas pesadas donde no llegan camiones ni grúas',
      lead:
        'Los drones de carga Partdro cubren cargas de 62–240 kg, elevación en clúster de hasta 720 kg y elevación con cable para una colocación precisa en construcción, líneas eléctricas, montaña y emergencias.',
      heroImage: '/images/c500-delivery-drone/hero.png',
      productSlugs: ['c500-delivery-drone', 'sl80-delivery-drone', 'y160-delivery-drone', 'yp800-delivery-drone'],
      outcomes: [
        {
          value: '240 kg',
          label: 'Carga por aeronave',
          desc: 'El C500 transporta hasta 240 kg por vuelo con 720 kg de empuje total.',
        },
        {
          value: '720 kg',
          label: 'Elevación en clúster',
          desc: 'Varios C500 elevan una carga compartida de hasta 720 kg.',
        },
        {
          value: '80 kg / 30 min',
          label: 'Larga autonomía',
          desc: 'SL80 con cuatro baterías semisólidas para reabastecimiento remoto.',
        },
        {
          value: '165 kg',
          label: 'Elevación con cable',
          desc: 'Y160 con cable de 15 m para una colocación precisa.',
        },
      ],
      applications: [
        { title: 'Materiales de construcción', desc: 'Lleve herramientas y materiales a plantas o sitios sin acceso de grúa.' },
        { title: 'Componentes de torres eléctricas', desc: 'Transporte de herrajes en terreno montañoso y remoto.' },
        { title: 'Madera y bambú', desc: 'Extraiga cargas del bosque hasta los puntos de recogida.' },
        { title: 'Suministros de emergencia', desc: 'Entregue cargas médicas, alimentos y ayuda cuando las carreteras están bloqueadas.' },
      ],
      faq: [
        {
          q: '¿Qué dron se adapta a mi carga?',
          a: 'C500 hasta 240 kg por aeronave; SL80 para 80 kg con hasta 30 minutos de autonomía; Y160 para elevación con cable de 165 kg; YP800 para 62 kg con 6 km de alcance y varias configuraciones.',
        },
        {
          q: '¿Qué es la elevación en clúster?',
          a: 'Varios C500 pueden elevar una carga compartida de hasta 720 kg. La configuración se planifica según la forma de la carga, la ruta y la zona de aterrizaje.',
        },
        {
          q: '¿Qué alcance tienen los drones de carga?',
          a: 'El C500 llega hasta 35 km y el YP800 hasta 6 km. El alcance real depende de la carga, el viento y la configuración de baterías.',
        },
        {
          q: '¿Cómo se envían las baterías?',
          a: 'Las baterías de litio se envían por separado según la normativa de mercancías peligrosas. Confirmamos la ruta, el embalaje y la documentación con la cotización.',
        },
        {
          q: '¿Y la normativa y la formación?',
          a: 'Los operadores deben cumplir la normativa aeronáutica local. La puesta en marcha y la formación están incluidas, y facilitamos la documentación del producto necesaria para su proceso de aprobación local.',
        },
      ],
      cta: {
        title: 'Indíquenos la carga y la ruta',
        body: 'Comparta la carga, la distancia, el terreno y las limitaciones de aterrizaje. Recomendaremos la aeronave y la configuración de baterías y enviaremos una cotización.',
        button: 'Solicitar cotización',
      },
    },
    de: {
      metaTitle: 'Schwerlast-Transportdrohnen | 80–240 kg Nutzlast | Partdro',
      metaDescription:
        'Transportdrohnen für Bau, Stromleitungen, Bergregionen und Notfälle: C500 240 kg / 720 kg im Cluster, SL80 80 kg, Y160 165 kg am Seil.',
      eyebrow: 'Schwerlastlogistik',
      title: 'Schwere Lasten bewegen, wo LKW und Kräne nicht hinkommen',
      lead:
        'Partdro-Transportdrohnen decken 62–240 kg Nutzlast ab, Cluster-Heben bis 720 kg und Seilheben für präzises Absetzen in Bau, Stromleitungsbau, Bergregionen und Notfällen.',
      heroImage: '/images/c500-delivery-drone/hero.png',
      productSlugs: ['c500-delivery-drone', 'sl80-delivery-drone', 'y160-delivery-drone', 'yp800-delivery-drone'],
      outcomes: [
        {
          value: '240 kg',
          label: 'Nutzlast pro Fluggerät',
          desc: 'C500 transportiert bis zu 240 kg pro Flug bei 720 kg Gesamtschub.',
        },
        {
          value: '720 kg',
          label: 'Cluster-Heben',
          desc: 'Mehrere C500 heben gemeinsam eine Last von bis zu 720 kg.',
        },
        {
          value: '80 kg / 30 min',
          label: 'Lange Ausdauer',
          desc: 'SL80 mit vier semisoliden Akkus für die Versorgung abgelegener Gebiete.',
        },
        {
          value: '165 kg',
          label: 'Seilheben',
          desc: 'Y160 mit 15-m-Hebeseil für präzises Absetzen.',
        },
      ],
      applications: [
        { title: 'Baumaterial', desc: 'Werkzeuge und Material auf Etagen oder Baustellen ohne Kranzugang bringen.' },
        { title: 'Komponenten für Strommasten', desc: 'Transport von Bauteilen in Berg- und abgelegenen Regionen.' },
        { title: 'Holz und Bambus', desc: 'Lasten aus dem Wald zu Sammelstellen bringen.' },
        { title: 'Notfallversorgung', desc: 'Medizinische Güter, Lebensmittel und Hilfsgüter liefern, wenn Straßen blockiert sind.' },
      ],
      faq: [
        {
          q: 'Welche Drohne passt zu meiner Nutzlast?',
          a: 'C500 bis 240 kg pro Fluggerät; SL80 für 80 kg mit bis zu 30 Minuten Ausdauer; Y160 für 165 kg Seilheben; YP800 für 62 kg mit 6 km Reichweite und mehreren Transportkonfigurationen.',
        },
        {
          q: 'Was ist Cluster-Heben?',
          a: 'Mehrere C500 können eine gemeinsame Last von bis zu 720 kg heben. Die Konfiguration wird auf Lastform, Route und Landeplatz abgestimmt.',
        },
        {
          q: 'Welche Reichweite erreichen die Transpordrohnen?',
          a: 'Die C500 erreicht bis zu 35 km, die YP800 bis zu 6 km. Die tatsächliche Reichweite hängt von Nutzlast, Wind und Akkukonfiguration ab.',
        },
        {
          q: 'Wie werden die Akkus versendet?',
          a: 'Lithiumakkus werden gemäß Gefahrgutvorschriften separat versandt. Route, Verpackung und Dokumentation werden mit dem Angebot bestätigt.',
        },
        {
          q: 'Und Vorschriften und Schulung?',
          a: 'Bediener müssen die lokalen Luftfahrtvorschriften einhalten. Inbetriebnahme und Schulung sind enthalten; wir stellen die Produktdokumentation für Ihren lokalen Genehmigungsprozess bereit.',
        },
      ],
      cta: {
        title: 'Nennen Sie uns Nutzlast und Route',
        body: 'Teilen Sie Last, Entfernung, Gelände und Landevorgaben. Wir empfehlen Fluggerät und Akkukonfiguration und senden ein Angebot.',
        button: 'Angebot anfordern',
      },
    },
    fr: {
      metaTitle: 'Drones cargo lourds | 80–240 kg de charge | Partdro',
      metaDescription:
        'Drones cargo pour construction, lignes électriques, montagne et urgences : C500 240 kg / 720 kg en grappe, SL80 80 kg, Y160 165 kg sur câble.',
      eyebrow: 'Logistique lourde',
      title: 'Déplacez des charges lourdes là où camions et grues ne passent pas',
      lead:
        'Les drones cargo Partdro couvrent des charges de 62–240 kg, le levage en grappe jusqu’à 720 kg et le levage sur câble pour une pose précise en construction, lignes électriques, montagne et urgences.',
      heroImage: '/images/c500-delivery-drone/hero.png',
      productSlugs: ['c500-delivery-drone', 'sl80-delivery-drone', 'y160-delivery-drone', 'yp800-delivery-drone'],
      outcomes: [
        {
          value: '240 kg',
          label: 'Charge par appareil',
          desc: 'Le C500 transporte jusqu’à 240 kg par vol avec 720 kg de poussée totale.',
        },
        {
          value: '720 kg',
          label: 'Levage en grappe',
          desc: 'Plusieurs C500 soulèvent ensemble une charge de 720 kg.',
        },
        {
          value: '80 kg / 30 min',
          label: 'Longue autonomie',
          desc: 'SL80 avec quatre batteries semi-solides pour le ravitaillement isolé.',
        },
        {
          value: '165 kg',
          label: 'Levage sur câble',
          desc: 'Y160 avec câble de 15 m pour une pose précise.',
        },
      ],
      applications: [
        { title: 'Matériaux de construction', desc: 'Montez outils et matériaux aux étages ou sur des sites sans accès grue.' },
        { title: 'Composants de pylônes électriques', desc: 'Transport de pièces en terrain montagneux et isolé.' },
        { title: 'Bois et bambou', desc: 'Extrayez les charges de la forêt vers les points de collecte.' },
        { title: 'Fournitures d’urgence', desc: 'Livrez matériel médical, nourriture et aide lorsque les routes sont coupées.' },
      ],
      faq: [
        {
          q: 'Quel drone correspond à ma charge ?',
          a: 'C500 jusqu’à 240 kg par appareil ; SL80 pour 80 kg avec jusqu’à 30 minutes d’autonomie ; Y160 pour 165 kg sur câble ; YP800 pour 62 kg avec 6 km de portée et plusieurs configurations.',
        },
        {
          q: 'Qu’est-ce que le levage en grappe ?',
          a: 'Plusieurs C500 peuvent soulever une charge commune de 720 kg. La configuration est planifiée selon la forme de la charge, le trajet et la zone d’atterrissage.',
        },
        {
          q: 'Quelle portée atteignent les drones cargo ?',
          a: 'Le C500 atteint 35 km et le YP800 6 km. La portée réelle dépend de la charge, du vent et de la configuration des batteries.',
        },
        {
          q: 'Comment les batteries sont-elles expédiées ?',
          a: 'Les batteries lithium sont expédiées séparément selon la réglementation sur les marchandises dangereuses. Le trajet, l’emballage et la documentation sont confirmés avec le devis.',
        },
        {
          q: 'Et la réglementation et la formation ?',
          a: 'Les opérateurs doivent respecter la réglementation aérienne locale. La mise en service et la formation sont incluses ; nous fournissons la documentation produit nécessaire à votre processus d’approbation local.',
        },
      ],
      cta: {
        title: 'Indiquez-nous la charge et le trajet',
        body: 'Précisez la charge, la distance, le terrain et les contraintes d’atterrissage. Nous recommanderons l’appareil et la configuration des batteries, puis enverrons un devis.',
        button: 'Demander un devis',
      },
    },
  },
}
