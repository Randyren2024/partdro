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

interface PostRow extends SlugRow {
  published_at?: string | null
}

async function fetchSlugs(table: 'products' | 'posts'): Promise<(SlugRow | PostRow)[]> {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !anonKey) return []
  try {
    // posts 额外取 published_at，为新闻条目输出 <lastmod>
    const select = table === 'posts' ? 'slug,published_at' : 'slug'
    const res = await fetch(`${url}/rest/v1/${table}?select=${select}&published=eq.true`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
    })
    if (!res.ok) return []
    return ((await res.json()) as (SlugRow | PostRow)[]).filter((r) => r.slug)
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
  const [productRows, postRows] = await Promise.all([fetchSlugs('products'), fetchSlugs('posts')])
  const productSlugs = productRows.map((r) => r.slug)
  const postSlugs = postRows.filter((r): r is PostRow => 'published_at' in r)

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

  // 新闻文章：翻译情况不确定，仅登记英语版本，避免声明不存在的语言版本；
  // <lastmod> 取发布时间，帮助 Google 识别新旧内容、排定重抓优先级
  const newsEntries = postSlugs.map(
    (p) =>
      `  <url>\n    <loc>${SITE_URL}/news/${escapeXml(p.slug)}</loc>${
        p.published_at ? `\n    <lastmod>${escapeXml(p.published_at)}</lastmod>` : ''
      }\n  </url>`,
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