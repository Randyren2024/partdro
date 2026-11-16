export interface SupplierProductLink {
  model: string
  slug: string
  category: 'cargo' | 'agricultural' | 'cleaning'
  names: Record<'en' | 'de' | 'es' | 'fr', string>
  sourceUrl: string
}

export interface SupplierProductFamily {
  id: string
  title: Record<'en' | 'de' | 'es' | 'fr', string>
  summary: Record<'en' | 'de' | 'es' | 'fr', string>
  items: string[]
}

export interface SupplierProfile {
  supplierId: string
  slug: string
  website: string
  address: string
  foundedYear: number
  displayName: Record<'en' | 'de' | 'es' | 'fr', string>
  verifiedAt: string
  description: Record<'en' | 'de' | 'es' | 'fr', string>
  families: SupplierProductFamily[]
  linkedProducts: SupplierProductLink[]
  catalogueModels: string[]
  sources: { label: string; url: string; type: 'official_company' | 'official_product' }[]
}

export const SUPPLIER_PROFILES: SupplierProfile[] = [
  {
    supplierId: 'supplier-201',
    slug: 'topxgun',
    website: 'https://www.topxgun.com/',
    address: '南京市江宁区吉印大道3118号',
    foundedYear: 2015,
    displayName: { en: 'TopXGun (Nanjing) Robotics Co., Ltd.', de: 'TopXGun (Nanjing) Robotics Co., Ltd.', es: 'TopXGun (Nanjing) Robotics Co., Ltd.', fr: 'TopXGun (Nanjing) Robotics Co., Ltd.' },
    verifiedAt: '2026-11-16',
    description: {
      en: 'TopXGun (Nanjing) Robotics Co., Ltd. develops UAV autopilot technology and low-altitude digital operations. Its official catalogue covers cargo transport, smart agriculture, industrial applications, aircraft systems, payloads and software.',
      de: 'TopXGun (Nanjing) Robotics Co., Ltd. entwickelt UAV-Autopilot-Technologie und digitale Anwendungen für den niedrigen Luftraum. Der offizielle Katalog umfasst Transport, intelligente Landwirtschaft, industrielle Anwendungen, Flugzeugsysteme, Nutzlasten und Software.',
      es: 'TopXGun (Nanjing) Robotics Co., Ltd. desarrolla tecnología de piloto automático para UAV y operaciones digitales de baja altitud. Su catálogo oficial abarca transporte, agricultura inteligente, aplicaciones industriales, sistemas de aeronaves, cargas útiles y software.',
      fr: 'TopXGun (Nanjing) Robotics Co., Ltd. développe des technologies de pilote automatique pour UAV et des opérations numériques à basse altitude. Son catalogue officiel couvre le transport, l’agriculture intelligente, les applications industrielles, les systèmes aéronautiques, les charges utiles et les logiciels.',
    },
    families: [
      {
        id: 'cargo',
        title: { en: 'High-efficiency cargo solutions', de: 'Hocheffiziente Transportlösungen', es: 'Soluciones de transporte de alta eficiencia', fr: 'Solutions de transport à haute efficacité' },
        summary: {
          en: 'Cargo UAVs for low-altitude logistics and lifting operations. The official catalogue lists Qingtian 80, Y160 and Yunpeng 800.',
          de: 'Transportdrohnen für Logistik und Hebearbeiten in niedriger Höhe. Der offizielle Katalog führt Qingtian 80, Y160 und Yunpeng 800.',
          es: 'UAV de carga para logística a baja altitud y operaciones de elevación. El catálogo oficial incluye Qingtian 80, Y160 y Yunpeng 800.',
          fr: 'Drones cargo pour la logistique à basse altitude et les opérations de levage. Le catalogue officiel répertorie Qingtian 80, Y160 et Yunpeng 800.',
        },
        items: ['擎天80', 'Y160', '运鹏800'],
      },
      {
        id: 'agriculture',
        title: { en: 'Smart agriculture solutions', de: 'Lösungen für intelligente Landwirtschaft', es: 'Soluciones de agricultura inteligente', fr: 'Solutions d’agriculture intelligente' },
        summary: {
          en: 'Agricultural aircraft for spraying, spreading, lifting and other farm operations. The official catalogue lists Fengpeng 800, A80, Fengpeng 700, Fengpeng 300E and Fengpeng 600.',
          de: 'Landwirtschaftliche UAVs zum Sprühen, Streuen, Heben und für weitere landwirtschaftliche Einsätze. Der offizielle Katalog führt Fengpeng 800, A80, Fengpeng 700, Fengpeng 300E und Fengpeng 600.',
          es: 'Aeronaves agrícolas para pulverización, esparcido, elevación y otras operaciones agrícolas. El catálogo oficial incluye Fengpeng 800, A80, Fengpeng 700, Fengpeng 300E y Fengpeng 600.',
          fr: 'Aéronefs agricoles pour la pulvérisation, l’épandage, le levage et d’autres opérations agricoles. Le catalogue officiel répertorie Fengpeng 800, A80, Fengpeng 700, Fengpeng 300E et Fengpeng 600.',
        },
        items: ['丰鹏800', 'A80', '丰鹏700', '丰鹏300E', '丰鹏600'],
      },
      {
        id: 'industrial',
        title: { en: 'Industrial innovation', de: 'Industrielle Innovation', es: 'Innovación industrial', fr: 'Innovation industrielle' },
        summary: {
          en: 'Industrial cleaning, emergency response and larger UAV platforms, alongside dedicated flight-control, avionics, payload and software systems.',
          de: 'Industrielle Reinigung, Notfallhilfe und größere UAV-Plattformen sowie spezielle Flugsteuerungs-, Avionik-, Nutzlast- und Softwaresysteme.',
          es: 'Limpieza industrial, respuesta a emergencias y plataformas UAV de mayor tamaño, además de sistemas especializados de control de vuelo, aviónica, cargas útiles y software.',
          fr: 'Nettoyage industriel, intervention d’urgence et plateformes UAV de grande taille, ainsi que des systèmes dédiés de commande de vol, d’avionique, de charges utiles et de logiciels.',
        },
        items: ['C15清洗无人机', 'KT100电系留', 'Y160消防', '星辰-15', '星辰-40E', '星辰-40F', '星辰-100F', '星辰-650'],
      },
      {
        id: 'systems',
        title: { en: 'Specialist hardware and software systems', de: 'Spezialisierte Hardware- und Softwaresysteme', es: 'Sistemas especializados de hardware y software', fr: 'Systèmes matériels et logiciels spécialisés' },
        summary: {
          en: 'The official catalogue also lists dedicated flight-control systems, avionics hardware, mission payload equipment and industry software. These are presented as solution areas rather than aircraft models.',
          de: 'Der offizielle Katalog führt außerdem spezielle Flugsteuerungssysteme, Avionik-Hardware, Missionsnutzlasten und Branchensoftware auf. Diese werden als Lösungsbereiche und nicht als Flugzeugmodelle dargestellt.',
          es: 'El catálogo oficial también incluye sistemas especializados de control de vuelo, hardware de aviónica, cargas útiles de misión y software sectorial. Se presentan como áreas de solución, no como modelos de aeronaves.',
          fr: 'Le catalogue officiel répertorie également des systèmes spécialisés de commande de vol, du matériel avionique, des charges utiles de mission et des logiciels sectoriels. Ils sont présentés comme des domaines de solution, et non comme des modèles d’aéronefs.',
        },
        items: ['专业化飞控系统', '航电硬件', '任务载荷', '行业软件'],
      },
    ],
    catalogueModels: ['擎天80', 'Y160', '运鹏800', '丰鹏800', 'A80', '丰鹏700', '丰鹏300E', '丰鹏600', 'C15清洗无人机', 'KT100电系留', 'Y160消防', '星辰-15', '星辰-40E', '星辰-40F', '星辰-100F', '星辰-650'],
    // YP800 is intentionally not linked yet: the existing Partdro YP800 record lists 62 kg payload.
    // TopXGun's official Yunpeng 800 page states 50 kg lifting / 30 kg cargo-box load.
    // Reconcile model identity and source specs before connecting these records.
    linkedProducts: [
      {
        model: 'Y160',
        slug: 'y160-delivery-drone',
        category: 'cargo',
        names: { en: 'Y160 Delivery Drone', de: 'Y160 Transportdrohne', es: 'Dron de transporte Y160', fr: 'Drone de transport Y160' },
        sourceUrl: 'https://www.topxgun.com/h-col-149.html',
      },
      {
        model: '丰鹏800',
        slug: 'fp800-agricultural-drone',
        category: 'agricultural',
        names: { en: 'Fengpeng 800 Agricultural Drone', de: 'Fengpeng 800 Landwirtschaftsdrohne', es: 'Dron agrícola Fengpeng 800', fr: 'Drone agricole Fengpeng 800' },
        sourceUrl: 'https://www.topxgun.com/h-col-179.html',
      },
      {
        model: 'C15',
        slug: 'c15',
        category: 'cleaning',
        names: { en: 'C15 Cleaning Drone', de: 'C15 Reinigungsdrohne', es: 'Dron de limpieza C15', fr: 'Drone de nettoyage C15' },
        sourceUrl: 'https://www.topxgun.com/',
      },
    ],
    sources: [
      { label: 'Official company website and product catalogue', url: 'https://www.topxgun.com/', type: 'official_company' },
      { label: 'Company profile and development history', url: 'https://www.topxgun.com/h-col-101.html', type: 'official_company' },
      { label: 'Y160 official product information', url: 'https://www.topxgun.com/h-col-149.html', type: 'official_product' },
      { label: 'Yunpeng 800 official product information', url: 'https://www.topxgun.com/h-col-141.html', type: 'official_product' },
      { label: 'Fengpeng 800 official product information', url: 'https://www.topxgun.com/h-col-179.html', type: 'official_product' },
      { label: 'Official catalogue and product-family navigation', url: 'https://www.topxgun.com/', type: 'official_company' },
    ],
  },
]

export const getSupplierProfile = (slug: string) => SUPPLIER_PROFILES.find((profile) => profile.slug === slug)

export const getSupplierProfileByProductSlug = (productSlug: string) =>
  SUPPLIER_PROFILES.find((profile) => profile.linkedProducts.some((product) => product.slug === productSlug))
