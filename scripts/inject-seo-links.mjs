// 构建后向静态 HTML 注入可抓取的产品内链
// 背景：本站为 Vue SPA，Google 首轮抓取需要可直接发现的 HTML 链接。
// 产品列表由 Supabase 异步加载；独立落地页又不在 products 表，因此必须显式注入。
// 这些链接会出现在 prerender 后的每个页面 HTML 中，帮助爬虫发现产品与语言版本。
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const DIST_INDEX = resolve(process.cwd(), 'dist', 'index.html')
const MARK_START = '<!-- seo-fallback:start -->'
const MARK_END = '<!-- seo-fallback:end -->'

const LOCALES = ['en', 'es', 'de', 'fr']
const DEFAULT_LOCALE = 'en'
const withPrefix = (p, loc) => (loc === DEFAULT_LOCALE ? p : `/${loc}${p === '/' ? '' : p}`)

// 独立落地页不在 Supabase products 表，但都由 CI 构建四种语言。
// 保持这里与 deploy-aliyun.yml 的 landing build/merge 保持一致。
const STANDALONE_LANDINGS = [
  { slug: 'c500-partdro-eavision', label: 'C500 EAVision Heavy-Lift Cargo Drone' },
  { slug: 'u15-multi-mission-drone', label: 'U15 Multi-Mission Drone' },
  { slug: 'vf50p-long-endurance-vtol-uav', label: 'VF50P Long-Endurance VTOL UAV' },
]

function toLabel(slug) {
  return slug
    .split('-')
    .map((w) => (/^[a-z]+\\d+[a-z]*$/.test(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ')
}

// 1) 优先用 Supabase，失败则回退线上 sitemap
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
    return [...xml.matchAll(/<loc>[^<]*\\/products\\/([^<]+)<\\/loc>/g)].map((m) => m[1])
  } catch (e) {
    console.warn('[seo-links] sitemap 读取失败:', e.message)
    return []
  }
}

function localizedProductLinks(slug, label) {
  return LOCALES.map((locale) => {
    const href = withPrefix(`/products/${slug}`, locale)
    return `<a href="${href}" hreflang="${locale}">${label}${locale === DEFAULT_LOCALE ? '' : ` [${locale.toUpperCase()}]`}</a>`
  }).join(' · ')
}

async function main() {
  if (!existsSync(DIST_INDEX)) {
    console.warn('[seo-links] 未找到 dist/index.html，跳过（需先 vite build）')
    return
  }

  // Supabase 产品 + 独立落地页合并去重。独立落地页不能依赖数据库记录存在。
  const slugs = [...new Set([...(await fetchProductSlugs()), ...STANDALONE_LANDINGS.map((p) => p.slug)])]
  if (!slugs.length) {
    console.warn('[seo-links] 未取到任何产品 slug，跳过注入')
    return
  }

  const standaloneBySlug = new Map(STANDALONE_LANDINGS.map((p) => [p.slug, p.label]))
  let html = readFileSync(DIST_INDEX, 'utf8')
  html = html.replace(new RegExp(`${MARK_START}[\\\\s\\\\S]*?${MARK_END}`, 'g'), '')

  const items = slugs
    .map((slug) => {
      const label = standaloneBySlug.get(slug) || toLabel(slug)
      return `        <li>${localizedProductLinks(slug, label)}</li>`
    })
    .join('\\n')

  const navLinks = ['/products', '/cases', '/news', '/documents', '/about', '/contact']
    .map((path) => LOCALES.map((locale) => `<a href="${withPrefix(path, locale)}" hreflang="${locale}">${path}</a>`).join(' · '))
    .join('\\n          ')

  const block =
    `\\n    ${MARK_START}\\n` +
    `    <nav class="seo-crawl-links" aria-label="Product and language links">\\n` +
    `      <ul>\\n${items}\\n      </ul>\\n` +
    `      <p>${navLinks}</p>\\n` +
    `    </nav>\\n` +
    `    ${MARK_END}\\n`

  if (!html.includes('</body>')) {
    console.warn('[seo-links] dist/index.html 中未找到 </body>，跳过注入')
    return
  }
  html = html.replace('</body>', `${block}  </body>`)
  writeFileSync(DIST_INDEX, html)
  console.log(`[seo-links] 已注入 ${slugs.length} 条产品内链（每页最多含 4 个语言版本）→ dist/index.html`)
}

main().catch((e) => {
  console.warn('[seo-links] 注入失败（不影响构建）:', e.message)
})
