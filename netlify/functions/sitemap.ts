import type { NetlifyEvent, NetlifyResponse } from '../shared/verifyAdmin'

const SITE_URL = 'https://www.droneworld.tech'

// 与前端保持一致：英语为默认语言不带前缀，其余语言带 /de /es /fr 前缀
const LOCALES = ['en', 'es', 'de', 'fr']
const DEFAULT_LOCALE = 'en'

function withPrefix(path: string, locale: string): string {
  return locale === DEFAULT_LOCALE ? path : `/${locale}${path === '/' ? '' : path}`
}

interface SlugRow {
  slug: string
}

async function fetchSlugs(table: 'products' | 'posts'): Promise<string[]> {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !anonKey) return []
  try {
    const res = await fetch(`${url}/rest/v1/${table}?select=slug&published=eq.true`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
    })
    if (!res.ok) return []
    const rows = (await res.json()) as SlugRow[]
    return rows.map((r) => r.slug).filter(Boolean)
  } catch {
    return []
  }
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// 每个路径输出该语言自身的 <url>，并附上全部语言的 xhtml:link hreflang alternates，
// 让 Google 把 4 种语言识别为同一页面的不同语言版本。
function localizedEntries(path: string): string {
  const altLines = LOCALES.map(
    (l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${SITE_URL}${escapeXml(withPrefix(path, l))}" />`,
  )
  altLines.push(
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL}${escapeXml(withPrefix(path, DEFAULT_LOCALE))}" />`,
  )
  const altBlock = altLines.join('\n')
  return LOCALES.map(
    (l) => `  <url>\n    <loc>${SITE_URL}${escapeXml(withPrefix(path, l))}</loc>\n${altBlock}\n  </url>`,
  ).join('\n')
}

export const handler = async (event: NetlifyEvent): Promise<NetlifyResponse> => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, body: '' }
  }

  // Supabase 查询失败时降级为纯静态路由，保证 sitemap 始终可用
  const [productSlugs, postSlugs] = await Promise.all([fetchSlugs('products'), fetchSlugs('posts')])

  // 栏目与产品页：4 种语言均有本地化内容
  const localizedPaths = [
    '/',
    '/products',
    ...productSlugs.map((s) => `/products/${s}`),
    '/cases',
    '/news',
    '/documents',
    '/about',
    '/contact',
  ]

  // 新闻文章：翻译情况不确定，仅登记英语版本，避免声明不存在的语言版本
  const newsEntries = postSlugs.map(
    (s) => `  <url>\n    <loc>${SITE_URL}/news/${escapeXml(s)}</loc>\n  </url>`,
  )

  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
    localizedPaths.map(localizedEntries).join('\n') +
    (newsEntries.length ? '\n' + newsEntries.join('\n') : '') +
    `\n</urlset>\n`

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
    body,
  }
}