// List landing_content rows: namespace, lang, __images keys presence
import { readFile } from 'node:fs/promises'
import path from 'node:path'
const ROOT = path.resolve(import.meta.dirname, '..')
const envText = await readFile(path.join(ROOT, '.env'), 'utf8')
const env = Object.fromEntries(envText.split(/\r?\n/).filter(l => l.includes('=') && !l.startsWith('#')).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const URL = env.VITE_SUPABASE_URL + '/rest/v1'
const headers = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` }

const rows = await (await fetch(`${URL}/landing_content?select=namespace,lang,content`, { headers })).json()
if (!Array.isArray(rows)) { console.log('ERR', JSON.stringify(rows).slice(0, 200)); process.exit(1) }
for (const r of rows.sort((a, b) => a.namespace.localeCompare(b.namespace) || a.lang.localeCompare(b.lang))) {
  const c = r.content || {}
  const keys = Object.keys(c)
  const hasImages = '__images' in c
  const imgKeys = hasImages ? Object.keys(c.__images || {}).length : 0
  console.log(`${r.namespace} | ${r.lang} | keys=${keys.length} | __images=${imgKeys}`)
}
