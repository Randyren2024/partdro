/**
 * 恢复 c15/en landing_content 行：静态 en.json c15 文本树 + 快照中的 __images/__videos/__layout。
 * 背景：c15/en 行文本键被意外破坏（15 键 → 3 键），静态树是权威文本来源。
 * 运行：node scripts/c15-restore-en.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const env = readFileSync(new URL('../.env', import.meta.url), 'utf8')
const get = (k) => env.match(new RegExp(`^${k}=(.*)$`, 'm'))?.[1].trim()
const supabase = createClient(get('VITE_SUPABASE_URL'), get('SUPABASE_SERVICE_ROLE_KEY'))

const staticEn = JSON.parse(readFileSync(new URL('../src/i18n/en.json', import.meta.url), 'utf8'))
const snap = JSON.parse(readFileSync(new URL('./c15-en.json', import.meta.url), 'utf8'))

if (!staticEn.c15?.hero?.title1) {
  console.error('static en.json c15 tree missing — abort')
  process.exit(1)
}

const content = { ...staticEn.c15 }
for (const k of ['__images', '__videos', '__layout']) {
  if (snap[k]) content[k] = snap[k]
}

const { error } = await supabase
  .from('landing_content')
  .upsert({ namespace: 'c15', lang: 'en', content }, { onConflict: 'namespace,lang' })
if (error) {
  console.error('restore FAILED:', error.message)
  process.exit(1)
}
console.log('c15/en restored:', Object.keys(content).length, 'keys')
