import { watch, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { supabase } from '../supabase/client'
import i18nInstance from '../i18n'
import en from '../i18n/en.json'
import es from '../i18n/es.json'
import de from '../i18n/de.json'
import fr from '../i18n/fr.json'

const IMAGES_KEY = '__images'
const STATIC: Record<string, any> = { en, es, de, fr }
const staticNs = (lang: string, ns: string) => STATIC[lang]?.[ns] ?? {}
// cache key: `${ns}::${lang}`
const cache = new Map<string, any>()

// 所有可编辑的顶层命名空间
export const EDITABLE_NAMESPACES = [
  'nav', 'hero', 'stats', 'products', 'cases', 'news', 'contact',
  'about', 'documents', 'footer', 'topBar', 'd15r',
]

// 图片覆盖：按 lang 分组的 reactive 对象，组件直接读写
export const imgOverridesByLang = reactive<Record<string, Record<string, string>>>({})

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
  const textOverrides = { ...overrideTree }
  delete textOverrides[IMAGES_KEY]

  const msgs = i18nInstance.global.getLocaleMessage(lang) as any
  const base = JSON.parse(JSON.stringify(msgs?.[ns] ?? {}))
  const merged = deepMerge(base, textOverrides)
  i18nInstance.global.setLocaleMessage(lang, { ...msgs, [ns]: merged })

  // 图片覆盖合并进全局（所有 namespace 的 __images 都汇总到 imgOverridesByLang[lang]）
  if (images && typeof images === 'object') {
    imgOverridesByLang[lang] = { ...(imgOverridesByLang[lang] || {}), ...images }
  }
}

async function loadAndMerge(lang: string) {
  // 清空本语言的图片覆盖，重新合并
  imgOverridesByLang[lang] = {}

  // 先同步应用所有缓存命中项（避免任何延迟）
  const uncached: string[] = []
  for (const ns of EDITABLE_NAMESPACES) {
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
}

/**
 * 公开访客侧：监听 locale 变化，自动把 D15R 覆盖项深合并进 i18n。
 * 登录与否都能看到已发布内容。
 */
export function useLandingContent() {
  const { locale } = useI18n()
  watch(locale, (l) => { loadAndMerge(l) }, { immediate: true, flush: 'pre' })
}

/** 计算相对静态默认值的差异（只存被改动过的叶子），跳过 __images 键。 */
function diffAgainst(base: any, edited: any): any {
  if (edited === null || typeof edited !== 'object') {
    return edited !== base ? edited : undefined
  }
  const out: any = Array.isArray(edited) ? [] : {}
  let changed = false
  for (const k of Object.keys(edited)) {
    if (k === IMAGES_KEY) continue
    const v = diffAgainst(base?.[k], edited[k])
    if (v !== undefined) {
      out[k] = v
      changed = true
    }
  }
  return changed ? out : undefined
}

/** 管理员：保存单个命名空间（diff 仅存差异 + 图片覆盖序列化到 __images）。 */
export async function saveEditableNamespace(
  ns: string,
  lang: string,
  editedText: object,
  images?: Record<string, string>,
): Promise<void> {
  const diff = diffAgainst(staticNs(lang, ns), editedText) ?? {}
  // 仅保留属于该命名空间的图片覆盖（key 以 ns. 开头）
  if (images) {
    const nsImages = Object.fromEntries(
      Object.entries(images).filter(([k]) => k === ns || k.startsWith(ns + '.')),
    )
    if (Object.keys(nsImages).length > 0) diff[IMAGES_KEY] = nsImages
  }
  const { error } = await supabase
    .from('landing_content')
    .upsert(
      { namespace: ns, lang, content: diff },
      { onConflict: 'namespace,lang' },
    )
  if (error) throw error
  cache.set(`${ns}::${lang}`, diff)
  applyNamespaceOverrides(lang, ns, diff)
}

/** 兼容旧调用：保存 d15r 命名空间。 */
export async function saveEditableD15r(
  lang: string,
  editedText: object,
  images?: Record<string, string>,
): Promise<void> {
  return saveEditableNamespace('d15r', lang, editedText, images)
}

/** 一次性保存所有命名空间。收集当前 i18n 消息树中所有可编辑 ns 的改动。 */
export async function saveAllNamespaces(lang: string): Promise<void> {
  const msgs = i18nInstance.global.getLocaleMessage(lang) as any
  const allImages = imgOverridesByLang[lang] || {}
  for (const ns of EDITABLE_NAMESPACES) {
    const tree = msgs?.[ns]
    if (!tree) continue
    await saveEditableNamespace(ns, lang, JSON.parse(JSON.stringify(tree)), allImages)
  }
}
