import { watch, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { supabase } from '../supabase/client'
import i18nInstance from '../i18n'
import en from '../i18n/en.json'
import es from '../i18n/es.json'
import de from '../i18n/de.json'
import fr from '../i18n/fr.json'

const NS = 'd15r'
const IMAGES_KEY = '__images'
const STATIC: Record<string, any> = { en, es, de, fr }
const staticD15r = (lang: string) => STATIC[lang]?.[NS] ?? {}
const cache = new Map<string, any>() // 存原始 content（含 __images）

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
function applyOverrides(lang: string, overrideTree: any) {
  // 提取 __images（不作为 i18n 消息的一部分）
  const images = overrideTree?.[IMAGES_KEY]
  const textOverrides = { ...overrideTree }
  delete textOverrides[IMAGES_KEY]

  const msgs = i18nInstance.global.getLocaleMessage(lang) as any
  const baseD15r = msgs?.[NS] ?? {}
  const merged = deepMerge(baseD15r, textOverrides)
  i18nInstance.global.setLocaleMessage(lang, { ...msgs, [NS]: merged })

  // 恢复图片覆盖
  if (images && typeof images === 'object') {
    imgOverridesByLang[lang] = { ...images }
  } else if (!imgOverridesByLang[lang]) {
    imgOverridesByLang[lang] = {}
  }
}

async function loadAndMerge(lang: string) {
  try {
    const cached = cache.get(lang)
    if (cached) {
      applyOverrides(lang, cached)
      return
    }
    const { data, error } = await supabase
      .from('landing_content')
      .select('content')
      .eq('namespace', NS)
      .eq('lang', lang)
      .maybeSingle()
    if (error || !data?.content) {
      // 无覆盖：清空图片覆盖
      imgOverridesByLang[lang] = {}
      return
    }
    cache.set(lang, data.content)
    applyOverrides(lang, data.content)
  } catch {
    imgOverridesByLang[lang] = {}
  }
}

/**
 * 公开访客侧：监听 locale 变化，自动把 D15R 覆盖项深合并进 i18n。
 * 登录与否都能看到已发布内容。
 */
export function useLandingContent() {
  const { locale } = useI18n()
  watch(locale, (l) => { loadAndMerge(l) }, { immediate: true, flush: 'post' })
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

/** 管理员：保存（diff 仅存差异 + 图片覆盖序列化到 __images）。 */
export async function saveEditableD15r(
  lang: string,
  editedText: object,
  images?: Record<string, string>,
): Promise<void> {
  const diff = diffAgainst(staticD15r(lang), editedText) ?? {}
  if (images && Object.keys(images).length > 0) {
    diff[IMAGES_KEY] = images
  }
  const { error } = await supabase
    .from('landing_content')
    .upsert(
      { namespace: NS, lang, content: diff },
      { onConflict: 'namespace,lang' },
    )
  if (error) throw error
  cache.set(lang, diff)
  applyOverrides(lang, diff)
}
