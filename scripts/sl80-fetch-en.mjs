// Fetch landing_content en row for sl80-delivery-drone -> scripts/sl80-en.json
// service_role only in local Node script (server-side semantics, never in frontend).
import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync } from 'node:fs'

const env = readFileSync(new URL('../.env', import.meta.url), 'utf8')
const get = (k) => env.match(new RegExp(`^${k}=(.*)$`, 'm'))?.[1].trim()
const supabase = createClient(get('VITE_SUPABASE_URL'), get('SUPABASE_SERVICE_ROLE_KEY'))

const NS = 'sl80-delivery-drone'

const { data, error } = await supabase
  .from('landing_content')
  .select('namespace,lang,content')
  .eq('namespace', NS)
  .eq('lang', 'en')
  .maybeSingle()

if (error) { console.error('FETCH ERROR:', error.message); process.exit(1) }
if (!data) { console.error('No en row found for', NS); process.exit(1) }

writeFileSync(new URL('./sl80-en.json', import.meta.url), JSON.stringify(data.content, null, 2), 'utf8')
console.log('Saved scripts/sl80-en.json | top-level keys:', Object.keys(data.content).length)
console.log('Top-level keys:', Object.keys(data.content).join(', '))
