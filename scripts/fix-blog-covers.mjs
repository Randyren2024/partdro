// Replace TopXGun-logo heroes: use first content image where available, else category-based reuse
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const file = path.join(ROOT, 'scripts', 'blog-data.json')
const envText = await readFile(path.join(ROOT, '.env'), 'utf8')
const env = Object.fromEntries(envText.split(/\r?\n/).filter(l => l.includes('=') && !l.startsWith('#')).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const URL = env.VITE_SUPABASE_URL + '/rest/v1'
const KEY = env.SUPABASE_SERVICE_ROLE_KEY
const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }

const posts = JSON.parse(await readFile(file, 'utf8'))
const AGR_POOL = [
  '/images/blog/agricultural-drones-for-cotton-spraying-in-brazil-a-more-flexible-approach-to-crop-protection/content-1.jpg',
  '/images/blog/efficient-pre-emergence-weed-control-in-wheat-with-the-a80-agricultural-drone/content-1.jpg',
  '/images/blog/combating-locust-infestations-with-agricultural-drones/content-1.jpg',
  '/images/blog/in-argentinas-fields-agricultural-drones-are-taking-off/content-1.jpg',
  '/images/blog/maximizing-banana-farming-efficiency-with-agri-drones/content-1.jpg',
  '/images/blog/change-the-way-you-farm-with-a-crop-seeding-drone/content-1.jpg',
]
const LOG_POOL = ['/images/yp800/scene-1.jpg', '/images/yp800/scene-2.jpg', '/images/y160/hero.png']
const IND_POOL = ['/images/sl80/hero.jpg', '/images/sl80/app-mountain.jpg']

let n = 0
const counters = { Agriculture: 0, Logistics: 0, 'Industry News': 0, Cleaning: 0, eVTOL: 0 }
for (const p of posts) {
  const m = p.content.match(/<img[^>]+src="([^"]+)"/)
  if (m) {
    p.image_url = m[1]
  } else {
    const pool = p.category === 'Agriculture' ? AGR_POOL : p.category === 'Logistics' ? LOG_POOL : IND_POOL
    p.image_url = pool[counters[p.category] % pool.length] || pool[0]
    counters[p.category]++
  }
  n++
}
await writeFile(file, JSON.stringify(posts, null, 2))
console.log(`local covers updated: ${n}`)

// DB
const postsRes = await fetch(`${URL}/posts?select=id,slug`, { headers })
const rows = await postsRes.json()
if (!Array.isArray(rows)) { console.log('DB ERR:', JSON.stringify(rows).slice(0, 200)); process.exit(1) }
let dbFixed = 0
for (const r of rows) {
  const local = posts.find(p => p.slug === r.slug)
  if (!local) continue
  const pr = await fetch(`${URL}/posts?id=eq.${r.id}`, { method: 'PATCH', headers, body: JSON.stringify({ image_url: local.image_url }) })
  if (pr.ok) dbFixed++; else console.log(`PATCH fail ${r.id}: ${pr.status}`)
}
console.log(`DB covers updated: ${dbFixed}`)
