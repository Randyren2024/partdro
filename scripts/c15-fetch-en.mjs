/**
 * 读取 c15 落地页 en 行内容，输出到 scripts/c15-en.json（一次性脚本）。
 * service_role 仅在本地 Node 使用。
 * 运行：node scripts/c15-fetch-en.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync } from 'node:fs'

const env = readFileSync(new URL('../.env', import.meta.url), 'utf8')
const get = (k) => env.match(new RegExp(`^${k}=(.*)$`, 'm'))?.[1].trim()
const supabase = createClient(get('VITE_SUPABASE_URL'), get('SUPABASE_SERVICE_ROLE_KEY'))

const { data, error } = await supabase
  .from('landing_content')
  .select('namespace,lang,content')
  .eq('namespace', 'c15')
  .eq('lang', 'en')
  .maybeSingle()

if (error) {
  console.error('FETCH ERROR:', error.message)
  process.exit(1)
}
if (!data) {
  console.error('No row found for namespace=c15 lang=en')
  process.exit(1)
}

writeFileSync(new URL('./c15-en.json', import.meta.url), JSON.stringify(data.content, null, 2))
console.log('OK: wrote scripts/c15-en.json, top-level keys:', Object.keys(data.content).length)
