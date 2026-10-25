# 08 · 构建与 SEO 管线

整个站点是**纯客户端渲染**的 SPA，原始 HTML 里只有一个空的 `<div id="app"></div>`。这对用户没有影响，对爬虫是致命的：首轮抓取看不到正文、看不到内链，产品页长期停在 Google Search Console 的 **"Discovered - currently not indexed"**。

所以每次构建都在做同一件事：**把 SPA 在无头浏览器里跑一遍，把渲染结果落盘成真静态 HTML**。这条管线拆成四段，任何一段失败都不阻断构建（站点照常上线，只是 SEO 变差）。

```
vite build
   │  dist/index.html + assets/（空壳 SPA）
   ▼
scripts/inject-seo-links.mjs      ← 往空壳里塞 <noscript> 内链（爬虫第一跳能看见产品链接）
   │
   ▼
scripts/prerender.mjs             ← Playwright 逐「路由 × 语言」渲染，落盘 140+ 个 HTML + canonical/hreflang
   │
   ▼
scripts/generate-sitemap.mjs      ← 生成 dist/sitemap.xml
   │
   ▼
dist/ （静态站，可直传 OSS 或 Netlify）
```

`package.json` 的实际命令：

```json
"build": "npx playwright install chromium && vite build && node scripts/inject-seo-links.mjs && node scripts/prerender.mjs && node scripts/generate-sitemap.mjs"
```

三个脚本也可以单独跑（`npm run prerender` / `npm run sitemap`），但必须**在 `vite build` 之后**——`prerender.mjs` 开头就会检查 `dist/index.html`，不存在则打印「跳过（需先 vite build）」并直接返回。

---

## 1. `inject-seo-links.mjs`（106 行）

**解决的问题**：预渲染虽然会把每个产品页落盘，但商品页之间的**内链**在 SPA 里是 JS 生成的。爬虫如果只抓首页，仍然发现不了产品页。这一步把产品链接以 `<noscript>` 形式写进 `dist/index.html`。

```ts
const MARK_START = '<!-- seo:products:start -->'
const MARK_END = '<!-- seo:products:end -->'
```

用显式标记包住注入块，重复构建时先删旧块再写新块——**幂等**，不会越滚越大。

**slug 来源两级**：

```
Supabase products 表（anon key 读已发布）
   │ 失败
   ▼
线上 https://www.droneworld.tech/sitemap.xml 解析
   │ 再失败
   ▼
console.warn，不注入，不 fail build
```

**标签生成规则**与前端保持一致：

```ts
// 与 ProductDetailView 的 productLabel 是同一套规则
const toLabel = (slug: string) =>
  slug.split('-').map(w => /^[a-z]+\d+[a-z]*$/.test(w) ? w.toUpperCase() : w).join(' ')
```

`/^[a-z]+\d+[a-z]*$/` 把 `d15r` → `D15R`、`c500` → `C500`、`fp800` → `FP800`，其余单词保持原样。**两处规则必须同步**，否则静态内链里的机型名和页面上显示的不一致。

每条链接同时输出四种语言：

```html
<a href="/products/d15r" hreflang="en">D15R</a>
<a href="/es/products/d15r" hreflang="es">D15R</a>
<a href="/de/products/d15r" hreflang="de">D15R</a>
<a href="/fr/products/d15r" hreflang="fr">D15R</a>
```

最后 `html.replace('</body>', block + '  </body>')`。整个函数包在 `try/catch` 里，**任何异常只 `console.warn`**——这一步是 SEO 优化，不是构建正确性的一部分。

---

## 2. `prerender.mjs`（366 行）—— 管线的核心

### 2.1 本地静态服务器

不去 `vite preview`（慢、且会和构建进程抢端口），而是用 `node:http` 起一个 40 行的小服务器，端口 `PRERENDER_PORT || 4177`：

```ts
const urlPath = decodeURIComponent((req.url || '/').split('?')[0])
let filePath = join(DIST, urlPath)
if (!filePath.startsWith(DIST)) { resp.writeHead(403); resp.end(); return }   // 目录穿越防护
```

最关键的一条注释：

> **绝不把「已存在的预渲染 HTML」当作静态文件直出**，否则重复运行时会抓到上次的产物；路由一律回退到本次构建的 `index.html`，由 SPA 重新渲染。

也就是说：`.html` 请求永远返回 `dist/index.html`（本次构建的空壳），只有 `assets/`、`images/` 这类带扩展名的真实文件才直出。第一版没做这个处理时，第二次构建会把第一次的产物当源文件，`hreflang` 越叠越多。

### 2.2 路由集合

```ts
const STATIC_ROUTES = ['/', '/products', '/about', '/news', '/cases', '/documents', '/contact']
```

加上三类动态路由：

