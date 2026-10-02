// Rebuild blog-data.json correctly from fresh fetch:
// url restore -> content img localization -> data-src cleanup -> brand rewrite -> domain rewrite -> slug rename
// Then upload-blog.mjs does full delete + reinsert.
import { readFile, writeFile, rename } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const IMG_DIR = path.join(ROOT, 'public', 'images', 'blog')
const file = path.join(ROOT, 'scripts', 'blog-data.json')

function extFromUrl(u) {
  const m = u.split('?')[0].match(/\.(jpe?g|png|webp|gif)$/i)
  return m ? m[1].toLowerCase() : 'jpg'
}

const posts = JSON.parse(await readFile(file, 'utf8'))
console.log(`Processing ${posts.length} posts...`)

let imgLocalized = 0, imgFallback = 0, slugRenamed = 0

for (const p of posts) {
  // 1. restore corrupted domain from brand-rewrite (partdroag.com never exists)
  p.content = p.content.split('www.partdroag.com').join('www.topxgunag.com')

  // 2. localize content image src (disk dirs use original slug naming after fresh fetch)
  const srcs = [...new Set([...p.content.matchAll(/<img[^>]+src="(https?:\/\/[^"]+)"/g)].map(m => m[1]))]
  let n = 0
  for (const src of srcs) {
    n++
    const ext = extFromUrl(src)
    const name = `content-${n}.${ext}`
    const dest = path.join(IMG_DIR, p.slug, name)
    if (!existsSync(dest)) {
      imgFallback++
      continue // keep origin URL
    }
    p.content = p.content.split(src).join(`/images/blog/${p.slug}/${name}`)
    imgLocalized++
  }

  // 3. strip data-src debug attribute
  p.content = p.content.replace(/ data-src="[^"]*"/g, '')

  // 4. domain rewrite + brand rewrite (per-field, no split!)
  const clean = s => s
    .replace(/(?:https?:\/\/)?(?:www\.)?topxgunag\.com/g, 'https://www.droneworld.tech')
    .replace(/TOPXGUN/g, 'PARTDRO').replace(/TopXGun/g, 'Partdro').replace(/Topxgun/g, 'Partdro').replace(/topxgun/g, 'partdro')
  p.title = clean(p.title)
  p.summary = clean(p.summary)
  p.content = clean(p.content)

  // 5. slug rename + path sync
  const oldSlug = p.slug
  const newSlug0 = oldSlug.replace(/topxgun/g, 'partdro')
  if (newSlug0 !== oldSlug) {
    const oldDir = path.join(IMG_DIR, oldSlug)
    const newDir = path.join(IMG_DIR, newSlug0)
    if (existsSync(oldDir) && !existsSync(newDir)) await rename(oldDir, newDir)
    p.slug = newSlug0
    p.image_url = p.image_url.split(`/${oldSlug}/`).join(`/${newSlug0}/`)
    p.content = p.content.split(`/images/blog/${oldSlug}/`).join(`/images/blog/${newSlug0}/`)
    slugRenamed++
  }
}

await writeFile(file, JSON.stringify(posts, null, 2))
console.log(`DONE. img localized: ${imgLocalized}, still remote: ${imgFallback}, slugs renamed: ${slugRenamed}`)
console.log('remnant check:', posts.filter(p => /topxgun/i.test(p.title + p.summary + p.content + p.slug + p.image_url)).length)
console.log('empty/truncated check:', posts.filter(p => p.content.length < 500).length, 'posts with content < 500 chars')
