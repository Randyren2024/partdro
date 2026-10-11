// 阿里云 FC + OSS 迁移后的全站部署验证脚本
//
// 用法：node scripts/verify-fc-deploy.mjs
// 覆盖迁移中出现过/可能出现的故障模式：
//   A. 目录路由回退首页（/de/cases 返回首页内容）—— canonical 检测法一击必中
//   B. 无斜杠路径 404 + JS 跳转（Google 拿不到干净 200）
//   C. sitemap.xml 缺失（Netlify Function 未随迁移走）
//   D. 带 index.html 的完整路径与无斜杠路径双规范并存
//   E. apex 裸域 / http 未重定向到 www + https（重复主机内容）
//   F. 真 404 被兜底成 200（软 404 风险）
//
// 判定核心：跟随重定向后，页面 <link rel="canonical"> 必须等于「请求路径的无斜杠
// 规范形」。canonical 指向 /  即首页回退；指向其他页面即串页。两种尾斜杠方案
// （无斜杠直出 / 301 到斜杠版）都兼容，只要求 canonical 与最终 URL 一致。
import { readFileSync } from 'node:fs'

const SITE = 'https://www.droneworld.tech'
const CONCURRENCY = 8
const MIN_PAGE_BYTES = 50_000 // 预渲染页均 >100KB；SPA 壳 ~4KB、404 页 ~1KB、首页回退 >100KB（靠 canonical 区分）

const norm = (p) => (p === '/' ? '/' : p.replace(/\/+$/, '') || '/')
const expectedCanonical = (p) => SITE + (norm(p) === '/' ? '/' : norm(p))

const results = []
const stats = { pass: 0, warn: 0, fail: 0 }

function record(name, status, detail) {
  results.push({ name, status, detail })
  stats[status === 'PASS' ? 'pass' : status === 'WARN' ? 'warn' : 'fail']++
  const icon = status === 'PASS' ? '✓' : status === 'WARN' ? '⚠' : '✗'
  console.log(`${icon} ${status.padEnd(4)} ${name.padEnd(46)} ${detail}`)
}

