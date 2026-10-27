import en from '../data/content/en.json'
import es from '../data/content/es.json'
import de from '../data/content/de.json'
import fr from '../data/content/fr.json'

export const LOCALES = ['en', 'es', 'de', 'fr']
export const LOCALE_LABELS = { en: 'EN', es: 'ES', de: 'DE', fr: 'FR' }

const CONTENT = { en, es, de, fr }

export function localeFromPath(pathname = window.location.pathname) {
  const first = pathname.split('/').filter(Boolean)[0]
  return LOCALES.includes(first) && first !== 'en' ? first : 'en'
}

export function localePath(locale, path) {
  return locale === 'en' ? path : `/${locale}${path}`
}

export function contentFor(locale) {
  return CONTENT[locale] || CONTENT.en
}

export function setDocumentLocale(locale, content) {
  document.documentElement.lang = locale
  document.documentElement.dataset.landingLocale = locale
  document.title = content.meta.title
}

export function format(template, values = {}) {
  return String(template).replace(/\{(\w+)\}/g, (match, key) =>
    Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : match
  )
}
