// Fetch blog posts from topxgunag.com and build local blog data
// Usage: node scripts/fetch-topxgun-blog.mjs
import { mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import * as cheerio from 'cheerio'

const BASE = 'https://www.topxgunag.com'
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
const ROOT = path.resolve(import.meta.dirname, '..')
const IMG_DIR = path.join(ROOT, 'public', 'images', 'blog')
const LIST_PAGES = ['blog', ...Array.from({ length: 7 }, (_, i) => `blog_p${i + 2}`)]

async function fetchPage(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'text/html' }, signal: AbortSignal.timeout(30000) })
      if (res.ok) return await res.text()
      console.log(`  HTTP ${res.status} ${url} (try ${i + 1})`)
    } catch (e) {
      console.log(`  FETCH FAIL ${url} (try ${i + 1}): ${e.message}`)
    }
    await new Promise(r => setTimeout(r, 1500 * (i + 1)))
  }
  return null
}

async function downloadImage(url, dest, tries = 3) {
  if (existsSync(dest)) return true
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(60000) })
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer())
        if (buf.length < 1000) return false // too small, likely error page
        await writeFile(dest, buf)
        return true
      }
    } catch { /* retry */ }
    await new Promise(r => setTimeout(r, 1500 * (i + 1)))
  }
  return false
}

function extFromUrl(u) {
  const m = u.split('?')[0].match(/\.(jpe?g|png|webp|gif)$/i)
  return m ? m[1].toLowerCase() : 'jpg'
}

function cleanContent(html, slug) {
  const $ = cheerio.load(`<div id="root">${html}</div>`)
  const root = $('#root')
  // unwrap internal topxgun links (keep text), keep external links
  root.find('a').each((_, el) => {
    const href = $(el).attr('href') || ''
    if (/topxgunag\.com/i.test(href) || href.startsWith('/')) $(el).contents().unwrap()
  })
  // strip presentation attributes
  root.find('*').each((_, el) => {
    const keep = {}
    for (const [k, v] of Object.entries(el.attribs || {})) {
      if (el.tagName === 'img' && (k === 'src' || k === 'alt')) keep[k] = v
      if (el.tagName === 'a' && k === 'href') keep[k] = v
    }
    el.attribs = keep
  })
  // drop empty paragraphs / nbsp-only
  root.find('p, div, span').each((_, el) => {
    if (!['p', 'div', 'span'].includes(el.tagName)) return
    const txt = $(el).text().replace(/&nbsp;|\u00a0/g, '').trim()
    if (!txt && !$(el).find('img').length) $(el).remove()
  })
  // localize content images
  const outDir = path.join('images', 'blog', slug)
  let n = 0
  root.find('img').each((_, el) => {
    let src = $(el).attr('src') || ''
    if (!src) { $(el).remove(); return }
    if (src.startsWith('//')) src = 'https:' + src
    else if (src.startsWith('/')) src = BASE + src
    const ext = extFromUrl(src)
    n++
    $(el).attr('src', `${outDir}/content-${n}.${ext}`)
    $(el).attr('data-src', src)
  })
  // keep only meaningful tags
  const allowed = new Set(['p', 'strong', 'em', 'b', 'i', 'u', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'img', 'br', 'a', 'table', 'thead', 'tbody', 'tr', 'td', 'th'])
  root.find('*').each((_, el) => { if (!allowed.has(el.tagName)) $(el).contents().unwrap() })
  let out = root.html() || ''
  // brand rewrite (text only at this point — urls are local or data-src kept separately)
  out = out
    .replace(/TOPXGUN/g, 'PARTDRO')
    .replace(/TopXGun/g, 'Partdro')
    .replace(/Topxgun/g, 'Partdro')
    .replace(/topxgun/g, 'partdro')
  // restore data-src original urls as comment-free image map
  const imgs = []
  root.find('img').each((_, el) => {
    const local = $(el).attr('src')
    const orig = $(el).attr('data-src')
    if (local && orig) imgs.push({ local: '/' + local, orig })
  })
  return { html: out, imgs }
}

function categorize(title, summary) {
  const t = (title + ' ' + summary).toLowerCase()
  if (/evtol|air taxi|passenger|urban air mobility/.test(t)) return 'eVTOL'
  if (/deliver|transport|logistic|cargo|haul|freight|tower material|bamboo|construction/.test(t)) return 'Logistics'
  if (/spray|agri|crop|seeding|farm|weed|harvest|field|rice|wheat|orchard|pesticide|fertiliz/.test(t)) return 'Agriculture'
  if (/clean|facade|skyscraper|window|high-rise|building/.test(t)) return 'Cleaning'
  return 'Industry News'
}

