// DB-only: fix content img src paths
import { readFile } from 'node:fs/promises'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const envText = await readFile(path.join(ROOT, '.env'), 'utf8')
const env = Object.fromEntries(envText.split(/\r?\n/).filter(l => l.includes('=') && !l.startsWith('#')).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const URL = env.VITE_SUPABASE_URL + '/rest/v1'
const KEY = env.SUPABASE_SERVICE_ROLE_KEY
const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }

const fixSrc = html => html
  .replace(/src="(?:\.\/)?images\\blog\\/g, 'src="/images/blog/')
  .replace(/src="(?:\.\/)?images\/blog\\/g, 'src="/images/blog/')
  .replace(/src="(?:\.\/)?images\\blog\//g, 'src="/images/blog/')

const langRes = await fetch(`${URL}/post_langs?select=post_id,lang,content&lang=eq.en`, { headers })
const langs = await langRes.json()
if (!Array.isArray(langs)) { console.log('UNEXPECTED:', JSON.stringify(langs).slice(0, 300)); process.exit(1) }
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
