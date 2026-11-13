import type { Lang } from '../types'

export const DEFAULT_LOCALE: Lang = 'en'
export const SUPPORTED_LOCALES: readonly Lang[] = ['en', 'de', 'es', 'fr']

export function isLocale(value: unknown): value is Lang {
  return typeof value === 'string' && SUPPORTED_LOCALES.includes(value as Lang)
}

// Bridge for legacy landing-content code while Nuxt i18n owns the actual global composer.
let globalComposer: any = null
export function setI18nComposer(composer: any) {
  globalComposer = composer
}

const global = {
  getLocaleMessage: (locale: string) => globalComposer?.getLocaleMessage(locale) ?? {},
  setLocaleMessage: (locale: string, messages: Record<string, any>) => globalComposer?.setLocaleMessage(locale, messages),
  get locale() {
    return globalComposer?.locale ?? { value: DEFAULT_LOCALE }
  },
}

const i18nInstance = { global }
export default i18nInstance