| 来源 | 说明 |
|---|---|
| `/products/c500-partdro-eavision` | **手动加的一行**：router 里有这个静态路径，但它不在 Supabase products 表里，sitemap 抓不到 |
| 产品 slug | 先读 `inject-seo-links` 注入的内链；为空则回退线上 sitemap |
| 新闻 slug | **先 Supabase 直读**，失败才回退线上 sitemap |

新闻 slug 优先直读的原因写在注释里，是一次真实事故：

> 线上 sitemap 来自「上一次部署」，迁移/首部署窗口期可能 404 或缺新闻条目（本次 FC 切换时 CI 就因此漏渲染了全部新闻页）。

这是整条管线最容易复发的坑：**任何「用线上产物推导本次构建输入」的设计，在首次部署/迁移时都必然失效**。产品 slug 先读注入内链、新闻 slug 先读 Supabase，都是为了减少对线上 sitemap 的依赖。

### 2.3 语言矩阵

```ts
function withPrefix(route, locale) {
  if (locale === DEFAULT_LOCALE) return route
  return `/${locale}${route === '/' ? '' : route}`
}
function localesFor(route) {
  return route.startsWith('/news/') ? [DEFAULT_LOCALE] : LOCALES
}
```

| 路由类型 | 预渲染语言 | 落盘位置 |
|---|---|---|
| `/` | 4 语 | `dist/index.html`、`dist/es/index.html` … |
| `/products` 等栏目 | 4 语 | `dist/products/index.html`、`dist/de/products/index.html` … |
| `/products/<slug>` | 4 语 | 同上模式 |
| `/news/<slug>` | **仅 en** | `dist/news/<slug>/index.html` |

新闻详情只渲染英语，因为老文章未必有 4 语翻译（运行时回退显示英语），预渲染 4 份会产出内容完全相同的重复页。

### 2.4 两套「就绪」判定

通用的「正文够长就落盘」会抓到空壳——**同一路由的产物体积会忽大忽小**，因为 Supabase 数据是异步合并进 i18n 的。所以分成两种策略。

**非新闻页**（`renderOne` 的 `else` 分支）：

```ts
// ① 正文长度 > 150 字符（去空白）
await page.waitForFunction(() => {
  const app = document.getElementById('app')
  return !!app && app.innerText.replace(/\s+/g, '').length > 150
}, null, { timeout: 10000 })

// ② 等所有 /rest/v1/ 请求结束并保持 800ms 空闲
const settled = await waitForApiSettled(page, state)
if (!settled && state.seen) throw new Error('Content requests did not settle')
```

`waitForApiSettled` 的时序：

```
等首个 /rest/v1/ 请求出现（最多 3s）→ 没出现返回 false
循环（总上限 8s，每 150ms 检查一次）：
   inflight === 0 且持续 > 800ms  → return true
   inflight > 0                   → 重置空闲计时
```

用「请求集合」而不是「正文长度」做判据，是因为长度只能证明「有内容」，不能证明「内容完整」。

**新闻页**用页面上的**显式探针**：

```ts
await page.waitForFunction(() => {
  const article = document.querySelector('[data-prerender-article]')
  if (document.querySelector('[data-prerender-article-error]')) {
    throw new Error('Article request failed or article was not found')
  }
  return !!article && !!article.querySelector('.article-content')?.textContent?.trim()
}, null, { timeout: 12000 })
```

这是**前后端的一条隐式契约**：`NewsDetailView` 必须给正文节点加 `data-prerender-article`，出错态必须加 `data-prerender-article-error`。改新闻页模板时如果删了这两个属性，预渲染会静默超时，然后「保留客户端渲染」——页面照常能看，只是没被索引。

随后再等一个可选探针：

```ts
// 文章末尾的「相关产品」内链依赖 products 请求；超时则保留文章本身，不阻断预渲染
await page.waitForFunction(
  () => !!document.querySelector('[data-related-products-ready="true"]'),
  null, { timeout: 8000 },
).catch(() => {})
```

`.catch(() => {})` 是刻意的：相关产品内链是加分项，缺了不该让整篇文章渲染失败。

**资源阻断**（省时间的关键）：

```ts
await page.route('**/*', (requestRoute) => {
  const type = requestRoute.request().resourceType()
  return ['image', 'media', 'font'].includes(type)
    ? requestRoute.abort() : requestRoute.continue()
})
```

图片、视频、字体不贡献正文文本，140+ 页 × 每页几十个资源，全下载会让构建从 3 分钟变成 20 分钟。

**导航等待用 `domcontentloaded` 而不是 `load`**：

> 个别资源（缺失图片的重试等）可能永不结束。

### 2.5 剔除运行时像素

