// 构建后预渲染（prerender）：把纯客户端渲染的 SPA 输出为静态 HTML，并覆盖多语言。
//
// 背景：本站是 CSR SPA，原始 HTML 只有空的 <div id="app"></div>，爬虫首轮拿不到
//       正文与内链，产品页长期停在 "Discovered - currently not indexed"。
//       这里把每个「路由 × 语言」的真实渲染结果落盘为静态 HTML：
//         英语（默认）   → dist/<route>/index.html
//         其他语言       → dist/<locale>/<route>/index.html
//       同时注入 canonical 与 hreflang（含 x-default）alternate 链接，让
//       Google 把每种语言识别为独立可抓取页面。Netlify 会优先返回已存在的静态
//       文件，因此 /products/<slug>、/de/products/<slug> 等将直接命中预渲染页。
//
// 复用仓库已有的 Playwright，零新增依赖。
// 用法：随 npm run build 自动执行，也可单独运行：
//   node scripts/prerender.mjs   # 首页 + 主要栏目 + 全部产品页（4 语言）+ 全部新闻（英语 + 已有翻译）
//   环境变量 PRERENDER_CONCURRENCY 可调整并发数（默认 4）
import { createServer } from 'node:http'
import { readFileSync, writeFileSync, existsSync, statSync, mkdirSync } from 'node:fs'
import { resolve, join, extname, dirname } from 'node:path'
import { chromium } from 'playwright'

const DIST = resolve(process.cwd(), 'dist')
const DIST_INDEX = join(DIST, 'index.html')
const PORT = Number(process.env.PRERENDER_PORT || 4177)
const BASE = `http://localhost:${PORT}`
const SITE = 'https://www.droneworld.tech'

const LOCALES = ['en', 'es', 'de', 'fr']
const DEFAULT_LOCALE = 'en'

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
}

// 固定栏目路由
const STATIC_ROUTES = [
  '/',
  '/products',
  '/solutions/facade-cleaning',
  '/solutions/solar-panel-cleaning',
  '/solutions/heavy-lift-logistics',
  '/about',
  '/news',
  '/cases',
  '/documents',
  '/contact',
]

/** 裸路径 + 语言 → 带前缀的可抓取 URL 路径（英语不带前缀） */
function withPrefix(route, locale) {
  if (locale === DEFAULT_LOCALE) return route
  return `/${locale}${route === '/' ? '' : route}`
}

// 有真实翻译的新闻 slug（由 collectRoutes 从 Supabase 读取）。
// 未翻译文章只预渲染英语：生产 FC 没有 SPA 回退，本地化 URL 不存在就是 404。
const translatedNewsSlugs = { es: new Set(), de: new Set(), fr: new Set() }

/** 该路由需要预渲染的语言集合：普通页面 4 语；新闻详情只渲染英语 + 真实存在的翻译 */
function localesFor(route) {
  if (!route.startsWith('/news/')) return LOCALES
  const slug = route.slice('/news/'.length)
  return [
    DEFAULT_LOCALE,
    ...LOCALES.filter((l) => l !== DEFAULT_LOCALE && translatedNewsSlugs[l]?.has(slug)),
  ]
}

function outPathFor(route, locale) {
  const p = withPrefix(route, locale)
  return p === '/' ? DIST_INDEX : join(DIST, p, 'index.html')
}

// 轻量静态服务器：命中真实文件则直出，否则回退 index.html（模拟 SPA 行为）
function startServer() {
  return new Promise((res) => {
    const server = createServer((req, resp) => {
      // 渲染超时会主动关闭页面上下文，未完成的请求会随之中断；
      // 此时 socket 可能已关闭，writeHead 会抛 ERR_HTTP_HEADERS_SENT。
      // 所有写入都必须先看 headersSent，否则一次中断会打挂整个构建。
      const safeWriteHead = (status, headers) => {
        if (resp.headersSent || resp.destroyed) return false
        resp.writeHead(status, headers)
        return true
      }
      try {
        const urlPath = decodeURIComponent((req.url || '/').split('?')[0])
        let filePath = join(DIST, urlPath)
        if (!filePath.startsWith(DIST)) {
          if (safeWriteHead(403)) resp.end()
          return
        }
        if (!(existsSync(filePath) && statSync(filePath).isFile())) {
          filePath = DIST_INDEX
        } else if (extname(filePath).toLowerCase() === '.html' && filePath !== DIST_INDEX) {
          // 绝不把「已存在的预渲染 HTML」当作静态文件直出，否则重复运行时会抓到上次的产物；
          // 路由一律回退到本次构建的 index.html，由 SPA 重新渲染。
          filePath = DIST_INDEX
        }
        if (safeWriteHead(200, {
          'Content-Type': MIME[extname(filePath).toLowerCase()] || 'application/octet-stream',
          'Cache-Control': 'no-store',
        })) resp.end(readFileSync(filePath))
      } catch (e) {
        if (safeWriteHead(500)) resp.end(String(e))
      }
    })
    server.listen(PORT, () => res(server))
  })
}

