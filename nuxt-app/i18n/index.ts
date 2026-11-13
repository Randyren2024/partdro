/**
 * i18n instance lazy-init wrapper.
 *
 * Nuxt + @nuxtjs/i18n provides the instance via useI18n() composable (must be in setup).
 * Module-level code in useLandingContent.ts (getLocaleMessage/setLocaleMessage) needs it too,
 * so we expose a setter that useLandingContent() calls at setup time, and a getter that
 * other functions use at runtime.
 */

/** Shared locale constants used by route helpers and page components. */
export const DEFAULT_LOCALE = 'en' as const
export const SUPPORTED_LOCALES = ['en', 'de', 'es', 'fr'] as const
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

export function isLocale(value: unknown): value is SupportedLocale {
  return typeof value === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(value)
}

let _instance: any = null

export function setI18nInstance(i: any) {
  _instance = i
}

export function getI18n(): any {
  if (!_instance) {
    // In Nuxt context, useI18n() is always called in setup before any module-level
    // functions are invoked from components. This guard is here for SSR edge cases.
    console.warn('[i18n] instance not initialized yet — useLandingContent() must be called in setup first')
  }
  return _instance
}

// Also provide a default export for code that does `import i18nInstance from '../i18n'`
export default {
  get global() {
    return getI18n()?.global
  },
  get locale() {
    return getI18n()?.locale
  },
}
