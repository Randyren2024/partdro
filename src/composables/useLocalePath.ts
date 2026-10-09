import { useRoute } from 'vue-router'
import { DEFAULT_LOCALE, isLocale } from '../i18n'

/** 去掉路径中的语言前缀，得到“裸路径”（英语根路径形态） */
export function stripLocalePrefix(path: string): string {
  const seg = path.split('/')[1]
  if (isLocale(seg) && seg !== DEFAULT_LOCALE) {
    return path.slice(seg.length + 1) || '/'
  }
  return path
}

/** 为裸路径补上语言前缀（英语为默认语言，不带前缀） */
export function withLocalePrefix(path: string, locale: unknown): string {
  const p = path.startsWith('/') ? path : `/${path}`
  const loc = isLocale(locale) ? locale : DEFAULT_LOCALE
  return loc === DEFAULT_LOCALE ? p : `/${loc}${p === '/' ? '' : p}`
}

/**
 * 站内链接本地化：依据当前路由的语言前缀，把裸路径转成对应的可抓取 URL。
 * 例：在 /de 下 lp('/products/c15') => '/de/products/c15'
 */
export function useLocalePath() {
  const route = useRoute()
  return (path: string): string =>
    withLocalePrefix(path, isLocale(route.params.locale) ? route.params.locale : DEFAULT_LOCALE)
}