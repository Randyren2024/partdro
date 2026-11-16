export interface SupplierProductLink {
  model: string
  slug: string
  category: 'cargo' | 'agricultural' | 'cleaning'
  names: Record<'en' | 'de' | 'es' | 'fr', string>
  sourceUrl: string
  sourceType: 'official_product' | 'official_catalogue'
  highlights: Record<'en' | 'de' | 'es' | 'fr', string>
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
  websiteLabel?: Record<'en' | 'de' | 'es' | 'fr', string>
  address: string
  foundedYear: number
  displayName: Record<'en' | 'de' | 'es' | 'fr', string>
  verifiedAt: string
  description: Record<'en' | 'de' | 'es' | 'fr', string>
  families: SupplierProductFamily[]
  linkedProducts: SupplierProductLink[]
  catalogueModels: string[]
  sources: { label: string; url: string; type: 'official_company' | 'official_product' | 'government_source' }[]
}

export const SUPPLIER_PROFILES: SupplierProfile[] = [

  {
    supplierId: 'supplier-240',
    slug: 'wuhu-tengden-aviation',
    website: 'https://www.tengden.com/',
    websiteLabel: { en: 'Parent group website', de: 'Website der Muttergesellschaft', es: 'Sitio web del grupo matriz', fr: 'Site web du groupe parent' },
    address: '安徽省芜湖市湾沚区安徽新芜经济开发区北航通航创新园5号楼9层',
    foundedYear: 2023,
    displayName: { en: '芜湖腾盾航空科技有限公司', de: '芜湖腾盾航空科技有限公司', es: '芜湖腾盾航空科技有限公司', fr: '芜湖腾盾航空科技有限公司' },
    verifiedAt: '2026-11-16',
    description: {
      en: 'Wuhu Tengden Aviation Technology Co., Ltd. is a wholly owned subsidiary of Sichuan Tengden Sci-Tech Innovation Co., Ltd. established in Wuhu. Wuhu municipal sources directly attribute the D18 modular large commercial UAV development and assembly line to this local subsidiary. The parent group publishes a broader UAV portfolio, but this profile lists only D18 because it is the model directly evidenced for the Wuhu entity.',
      de: 'Wuhu Tengden Aviation Technology Co., Ltd. ist eine in Wuhu gegründete hundertprozentige Tochtergesellschaft von Sichuan Tengden Sci-Tech Innovation Co., Ltd. Kommunale Quellen aus Wuhu ordnen die Entwicklung und Endmontagelinie des modularen Großraum-Transport-UAV D18 direkt dieser lokalen Tochtergesellschaft zu. Die Muttergesellschaft veröffentlicht ein breiteres UAV-Portfolio; dieses Profil führt nur D18 auf, da dieses Modell für die Wuhu-Gesellschaft direkt belegt ist.',
      es: 'Wuhu Tengden Aviation Technology Co., Ltd. es una filial de propiedad total de Sichuan Tengden Sci-Tech Innovation Co., Ltd. establecida en Wuhu. Fuentes municipales de Wuhu atribuyen directamente a esta filial local el desarrollo y la línea de ensamblaje del UAV comercial modular D18. El grupo matriz publica una cartera más amplia, pero este perfil solo incluye D18 porque es el modelo documentado directamente para la entidad de Wuhu.',
      fr: 'Wuhu Tengden Aviation Technology Co., Ltd. est une filiale détenue à 100 % par Sichuan Tengden Sci-Tech Innovation Co., Ltd., établie à Wuhu. Les sources municipales de Wuhu attribuent directement à cette filiale locale le développement et la ligne d’assemblage du grand UAV commercial modulaire D18. Le groupe parent publie un portefeuille plus large, mais ce profil ne présente que le D18, seul modèle directement documenté pour l’entité de Wuhu.',
    },
    families: [
      {
        id: 'd18-commercial',
        title: { en: 'Modular large commercial UAV', de: 'Modulares großes kommerzielles UAV', es: 'UAV comercial modular de gran tamaño', fr: 'Grand UAV commercial modulaire' },
        summary: {
          en: 'D18 is a four-engine fixed-wing cargo UAV with a modular cargo bay. Wuhu official sources report a 4.35-tonne maximum take-off weight, 1.8-tonne maximum payload and more than 600 km range at full load. A separate Wuhu source reports over 1,500 km range with a 1.5-tonne payload. Missions include cargo transport, airdrop, emergency response and weather modification.',
          de: 'D18 ist ein viermotoriges Starrflügel-Fracht-UAV mit modularem Frachtraum. Offizielle Quellen aus Wuhu nennen 4,35 t maximales Startgewicht, 1,8 t maximale Nutzlast und mehr als 600 km Reichweite bei voller Last. Eine separate Quelle aus Wuhu nennt über 1.500 km Reichweite bei 1,5 t Nutzlast. Einsatzbereiche sind Frachttransport, Abwurf, Notfallhilfe und Wetterbeeinflussung.',
          es: 'D18 es un UAV de carga de ala fija con cuatro motores y bodega modular. Fuentes oficiales de Wuhu indican 4,35 toneladas de peso máximo al despegue, 1,8 toneladas de carga útil máxima y más de 600 km de alcance a plena carga. Otra fuente de Wuhu informa de más de 1.500 km con 1,5 toneladas de carga útil. Sus misiones incluyen transporte, lanzamiento de suministros, respuesta a emergencias y modificación meteorológica.',
          fr: 'Le D18 est un UAV cargo à voilure fixe et quatre moteurs, doté d’une soute modulaire. Les sources officielles de Wuhu indiquent une masse maximale au décollage de 4,35 tonnes, une charge utile maximale de 1,8 tonne et plus de 600 km de portée à pleine charge. Une autre source de Wuhu indique plus de 1 500 km avec une charge utile de 1,5 tonne. Les missions comprennent le transport, le largage de matériel, les interventions d’urgence et la modification météorologique.',
        },
        items: ['D18'],
      },
    ],
    linkedProducts: [],
    catalogueModels: ['D18'],
    sources: [
      { label: 'Sichuan Tengden official group website', url: 'https://www.tengden.com/', type: 'official_company' },
      { label: 'Sichuan Tengden official company profile', url: 'https://www.tengden.com/about.html', type: 'official_company' },
      { label: 'Wuhu municipal report: D18 assembly line and local subsidiary relationship', url: 'https://kjj.wuhu.gov.cn/gg/xqkj/8810527.html', type: 'government_source' },
      { label: 'Wuhu municipal report: D18 first flight and specifications', url: 'https://kjj.wuhu.gov.cn/gg/kjyw/8849909.html', type: 'government_source' },
      { label: 'Wuhu investment promotion report: D18 heavy-payload airdrop test', url: 'https://tzcjzx.wuhu.gov.cn/zsdt/gzdt/8865027.html', type: 'government_source' },
      { label: 'Shenzhen Stock Exchange filing: Wuhu subsidiary registration and address', url: 'https://reportdocs.static.szse.cn/UpFiles/rasinfodisc1/202606/RAS_202606_161935627E1A9C0B0848B3AE740A8FF48C0397.pdf', type: 'government_source' },
    ],
  },

  {
    supplierId: 'supplier-239',
    slug: 'wuhu-united-aircraft',
    website: 'https://www.uatair.com/about/company/2.html',
    websiteLabel: { en: 'Official subsidiary profile', de: 'Offizielles Tochtergesellschaftsprofil', es: 'Perfil oficial de la filial', fr: 'Profil officiel de la filiale' },
    address: '安徽省芜湖市湾沚区安徽新芜经济开发区北航芜湖通航创新园',
    foundedYear: 2021,
    displayName: { en: 'Wuhu United Aircraft Technology Co., Ltd.', de: 'Wuhu United Aircraft Technology Co., Ltd.', es: 'Wuhu United Aircraft Technology Co., Ltd.', fr: 'Wuhu United Aircraft Technology Co., Ltd.' },
    verifiedAt: '2026-11-16',
    description: {
      en: 'Wuhu United Aircraft Technology Co., Ltd. is a wholly owned subsidiary of United Aircraft Group and its strategic base in East China. It focuses on aircraft R&D, manufacturing, testing, flight trials, maintenance, training and support. The catalogue below represents the parent group portfolio, not proof that every model is manufactured at the Wuhu site.',
      de: 'Wuhu United Aircraft Technology Co., Ltd. ist eine hundertprozentige Tochtergesellschaft der United Aircraft Group und deren strategischer Standort in Ostchina. Das Unternehmen konzentriert sich auf Forschung und Entwicklung, Fertigung, Tests, Flugerprobung, Wartung, Schulung und Support. Der Katalog zeigt das Portfolio der Muttergesellschaft und bestätigt nicht, dass jedes Modell in Wuhu gefertigt wird.',
      es: 'Wuhu United Aircraft Technology Co., Ltd. es una filial de propiedad total de United Aircraft Group y su base estratégica en el este de China. Se dedica a I+D, fabricación, pruebas, ensayos de vuelo, mantenimiento, formación y soporte. El catálogo representa el portafolio del grupo matriz, no confirma que todos los modelos se fabriquen en Wuhu.',
      fr: 'Wuhu United Aircraft Technology Co., Ltd. est une filiale détenue à 100 % par United Aircraft Group et sa base stratégique en Chine orientale. Elle se concentre sur la R&D, la fabrication, les essais, les essais en vol, la maintenance, la formation et le support. Le catalogue représente le portefeuille du groupe parent et ne confirme pas que chaque modèle soit fabriqué à Wuhu.',
    },
    families: [
      {
        id: 'helicopters',
        title: { en: 'Heavy-lift unmanned helicopters', de: 'Schwerlast-Drohnenhubschrauber', es: 'Helicópteros no tripulados de carga pesada', fr: 'Hélicoptères sans pilote à forte charge utile' },
        summary: {
          en: 'TD550D received a type certificate in March 2025; Wuhu municipal sources report 200 kg maximum payload and operation up to 6,500 m for this variant. The family also includes TD220 (350 kg maximum take-off weight, 60 kg payload, 5 h at 35 kg) and the T1400 (1,400 kg maximum take-off weight, 650 kg maximum payload including fuel).',
          de: 'TD550D erhielt im März 2025 eine Musterzulassung; Quellen der Stadt Wuhu nennen für diese Variante 200 kg maximale Nutzlast und einen Einsatz bis 6.500 m. Zur Familie gehören außerdem TD220 (350 kg maximales Startgewicht, 60 kg Nutzlast, 5 h bei 35 kg) und T1400 (1.400 kg maximales Startgewicht, 650 kg maximale Nutzlast einschließlich Kraftstoff).',
          es: 'TD550D obtuvo un certificado de tipo en marzo de 2025; fuentes municipales de Wuhu indican 200 kg de carga útil máxima y operación hasta 6.500 m para esta variante. La familia también incluye TD220 (350 kg de peso máximo al despegue, 60 kg de carga útil, 5 h con 35 kg) y T1400 (1.400 kg de peso máximo al despegue, 650 kg de carga útil máxima incluido el combustible).',
          fr: 'TD550D a obtenu un certificat de type en mars 2025 ; des sources municipales de Wuhu indiquent 200 kg de charge utile maximale et une exploitation jusqu’à 6 500 m pour cette variante. La famille comprend aussi le TD220 (350 kg de masse maximale au décollage, 60 kg de charge utile, 5 h avec 35 kg) et le T1400 (1 400 kg de masse maximale au décollage, 650 kg de charge utile maximale carburant compris).',
        },
        items: ['TD220', 'TD550 / TD550D', '铂影 T1400'],
      },
      {
        id: 'tiltrotor',
        title: { en: 'Tiltrotor aircraft', de: 'Kipprotor-Fluggeräte', es: 'Aeronaves de rotor basculante', fr: 'Aéronefs à rotors basculants' },
        summary: {
          en: 'The six-ton-class Lanying R6000 combines vertical take-off and landing with high-speed cruise; official figures include 6,100 kg maximum take-off weight, 2,000 kg commercial payload, 550 km/h cruise speed and 4,000 km maximum range.',
          de: 'Der Kipprotor Lanying R6000 der Sechs-Tonnen-Klasse verbindet Senkrechtstart und -landung mit schnellem Reiseflug; offizielle Angaben nennen 6.100 kg maximales Startgewicht, 2.000 kg kommerzielle Nutzlast, 550 km/h Reisegeschwindigkeit und 4.000 km maximale Reichweite.',
          es: 'El convertiplano Lanying R6000 de seis toneladas combina despegue vertical con crucero de alta velocidad; las cifras oficiales incluyen 6.100 kg de peso máximo al despegue, 2.000 kg de carga comercial, 550 km/h de crucero y 4.000 km de alcance máximo.',
          fr: 'Le convertiplane Lanying R6000 de six tonnes associe le décollage vertical à une croisière rapide ; les données officielles indiquent 6 100 kg de masse maximale au décollage, 2 000 kg de charge commerciale, 550 km/h en croisière et 4 000 km de portée maximale.',
        },
        items: ['镧影 R6000'],
      },
      {
        id: 'multirotor',
        title: { en: 'Multirotor and agricultural UAVs', de: 'Multikopter und Landwirtschafts-UAVs', es: 'UAV multirrotor y agrícolas', fr: 'UAV multirotors et agricoles' },
        summary: {
          en: 'The group catalogue also lists the Leiying Q20 intelligent flight platform and Q100P agricultural UAV.',
          de: 'Der Gruppenkatalog führt auch die intelligente Flugplattform Leiying Q20 und das Landwirtschafts-UAV Q100P auf.',
          es: 'El catálogo del grupo también incluye la plataforma Leiying Q20 y el UAV agrícola Q100P.',
          fr: 'Le catalogue du groupe comprend également la plateforme Leiying Q20 et le drone agricole Q100P.',
        },
        items: ['镭影 Q20', 'Q100P'],
      },
      {
        id: 'systems',
        title: { en: 'Airborne and ground systems', de: 'Bord- und Bodensysteme', es: 'Sistemas embarcados y terrestres', fr: 'Systèmes embarqués et au sol' },
        summary: {
          en: 'Flight-control computers, servo systems, ground-control equipment, rotor blades and composite products.',
          de: 'Flugsteuerungscomputer, Servosysteme, Bodensteuerungsausrüstung, Rotorblätter und Verbundwerkstoffprodukte.',
          es: 'Ordenadores de control de vuelo, servosistemas, equipos de control terrestre, palas de rotor y productos compuestos.',
          fr: 'Calculateurs de commande de vol, servosystèmes, équipements de contrôle au sol, pales de rotor et produits composites.',
        },
        items: ['多余度飞行控制计算机', '双余度伺服控制器', '车载 / 地面控制站', '旋翼桨叶', '复合材料产品'],
      },
    ],
    linkedProducts: [],
    catalogueModels: ['TD220', 'TD550', 'TD550D', 'T1400', 'R6000', 'Q20', 'Q100P'],
    sources: [
      { label: 'Wuhu subsidiary profile and official address', url: 'https://www.uatair.com/about/company/2.html', type: 'official_company' },
      { label: 'United Aircraft Group official product catalogue', url: 'https://www.uatair.com/product.html', type: 'official_company' },
      { label: 'TD550D type certificate announcement', url: 'https://www.uatair.com/news/424.html', type: 'official_company' },
      { label: 'TD550D payload and high-altitude operating information', url: 'https://cczx.wuhu.gov.cn/cxzx/cxyw/8743817.html', type: 'government_source' },
      { label: 'TD220 official product specifications', url: 'https://www.uatair.com/en/product/info/39.html', type: 'official_product' },
      { label: 'T1400 official product specifications', url: 'https://www.uatair.com/news/427.html', type: 'official_product' },
      { label: 'R6000 official product specifications', url: 'https://www.uatair.com/product/info/69.html', type: 'official_product' },
      { label: 'Company development history', url: 'https://www.uatair.com/about/develop.html', type: 'official_company' },
    ],
  },
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
        sourceType: 'official_product',
        highlights: { en: 'Up to 165 kg payload · heavy-lift cargo transport', de: 'Bis zu 165 kg Nutzlast · Schwerlasttransport', es: 'Hasta 165 kg de carga útil · transporte pesado', fr: 'Jusqu’à 165 kg de charge utile · transport lourd' },
      },
      {
        model: '丰鹏800',
        slug: 'fp800-agricultural-drone',
        category: 'agricultural',
        names: { en: 'Fengpeng 800 Agricultural Drone', de: 'Fengpeng 800 Landwirtschaftsdrohne', es: 'Dron agrícola Fengpeng 800', fr: 'Drone agricole Fengpeng 800' },
        sourceUrl: 'https://www.topxgun.com/h-col-179.html',
        sourceType: 'official_product',
        highlights: { en: '80 L spray · 120 L spreading · 85 kg lifting load', de: '80 l Sprühen · 120 l Streuen · 85 kg Hubkraft', es: '80 L de pulverización · 120 L de esparcido · 85 kg de elevación', fr: 'Pulvérisation 80 L · épandage 120 L · levage 85 kg' },
      },
      {
        model: 'C15',
        slug: 'c15',
        category: 'cleaning',
        names: { en: 'C15 Cleaning Drone', de: 'C15 Reinigungsdrohne', es: 'Dron de limpieza C15', fr: 'Drone de nettoyage C15' },
        sourceUrl: 'https://www.topxgun.com/h-col-163.html',
        sourceType: 'official_product',
        highlights: { en: '16 MPa max pressure · 20 L/min · 120 m hose · 100 m working height', de: '16 MPa Maximaldruck · 20 l/min · 120 m Schlauch · 100 m Arbeitshöhe', es: '16 MPa de presión máxima · 20 L/min · manguera de 120 m · 100 m de altura de trabajo', fr: 'Pression max. 16 MPa · 20 L/min · tuyau de 120 m · hauteur de travail de 100 m' },
      },
    ],
    sources: [
      { label: 'Official company website and product catalogue', url: 'https://www.topxgun.com/', type: 'official_company' },
      { label: 'Company profile and development history', url: 'https://www.topxgun.com/h-col-101.html', type: 'official_company' },
      { label: 'Y160 official product information', url: 'https://www.topxgun.com/h-col-149.html', type: 'official_product' },
      { label: 'Y160 payload and application information', url: 'https://www.topxgun.com/h-nd-40.html', type: 'official_product' },
      { label: 'Yunpeng 800 official product information', url: 'https://www.topxgun.com/h-col-141.html', type: 'official_product' },
      { label: 'Fengpeng 800 official product information', url: 'https://www.topxgun.com/h-col-179.html', type: 'official_product' },
      { label: 'C15 official cleaning drone product information', url: 'https://www.topxgun.com/h-col-163.html', type: 'official_product' },
      { label: 'Official catalogue and product-family navigation', url: 'https://www.topxgun.com/', type: 'official_company' },
    ],
  },
]

export const getSupplierProfile = (slug: string) => SUPPLIER_PROFILES.find((profile) => profile.slug === slug)

export const getSupplierProfileByProductSlug = (productSlug: string) =>
  SUPPLIER_PROFILES.find((profile) => profile.linkedProducts.some((product) => product.slug === productSlug))
