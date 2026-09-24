import { ref } from 'vue'
import i18nInstance from '../i18n'
import { imgOverridesByLang, videoOverridesByLang, saveAllNamespaces } from './useLandingContent'

// 模块级单例状态（跨组件共享）
export const dirty = ref(false)
export const saving = ref(false)

/** 将点路径 key（如 "hero.title" 或 "d15r.hero.kicker"）写入 i18n 消息树 */
export function applyTextEdit(key: string, value: string) {
  const parts = key.split('.')
  const lang = i18nInstance.global.locale.value as string
  const messages = i18nInstance.global.getLocaleMessage(lang) as any
  let node = messages
  for (let i = 0; i < parts.length - 1; i++) {
    if (!node[parts[i]]) node[parts[i]] = {}
    node = node[parts[i]]
  }
  node[parts[parts.length - 1]] = value
  i18nInstance.global.setLocaleMessage(lang, messages)
  dirty.value = true
}

/** 写入图片覆盖（key 为命名空间路径，value 为完整 URL、/ 开头路径或纯文件名） */
export function applyImgEdit(key: string, value: string) {
  const lang = i18nInstance.global.locale.value as string
  if (!imgOverridesByLang[lang]) imgOverridesByLang[lang] = {}
  imgOverridesByLang[lang] = { ...imgOverridesByLang[lang], [key]: value }
  dirty.value = true
}

/** 写入视频覆盖（key 为命名空间路径，value 为 MP4/WebM 直链或 YouTube/Bilibili 链接；空串清除） */
export function applyVideoEdit(key: string, value: string) {
  const lang = i18nInstance.global.locale.value as string
  if (!videoOverridesByLang[lang]) videoOverridesByLang[lang] = {}
  videoOverridesByLang[lang] = { ...videoOverridesByLang[lang], [key]: value }
  dirty.value = true
}

/** 保存所有命名空间到 Supabase */
export async function saveAll(): Promise<void> {
  saving.value = true
  try {
    const lang = i18nInstance.global.locale.value as string
    await saveAllNamespaces(lang, videoOverridesByLang[lang] || {})
    dirty.value = false
  } catch (e) {
    console.error('Save failed:', e)
    throw e
  } finally {
    saving.value = false
  }
}

/** 重载页面（丢弃未保存改动） */
export function reload() {
  dirty.value = false
  location.reload()
}
