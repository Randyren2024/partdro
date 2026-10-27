// 构建期静态生成 dist/sitemap.xml（替代原 netlify/functions/sitemap.ts 运行时函数）。
//
// 背景：站点已从 Netlify 迁到阿里云 FC + OSS 静态托管，Netlify Functions 不再运行，
//       /sitemap.xml 一度 404。把同一逻辑移到构建期落盘为静态文件，任何托管平台都可用。
//       URL 与 canonical 保持无尾斜杠方案（FC 路由对无斜杠路径直接服务 <path>/index.html）。
//
// 数据源：Supabase products / posts 的 slug（匿名 key 即可读，published=true）。
// 降级策略：Supabase 查询失败时仍输出纯静态栏目路由，保证 sitemap 永远可用。
// 用法：npm run build 末尾自动执行，或单独 node scripts/generate-sitemap.mjs
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve, join } from 'node:path'

const SITE_URL = 'https://www.droneworld.tech'
const LOCALES = ['en', 'es', 'de', 'fr']
const DEFAULT_LOCALE = 'en'
const DIST = resolve(process.cwd(), 'dist')

// 本地构建时进程环境未必带 Supabase 变量，从 .env 兜底读取
function loadEnv() {
  const env = { ...process.env }
  const envFile = join(process.cwd(), '.env')
  if (existsSync(envFile)) {
    for (const line of readFileSync(envFile, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/)
      if (m && !(m[1] in env)) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  }
  return env
}

async function fetchSlugs(env, table) {
  const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL
  const anonKey = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY
  if (!url || !anonKey) return []
  try {
    // posts 额外取 post_langs(lang)：sitemap 只登记真实存在的翻译
    const select = table === 'posts' ? 'slug,published_at,post_langs(lang)' : 'slug'
    const res = await fetch(`${url}/rest/v1/${table}?select=${select}&published=eq.true`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
    })
    if (!res.ok) return []
    return (await res.json()).filter((r) => r.slug)
  } catch {
    return []
  }
}

function withPrefix(path, locale) {
  return locale === DEFAULT_LOCALE ? path : `/${locale}${path === '/' ? '' : path}`
}

function escapeXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// 每个路径输出该语言自身的 <url>，并附全部语言的 xhtml:link hreflang alternates
function localizedEntries(path) {
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

const env = loadEnv()
const [productRows, postRows] = await Promise.all([
  fetchSlugs(env, 'products'),
  fetchSlugs(env, 'posts'),
])
const productSlugs = productRows.map((r) => r.slug)
const postSlugs = postRows.filter((r) => r.published_at !== undefined || true).map((r) => r)

if (!productSlugs.length && !postSlugs.length) {
  console.warn('[sitemap] Supabase 无数据，降级为纯静态栏目路由')
}

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

// 新闻文章：英语全量；其他语言只登记 post_langs 里真实存在的翻译。
// <lastmod> 取发布时间；多语言文章附带 hreflang alternates。
const newsEntries = postRows.map((p) => {
  const lastmod = p.published_at ? `\n    <lastmod>${escapeXml(p.published_at)}</lastmod>` : ''
  const langs = [
    DEFAULT_LOCALE,
    ...LOCALES.filter(
      (l) => l !== DEFAULT_LOCALE && (p.post_langs ?? []).some((x) => x.lang === l),
    ),
  ]
  const url = (l) => `${SITE_URL}${withPrefix(`/news/${escapeXml(p.slug)}`, l)}`
  if (langs.length === 1) {
    return `  <url>\n    <loc>${url(DEFAULT_LOCALE)}</loc>${lastmod}\n  </url>`
  }
  const altBlock = [
    ...langs.map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${url(l)}" />`),
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

if (!existsSync(DIST)) {
  console.error('[sitemap] dist/ 不存在，请先执行 vite build')
  process.exit(1)
}
writeFileSync(join(DIST, 'sitemap.xml'), body, 'utf8')
console.log(
  `[sitemap] ✓ dist/sitemap.xml（${localizedPaths.length * LOCALES.length + newsEntries.length} 条 URL，` +
    `产品 ${productSlugs.length} / 新闻 ${newsEntries.length}）`,
)
