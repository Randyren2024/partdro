// Fix brand remnants in summaries (local + Supabase post_langs)
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const file = path.join(ROOT, 'scripts', 'blog-data.json')
const envText = await readFile(path.join(ROOT, '.env'), 'utf8')
const env = Object.fromEntries(envText.split(/\r?\n/).filter(l => l.includes('=') && !l.startsWith('#')).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const URL = env.VITE_SUPABASE_URL
const KEY = env.SUPABASE_SERVICE_ROLE_KEY

const fix = s => s ? s.replace(/TOPXGUN/g, 'PARTDRO').replace(/TopXGun/g, 'Partdro').replace(/Topxgun/g, 'Partdro') : s

// 1. local file
const posts = JSON.parse(await readFile(file, 'utf8'))
let localFixed = 0
for (const p of posts) {
  const f = fix(p.summary)
  if (f !== p.summary) { p.summary = f; localFixed++ }
}
await writeFile(file, JSON.stringify(posts, null, 2))
console.log(`Local summaries fixed: ${localFixed}`)

// 2. supabase: map slug->id, patch affected post_langs rows
const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }
const postsRes = await fetch(`${URL}/rest/v1/posts?select=id,slug`, { headers })
const idBySlug = Object.fromEntries((await postsRes.json()).map(r => [r.slug, r.id]))

const langRes = await fetch(`${URL}/rest/v1/post_langs?select=post_id,lang,title,summary&lang=eq.en`, { headers })
const langs = await langRes.json()
let dbFixed = 0
for (const row of langs) {
  const f = fix(row.summary)
  if (f !== row.summary) {
    const r = await fetch(`${URL}/rest/v1/post_langs?post_id=eq.${row.post_id}&lang=eq.en`, {
      method: 'PATCH', headers, body: JSON.stringify({ summary: f }),
    })
    if (!r.ok) { console.log(`PATCH fail post ${row.post_id}: ${r.status}`); continue }
    dbFixed++
  }
}
console.log(`DB summaries fixed: ${dbFixed}`)