```ts
function stripRuntimePixels(html) {
  const hosts = 'googleads\\.g\\.doubleclick\\.net|googleadservices\\.com|google\\.com/ads'
  return html
    .replace(new RegExp(`<script\\b[^>]*(?:${hosts})[^>]*>\\s*</script>`, 'gi'), '')
    .replace(new RegExp(`<img\\b[^>]*(?:${hosts})[^>]*>`, 'gi'), '')
}
```

原因写在注释里：**预渲染会把它们连同 localhost 的 url 参数一起固化进静态 HTML，导致线上每页多打一次广告像素**。

换个说法：无头浏览器在 `localhost:4177` 上跑，gtag 会在 DOM 里插一个带 `url=http://localhost:4177/...` 的像素 img/script。如果不剔掉，每个静态页面上都会残留一个**指向 localhost 的**广告像素——既污染统计，又是明显的脏数据。

注意保留范围：**GTM 自身的引导脚本保留**，只剔 Google Ads 域名的 `<script>` 和 `<img>`。

### 2.6 注入 canonical 与 hreflang

```ts
function injectSeo(html, route, locale) {
  const cleaned = stripRuntimePixels(html)
  const isNewsDetail = route.startsWith('/news/')
  const alts = isNewsDetail ? [] : LOCALES.map(l =>
    `<link rel="alternate" hreflang="${l}" href="${SITE}${withPrefix(route, l)}" />`)
  if (!isNewsDetail) alts.push(
    `<link rel="alternate" hreflang="x-default" href="${SITE}${withPrefix(route, DEFAULT_LOCALE)}" />`)

  const block = [`<link rel="canonical" href="${SITE}${withPrefix(route, locale)}" />`, ...alts].join('\n    ')
  return cleaned
    .replace(/<link[^>]*rel="canonical"[^>]*>/gi, '')                       // 清旧的
    .replace(/<link[^>]*rel="alternate"[^>]*hreflang="[^"]*"[^>]*>/gi, '')
    .replace('</head>', `    ${block}\n  </head>`)
}
```

**先删后写**是必须的：运行时的 `useSeo` 已经在 `<head>` 里写过 canonical，直接 append 会出现两个 canonical，Google 会忽略全部。

**新闻详情只发 canonical**，注释解释得很清楚：

> 老文章未必有 4 语翻译（运行时回退显示英语），声明 alternates 会与实际内容不符。

这句话是「声明的一致性」原则：`hreflang` 是承诺，承诺了就必须有内容差异，否则等于自造重复页。

### 2.7 并发、预算、落盘时机

```ts
const CONCURRENCY = Number.isInteger(n) && n > 0 ? Math.min(n, 8) : 4   // PRERENDER_CONCURRENCY
const RENDER_BUDGET_MS = 6 * 60 * 1000
const ROUTE_TIMEOUT_MS = 20000
```

注释：

> 新闻页默认渲染后总量超过 140 页，串行需 10 分钟级；4 个并发把构建压到 3 分钟级。

共享游标的 worker 池（单线程取任务，无竞态）：

```ts
let next = 0
const workers = Array.from({ length: Math.min(CONCURRENCY, tasks.length) }, async () => {
  while (next < tasks.length && Date.now() < deadline) await renderOne(tasks[next++])
})
await Promise.all(workers)
if (next < tasks.length) console.warn(`Time budget reached; ${tasks.length - next} pages retain client-side rendering`)
```

超预算不报错，只降级成 CSR。理由：**SEO 是增量收益，构建时间是有硬上限的**（Netlify / CI 都有超时）。

**所有页面渲染完才统一落盘**：

```ts
// 全部渲染完成后再落盘：避免预渲染产物被服务器当作 index.html 回退而污染后续路由
```

这个是 §2.1 那条「不直出已存在的 HTML」的**第二道保险**。两道都要有：只做落盘时机，服务器读到的是旧产物；只做服务器过滤，万一有别的路径（比如 `assets/` 里误放 HTML）仍会中招。

**单页超时用 context 硬关**：

```ts
const timer = setTimeout(() => { void context.close().catch(() => {}) }, ROUTE_TIMEOUT_MS)
```

Playwright 的 `page.goto` timeout 不覆盖「navigation 之后卡在 evaluate」，只有关 context 才能中断所有挂起操作。

**顶层兜底**：

```ts
main().catch((e) => console.warn('[prerender] 预渲染失败（不影响构建）:', e.message))
```

整个脚本永远退出码 0。

---

## 3. `generate-sitemap.mjs`（116 行）

`netlify/functions/sitemap.ts` 的**构建期孪生版本**，逻辑同构（`withPrefix` / `escapeXml` / `localizedEntries` 三个函数一一对应）。原因写在文件头：

