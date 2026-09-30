/**
 * 修复 c15 landing_content 的 __images/__videos 键名：裸键 → ns 前缀完整键。
 * 运行：node scripts/c15-fix-image-keys.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const env = readFileSync(new URL('../.env', import.meta.url), 'utf8')
const get = (k) => env.match(new RegExp(`^${k}=(.*)$`, 'm'))?.[1].trim()
const supabase = createClient(get('VITE_SUPABASE_URL'), get('SUPABASE_SERVICE_ROLE_KEY'))

const NS = 'c15'
const { data: row, error } = await supabase
  .from('landing_content')
  .select('content')
  .eq('namespace', NS)
  .eq('lang', 'en')
  .maybeSingle()
if (error || !row) {
  console.error('fetch failed:', error?.message)
  process.exit(1)
}

const content = row.content
const rekey = (obj) =>
  Object.fromEntries(Object.entries(obj ?? {}).map(([k, v]) => [k.startsWith(NS + '.') ? k : `${NS}.${k}`, v]))
content.__images = rekey(content.__images)
content.__videos = rekey(content.__videos)

const { error: uerr } = await supabase
  .from('landing_content')
  .upsert({ namespace: NS, lang: 'en', content }, { onConflict: 'namespace,lang' })
if (uerr) {
  console.error('upsert failed:', uerr.message)
  process.exit(1)
}
console.log('fixed keys:', JSON.stringify({ images: content.__images, videos: content.__videos }, null, 2))
