// One-off: fetch the en landing_content row for yp800-delivery-drone and save to JSON.
// Service-role key is read from .env locally only.
import { readFileSync, writeFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const envText = readFileSync(new URL('../.env', import.meta.url), 'utf8')
const env = Object.fromEntries(
  envText
    .split(/\r?\n/)
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=')
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
    }),
)

const url = env.VITE_SUPABASE_URL
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env')
  process.exit(1)
}

const supabase = createClient(url, serviceKey)

const { data, error } = await supabase
  .from('landing_content')
  .select('namespace,lang,content')
  .eq('namespace', 'yp800-delivery-drone')
  .eq('lang', 'en')
  .maybeSingle()

if (error) {
  console.error('Fetch failed:', error.message)
  process.exit(1)
}
if (!data) {
  console.error('No en row found for yp800-delivery-drone')
  process.exit(1)
}

writeFileSync(new URL('./yp800-en.json', import.meta.url), JSON.stringify(data.content, null, 2))
console.log('Saved en row to scripts/yp800-en.json, top-level keys:', Object.keys(data.content).length)
