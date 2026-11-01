// 构建后向 dist/index.html 注入可抓取的产品内链
// 背景：本站为纯客户端渲染 SPA，原始 HTML 仅有空的 <div id="app"></div>，
//       爬虫首轮看不到任何内容与链接，导致产品页长期停留在
//       "Discovered - currently not indexed"。这里把产品链接以 <noscript>
//       形式写进静态 HTML，为无 JS 的首轮抓取提供内链；JS 用户无感知。
//
// 用法：随 npm run build 自动执行，也可单独运行 `node scripts/inject-seo-links.mjs`
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const DIST_INDEX = resolve(process.cwd(), 'dist', 'index.html')
const MARK_START = '<!-- seo-fallback:start -->'
const MARK_END = '<!-- seo-fallback:end -->'

// 与前端保持一致：英语为默认语言不带前缀，其余语言带 /de /es /fr 前缀
const LOCALES = ['en', 'es', 'de', 'fr']
const DEFAULT_LOCALE = 'en'
const withPrefix = (p, loc) => (loc === DEFAULT_LOCALE ? p : `/${loc}${p === '/' ? '' : p}`)

function toLabel(slug) {
  return slug
    .split('-')
    .map((w) => (/^[a-z]+\d+[a-z]*$/.test(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ')
}

// 1) 优先用 Supabase（与 sitemap 函数同源），失败则回退线上 sitemap
async function fetchProductSlugs() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
  if (url && key) {
    try {
      const res = await fetch(`${url}/rest/v1/products?select=slug&published=eq.true`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
      })
      if (res.ok) {
        const rows = await res.json()
        const slugs = rows.map((r) => r.slug).filter(Boolean)
        if (slugs.length) return slugs
      }
    } catch (e) {
      console.warn('[seo-links] Supabase 读取失败，回退 sitemap:', e.message)
    }
  }
  try {
    const res = await fetch('https://www.droneworld.tech/sitemap.xml')
    if (!res.ok) return []
    const xml = await res.text()
    return [...xml.matchAll(/<loc>[^<]*\/products\/([^<]+)<\/loc>/g)].map((m) => m[1])
  } catch (e) {
    console.warn('[seo-links] sitemap 读取失败:', e.message)
    return []
  }
}

async function main() {
  if (!existsSync(DIST_INDEX)) {
    console.warn('[seo-links] 未找到 dist/index.html，跳过（需先 vite build）')
    return
  }
  const slugs = [...new Set(await fetchProductSlugs())]
  if (!slugs.length) {
    console.warn('[seo-links] 未取到任何产品 slug，跳过注入')
    return
  }

  let html = readFileSync(DIST_INDEX, 'utf8')
  // 幂等：重复构建时先移除旧块
  html = html.replace(new RegExp(`${MARK_START}[\\s\\S]*?${MARK_END}`, 'g'), '')

  const items = slugs
    .map((s) => {
      const label = toLabel(s)
      // 每个产品同时给出 4 种语言的可抓取链接，帮助爬虫发现各语言版本
      const links = LOCALES.map((l) =>
        l === DEFAULT_LOCALE
          ? `<a href="${withPrefix(`/products/${s}`, l)}" hreflang="${l}">${label}</a>`
          : `<a href="${withPrefix(`/products/${s}`, l)}" hreflang="${l}">${label} [${l.toUpperCase()}]</a>`,
      ).join(' · ')
      return `        <li>${links}</li>`
    })
    // U15 是只有英语版的独立静态落地页，不在 products 表，单独给一条内链
    .concat(
      '        <li><a href="/products/u15-multi-mission-drone" hreflang="en">U15 Multi-Mission Drone</a></li>',
    )
    .join('\n')
  const navLinks = ['/products', '/cases', '/news', '/documents', '/about', '/contact']
    .map((p) => LOCALES.map((l) => `<a href="${withPrefix(p, l)}" hreflang="${l}">${p}</a>`).join(' · '))
    .join('\n          ')
  const block =
    `\n    ${MARK_START}\n` +
    `    <noscript>\n` +
    `      <nav aria-label="Products">\n` +
    `        <ul>\n${items}\n        </ul>\n` +
    `        <p>${navLinks}</p>\n` +
    `      </nav>\n` +
    `    </noscript>\n` +
    `    ${MARK_END}\n`

  if (!html.includes('</body>')) {
    console.warn('[seo-links] dist/index.html 中未找到 </body>，跳过注入')
    return
  }
  html = html.replace('</body>', `${block}  </body>`)
  writeFileSync(DIST_INDEX, html)
  console.log(`[seo-links] 已注入 ${slugs.length} 条产品内链 → dist/index.html`)
}

main().catch((e) => {
  console.warn('[seo-links] 注入失败（不影响构建）:', e.message)
})