const seen = new Map() // url -> {title, date, summary}
for (const lp of LIST_PAGES) {
  const url = `${BASE}/${lp}`
  const html = await fetchPage(url)
  if (!html) { console.log(`LIST FAIL: ${lp}`); continue }
  const $ = cheerio.load(html)
  $('div.blog_info').each((_, el) => {
    const a = $(el).find('a.secondary-font').first()
    const href = a.attr('href')
    if (!href) return
    const dayText = $(el).find('.news_day').text().replace(/.*fa-calendar\s*/s, '').trim()
    const summary = $(el).find('.text').first().text().replace(/\s+/g, ' ').trim()
    if (!seen.has(href)) seen.set(href, { title: a.text().trim(), dateText: dayText, summary })
  })
  console.log(`LIST ${lp}: total unique = ${seen.size}`)
  await new Promise(r => setTimeout(r, 600))
}

const posts = [...seen.entries()]
console.log(`\nFound ${posts.length} posts. Fetching details...`)

const CONCURRENCY = 6
const queue = [...seen.entries()]
const results = []
let done = 0

async function fetchPost([url, meta]) {
  const slug = url.replace(BASE + '/', '').replace(/\.html$/, '')
  const html = await fetchPage(url)
  if (!html) { console.log(`POST ${slug} DETAIL FAIL`); return }
  const $ = cheerio.load(html)
  const hero = $('meta[property="og:image"]').attr('content') || ''
  const title = ($('h1.blog_title').text() || meta.title).trim()
  const contentHtml = $('#content-item').html() || ''
  if (!contentHtml) { console.log(`POST ${slug} NO CONTENT`); return }
  const { html: cleaned, imgs } = cleanContent(contentHtml, slug)

  // download hero + content images in parallel
  const downloads = []
  if (hero) {
    const ext = extFromUrl(hero)
    downloads.push(downloadImage(hero, path.join(IMG_DIR, slug, `hero.${ext}`)).then(ok => ({ kind: 'hero', ext, ok })))
  }
  imgs.forEach((im, i) => {
    const ext = extFromUrl(im.orig)
    const name = im.local.split('/').pop()
    downloads.push(downloadImage(im.orig, path.join(IMG_DIR, slug, name)).then(ok => ({ kind: 'content', name, ok })))
  })
  await Promise.all(downloads)

  let finalHtml = cleaned
  imgs.forEach((im) => {
    const name = im.local.split('/').pop()
    const ok = existsSync(path.join(IMG_DIR, slug, name))
    if (!ok) finalHtml = finalHtml.replace(im.local, im.orig) // fallback to origin
  })

  let publishedAt = new Date().toISOString()
  const d = Date.parse(meta.dateText)
  if (!isNaN(d)) publishedAt = new Date(d).toISOString()

  const summary = meta.summary.replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 300)
  const brandTitle = title.replace(/TOPXGUN/g, 'PARTDRO').replace(/TopXGun/g, 'Partdro').replace(/Topxgun/g, 'Partdro')

  let heroLocal = ''
  if (hero) {
    const ext = extFromUrl(hero)
    if (existsSync(path.join(IMG_DIR, slug, `hero.${ext}`))) heroLocal = `/images/blog/${slug}/hero.${ext}`
  }

  results.push({
    slug,
    category: categorize(brandTitle, summary),
    image_url: heroLocal || hero,
    published_at: publishedAt,
    title: brandTitle,
    summary,
    content: finalHtml,
    content_images: imgs.length,
  })
  done++
  if (done % 10 === 0) console.log(`progress: ${done}/${queue.length}`)
}

await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
  while (queue.length) {
    const item = queue.shift()
    if (!item) break
    await fetchPost(item)
    await new Promise(r => setTimeout(r, 200))
  }
}))

await mkdir(path.dirname(path.join(ROOT, 'scripts', 'blog-data.json')), { recursive: true })
await writeFile(path.join(ROOT, 'scripts', 'blog-data.json'), JSON.stringify(results, null, 2))
console.log(`\nDONE: ${results.length}/${posts.length} posts scraped -> scripts/blog-data.json`)
const noHero = results.filter(r => r.image_url.startsWith('http'))
console.log(`Hero not localized (fallback to origin): ${noHero.length}`)
