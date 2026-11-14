// 产品页搜索意图元数据（<title> / meta description）。
//
// 为什么单独维护：可见 H1 来自 i18n / CMS，改标题标签不应该连带改页面文案，
// 也不应该依赖线上 landing_content 的覆盖层。英语按真实商业搜索词手写
// （facade cleaning drone / solar panel cleaning drone / heavy-lift cargo drone /
// agricultural spraying drone）；其他语言继续使用本地化 hero 文案，只做规范化，
// 避免未经母语审校的机翻进入搜索结果。
export interface ProductSeoCopy {
  title: string
  description: string
}

const EN: Record<string, ProductSeoCopy> = {
  d15r: {
    title: 'D15R Tethered Facade & Window Cleaning Drone | Partdro',
    description:
      'Tethered facade and window cleaning drone: 20 MPa pressure, up to 1,000 m²/h and a 100 m hose. No scaffolding or rope access. Request a quote.',
  },
  c15: {
    title: 'C15 High-Pressure Facade Cleaning Drone | Partdro',
    description:
      '16 MPa high-pressure cleaning drone with a 120 m hose and up to 100 m working height for facades, glass curtain walls and wind turbine blades.',
  },
  d50r: {
    title: 'D50R Solar Panel Cleaning Drone | Partdro',
    description:
      'Autonomous solar panel cleaning drone with a 50 L tank, dual RTK positioning and route planning for large photovoltaic plants.',
  },
  'c500-delivery-drone': {
    title: 'C500 Heavy-Lift Cargo Drone – 240 kg Payload | Partdro',
    description:
      'Heavy-lift cargo drone with 240 kg single-aircraft payload and 720 kg cluster lift for construction, emergency and remote logistics.',
  },
  'sl80-delivery-drone': {
    title: 'SL80 Heavy Cargo Drone – 80 kg Payload | Partdro',
    description:
      'Long-endurance cargo drone with an 80 kg payload, up to 30 minutes of flight time and swappable semi-solid-state batteries for remote resupply.',
  },
  'y160-delivery-drone': {
    title: 'Y160 Tethered Cargo Drone – 165 kg Lift | Partdro',
    description:
      'Industrial cargo drone with a 15 m lifting cable and 165 kg lifting capacity for power-line, construction and mountain transport.',
  },
  'yp800-delivery-drone': {
    title: 'YP800 Low-Altitude Cargo Transport Drone | Partdro',
    description:
      'Multi-configuration low-altitude cargo transport drone with long endurance and intelligent operation for heavy-payload logistics.',
  },
  'fp800-agricultural-drone': {
    title: 'FP800 Agricultural Spraying & Seeding Drone | Partdro',
    description:
      'Agricultural drone with an 80 L spray tank and 120 L spreader on one airframe for crop protection, fertilizing and seeding.',
  },
}

/** 标题尾部常见的悬空标点（CMS 里遗留的 "Heavy Payload,"） */
function cleanTitlePart(value: string): string {
  return value.replace(/[\s,;:–—-]+$/u, '').trim()
}

/** meta description 截断：优先在词边界结束，避免硬切单词 */
function clampDescription(value: string, max = 160): string {
  const clean = value.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(' ')
  return `${cut.slice(0, lastSpace > max * 0.6 ? lastSpace : cut.length)}…`
}

/**
 * @param fallbackTitle 例：`D15R - Window & Facade Cleaning Drone`（不含站点名）
 * @param fallbackDescription 例：`D15R - Tethered facade ...`
 */
export function productSeo(
  slug: string,
  locale: string,
  fallbackTitle: string,
  fallbackDescription: string,
): ProductSeoCopy {
  if (locale === 'en' && EN[slug]) return EN[slug]
  return {
    title: `${cleanTitlePart(fallbackTitle)} | Partdro`,
    description: clampDescription(fallbackDescription),
  }
}
