// Upsort fetched blog data into Supabase posts + post_langs (server-side only)
// Usage: node scripts/upload-blog.mjs [--dry]
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const DRY = process.argv.includes('--dry')

// load env manually
const envText = await readFile(path.join(ROOT, '.env'), 'utf8')
const env = Object.fromEntries(envText.split(/\r?\n/).filter(l => l.includes('=') && !l.startsWith('#')).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const URL = env.VITE_SUPABASE_URL
const KEY = env.SUPABASE_SERVICE_ROLE_KEY

const posts = JSON.parse(await readFile(path.join(ROOT, 'scripts', 'blog-data.json'), 'utf8'))
console.log(`Loaded ${posts.length} posts from blog-data.json`)

async function sb(endpoint, method, body) {
  const res = await fetch(`${URL}/rest/v1/${endpoint}`, {
    method,
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(`${method} ${endpoint} -> ${res.status}: ${t.slice(0, 300)}`)
  }
  return res
}

if (DRY) {
  const sample = posts[0]
  console.log('DRY RUN sample:', JSON.stringify({ slug: sample.slug, category: sample.category, image_url: sample.image_url, title: sample.title, summary: sample.summary.slice(0, 80), contentLen: sample.content.length }, null, 1))
  const noHero = posts.filter(p => p.image_url.startsWith('http')).map(p => p.slug)
  console.log(`Posts with non-local hero: ${noHero.length}`, noHero.slice(0, 10))
  const empty = posts.filter(p => !p.content || p.content.length < 100).map(p => p.slug)
  console.log(`Posts with thin content: ${empty.length}`, empty.slice(0, 10))
  process.exit(0)
}

// 1. delete old posts (post_langs rows cascade or delete explicitly)
const delRes = await fetch(`${URL}/rest/v1/posts?id=neq.0`, {
  method: 'DELETE',
  headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, Prefer: 'return=minimal' },
})
if (!delRes.ok) throw new Error(`DELETE posts failed: ${delRes.status} ${await delRes.text()}`)
await fetch(`${URL}/rest/v1/post_langs?post_id=neq.0`, {
  method: 'DELETE',
  headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, Prefer: 'return=minimal' },
})
console.log('Old posts deleted')

// 2. insert new posts (need ids back)
const rows = posts.map(p => ({
  slug: p.slug,
  category: p.category,
  image_url: p.image_url,
  published: true,
  published_at: p.published_at,
}))
const insRes = await fetch(`${URL}/rest/v1/posts`, {
  method: 'POST',
  headers: {
    apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json',
    Prefer: 'return=representation',
  },
  body: JSON.stringify(rows),
})
if (!insRes.ok) throw new Error(`INSERT posts failed: ${insRes.status} ${await insRes.text()}`)
const inserted = await insRes.json()
console.log(`Inserted ${inserted.length} posts`)
const idBySlug = Object.fromEntries(inserted.map(r => [r.slug, r.id]))

// 3. insert post_langs (en)
const langs = posts.map(p => ({
  post_id: idBySlug[p.slug],
  lang: 'en',
  title: p.title,
  summary: p.summary,
  content: p.content,
})).filter(l => l.post_id)
const langRes = await fetch(`${URL}/rest/v1/post_langs`, {
  method: 'POST',
  headers: {
    apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json',
    Prefer: 'return=minimal',
  },
  body: JSON.stringify(langs),
})
if (!langRes.ok) throw new Error(`INSERT post_langs failed: ${langRes.status} ${await langRes.text()}`)
console.log(`Inserted ${langs.length} post_langs rows`)

// 4. write mapping report
await writeFile(path.join(ROOT, 'scripts', 'blog-upload-report.json'), JSON.stringify({ inserted: inserted.length, langs: langs.length, at: new Date().toISOString() }, null, 2))
console.log('DONE')
