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
//   node scripts/prerender.mjs   # 首页 + 主要栏目 + 全部产品页（4 语言）+ 全部新闻文章页（仅英语）
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
const STATIC_ROUTES = ['/', '/products', '/about', '/news', '/cases', '/documents', '/contact']

/** 裸路径 + 语言 → 带前缀的可抓取 URL 路径（英语不带前缀） */
function withPrefix(route, locale) {
  if (locale === DEFAULT_LOCALE) return route
  return `/${locale}${route === '/' ? '' : route}`
}

/** 该路由需要预渲染的语言集合：新闻页仅英语（本地化翻译不确定，改由运行时按前缀渲染） */
function localesFor(route) {
  return route.startsWith('/news/') ? [DEFAULT_LOCALE] : LOCALES
}

function outPathFor(route, locale) {
  const p = withPrefix(route, locale)
  return p === '/' ? DIST_INDEX : join(DIST, p, 'index.html')
}

// 轻量静态服务器：命中真实文件则直出，否则回退 index.html（模拟 SPA 行为）
function startServer() {
  return new Promise((res) => {
    const server = createServer((req, resp) => {
      try {
        const urlPath = decodeURIComponent((req.url || '/').split('?')[0])
        let filePath = join(DIST, urlPath)
        if (!filePath.startsWith(DIST)) {
          resp.writeHead(403)
          resp.end()
          return
        }
        if (!(existsSync(filePath) && statSync(filePath).isFile())) {
          filePath = DIST_INDEX
        } else if (extname(filePath).toLowerCase() === '.html' && filePath !== DIST_INDEX) {
          // 绝不把「已存在的预渲染 HTML」当作静态文件直出，否则重复运行时会抓到上次的产物；
          // 路由一律回退到本次构建的 index.html，由 SPA 重新渲染。
          filePath = DIST_INDEX
        }
        resp.writeHead(200, {
          'Content-Type': MIME[extname(filePath).toLowerCase()] || 'application/octet-stream',
          'Cache-Control': 'no-store',
        })
        resp.end(readFileSync(filePath))
      } catch (e) {
        resp.writeHead(500)
        resp.end(String(e))
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
    const res = await fetch(`${SITE}/sitemap.xml`)
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
    })
    if (!res.ok) return []
    return (await res.json()).map((r) => r.slug).filter(Boolean)
  } catch (e) {
    console.warn('[prerender] Supabase 新闻 slug 读取失败:', e.message)
    return []
  }
}

async function collectRoutes() {
  const routes = [...STATIC_ROUTES]

  // C500 Google Ads 落地页：router 静态路径（不在 Supabase products 表，sitemap 抓不到）
  routes.push('/products/c500-partdro-eavision')

  let productSlugs = readInjectedSlugs('/products')
  if (!productSlugs.length) productSlugs = await fetchSitemapSlugs('/products')
  productSlugs = [...new Set(productSlugs)].filter(Boolean)
  for (const s of productSlugs) routes.push(`/products/${s}`)

  // 新闻详情页同样默认预渲染（仅英语）：slug 首选 Supabase 直读（不受线上部署状态影响），
  // 失败时回退线上 sitemap。
  let newsSlugs = await fetchSupabaseNewsSlugs()
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

/** 注入 canonical 与 hreflang alternates（含 x-default），并移除运行时留下的旧标签。
 *  新闻详情页例外：只发 canonical 不发 hreflang——老文章未必有 4 语翻译
 *  （运行时回退显示英语），声明 alternates 会与实际内容不符；列表页 /news 不受影响。 */
function injectSeo(html, route, locale) {
  const cleaned = stripRuntimePixels(html)
  const isNewsDetail = route.startsWith('/news/')
  const alts = isNewsDetail
    ? []
    : LOCALES.map(
        (l) => `<link rel="alternate" hreflang="${l}" href="${SITE}${withPrefix(route, l)}" />`,
      )
  if (!isNewsDetail) {
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
  // 再等所有数据请求结束，并保持 800ms 空闲（最多 23s）
  let idleSince = 0
  while (Date.now() - t0 < 23000) {
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
const CONCURRENCY = Math.max(1, Number(process.env.PRERENDER_CONCURRENCY || 4))

async function renderAll(tasks) {
  const browser = await chromium.launch()
  const rendered = []

  async function renderOne({ route, locale }) {
    const url = withPrefix(route, locale)
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await context.newPage()
    // 追踪 Supabase REST / Storage 请求，作为「内容已就绪」的确定信号
    const state = { seen: false, inflight: new Set() }
    const isDataApi = (u) => u.includes('/rest/v1/') || u.includes('/storage/v1/')
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
      // 页面就绪与否交给下面的数据等待 + 正文等待 + 图片等待（均带超时）判定。
      await page.goto(`${BASE}${url}`, { waitUntil: 'domcontentloaded', timeout: 60000 })
      await page
        .waitForFunction(
          () => {
            const app = document.getElementById('app')
            return !!app && app.innerText.replace(/\s+/g, '').length > 150
          },
          { timeout: 20000 },
        )
        .catch(() => console.warn(`[prerender]   ${url} 正文等待超时，仍尝试落盘`))
      const settled = await waitForApiSettled(page, state)
      if (!settled) console.warn(`[prerender]   ${url} 数据请求未确认结束，按现状落盘`)
      await page.waitForTimeout(600)
      // 等图片加载（带兜底超时，避免坏图挂死）
      await page
        .evaluate(async () => {
          const imgs = Array.from(document.images).filter((i) => !i.complete)
          await Promise.race([
            Promise.all(imgs.map((i) => new Promise((r) => ((i.onload = r), (i.onerror = r))))),
            new Promise((r) => setTimeout(r, 8000)),
          ])
        })
        .catch(() => {})
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
      await context.close()
    }
  }

  try {
    // 共享游标的 worker 池（单线程取任务无竞态）
    let next = 0
    const workers = Array.from(
      { length: Math.min(CONCURRENCY, tasks.length) },
      async () => {
        while (next < tasks.length) {
          await renderOne(tasks[next++])
        }
      },
    )
    await Promise.all(workers)
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