// 产品 slug：优先读取 inject-seo-links 注入到 dist/index.html 的内链（零网络、最可靠），
// 其次回退线上 sitemap.xml
function readInjectedSlugs(prefix) {
  if (!existsSync(DIST_INDEX)) return []
  const html = readFileSync(DIST_INDEX, 'utf8')
  const re = new RegExp(`href="(?:/[a-z]{2})?${prefix}/([^"#?]+)"`, 'g')
  return [...html.matchAll(re)].map((m) => m[1])
}

async function fetchSitemapSlugs(prefix) {
  try {
    const res = await fetch(`${SITE}/sitemap.xml`, { signal: AbortSignal.timeout(10000) })
    if (!res.ok) return []
    const xml = await res.text()
    const re = new RegExp(`<loc>[^<]*${prefix}/([^<]+)</loc>`, 'g')
    return [...xml.matchAll(re)].map((m) => m[1])
  } catch (e) {
    console.warn('[prerender] sitemap 读取失败:', e.message)
    return []
  }
}

// 新闻 slug 首选 Supabase 直读：线上 sitemap 来自「上一次部署」，迁移/首部署窗口期
// 可能 404 或缺新闻条目（本次 FC 切换时 CI 就因此漏渲染了全部新闻页）。
function loadEnv() {
  const env = { ...process.env }
  const envFile = resolve(process.cwd(), '.env')
  if (existsSync(envFile)) {
    for (const line of readFileSync(envFile, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/)
      if (m && !(m[1] in env)) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  }
  return env
}

async function fetchSupabaseNewsSlugs() {
  const env = loadEnv()
  const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL
  const anonKey = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY
  if (!url || !anonKey) return []
  try {
    const res = await fetch(`${url}/rest/v1/posts?select=slug&published=eq.true`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return []
    return (await res.json()).map((r) => r.slug).filter(Boolean)
  } catch (e) {
    console.warn('[prerender] Supabase 新闻 slug 读取失败:', e.message)
    return []
  }
}

/** 读取每种语言真实存在的新闻翻译（post_langs 内连接 posts），只预渲染这些本地化页面。 */
async function fetchTranslatedNewsSlugs() {
  const env = loadEnv()
  const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL
  const anonKey = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY
  if (!url || !anonKey) return
  await Promise.all(
    LOCALES.filter((l) => l !== DEFAULT_LOCALE).map(async (lang) => {
      try {
        const res = await fetch(
          `${url}/rest/v1/posts?select=slug,post_langs!inner(lang)&published=eq.true&post_langs.lang=eq.${lang}`,
          {
            headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
            signal: AbortSignal.timeout(10000),
          },
        )
        if (!res.ok) return
        const rows = await res.json()
        for (const r of rows) if (r.slug) translatedNewsSlugs[lang].add(r.slug)
      } catch (e) {
        console.warn(`[prerender] Supabase 新闻翻译读取失败 (${lang}):`, e.message)
      }
    }),
  )
}

async function collectRoutes() {
  const routes = [...STATIC_ROUTES]

  let productSlugs = readInjectedSlugs('/products')
  if (!productSlugs.length) productSlugs = await fetchSitemapSlugs('/products')
  // /products/c500-partdro-eavision 与 /products/u15-multi-mission-drone 是独立静态落地页，
  // 会出现在首页内链/线上 sitemap 里，但不是 SPA 产品路由，不能在这里预渲染。
  productSlugs = [...new Set(productSlugs)].filter(
    (s) => s && s !== 'c500-partdro-eavision' && s !== 'u15-multi-mission-drone',
  )
  for (const s of productSlugs) routes.push(`/products/${s}`)

  // 新闻详情页：英语全量 + 其他语言仅真实存在的翻译。slug 首选 Supabase 直读
  // （不受线上部署状态影响），失败时回退线上 sitemap。
  const [englishNews] = await Promise.all([fetchSupabaseNewsSlugs(), fetchTranslatedNewsSlugs()])
  let newsSlugs = englishNews
  if (!newsSlugs.length) newsSlugs = await fetchSitemapSlugs('/news')
  newsSlugs = [...new Set(newsSlugs)].filter(Boolean)
  for (const s of newsSlugs) routes.push(`/news/${s}`)

  return [...new Set(routes)]
}

/** 移除运行时被 gtag/Google Ads 动态注入的第三方像素：预渲染会把它们连同
 *  localhost 的 url 参数一起固化进静态 HTML，导致线上每页多打一次广告像素，
 *  故在落盘前剔除（GTM 自身的引导脚本保留）。 */
function stripRuntimePixels(html) {
  const hosts = 'googleads\\.g\\.doubleclick\\.net|googleadservices\\.com|google\\.com/ads'
  return html
    .replace(new RegExp(`<script\\b[^>]*(?:${hosts})[^>]*>\\s*</script>`, 'gi'), '')
    .replace(new RegExp(`<img\\b[^>]*(?:${hosts})[^>]*>`, 'gi'), '')
}

/** 新闻详情页实际拥有的语言（英语 + Supabase 里存在的翻译） */
function availableNewsLocales(route) {
  const slug = route.slice('/news/'.length)
  return [
    DEFAULT_LOCALE,
    ...LOCALES.filter((l) => l !== DEFAULT_LOCALE && translatedNewsSlugs[l]?.has(slug)),
  ]
}

/** 注入 canonical 与 hreflang alternates（含 x-default），并移除运行时留下的旧标签。
 *  新闻详情页只在存在真实翻译时发 alternates：只有英语的老文章声明 4 语
 *  会与实际内容不符；有翻译的文章发「英语 + 实际翻译语言」。列表页 /news 不受影响。 */
function injectSeo(html, route, locale) {
  const cleaned = stripRuntimePixels(html)
  const isNewsDetail = route.startsWith('/news/')
  const langs = isNewsDetail ? availableNewsLocales(route) : LOCALES
  const alts = []
  if (!isNewsDetail || langs.length > 1) {
    for (const l of langs) {
      alts.push(`<link rel="alternate" hreflang="${l}" href="${SITE}${withPrefix(route, l)}" />`)
    }
    alts.push(
      `<link rel="alternate" hreflang="x-default" href="${SITE}${withPrefix(route, DEFAULT_LOCALE)}" />`,
    )
  }
  const block = [`<link rel="canonical" href="${SITE}${withPrefix(route, locale)}" />`, ...alts].join(
    '\n    ',
  )
  return cleaned
    .replace(/<link[^>]*rel="canonical"[^>]*>/gi, '')
    .replace(/<link[^>]*rel="alternate"[^>]*hreflang="[^"]*"[^>]*>/gi, '')
    .replace('</head>', `    ${block}\n  </head>`)
}

// 页面正文（产品落地页的规格 / FAQ / 图集等）来自 Supabase，异步合并进 i18n。
// 仅靠「正文长度够」会在数据到达前就落盘，抓到空壳（实测同一路由体积忽大忽小）。
// 这里改为等待所有 Supabase 请求真正结束并保持空闲，再短暂等待 Vue 刷新。
async function waitForApiSettled(page, state) {
  const t0 = Date.now()
  // 先等首个数据请求出现（最多 3s）
  while (!state.seen && Date.now() - t0 < 3000) await page.waitForTimeout(100)
  if (!state.seen) return false
  // Wait for content requests and 800ms idle, within a 15s total limit.
  // 8s was flaky for localized product pages whose landing_content overlay
  // requests occasionally queue behind the main content fetch.
  let idleSince = 0
  while (Date.now() - t0 < 15000) {
    if (state.inflight.size === 0) {
      if (!idleSince) idleSince = Date.now()
      if (Date.now() - idleSince > 800) return true
    } else {
      idleSince = 0
    }
    await page.waitForTimeout(150)
  }
  return false
}

// 并发渲染：新闻页默认渲染后总量超过 140 页，串行需 10 分钟级；
// 4 个并发把构建压到 3 分钟级。可用 PRERENDER_CONCURRENCY 调整。
const requestedConcurrency = Number(process.env.PRERENDER_CONCURRENCY || 4)
const CONCURRENCY = Number.isInteger(requestedConcurrency) && requestedConcurrency > 0
  ? Math.min(requestedConcurrency, 8) : 4
// Leave ample time for bundling, sitemap generation and Netlify post-processing.
const RENDER_BUDGET_MS = 6 * 60 * 1000
const ROUTE_TIMEOUT_MS = 20000

async function renderAll(tasks) {
  const browser = await chromium.launch()
  const rendered = []
  const deadline = Date.now() + RENDER_BUDGET_MS

  async function renderOne({ route, locale }) {
    const url = withPrefix(route, locale)
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    // Closing the context interrupts navigation, evaluation and pending network work.
    const timer = setTimeout(() => { void context.close().catch(() => {}) }, ROUTE_TIMEOUT_MS)
    const page = await context.newPage()
    // Track content REST requests; storage downloads do not determine text readiness.
    const state = { seen: false, inflight: new Set() }
    const isDataApi = (u) => u.includes('/rest/v1/')
    page.on('request', (r) => {
      if (isDataApi(r.url())) {
        state.seen = true
        state.inflight.add(r)
      }
    })
    page.on('requestfinished', (r) => state.inflight.delete(r))
    page.on('requestfailed', (r) => state.inflight.delete(r))
    try {
      // 用 domcontentloaded 而非 load：个别资源（缺失图片的重试等）可能永不结束，
      // Readiness is bounded below; media downloads are excluded.
      // Images, fonts and embedded videos do not contribute article text to the snapshot.
      await page.route('**/*', (requestRoute) => {
        const type = requestRoute.request().resourceType()
        return ['image', 'media', 'font'].includes(type)
          ? requestRoute.abort() : requestRoute.continue()
      })
      await page.goto(`${BASE}${url}`, { waitUntil: 'domcontentloaded', timeout: 10000 })
      if (route.startsWith('/news/')) {
        // Wait for this article, rather than navigation/footer text or unrelated requests.
        // Never publish an empty/error article as an apparently successful static page.
        await page.waitForFunction(() => {
          const article = document.querySelector('[data-prerender-article]')
          if (document.querySelector('[data-prerender-article-error]')) {
            throw new Error('Article request failed or article was not found')
          }
          return !!article && !!article.querySelector('.article-content')?.textContent?.trim()
        }, null, { timeout: 12000 })
        // 文章末尾的「相关产品 / 相关文章」内链依赖 products、posts 请求；
        // 等两组数据都就绪再落盘，避免静态 HTML 缺内链（超时则保留文章本身，不阻断预渲染）。
        await page.waitForFunction(
          () =>
            !!document.querySelector('[data-related-products-ready="true"]') &&
            !!document.querySelector('[data-related-articles-ready="true"]'),
          null,
          { timeout: 8000 },
        ).catch(() => {})
      } else {
        await page.waitForFunction(() => {
          const app = document.getElementById('app')
          return !!app && app.innerText.replace(/\s+/g, '').length > 150
        }, null, { timeout: 10000 })
        const settled = await waitForApiSettled(page, state)
        if (!settled && state.seen) throw new Error('Content requests did not settle')
      }
      await page.waitForTimeout(100)
      const html = injectSeo(
        await page.evaluate(() => '<!doctype html>\n' + document.documentElement.outerHTML),
        route,
        locale,
      )
      rendered.push({ route, locale, html })
      console.log(`[prerender] ✓ ${url} (${html.length} bytes)`)
    } catch (e) {
      console.warn(`[prerender] ✗ ${url}: ${e.message}`)
    } finally {
      clearTimeout(timer)
      await context.close()
    }
  }

  try {
    // 共享游标的 worker 池（单线程取任务无竞态）
    let next = 0
    const workers = Array.from(
      { length: Math.min(CONCURRENCY, tasks.length) },
      async () => {
        while (next < tasks.length && Date.now() < deadline) {
          await renderOne(tasks[next++])
        }
      },
    )
    await Promise.all(workers)
    if (next < tasks.length) {
      console.warn(`[prerender] Time budget reached; ${tasks.length - next} pages retain client-side rendering`)
    }
  } finally {
    await browser.close()
  }
  return rendered
}

async function main() {
  if (!existsSync(DIST_INDEX)) {
    console.warn('[prerender] 未找到 dist/index.html，跳过（需先 vite build）')
    return
  }
  const routes = await collectRoutes()
  const tasks = routes.flatMap((route) => localesFor(route).map((locale) => ({ route, locale })))
  console.log(`[prerender] 待渲染 ${tasks.length} 个页面（${routes.length} 路由 × 语言）`)

  const server = await startServer()
  let rendered = []
  try {
    rendered = await renderAll(tasks)
  } finally {
    server.close()
  }

  // 全部渲染完成后再落盘：避免预渲染产物被服务器当作 index.html 回退而污染后续路由
  let count = 0
  for (const { route, locale, html } of rendered) {
    const out = outPathFor(route, locale)
    mkdirSync(dirname(out), { recursive: true })
    writeFileSync(out, html)
    count++
  }
  console.log(`[prerender] 完成：${count}/${tasks.length} 个页面已写入 dist/`)
}

main().catch((e) => {
  console.warn('[prerender] 预渲染失败（不影响构建）:', e.message)
})