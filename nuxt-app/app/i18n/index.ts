import type { Lang } from '../types'

export const DEFAULT_LOCALE: Lang = 'en'
export const SUPPORTED_LOCALES: readonly Lang[] = ['en', 'de', 'es', 'fr']

export function isLocale(value: unknown): value is Lang {
  return typeof value === 'string' && SUPPORTED_LOCALES.includes(value as Lang)
}
