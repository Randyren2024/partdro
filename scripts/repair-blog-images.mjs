// Repair: download images missed by fetch script (missing mkdir), rewrite blog-data.json
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync, statSync } from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const IMG_DIR = path.join(ROOT, 'public', 'images', 'blog')
const BASE = 'https://www.topxgunag.com'
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'

function extFromUrl(u) {
  const m = u.split('?')[0].match(/\.(jpe?g|png|webp|gif)$/i)
  return m ? m[1].toLowerCase() : 'jpg'
}

async function downloadImage(url, dest, tries = 3) {
  if (existsSync(dest) && statSync(dest).size > 1000) return true
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(60000) })
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer())
        if (buf.length < 500) return false
        await mkdir(path.dirname(dest), { recursive: true })
        await writeFile(dest, buf)
        return true
      }
    } catch { /* retry */ }
    await new Promise(r => setTimeout(r, 1200 * (i + 1)))
  }
  return false
}

const posts = JSON.parse(await readFile(path.join(ROOT, 'scripts', 'blog-data.json'), 'utf8'))
console.log(`Repairing ${posts.length} posts...`)

let fixedHeroes = 0, fixedContent = 0, failed = []
const CONCURRENCY = 6
const queue = [...posts]
let done = 0

await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
  while (queue.length) {
    const p = queue.shift()
    if (!p) break
    const dir = path.join(IMG_DIR, p.slug)

    // hero
    if (p.image_url.startsWith('http')) {
      const ext = extFromUrl(p.image_url)
      if (await downloadImage(p.image_url, path.join(dir, `hero.${ext}`))) {
        p.image_url = `/images/blog/${p.slug}/hero.${ext}`
        fixedHeroes++
      } else failed.push({ slug: p.slug, img: 'hero', url: p.image_url })
    }

    // content images still pointing to origin
    const srcs = [...p.content.matchAll(/<img[^>]+src="(https?:\/\/[^"]+)"/g)].map(m => m[1])
    let n = 0
    for (const src of srcs) {
      n++
      const ext = extFromUrl(src)
      const name = `content-${n}.${ext}`
      if (await downloadImage(src, path.join(dir, name))) {
        p.content = p.content.split(src).join(`/images/blog/${p.slug}/${name}`)
        fixedContent++
      } else failed.push({ slug: p.slug, img: name, url: src })
    }

    done++
    if (done % 15 === 0) console.log(`progress: ${done}/${posts.length}, failed so far: ${failed.length}`)
  }
}))

await writeFile(path.join(ROOT, 'scripts', 'blog-data.json'), JSON.stringify(posts, null, 2))
console.log(`\nDONE. heroes fixed: ${fixedHeroes}, content imgs fixed: ${fixedContent}, failures: ${failed.length}`)
if (failed.length) console.log(JSON.stringify(failed.slice(0, 20), null, 1))
