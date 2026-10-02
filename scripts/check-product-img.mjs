// Check c15 product image_url vs actual files
import { readFile } from 'node:fs/promises'
import path from 'node:path'
const ROOT = path.resolve(import.meta.dirname, '..')
const envText = await readFile(path.join(ROOT, '.env'), 'utf8')
const env = Object.fromEntries(envText.split(/\r?\n/).filter(l => l.includes('=') && !l.startsWith('#')).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const URL = env.VITE_SUPABASE_URL + '/rest/v1'
const headers = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` }

const rows = await (await fetch(`${URL}/products?select=id,slug,image_url&slug=in.(c15,d15r,y160,sl80,yp800)`, { headers })).json()
console.log(JSON.stringify(rows, null, 1))
