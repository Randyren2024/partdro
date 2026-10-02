// Fix content img src: add leading slash + normalize backslashes (local + DB)
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const file = path.join(ROOT, 'scripts', 'blog-data.json')
const envText = await readFile(path.join(ROOT, '.env'), 'utf8')
const env = Object.fromEntries(envText.split(/\r?\n/).filter(l => l.includes('=') && !l.startsWith('#')).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const URL = env.VITE_SUPABASE_URL
const KEY = env.SUPABASE_SERVICE_ROLE_KEY
const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }

const fixSrc = html => html
  .replace(/src="(?:\.\/)?images\\blog\\/g, 'src="/images/blog/')
  .replace(/src="(?:\.\/)?images\/blog\\/g, 'src="/images/blog/')
  .replace(/src="(?:\.\/)?images\\blog\//g, 'src="/images/blog/')

// local
const posts = JSON.parse(await readFile(file, 'utf8'))
let n = 0
for (const p of posts) {
  const c = fixSrc(p.content)
  if (c !== p.content) { p.content = c; n++ }
}
await writeFile(file, JSON.stringify(posts, null, 2))
console.log(`local fixed: ${n}`)

// DB
const postsRes = await fetch(`${URL}/posts?select=id,slug`, { headers })
const idBySlug = Object.fromEntries((await postsRes.json()).map(r => [r.slug, r.id]))
const langRes = await fetch(`${URL}/post_langs?select=post_id,lang,content&lang=eq.en`, { headers })
const langs = await langRes.json()
let dbFixed = 0
for (const row of langs) {
  const c = fixSrc(row.content || '')
  if (c !== row.content) {
    const r = await fetch(`${URL}/post_langs?post_id=eq.${row.post_id}&lang=eq.en`, { method: 'PATCH', headers, body: JSON.stringify({ content: c }) })
    if (!r.ok) { console.log(`PATCH fail ${row.post_id}: ${r.status}`); continue }
    dbFixed++
  }
}
console.log(`DB fixed: ${dbFixed}`)
