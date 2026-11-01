import en from '../data/content/en.json'

export const LOCALES = ['en']
export const LOCALE_LABELS = { en: 'EN' }

const CONTENT = { en }

export function localeFromPath() {
  return 'en'
}

export function localePath(locale, path) {
  return path
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
