// 构建后向静态 HTML 注入可抓取的产品内链
// 产品列表由 Supabase 异步加载；独立落地页不在 products 表，因此必须显式注入。
// 这些链接写入 noscript，不改变访客页面布局，并为抓取器提供真实 href。
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const DIST_INDEX = resolve(process.cwd(), 'dist', 'index.html')
const MARK_START = '<!-- seo-fallback:start -->'
const MARK_END = '<!-- seo-fallback:end -->'
const LOCALES = ['en', 'es', 'de', 'fr']
const DEFAULT_LOCALE = 'en'
const withPrefix = (path, locale) =>
  locale === DEFAULT_LOCALE ? path : '/' + locale + (path === '/' ? '' : path)

// 独立落地页不在 Supabase products 表，但均由 CI 构建四种语言。
const STANDALONE_LANDINGS = [
  { slug: 'c500-partdro-eavision', label: 'C500 EAVision Heavy-Lift Cargo Drone' },
  { slug: 'u15-multi-mission-drone', label: 'U15 Multi-Mission Drone' },
  { slug: 'vf50p-long-endurance-vtol-uav', label: 'VF50P Long-Endurance VTOL UAV' },
]

function toLabel(slug) {
  return slug
    .split('-')
    .map((word) => (/^[a-z]+\d+[a-z]*$/.test(word) ? word.toUpperCase() : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(' ')
}

async function fetchProductSlugs() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
  if (url && key) {
    try {
      const response = await fetch(url + '/rest/v1/products?select=slug&published=eq.true', {
        headers: { apikey: key, Authorization: 'Bearer ' + key },
      })
      if (response.ok) {
        const rows = await response.json()
        const slugs = rows.map((row) => row.slug).filter(Boolean)
        if (slugs.length) return slugs
      }
    } catch (error) {
      console.warn('[seo-links] Supabase 读取失败，回退 sitemap:', error.message)
    }
  }
  try {
    const response = await fetch('https://www.droneworld.tech/sitemap.xml')
    if (!response.ok) return []
    const xml = await response.text()
    return [...xml.matchAll(/<loc>[^<]*\/products\/([^<]+)<\/loc>/g)].map((match) => match[1])
  } catch (error) {
    console.warn('[seo-links] sitemap 读取失败:', error.message)
    return []
  }
}

function localizedProductLinks(slug, label) {
  return LOCALES.map((locale) => {
    const href = withPrefix('/products/' + slug, locale)
    const suffix = locale === DEFAULT_LOCALE ? '' : ' [' + locale.toUpperCase() + ']'
    return '<a href="' + href + '" hreflang="' + locale + '">' + label + suffix + '</a>'
  }).join(' · ')
}

async function main() {
  if (!existsSync(DIST_INDEX)) {
    console.warn('[seo-links] 未找到 dist/index.html，跳过（需先 vite build）')
    return
  }

  // Supabase 产品 + 独立落地页合并去重，独立落地页不能依赖数据库记录存在。
  const dynamicSlugs = await fetchProductSlugs()
  const slugs = [...new Set([...dynamicSlugs, ...STANDALONE_LANDINGS.map((item) => item.slug)])]
  const standaloneBySlug = new Map(STANDALONE_LANDINGS.map((item) => [item.slug, item.label]))

  let html = readFileSync(DIST_INDEX, 'utf8')
  // 幂等：重复构建时先移除旧块
  html = html.replace(new RegExp(MARK_START + '[\\s\\S]*?' + MARK_END, 'g'), '')

  const items = slugs
    .map((slug) => {
      const label = standaloneBySlug.get(slug) || toLabel(slug)
      return '        <li>' + localizedProductLinks(slug, label) + '</li>'
    })
    .join('\n')

  const navLinks = ['/products', '/cases', '/news', '/documents', '/about', '/contact']
    .map((path) =>
      LOCALES.map((locale) =>
        '<a href="' + withPrefix(path, locale) + '" hreflang="' + locale + '">' + path + '</a>',
      ).join(' · '),
    )
    .join('\n          ')

  const block =
    '\n    ' + MARK_START + '\n' +
    '    <noscript>\n' +
    '      <nav aria-label="Product and language links">\n' +
    '        <ul>\n' + items + '\n        </ul>\n' +
    '        <p>' + navLinks + '</p>\n' +
    '      </nav>\n' +
    '    </noscript>\n' +
    '    ' + MARK_END + '\n'

  if (!html.includes('</body>')) {
    console.warn('[seo-links] dist/index.html 中未找到 </body>，跳过注入')
    return
  }
  html = html.replace('</body>', block + '  </body>')
  writeFileSync(DIST_INDEX, html)
  console.log('[seo-links] 已注入 ' + slugs.length + ' 个产品 URL（每个产品含 4 个语言版本）')
}

main().catch((error) => {
  console.warn('[seo-links] 注入失败（不影响构建）:', error.message)
})
