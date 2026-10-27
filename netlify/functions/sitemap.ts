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
  post_langs?: { lang: string }[]
}

async function fetchSlugs(table: 'products' | 'posts'): Promise<(SlugRow | PostRow)[]> {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !anonKey) return []
  try {
    // posts 额外取 published_at（<lastmod>）与 post_langs（只登记真实存在的翻译）
    const select = table === 'posts' ? 'slug,published_at,post_langs(lang)' : 'slug'
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
    // C500 EAVision 是独立静态落地页（landing/eavision-c500），不在 products 表，但属于投放/自然搜索落地页
    '/products/c500-partdro-eavision',
    ...productSlugs.map((s) => `/products/${s}`),
    '/cases',
    '/news',
    '/documents',
    '/about',
    '/contact',
  ]

  // 新闻文章：英语全量；其他语言只登记 post_langs 里真实存在的翻译，
  // 并把这些语言作为同一篇文章的 hreflang alternates。未翻译的本地化 URL
  // 生产上会 301 回英语（见 fc/index.ts），不能写进 sitemap。
  // <lastmod> 取发布时间，帮助 Google 识别新旧内容、排定重抓优先级。
  const newsEntries = postSlugs.map((p) => {
    const lastmod = p.published_at ? `\n    <lastmod>${escapeXml(p.published_at)}</lastmod>` : ''
    const langs = [
      DEFAULT_LOCALE,
      ...LOCALES.filter(
        (l) => l !== DEFAULT_LOCALE && (p.post_langs ?? []).some((x) => x.lang === l),
      ),
    ]
    const url = (l: string) =>
      `${SITE_URL}${withPrefix(`/news/${escapeXml(p.slug)}`, l)}`
    if (langs.length === 1) {
      return `  <url>\n    <loc>${url(DEFAULT_LOCALE)}</loc>${lastmod}\n  </url>`
    }
    const altBlock = [
      ...langs.map(
        (l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${url(l)}" />`,
      ),
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${url(DEFAULT_LOCALE)}" />`,
    ].join('\n')
    return langs
      .map((l) => `  <url>\n    <loc>${url(l)}</loc>${lastmod}\n${altBlock}\n  </url>`)
      .join('\n')
  })

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