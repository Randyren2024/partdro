// Fix c15 product card image: placeholder.svg -> product.png
import { readFile } from 'node:fs/promises'
import path from 'node:path'
const ROOT = path.resolve(import.meta.dirname, '..')
const envText = await readFile(path.join(ROOT, '.env'), 'utf8')
const env = Object.fromEntries(envText.split(/\r?\n/).filter(l => l.includes('=') && !l.startsWith('#')).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const URL = env.VITE_SUPABASE_URL + '/rest/v1'
const headers = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json' }

const r = await fetch(`${URL}/products?slug=eq.c15`, { method: 'PATCH', headers, body: JSON.stringify({ image_url: '/images/c15/product.png' }) })
console.log('PATCH status:', r.status)
const check = await (await fetch(`${URL}/products?select=slug,image_url&slug=eq.c15`, { headers })).json()
console.log(JSON.stringify(check))
