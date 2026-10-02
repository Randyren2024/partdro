// Final pass: replace remaining topxgunag.com mentions with droneworld.tech (local + DB)
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const file = path.join(ROOT, 'scripts', 'blog-data.json')
const envText = await readFile(path.join(ROOT, '.env'), 'utf8')
const env = Object.fromEntries(envText.split(/\r?\n/).filter(l => l.includes('=') && !l.startsWith('#')).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const URL = env.VITE_SUPABASE_URL
const KEY = env.SUPABASE_SERVICE_ROLE_KEY
const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }

const posts = JSON.parse(await readFile(file, 'utf8'))
let n = 0
for (const p of posts) {
  const f = (p.title + '\n' + p.summary + '\n' + p.content)
    .replace(/(?:https?:\/\/)?(?:www\.)?topxgunag\.com/g, 'https://www.droneworld.tech')
    .replace(/TOPXGUN/g, 'PARTDRO').replace(/TopXGun/g, 'Partdro').replace(/topxgun/g, 'partdro')
  const [t2, s2, c2] = f.split('\n')
  if (c2 !== p.content || s2 !== p.summary || t2 !== p.title) {
    Object.assign(p, { title: t2, summary: s2, content: c2 })
    n++
  }
}
await writeFile(file, JSON.stringify(posts, null, 2))
console.log(`local fixed: ${n}`)

// DB: patch affected en rows by matching content
const postsRes = await fetch(`${URL}/rest/v1/posts?select=id,slug`, { headers })
const idBySlug = Object.fromEntries((await postsRes.json()).map(r => [r.slug, r.id]))
const langRes = await fetch(`${URL}/rest/v1/post_langs?select=post_id,lang,title,summary,content&lang=eq.en`, { headers })
const langs = await langRes.json()
let dbFixed = 0
for (const row of langs) {
  const c = (row.content || '').replace(/(?:https?:\/\/)?(?:www\.)?topxgunag\.com/g, 'https://www.droneworld.tech')
    .replace(/TOPXGUN/g, 'PARTDRO').replace(/TopXGun/g, 'Partdro').replace(/topxgun/g, 'partdro')
  const t = (row.title || '').replace(/topxgun/gi, 'Partdro')
  const s = (row.summary || '').replace(/(?:https?:\/\/)?(?:www\.)?topxgunag\.com/g, 'https://www.droneworld.tech').replace(/topxgun/gi, 'Partdro')
  if (c !== row.content || t !== row.title || s !== row.summary) {
    const slug = Object.entries(idBySlug).find(([, id]) => id === row.post_id)?.[0]
    const local = posts.find(p => p.slug === slug)
    const body = local ? { title: local.title, summary: local.summary, content: local.content } : { content: c, title: t, summary: s }
    const r = await fetch(`${URL}/rest/v1/post_langs?post_id=eq.${row.post_id}&lang=eq.${row.lang}`, { method: 'PATCH', headers, body: JSON.stringify(body) })
    if (!r.ok) console.log(`PATCH fail post ${row.post_id}: ${r.status}`)
    else dbFixed++
  }
}
console.log(`DB rows fixed: ${dbFixed}`)