> 站点已从 Netlify 迁到阿里云 FC + OSS 静态托管，Netlify Functions 不再运行，`/sitemap.xml` 一度 404。把同一逻辑移到构建期落盘为静态文件。

**但要注意一个反直觉的事实**：`fc/index.ts` 在静态服务之前就拦截 `/sitemap.xml` 并直接调用 `sitemapHandler`（`fc/index.ts:241`），所以**阿里云线上命中的仍是运行时版本**（见 07 §1.2），`dist/sitemap.xml` 服务于 Netlify / 纯静态托管 / `npm run preview`。构建期落盘的真正价值是：让 sitemap 的 URL 集合在构建日志里可核对，且任何托管平台都能直接用。两处逻辑同构，改动必须同步。

```ts
function loadEnv() {           // 从 .env 兜底（CI 里进程环境已有）
  // 只填充「进程环境里不存在」的键，不覆盖 CI 注入值
}
```

写好 `dist/sitemap.xml`。`dist/` 不存在则 `process.exit(1)`——和其他两个脚本不同，这一步是**唯一会 fail build 的**，因为没有 sitemap 就等于向 Google 声明站点没有内容。

末尾打印 URL 总数与产品/新闻计数，用于核对「这次构建漏没漏页面」。

---

## 4. 线上如何服务这些静态文件

`dist/` 里的目录结构是「子目录 + index.html」，而 OSS 不会自动把 `/de/cases` 解析到 `de/cases/index.html`。这就是 `fc/index.ts` 存在的理由（见 07 §2）：

```
GET /de/cases
  → FC serveStatic()
  → 无扩展名 → 尝试 de/cases/index.html
  → 命中 → 返回，Cache-Control: public, max-age=60
```

HTML 只缓存 60 秒（保证发版立刻可见），`assets/` 永久缓存（带内容哈希）。

---

## 5. hreflang 策略总表

| 位置 | 声明内容 | 原因 |
|---|---|---|
| `prerender.mjs` · 栏目/产品页 | canonical + 4 语 hreflang + x-default | 四种语言都有真实内容 |
| `prerender.mjs` · 新闻详情 | 仅 canonical | 老文章可能没有翻译 |
| `generate-sitemap.mjs` · 产品 | 4 条 `<url>`，各带 4 语 hreflang | 与预渲染一致 |
| `generate-sitemap.mjs` · 新闻 | 仅 en + `<lastmod>` | 同上 |
| `inject-seo-links.mjs` · noscript 内链 | 4 语 `<a hreflang>` | 让爬虫第一跳发现所有页面 |
| `src/router/index.ts` · 运行时 | en 无前缀，`/es` `/de` `/fr` 有前缀 | URL 即语言 |

**核心原则**：三处（预渲染、sitemap、运行时）对「哪些页面有哪几种语言」的判断必须一致。目前它们各自硬编码了 `LOCALES = ['en','es','de','fr']` 和「新闻仅 en」两条规则——**新增语言时要同时改四处**（`src/i18n/index.ts` 的 `SUPPORTED_LOCALES`、`src/router/index.ts` 的 `:locale(...)` 正则、`prerender.mjs`、`generate-sitemap.mjs`）。

---

## 6. 常见故障与排查

| 现象 | 原因 | 处理 |
|---|---|---|
| 产品页「已发现但未编入索引」 | 只跑了 `vite build`，没跑预渲染 | 完整跑 `npm run build` |
| 构建后某些页面没预渲染 | 达到 6 分钟预算，日志有 `Time budget reached` | 调 `PRERENDER_CONCURRENCY=8` 或减页面 |
| 新闻页全部漏渲染 | 线上 sitemap 缺条目（迁移窗口期） | 确认 `VITE_SUPABASE_URL/ANON_KEY` 在 CI 里可用 |
| 静态 HTML 里有 `localhost:4177` 的像素 | `stripRuntimePixels` 域名列表未命中 | 补正则 |
| `<head>` 里出现两个 canonical | `injectSeo` 的先删逻辑被绕过 | 检查是否重复注入 |
| 同一路由产物体积忽大忽小 | `waitForApiSettled` 被改成了固定 sleep | 恢复请求集合判据 |
| 第二次构建 hreflang 越叠越多 | 静态服务器直出了旧 HTML | 恢复「`.html` 一律回退 index.html」 |
| sitemap 404 | 只部署了静态文件，没跑 `generate-sitemap` | 检查 build 命令链 |

本地单跑：

```bash
npm run build
PRERENDER_CONCURRENCY=8 node scripts/prerender.mjs     # 只看渲染
node scripts/generate-sitemap.mjs                      # 只重生成 sitemap
head -40 dist/sitemap.xml
```

---

下一篇：[09-dependencies.md](./09-dependencies.md) — 依赖清单与用途。
