import { createI18n } from 'vue-i18n'
import en from './en.json'
import es from './es.json'
import de from './de.json'
import fr from './fr.json'

const SUPPORTED_LOCALES = ['en', 'es', 'de', 'fr']

// 广告/外链可用 ?lang=de 指定语言；其次读取 localStorage；最后回退 en
const urlLang =
  typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('lang') : null
const initialLocale =
  (urlLang && SUPPORTED_LOCALES.includes(urlLang) ? urlLang : null) ||
  localStorage.getItem('lang') ||
  'en'
if (urlLang && SUPPORTED_LOCALES.includes(urlLang)) {
  localStorage.setItem('lang', urlLang)
  document.documentElement.lang = urlLang
}

const i18n = createI18n({
  legacy: false,
  locale: initialLocale,
  fallbackLocale: 'en',
  messages: JSON.parse(JSON.stringify({ en, es, de, fr })),
})

export default i18n
