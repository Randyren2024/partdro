// C500 备用落地页的静态结构数据（从独立项目的 src/data/c500.js 迁移）。
// 所有中文显示文案已移出，统一走 i18n 命名空间 c500eavision；此文件只保留
// 资源路径、结构字段与语言中性的数值/编号。

export const ASSET_BASE =
  'https://eavision-front-prod.oss-cn-hangzhou.aliyuncs.com/guanwang/products/new/c500/'
export const VIDEO_BASE = `${ASSET_BASE}video/`

export const img = (name: string): string => `${ASSET_BASE}${name}@2x.png`
export const vid = (index: number): string => `${VIDEO_BASE}${index}.mp4`

export const heroImage = img('hero')
export const heroVideo = `${VIDEO_BASE}dy.mp4`
export const technologyImage = img('technology')

export interface Ability {
  key: string
  image: string
  video?: string
}

export const abilities: Ability[] = [
  { key: 'payload', image: img('ability-payload'), video: vid(1) },
  { key: 'speed', image: img('ability-speed') },
  { key: 'structure', image: img('ability-short'), video: vid(2) },
  { key: 'perception', image: img('ability-short'), video: vid(3) },
  { key: 'decision', image: img('ability-decision'), video: vid(4) },
  { key: 'battery', image: img('ability-battery') },
  { key: 'cluster', image: img('ability-cluster') },
  { key: 'applications', image: img('ability-applications') }
]

export interface PowerMetric {
  value: string
  note?: number
}

export const powerMetrics: PowerMetric[] = [
  { value: '240' },
  { value: '90', note: 4 },
  { value: '6000', note: 5 },
  { value: '6' }
]

export interface Story {
  id: string
  image: string
  video?: string
  i18nKey: string
  metrics?: boolean
}

// 首个故事（含动力参数看板）
export const performanceStory: Story = {
  id: 'c500-performance',
  image: `${ASSET_BASE}dlgx.png`,
  video: '',
  i18nKey: 'performance',
  metrics: true
}

const storyPlaceholder = img('story-placeholder')

export const stories: Story[] = [
  { id: 'c500-energy-story', image: storyPlaceholder, video: vid(23), i18nKey: 'energy' },
  { id: 'c500-perception-story', image: storyPlaceholder, video: vid(24), i18nKey: 'perception' },
  { id: 'c500-decision-story', image: storyPlaceholder, video: vid(25), i18nKey: 'decision' },
  { id: 'c500-cluster-story', image: storyPlaceholder, video: vid(26), i18nKey: 'cluster' },
  { id: 'c500-functions-story', image: img('functions-background'), video: '', i18nKey: 'functions' }
]

export interface GalleryPart {
  // 仅保留脚注编号；文案在 i18n 的 detailParts/titleParts.[i].text
  note?: number
}

export interface GalleryItem {
  image: string
  video?: string
  // 脚注编号引用
  notes?: number[]
  detailParts?: GalleryPart[]
  titleParts?: GalleryPart[]
  // 是否存在补充说明段落（文案在 i18n 的 detailNote）
  detailNote?: boolean
}

export interface Gallery {
  name: string
  variant: 'slides' | 'tabs' | 'cards'
  autoplay: boolean
  overlayCaption?: boolean
  items: GalleryItem[]
}

const landscape = img('landscape-placeholder')

export const galleries: Record<string, Gallery> = {
  power: {
    name: 'power',
    variant: 'slides',
    autoplay: true,
    items: [
      { image: img('power-front'), video: vid(21) },
      { detailParts: [{ note: 3 }, { note: 3 }], image: img('power-structure'), video: vid(22) }
    ]
  },
  energy: {
    name: 'energy',
    variant: 'tabs',
    autoplay: true,
    items: [
      { notes: [10], image: landscape, video: vid(5) },
      { notes: [1], image: landscape, video: vid(6) },
      { detailParts: [{ note: 5 }, {}], detailNote: true, image: img('energy-altitude') }
    ]
  },
  perception: {
    name: 'perception',
    variant: 'tabs',
    autoplay: false,
    items: [
      { image: landscape, video: vid(7) },
      { image: landscape, video: vid(8) },
      { image: landscape, video: vid(9) },
      { image: landscape, video: vid(10) }
    ]
  },
  cluster: {
    name: 'cluster',
    variant: 'slides',
    autoplay: true,
    overlayCaption: true,
    items: [
      { titleParts: [{ note: 6 }, {}], image: landscape, video: vid(20) },
      { image: landscape, video: vid(14) },
      { image: img('cluster-quad') }
    ]
  },
  functions: {
    name: 'functions',
    variant: 'cards',
    autoplay: true,
    items: [
      { detailParts: [{ note: 2 }, {}], image: img('function-placeholder'), video: vid(15) },
      { image: img('function-placeholder'), video: vid(16) },
      { notes: [7], image: img('function-placeholder'), video: vid(17) },
      { image: img('function-airlift'), video: vid(18) },
      { notes: [6], image: img('function-airlift'), video: vid(19) }
    ]
  }
}

export interface Decision {
  image: string
  video?: string
}

export const decisions: Decision[] = [
  { image: img('decision-placeholder'), video: vid(11) },
  { image: img('decision-placeholder'), video: vid(12) },
  { image: img('decision-placeholder'), video: vid(13) }
]

export interface Application {
  image: string
}

export const applications: Application[] = [
  { image: img('application-solar') },
  { image: img('application-timber') },
  { image: img('application-steel') },
  { image: img('application-emergency') }
]

export interface Package {
  image: string
}

export const packages: Package[] = [
  { image: img('package-standard-charger') },
  { image: img('package-standard-station') },
  { image: img('package-airlift-charger') },
  { image: img('package-airlift-station') }
]

export interface Specification {
  // 语言中性的数值/单位；描述性取值留空，文案在 i18n 的 specifications.[i].value
  value: string
}

export const specifications: Specification[] = [
  { value: '240 kg' },
  { value: '120 kg' },
  { value: '' },
  { value: '' },
  { value: '720 kg' },
  { value: '90 km/h' },
  { value: '' },
  { value: 'IP55' },
  { value: '' },
  { value: '' },
  { value: '' },
  { value: '' },
  { value: '' },
  { value: '' },
  { value: '' },
  { value: '' }
]

export interface Note {
  // 子条目索引；文案在 i18n 的 notes.[i].extra.[j]
  extra?: number[]
}

export const notes: Note[] = [
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  { extra: [0, 1, 2] },
  {},
  {}
]