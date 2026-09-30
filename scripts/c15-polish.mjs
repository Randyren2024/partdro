/**
 * C15 收尾打磨（Phase 8a/8b）：
 * 1. output 大数字改为可编辑值（100 m / Max operating height），rows.2 改喷臂长度避免重复
 * 2. banner.jpg 以无人机为中心裁方图 → banner-drone.jpg（scenarios.2 用）
 * 运行：node scripts/c15-polish.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import sharp from 'sharp'

const env = readFileSync(new URL('../.env', import.meta.url), 'utf8')
const get = (k) => env.match(new RegExp(`^${k}=(.*)$`, 'm'))?.[1].trim()
const supabase = createClient(get('VITE_SUPABASE_URL'), get('SUPABASE_SERVICE_ROLE_KEY'))

// ---- 1. 内容更新 ----
const { data: row, error: ferr } = await supabase
  .from('landing_content')
  .select('content')
  .eq('namespace', 'c15')
  .eq('lang', 'en')
  .maybeSingle()
if (ferr || !row) {
  console.error('fetch failed:', ferr?.message)
  process.exit(1)
}
const content = row.content
content.output.bigNumber = '100 m'
content.output.unitTitle = 'Max operating height'
content.output.rows[2] = { label: 'Spray boom length', value: '1.6 m' }
content.__images['c15.scenarios.2.img'] = 'banner-drone.jpg'

const { error: uerr } = await supabase
  .from('landing_content')
  .upsert({ namespace: 'c15', lang: 'en', content }, { onConflict: 'namespace,lang' })
if (uerr) {
  console.error('upsert failed:', uerr.message)
  process.exit(1)
}
console.log('content updated: output.bigNumber=100 m, rows.2=spray boom, scenarios.2=banner-drone.jpg')

// ---- 2. banner.jpg 裁切（无人机约在 72% 宽度处，裁方图）----
const src = new URL('../public/images/c15/banner.jpg', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')
const dst = new URL('../public/images/c15/banner-drone.jpg', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')
const meta = await sharp(src).metadata()
const side = meta.height
let left = Math.round(meta.width * 0.72 - side / 2)
left = Math.max(0, Math.min(left, meta.width - side))
await sharp(src).extract({ left, top: 0, width: side, height: side }).jpeg({ quality: 88 }).toFile(dst)
console.log(`banner-drone.jpg: ${side}x${side} from x=${left} (src ${meta.width}x${meta.height})`)
