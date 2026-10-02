// Rename slugs topxgun->partdro, strip data-src attrs, sync local dirs + Supabase
import { readFile, writeFile, rename } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const IMG_DIR = path.join(ROOT, 'public', 'images', 'blog')
const file = path.join(ROOT, 'scripts', 'blog-data.json')
const envText = await readFile(path.join(ROOT, '.env'), 'utf8')
const env = Object.fromEntries(envText.split(/\r?\n/).filter(l => l.includes('=') && !l.startsWith('#')).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const URL = env.VITE_SUPABASE_URL
const KEY = env.SUPABASE_SERVICE_ROLE_KEY

const posts = JSON.parse(await readFile(file, 'utf8'))
const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }

let renamed = 0, cleaned = 0
for (const p of posts) {
  // strip data-src debug attribute
  if (p.content.includes('data-src=')) {
    p.content = p.content.replace(/ data-src="[^"]*"/g, '')
    cleaned++
  }
  const oldSlug = p.slug
  const newSlug = oldSlug.replace(/topxgun/g, 'partdro')
  if (newSlug !== oldSlug) {
    // local image dir rename
    const oldDir = path.join(IMG_DIR, oldSlug)
    const newDir = path.join(IMG_DIR, newSlug)
    if (existsSync(oldDir) && !existsSync(newDir)) await rename(oldDir, newDir)
    // rewrite data
    p.slug = newSlug
    p.image_url = p.image_url.split(`/${oldSlug}/`).join(`/${newSlug}/`)
    p.content = p.content.split(`/images/blog/${oldSlug}/`).join(`/images/blog/${newSlug}/`)
    renamed++
  }
}
await writeFile(file, JSON.stringify(posts, null, 2))
console.log(`local: renamed ${renamed} slugs, cleaned data-src in ${cleaned}`)

// Supabase: fetch id by old slug map is gone — use title matching instead
// We patch posts rows whose slug or image_url still contains topxgun
const res = await fetch(`${URL}/rest/v1/posts?select=id,slug,image_url&slug=like.*topxgun*`, { headers })
const rows = await res.json()
console.log(`DB rows with topxgun slug: ${rows.length}`)
for (const r of rows) {
  const newSlug = r.slug.replace(/topxgun/g, 'partdro')
  const newImg = r.image_url.split(`/${r.slug}/`).join(`/${newSlug}/`)
  const pr = await fetch(`${URL}/rest/v1/posts?id=eq.${r.id}`, {
    method: 'PATCH', headers, body: JSON.stringify({ slug: newSlug, image_url: newImg }),
  })
  if (!pr.ok) console.log(`PATCH fail id=${r.id}: ${pr.status} ${await pr.text()}`)
}
console.log('DB slug rename done')
