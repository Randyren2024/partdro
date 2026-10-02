import { watch, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { supabase } from '../supabase/client'
import { callFunction } from '../lib/netlifyApi'
import i18nInstance from '../i18n'
import en from '../i18n/en.json'
import es from '../i18n/es.json'
import de from '../i18n/de.json'
import fr from '../i18n/fr.json'
import { defaultLandingTemplate } from '../i18n/landingTemplate'
import {
  defaultSectionLayout,
  fullSectionLayout,
  normalizeSectionLayout,
  type SectionLayoutItem,
} from '../components/product/sectionIds'

const IMAGES_KEY = '__images'
const VIDEOS_KEY = '__videos'
const LAYOUT_KEY = '__layout'
const STATIC: Record<string, any> = { en, es, de, fr }
// cache key: `${ns}::${lang}`
const cache = new Map<string, any>()

// 所有可编辑的静态顶层命名空间
export const EDITABLE_NAMESPACES = [
  'nav', 'hero', 'stats', 'products', 'cases', 'news', 'contact',
  'about', 'documents', 'footer', 'topBar', 'd15r',
]

// 新产品动态命名空间（/admin/products 创建后注册，i18n 基底来自 defaultLandingTemplate）
const dynamicNamespaces = new Set<string>()
const allNamespaces = () => [...EDITABLE_NAMESPACES, ...dynamicNamespaces]

const staticNs = (lang: string, ns: string) =>
  STATIC[lang]?.[ns] ?? (dynamicNamespaces.has(ns) ? defaultLandingTemplate() : {})

// 图片/视频覆盖：按 lang 分组的 reactive 对象，组件直接读写
export const imgOverridesByLang = reactive<Record<string, Record<string, string>>>({})
export const videoOverridesByLang = reactive<Record<string, Record<string, string>>>({})
// 区块布局（顺序 + 显隐）：按 ns 存储，语言无关（保存时写入所有已保存 lang 的 content）
export const layoutByNs = reactive<Record<string, SectionLayoutItem[]>>({})

export function getSectionLayout(ns: string): SectionLayoutItem[] {
  const stored = layoutByNs[ns]
  if (stored) return stored
  // legacy 产品页（d15r）未存布局时仍显示全部区块；新产品默认空白
  if (ns === 'd15r') return fullSectionLayout()
  return defaultSectionLayout()
}

export function setSectionLayout(ns: string, items: SectionLayoutItem[]) {
  layoutByNs[ns] = items.map((it) => ({ ...it }))
}

function isPlainObject(v: any): v is Record<string, any> {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
}
function deepMerge(base: any, override: any): any {
  if (!isPlainObject(override)) return override
  const out: any = isPlainObject(base) ? { ...base } : {}
  for (const k of Object.keys(override)) {
    out[k] = k in out ? deepMerge(out[k], override[k]) : override[k]
  }
  return out
}
function applyNamespaceOverrides(lang: string, ns: string, overrideTree: any) {
  const images = overrideTree?.[IMAGES_KEY]
  const videos = overrideTree?.[VIDEOS_KEY]
  const layout = normalizeSectionLayout(overrideTree?.[LAYOUT_KEY])
  const textOverrides = { ...overrideTree }
  delete textOverrides[IMAGES_KEY]
  delete textOverrides[VIDEOS_KEY]
  delete textOverrides[LAYOUT_KEY]

  const msgs = i18nInstance.global.getLocaleMessage(lang) as any
  const base = JSON.parse(JSON.stringify(msgs?.[ns] ?? {}))
  const merged = deepMerge(base, textOverrides)
  i18nInstance.global.setLocaleMessage(lang, { ...msgs, [ns]: merged })

  // 图片/视频覆盖合并进全局（所有 namespace 的 __images/__videos 都按 lang 汇总）
  if (images && typeof images === 'object') {
    imgOverridesByLang[lang] = { ...(imgOverridesByLang[lang] || {}), ...images }
  }
  if (videos && typeof videos === 'object') {
    videoOverridesByLang[lang] = { ...(videoOverridesByLang[lang] || {}), ...videos }
  }
  // 布局语言无关：任一 lang 带有合法 __layout 都覆盖当前 ns 的布局
  if (layout) {
    layoutByNs[ns] = layout
  }
}

async function loadAndMerge(lang: string) {
  // 清空本语言的图片/视频覆盖，重新合并
  imgOverridesByLang[lang] = {}
  videoOverridesByLang[lang] = {}

  // 先同步应用所有缓存命中项（避免任何延迟）
  const uncached: string[] = []
  for (const ns of allNamespaces()) {
    const cacheKey = `${ns}::${lang}`
    const cached = cache.get(cacheKey)
    if (cached) {
      applyNamespaceOverrides(lang, ns, cached)
    } else {
      uncached.push(ns)
    }
  }

  // 并行请求所有未缓存的命名空间
  const results = await Promise.all(
    uncached.map(async (ns) => {
      try {
        const { data, error } = await supabase
          .from('landing_content')
          .select('content')
          .eq('namespace', ns)
          .eq('lang', lang)
          .maybeSingle()
        if (error || !data?.content) return null
        cache.set(`${ns}::${lang}`, data.content)
        return { ns, content: data.content }
      } catch {
        return null
      }
    }),
  )
  // 统一应用，一次 setLocaleMessage 触发一次重渲染
  for (const r of results) {
    if (r) applyNamespaceOverrides(lang, r.ns, r.content)
  }

  // 布局语言无关：当前语言没有 __layout 的 ns，从 en 行补拉
  await ensureLayoutFromEn(lang)
  // 图片/视频覆盖：当前语言缺键时从 en 行按键级补齐（当前语言已覆盖的键优先）
  await ensureMediaFromEn(lang)
  // 产品页命名空间：en 也无 __layout 时，新产品保持空白；d15r legacy 回退全量
  const productNs = ['d15r', ...dynamicNamespaces]
  for (const ns of productNs) {
    if (!layoutByNs[ns]) layoutByNs[ns] = ns === 'd15r' ? fullSectionLayout() : []
  }
}

/** 为缺少布局的命名空间从 en 的 landing_content 行拉取 __layout。 */
async function ensureLayoutFromEn(lang: string) {
  if (lang === 'en') return
  const missing = allNamespaces().filter((ns) => !layoutByNs[ns])
  if (missing.length === 0) return
  const results = await Promise.all(
    missing.map(async (ns) => {
      try {
        const { data, error } = await supabase
          .from('landing_content')
          .select('content')
          .eq('namespace', ns)
          .eq('lang', 'en')
          .maybeSingle()
        if (error || !data?.content) return null
        const layout = normalizeSectionLayout(data.content?.[LAYOUT_KEY])
        return layout ? { ns, layout } : null
      } catch {
        return null
      }
    }),
  )
  for (const r of results) {
    if (r) layoutByNs[r.ns] = r.layout
  }
}

/** 取某个命名空间的 en 行内容（带缓存），供媒体回退使用。 */
async function getEnContent(ns: string): Promise<any> {
  const cacheKey = `${ns}::en`
  const cached = cache.get(cacheKey)
  if (cached) return cached
  try {
    const { data, error } = await supabase
      .from('landing_content')
      .select('content')
      .eq('namespace', ns)
      .eq('lang', 'en')
      .maybeSingle()
    if (error || !data?.content) return null
    cache.set(cacheKey, data.content)
    return data.content
  } catch {
    return null
  }
}

/**
 * 图片/视频覆盖语言回退：__images/__videos 不走 vue-i18n fallbackLocale，
 * 非 en 语言没有 (ns, lang) 行（或行内缺键）时，从 en 行按键级补齐。
 * 当前语言已覆盖的键优先，管理端按 lang 保存的部分覆盖不受影响。
 */
async function ensureMediaFromEn(lang: string) {
  if (lang === 'en') return
  const results = await Promise.all(
    allNamespaces().map(async (ns) => {
      const content = await getEnContent(ns)
      if (!content) return null
      const images = content[IMAGES_KEY]
      const videos = content[VIDEOS_KEY]
      if (!isPlainObject(images) && !isPlainObject(videos)) return null
      return {
        images: isPlainObject(images) ? (images as Record<string, string>) : null,
        videos: isPlainObject(videos) ? (videos as Record<string, string>) : null,
      }
    }),
  )
  for (const r of results) {
    if (!r) continue
    if (r.images) {
      for (const [k, v] of Object.entries(r.images)) {
        if (!(k in imgOverridesByLang[lang])) imgOverridesByLang[lang][k] = v
      }
    }
    if (r.videos) {
      for (const [k, v] of Object.entries(r.videos)) {
        if (!(k in videoOverridesByLang[lang])) videoOverridesByLang[lang][k] = v
      }
    }
  }
}

/**
 * 注册一个新产品落地页命名空间：
 * 把默认模板写入 en messages（fallbackLocale 让其他语言回退到它），并拉取其覆盖数据。
 * 由 ProductDetailView 在 ns 变化时调用；对静态命名空间（如 d15r）是空操作。
 */
export function registerProductNamespace(ns: string) {
  if (!dynamicNamespaces.has(ns) && !EDITABLE_NAMESPACES.includes(ns)) {
    dynamicNamespaces.add(ns)
    const enMsgs = i18nInstance.global.getLocaleMessage('en') as any
    if (!enMsgs[ns]) {
      i18nInstance.global.setLocaleMessage('en', { ...enMsgs, [ns]: defaultLandingTemplate() })
    }
    const current = typeof i18nInstance.global.locale === 'string'
      ? i18nInstance.global.locale
      : (i18nInstance.global.locale as any).value
    loadAndMerge(current)
  }
}

/**
 * 公开访客侧：监听 locale 变化，自动把落地页覆盖项深合并进 i18n。
 * 登录与否都能看到已发布内容。
 */
export function useLandingContent() {
  const { locale } = useI18n()
  watch(locale, (l) => { loadAndMerge(l) }, { immediate: true, flush: 'pre' })
}

/** 计算相对静态默认值的差异（只存被改动过的叶子），跳过 __images/__videos 键。 */
function diffAgainst(base: any, edited: any): any {
  if (edited === null || typeof edited !== 'object') {
    return edited !== base ? edited : undefined
  }
  const out: any = Array.isArray(edited) ? [] : {}
  let changed = false
  for (const k of Object.keys(edited)) {
    if (k === IMAGES_KEY || k === VIDEOS_KEY || k === LAYOUT_KEY) continue
    const v = diffAgainst(base?.[k], edited[k])
    if (v !== undefined) {
      out[k] = v
      changed = true
    }
  }
  return changed ? out : undefined
}

/** 管理员：保存单个命名空间（diff 仅存差异 + 图片/视频覆盖序列化到 __images/__videos）。 */
export async function saveEditableNamespace(
  ns: string,
  lang: string,
  editedText: object,
  images?: Record<string, string>,
  videos?: Record<string, string>,
): Promise<void> {
  const diff = diffAgainst(staticNs(lang, ns), editedText) ?? {}
  // 仅保留属于该命名空间的覆盖（key 以 ns. 开头）
  if (images) {
    const nsImages = Object.fromEntries(
      Object.entries(images).filter(([k]) => k === ns || k.startsWith(ns + '.')),
    )
    if (Object.keys(nsImages).length > 0) diff[IMAGES_KEY] = nsImages
  }
  if (videos) {
    const nsVideos = Object.fromEntries(
      Object.entries(videos).filter(([k]) => k === ns || k.startsWith(ns + '.')),
    )
    if (Object.keys(nsVideos).length > 0) diff[VIDEOS_KEY] = nsVideos
  }
  // 区块布局：仅当该 ns 有已存布局或已偏离默认时写入
  const layout = layoutByNs[ns]
  if (layout) {
    diff[LAYOUT_KEY] = layout
  }
  // 空保存保护：无任何差异且数据库也没有已存内容时跳过（防清空/防冗余行）
  const prev = cache.get(`${ns}::${lang}`)
  if (Object.keys(diff).length === 0 && (!prev || Object.keys(prev).length === 0)) return
  await callFunction('landing-content', { namespace: ns, lang, content: diff })
  cache.set(`${ns}::${lang}`, diff)
  applyNamespaceOverrides(lang, ns, diff)
}

/** 兼容旧调用：保存 d15r 命名空间。 */
export async function saveEditableD15r(
  lang: string,
  editedText: object,
  images?: Record<string, string>,
  videos?: Record<string, string>,
): Promise<void> {
  return saveEditableNamespace('d15r', lang, editedText, images, videos)
}

/** 一次性保存所有命名空间。收集当前 i18n 消息树中所有可编辑 ns 的改动。 */
export async function saveAllNamespaces(
  lang: string,
  videos?: Record<string, string>,
): Promise<void> {
  const msgs = i18nInstance.global.getLocaleMessage(lang) as any
  const allImages = imgOverridesByLang[lang] || {}
  for (const ns of allNamespaces()) {
    // 用 ?? {} 而不是 continue：某语言只改图/视频不改文时，改动不能丢
    const tree = msgs?.[ns] ?? {}
    await saveEditableNamespace(
      ns,
      lang,
      JSON.parse(JSON.stringify(tree)),
      allImages,
      videos,
    )
  }
}
