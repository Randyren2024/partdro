export const SECTION_IDS = [
  'hero',
  'strip',
  'why',
  'designed',
  'output',
  'spray',
  'intelligence',
  'safety',
  'multiangle',
  'compare',
  'applications',
  'scenarios',
  'video',
  'kit',
  'specs',
  'cta',
] as const

export type SectionId = (typeof SECTION_IDS)[number]

export const SECTION_LABELS: Record<SectionId, string> = {
  hero: 'Hero banner',
  strip: 'Key stats',
  why: 'Why this product',
  designed: 'Design highlights',
  output: 'Performance',
  spray: 'Key features',
  intelligence: 'Smart features',
  safety: 'Safety',
  multiangle: 'Flexible design',
  compare: 'Comparison',
  applications: 'Applications',
  scenarios: 'Use cases',
  video: 'Video',
  kit: 'Kit contents',
  specs: 'Specifications',
  cta: 'Call to action',
}

export interface SectionLayoutItem {
  id: SectionId
  visible: boolean
}

/** 新产品默认：空白页（不预选任何区块）。 */
export function defaultSectionLayout(): SectionLayoutItem[] {
  return []
}

/** 完整默认顺序（legacy 产品页如 d15r 在未存布局时的回退）。 */
export function fullSectionLayout(): SectionLayoutItem[] {
  return SECTION_IDS.map((id) => ({ id, visible: true }))
}

export function isSectionId(v: unknown): v is SectionId {
  return typeof v === 'string' && (SECTION_IDS as readonly string[]).includes(v)
}

/** 规范化外部载入的 layout：过滤非法 id、去重；空数组合法（空白页）。 */
export function normalizeSectionLayout(raw: unknown): SectionLayoutItem[] | null {
  if (!Array.isArray(raw)) return null
  if (raw.length === 0) return []
  const seen = new Set<string>()
  const out: SectionLayoutItem[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const id = (item as any).id
    if (!isSectionId(id) || seen.has(id)) continue
    seen.add(id)
    out.push({ id, visible: (item as any).visible !== false })
  }
  return out
}
