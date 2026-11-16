import supplierSource from './suppliers.json'

export interface SupplierRecord {
  id: string
  name: string
  name_en?: string
  region: string
  province: string
  city: string
  district?: string
  segment: string
  category: string
  category_label: string
  note?: string
  product_models?: string[]
  website?: string
  contact_email?: string
  status: string
}

export const SUPPLIERS = supplierSource.suppliers as SupplierRecord[]
export const SUPPLIER_UPDATED = supplierSource.updated || '2026-11-15'
export const SUPPLIER_CATEGORIES = supplierSource.categories as Record<string, string>

export const SUPPLIER_REGIONS = [
  {
    slug: 'north',
    key: '北方',
    names: { en: 'Northern China', de: 'Nordchina', es: 'Norte de China', fr: 'Nord de la Chine' },
    descriptions: {
      en: 'Browse UAV manufacturers, component suppliers, flight-control specialists and service providers listed across Northern China.',
      de: 'Entdecken Sie gelistete UAV-Hersteller, Komponentenlieferanten, Flugsteuerungsspezialisten und Dienstleister in Nordchina.',
      es: 'Explore fabricantes de UAV, proveedores de componentes, especialistas en control de vuelo y proveedores de servicios del norte de China.',
      fr: 'Découvrez les fabricants de drones, fournisseurs de composants, spécialistes du contrôle de vol et prestataires répertoriés dans le nord de la Chine.',
    },
  },
  {
    slug: 'yangtze-river-delta',
    key: '长三角',
    names: { en: 'Yangtze River Delta', de: 'Jangtse-Delta', es: 'Delta del Yangtsé', fr: 'Delta du Yangtsé' },
    descriptions: {
      en: 'Explore UAV and low-altitude aviation companies listed across the Yangtze River Delta, with city, capability and industry filters.',
      de: 'Entdecken Sie gelistete UAV- und Low-Altitude-Aviation-Unternehmen im Jangtse-Delta, filterbar nach Stadt, Kompetenz und Branche.',
      es: 'Explore empresas de UAV y aviación de baja altitud del delta del Yangtsé, con filtros por ciudad, capacidad e industria.',
      fr: 'Explorez les entreprises de drones et d’aviation basse altitude du delta du Yangtsé, avec des filtres par ville, compétence et secteur.',
    },
  },
  {
    slug: 'pearl-river-delta',
    key: '珠三角',
    names: { en: 'Pearl River Delta', de: 'Perlflussdelta', es: 'Delta del río Perla', fr: 'Delta de la rivière des Perles' },
    descriptions: {
      en: 'Browse the UAV companies listed in the Pearl River Delta, including aircraft, industrial systems, components and specialist services.',
      de: 'Durchsuchen Sie die im Perlflussdelta gelisteten UAV-Unternehmen aus den Bereichen Fluggeräte, Industriesysteme, Komponenten und Spezialdienste.',
      es: 'Consulte las empresas de UAV del delta del río Perla, incluidos fabricantes de aeronaves, sistemas industriales, componentes y servicios especializados.',
      fr: 'Consultez les entreprises de drones répertoriées dans le delta de la rivière des Perles : aéronefs, systèmes industriels, composants et services spécialisés.',
    },
  },
] as const

