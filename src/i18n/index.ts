import { createI18n } from 'vue-i18n'
import en from './en.json'
import es from './es.json'
import de from './de.json'
import fr from './fr.json'

export const SUPPORTED_LOCALES = ['en', 'es', 'de', 'fr'] as const
export type Locale = (typeof SUPPORTED_LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'en'

export function isLocale(v: unknown): v is Locale {
  return typeof v === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(v)
}

// 语言判定优先级：URL 路径前缀（/de、/es、/fr）> ?lang= 参数 > 默认 en。
// 路径前缀是多语言 SEO 的权威来源（每种语言有独立可抓取的 URL）；
// localStorage 不再参与判定，避免在英语 URL 上残留上次选择的语言，
// 导致正文语言与 URL / canonical 不一致。
function detectInitialLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE
  const seg = window.location.pathname.split('/')[1]
  if (isLocale(seg) && seg !== DEFAULT_LOCALE) return seg
  const q = new URLSearchParams(window.location.search).get('lang')
  if (isLocale(q)) return q
  return DEFAULT_LOCALE
}

const initialLocale = detectInitialLocale()
if (initialLocale !== DEFAULT_LOCALE) {
  localStorage.setItem('lang', initialLocale)
}
document.documentElement.lang = initialLocale

const i18n = createI18n({
  legacy: false,
  locale: initialLocale,
  fallbackLocale: DEFAULT_LOCALE,
  messages: JSON.parse(JSON.stringify({ en, es, de, fr })),
})

export default i18n