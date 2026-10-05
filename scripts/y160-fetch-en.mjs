/**
 * Y160 配送无人机：拉取 landing_content 中 en 行内容，存到 scripts/y160-en.json。
 * 仅在本地 Node 环境使用 service_role（服务端语义，绝不进入前端代码/VITE_*）。
 * 运行：node scripts/y160-fetch-en.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync } from 'node:fs'

const env = readFileSync(new URL('../.env', import.meta.url), 'utf8')
const get = (k) => env.match(new RegExp(`^${k}=(.*)$`, 'm'))?.[1].trim()
const supabase = createClient(get('VITE_SUPABASE_URL'), get('SUPABASE_SERVICE_ROLE_KEY'))

const NS = 'y160-delivery-drone'

const { data, error } = await supabase
  .from('landing_content')
  .select('namespace,lang,content')
  .eq('namespace', NS)
  .eq('lang', 'en')
  .maybeSingle()

if (error) { console.error('FETCH ERROR:', error.message); process.exit(1) }
if (!data) { console.error('NO ROW for', NS, 'lang=en'); process.exit(1) }

const out = new URL('./y160-en.json', import.meta.url)
writeFileSync(out, JSON.stringify(data.content, null, 2), 'utf8')
console.log('OK: saved', out.pathname, 'top-level keys:', Object.keys(data.content).length)