export const SUPPLIER_UI = {
  en: {
    title: 'UAV Supplier Directory',
    subtitle: 'Explore a structured directory of 249 UAV and low-altitude aviation companies across three major regions of China.',
    search: 'Search company, city, capability or product',
    region: 'Region',
    allRegions: 'All regions',
    category: 'Industry',
    allCategories: 'All industries',
    count: 'companies listed',
    city: 'Location',
    capability: 'Business focus',
    note: 'Directory note',
    listed: 'Directory listing · verification pending',
    source: 'Source: regional UAV company spreadsheets. Company details are listed for research and discovery; independent verification is ongoing.',
    updated: 'Dataset updated',
    empty: 'No companies match these filters.',
    clear: 'Clear filters',
    browse: 'Browse regional directories',
    back: 'All suppliers',
    regionIntro: 'This regional index brings together company records from the supplied industry directory. Use search and industry filters to narrow the list. Listings are not endorsements or confirmations of current operating status.',
  },
  de: {
    title: 'UAV-Unternehmensverzeichnis',
    subtitle: 'Ein strukturiertes Verzeichnis von 249 UAV- und Low-Altitude-Aviation-Unternehmen in drei wichtigen Regionen Chinas.',
    search: 'Unternehmen, Stadt, Kompetenz oder Produkt suchen',
    region: 'Region',
    allRegions: 'Alle Regionen',
    category: 'Branche',
    allCategories: 'Alle Branchen',
    count: 'Unternehmen gelistet',
    city: 'Standort',
    capability: 'Geschäftsschwerpunkt',
    note: 'Verzeichnishinweis',
    listed: 'Verzeichniseintrag · Prüfung ausstehend',
    source: 'Quelle: regionale UAV-Unternehmenslisten. Die Angaben dienen der Recherche; eine unabhängige Überprüfung läuft.',
    updated: 'Datenstand',
    empty: 'Keine Unternehmen entsprechen den Filtern.',
    clear: 'Filter zurücksetzen',
    browse: 'Regionale Verzeichnisse',
    back: 'Alle Anbieter',
    regionIntro: 'Dieser regionale Index bündelt Unternehmenseinträge aus dem bereitgestellten Branchenverzeichnis. Die Einträge sind keine Empfehlung und bestätigen nicht den aktuellen Geschäftsbetrieb.',
  },
  es: {
    title: 'Directorio de proveedores UAV',
    subtitle: 'Un directorio estructurado de 249 empresas de UAV y aviación de baja altitud en tres regiones clave de China.',
    search: 'Buscar empresa, ciudad, capacidad o producto',
    region: 'Región',
    allRegions: 'Todas las regiones',
    category: 'Industria',
    allCategories: 'Todas las industrias',
    count: 'empresas incluidas',
    city: 'Ubicación',
    capability: 'Actividad principal',
    note: 'Nota del directorio',
    listed: 'Registro en directorio · verificación pendiente',
    source: 'Fuente: hojas de cálculo regionales de empresas UAV. Los datos se ofrecen para investigación; la verificación independiente está en curso.',
    updated: 'Datos actualizados',
    empty: 'Ninguna empresa coincide con estos filtros.',
    clear: 'Borrar filtros',
    browse: 'Directorios regionales',
    back: 'Todos los proveedores',
    regionIntro: 'Este índice regional reúne registros del directorio industrial proporcionado. Los registros no constituyen recomendaciones ni confirman la actividad comercial actual.',
  },
  fr: {
    title: 'Annuaire des fournisseurs de drones',
    subtitle: 'Un répertoire structuré de 249 entreprises de drones et d’aviation basse altitude dans trois grandes régions de Chine.',
    search: 'Rechercher une entreprise, une ville, une compétence ou un produit',
    region: 'Région',
    allRegions: 'Toutes les régions',
    category: 'Secteur',
    allCategories: 'Tous les secteurs',
    count: 'entreprises répertoriées',
    city: 'Localisation',
    capability: 'Activité principale',
    note: 'Note de l’annuaire',
    listed: 'Entrée de l’annuaire · vérification en attente',
    source: 'Source : fichiers régionaux des entreprises de drones. Les données sont fournies à des fins de recherche ; la vérification indépendante est en cours.',
    updated: 'Données mises à jour',
    empty: 'Aucune entreprise ne correspond à ces filtres.',
    clear: 'Effacer les filtres',
    browse: 'Annuaires régionaux',
    back: 'Tous les fournisseurs',
    regionIntro: 'Cet index régional rassemble les entrées du répertoire sectoriel fourni. Ces entrées ne constituent pas une recommandation et ne confirment pas l’activité actuelle des entreprises.',
  },
} as const

export const SUPPLIER_CATEGORY_LABELS: Record<string, Record<string, string>> = {
  en: {
    evtol: 'eVTOL & Flying Cars', agricultural: 'Agricultural Spraying', logistics: 'Logistics & Delivery',
    industrial: 'Industrial & Enterprise', helicopter: 'Unmanned Helicopters', fixed_wing: 'Fixed-Wing & VTOL',
    consumer: 'Consumer & Aerial', flight_control: 'Flight Control & Avionics', components: 'Components & Materials',
    services: 'Training & Services', defense: 'Defense & Security', other: 'Other',
  },
  de: {
    evtol: 'eVTOL & Flugautos', agricultural: 'Landwirtschaftliche Sprühtechnik', logistics: 'Logistik & Lieferung',
    industrial: 'Industrie & Unternehmen', helicopter: 'Unbemannte Hubschrauber', fixed_wing: 'Flächenflugzeuge & VTOL',
    consumer: 'Consumer & Luftbild', flight_control: 'Flugsteuerung & Avionik', components: 'Komponenten & Materialien',
    services: 'Schulung & Dienstleistungen', defense: 'Verteidigung & Sicherheit', other: 'Sonstiges',
  },
  es: {
    evtol: 'eVTOL y coches voladores', agricultural: 'Aplicaciones agrícolas', logistics: 'Logística y entrega',
    industrial: 'Industria y empresas', helicopter: 'Helicópteros no tripulados', fixed_wing: 'Ala fija y VTOL',
    consumer: 'Consumo y fotografía aérea', flight_control: 'Control de vuelo y aviónica', components: 'Componentes y materiales',
    services: 'Formación y servicios', defense: 'Defensa y seguridad', other: 'Otros',
  },
  fr: {
    evtol: 'eVTOL et voitures volantes', agricultural: 'Pulvérisation agricole', logistics: 'Logistique et livraison',
    industrial: 'Industrie et entreprises', helicopter: 'Hélicoptères sans pilote', fixed_wing: 'Aile fixe et VTOL',
    consumer: 'Grand public et imagerie aérienne', flight_control: 'Commande de vol et avionique', components: 'Composants et matériaux',
    services: 'Formation et services', defense: 'Défense et sécurité', other: 'Autres',
  },
}