async function fetchPage(path) {
  const res = await fetch(SITE + path, { redirect: 'follow' })
  const body = await res.text()
  const bytes = Buffer.byteLength(body)
  const canonical = body.match(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/i)?.[1] || null
  const lang = body.match(/<html[^>]*\slang="([^"]+)"/i)?.[1] || null
  const hreflangs = (body.match(/hreflang="/g) || []).length
  const title = body.match(/<title>([^<]*)<\/title>/i)?.[1] || null
  return { finalPath: new URL(res.url).pathname, status: res.status, bytes, canonical, lang, hreflangs, title, body }
}

// ---------- 1. 页面类检查（预渲染页 canonical 一致性） ----------
async function checkPage(path, { expectLang = null, expectHreflangs = 0 } = {}) {
  try {
    const r = await fetchPage(path)
    if (r.status !== 200) return record(path, 'FAIL', `HTTP ${r.status}（期望 200）`)
    if (r.bytes < MIN_PAGE_BYTES) return record(path, 'FAIL', `${r.bytes}B 太小（疑似 SPA 壳/404 页，期望预渲染正文 ≥${MIN_PAGE_BYTES}B）`)
    const exp = expectedCanonical(path)
    if (!r.canonical) return record(path, 'FAIL', `缺 canonical 标签`)
    if (r.canonical !== exp) {
      const hint = r.canonical === SITE + '/' ? '← 首页回退！FC 目录路由仍未修复' : '← 串页/不一致'
      return record(path, 'FAIL', `canonical=${r.canonical} 期望=${exp} ${hint}`)
    }
    if (norm(r.finalPath) !== norm(path)) return record(path, 'WARN', `重定向到 ${r.finalPath}（内容正确，多一跳）`)
    if (expectLang && r.lang !== expectLang) return record(path, 'WARN', `lang=${r.lang} 期望 ${expectLang}`)
    if (expectHreflangs && r.hreflangs < expectHreflangs) return record(path, 'WARN', `hreflang 仅 ${r.hreflangs} 个（期望 ≥${expectHreflangs}）`)
    record(path, 'PASS', `200 ${r.bytes}B canonical✓ ${r.lang ? 'lang=' + r.lang : ''}`)
  } catch (e) {
    record(path, 'FAIL', `请求异常: ${e.message}`)
  }
}

// ---------- 2. 文件类检查 ----------
async function checkFile(path, { minBytes, label }) {
  try {
    const res = await fetch(SITE + path, { redirect: 'follow' })
    const body = await res.text()
    if (res.status !== 200) return record(path, 'FAIL', `${label}: HTTP ${res.status}（期望 200）`)
    if (Buffer.byteLength(body) < minBytes) return record(path, 'FAIL', `${label}: ${Buffer.byteLength(body)}B 太小`)
    record(path, 'PASS', `${label}: 200 ${Buffer.byteLength(body)}B`)
    return body
  } catch (e) {
    record(path, 'FAIL', `${label}: 请求异常 ${e.message}`)
    return null
  }
}

// ---------- 3. 重定向/主机类检查 ----------
async function checkRedirect(url, expectLocationPrefix) {
  try {
    const res = await fetch(url, { redirect: 'manual' })
    if ([301, 302, 307, 308].includes(res.status)) {
      const loc = res.headers.get('location') || ''
      const ok = loc.startsWith(expectLocationPrefix)
      record(url, ok ? 'PASS' : 'WARN', `→ ${res.status} ${loc}${ok ? '' : '（重定向目标非预期）'}`)
    } else if (res.status === 200) {
      record(url, 'WARN', `200 直出（建议 301 到 www 主机，避免双主机收录）`)
    } else {
      record(url, 'FAIL', `HTTP ${res.status}`)
    }
  } catch (e) {
    record(url, 'FAIL', `请求异常: ${e.message}`)
  }
}

// ---------- 4. 软 404 检查 ----------
async function checkReal404(path) {
  try {
    const res = await fetch(SITE + path, { redirect: 'follow' })
    if (res.status >= 400 && res.status < 500) record(path, 'PASS', `HTTP ${res.status}（真 404 ✓）`)
    else if (res.status === 200) record(path, 'WARN', `200 直出（不存在路径返回 200 = 软 404 风险）`)
    else record(path, 'WARN', `HTTP ${res.status}`)
  } catch (e) {
    record(path, 'FAIL', `请求异常: ${e.message}`)
  }
}

console.log(`\n=== FC/OSS 部署验证 @ ${new Date().toISOString()} ===\n`)

// --- 4 语言首页（含 lang 与 hreflang 数量校验） ---
for (const [p, lang] of [['/', 'en'], ['/es', 'es'], ['/de', 'de'], ['/fr', 'fr']]) {
  await checkPage(p, { expectLang: lang, expectHreflangs: 5 })
}

// --- 栏目页 × 多语言（故障 A/B 的主战场） ---
for (const p of ['/products', '/es/products', '/de/news', '/fr/cases', '/de/documents', '/fr/about', '/es/contact', '/de/cases']) {
  await checkPage(p)
}

// --- 产品页：slug 从 sitemap 动态取，sitemap 不可用则回退已知列表 ---
const sitemapXml = await checkFile('/sitemap.xml', { minBytes: 10_000, label: 'sitemap' })
let productSample = ['/products/c500-delivery-drone', '/de/products/y160-delivery-drone']
let newsSample = ['/news/d15r-cleaning-drone-product-film']
let sitemapLocs = []
if (sitemapXml) {
  sitemapLocs = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
  const products = sitemapLocs.filter((u) => /\/products\/[^/]+$/.test(u))
  const news = sitemapLocs.filter((u) => /\/news\/[^/]+$/.test(u))
  if (products.length) productSample = [products[0], products[Math.floor(products.length / 2)], products[products.length - 1]]
  if (news.length) newsSample = [news[0], news[Math.floor(news.length / 2)]]
  const locOk = sitemapLocs.length >= 140 && sitemapLocs.every((u) => u.startsWith(SITE))
  record('sitemap 内容', locOk ? 'PASS' : 'WARN', `${sitemapLocs.length} 条 URL（期望 ≥140）${locOk ? '' : '；数量异常或含外部 host'}`)
} else {
  record('sitemap 内容', 'FAIL', 'sitemap.xml 不可用，无法动态抽样')
}
for (const p of productSample) await checkPage(p.replace(SITE, ''))
for (const p of newsSample) await checkPage(p.replace(SITE, ''))

// --- robots.txt / 静态资源 ---
await checkFile('/robots.txt', { minBytes: 50, label: 'robots' })
if (sitemapXml) {
  const hasSitemapRef = (await (await fetch(SITE + '/robots.txt')).text()).includes('/sitemap.xml')
  record('robots → sitemap 引用', hasSitemapRef ? 'PASS' : 'WARN', hasSitemapRef ? '含 Sitemap 行' : '缺 Sitemap: 行')
}
const homeHtml = await (await fetch(SITE + '/', { redirect: 'follow' })).text()
const firstAsset = homeHtml.match(/\/assets\/[a-zA-Z0-9_.-]+\.js/)?.[0]
if (firstAsset) await checkFile(firstAsset, { minBytes: 1000, label: 'js 资源' })
const ogImg = sitemapXml ? null : null
await checkFile('/images/news/d15r-cleaning-drone-product-film.jpg', { minBytes: 5000, label: 'og 图' })

// --- 故障 D：index.html 双规范 ---
{
  // 手动重定向：fetchPage 的 follow 会把 301 后的 200 误判为"直出"
  const res = await fetch(SITE + '/de/cases/index.html', { redirect: 'manual' }).catch(() => null)
  const status = res?.status ?? 0
  const loc = res?.headers?.get('location') || ''
  if (!res) record('index.html 双规范', 'FAIL', '请求异常')
  else if (status >= 300 && status < 400 && loc.endsWith('/de/cases')) record('index.html 双规范', 'PASS', `完整路径 301 → ${loc} ✓`)
  else if (status === 200) record('index.html 双规范', 'WARN', '200 直出（建议 301 收敛到无斜杠）')
  else record('index.html 双规范', 'FAIL', `HTTP ${status} loc=${loc}（若为首页回退则目录路由仍坏）`)
}

// --- 故障 E：http 与裸域重定向 ---
await checkRedirect('http://www.droneworld.tech/', 'https://www.droneworld.tech')
await checkRedirect('https://droneworld.tech/', 'https://www.droneworld.tech')

// --- 故障 F：真 404 ---
await checkReal404('/this-page-should-not-exist-8f3k1')

// ---------- 汇总 ----------
console.log(`\n=== 汇总：${stats.pass} 通过 / ${stats.warn} 警告 / ${stats.fail} 失败 ===`)
if (stats.fail) {
  console.log('\n失败项修复指引：')
  console.log('  canonical=首页  → FC 路由补目录索引规则：无斜杠/斜杠路径尝试 <path>/index.html')
  console.log('  sitemap 404     → 上传 dist/sitemap.xml 到 OSS 根目录（node scripts/generate-sitemap.mjs 生成）')
  console.log('  双规范/双主机   → FC/OSS 补 301：*/index.html → 无斜杠；apex/http → https://www')
  process.exit(1)
}
if (stats.warn) console.log('\n警告项不影响收录，但建议按上表提示收敛。')
console.log('全部关键检查通过 ✓')
