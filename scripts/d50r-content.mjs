/**
 * D50R 光伏清洗无人机上架（一次性脚本）。
 * 仅在本地 Node 环境使用 service_role（服务端语义，绝不进入前端代码/VITE_*）。
 * 运行：node scripts/d50r-content.mjs
 *
 * 内容来源：jsirobot.com D50R 产品页（品牌 JIUSI → Partdro 改写）。
 * 文本基底在 src/i18n/{en,es,de,fr}.json 的 d50r 树（静态），本脚本只写：
 *   1. products 行（category=cleaning，sort_order 排在 d15r 之后）
 *   2. product_langs 四语言 name/short_desc
 *   3. landing_content en 行：__layout + __images（scenarios.0-3.img 留待图片生成后补）
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const env = readFileSync(new URL('../.env', import.meta.url), 'utf8')
const get = (k) => env.match(new RegExp(`^${k}=(.*)$`, 'm'))?.[1].trim()
const supabase = createClient(get('VITE_SUPABASE_URL'), get('SUPABASE_SERVICE_ROLE_KEY'))

const NS = 'd50r'

const __layout = [
  { id: 'hero', visible: true },
  { id: 'strip', visible: true },
  { id: 'why', visible: true },
  { id: 'designed', visible: true },
  { id: 'output', visible: true },
  { id: 'intelligence', visible: true },
  { id: 'safety', visible: true },
  { id: 'multiangle', visible: true },
  { id: 'compare', visible: true },
  { id: 'scenarios', visible: true },
  { id: 'video', visible: true },
  { id: 'specs', visible: true },
  { id: 'cta', visible: true },
]

// 全键名（与 ProductDetailView.imgEdit 的查找键一致）
const __images = {
  'd50r.hero.mainImg': 'hero.jpg',
  'd50r.designed.img': 'tank.png',
  'd50r.intelligence.img': 'gcs-ui.png',
  'd50r.multiangle.img': 'nozzle-angle.png',
  'd50r.scenarios.0.img': 'scenario-0.jpg',
  'd50r.scenarios.1.img': 'scenario-1.jpg',
  'd50r.scenarios.2.img': 'scenario-2.jpg',
  'd50r.scenarios.3.img': 'scenario-3.jpg',
}

const langs = [
  {
    lang: 'en',
    name: 'Partdro D50R Solar Cleaning Drone',
    short_desc:
      'Photovoltaic intelligent cleaning drone — 50 L water tank, automated route planning, dual RTK positioning and 8-10 MPa high-pressure nozzles for large PV plants.',
  },
  {
    lang: 'es',
    name: 'Partdro D50R Dron de Limpieza Solar',
    short_desc:
      'Dron inteligente de limpieza fotovoltaica: depósito de 50 L, planificación automatizada de rutas, posicionamiento doble RTK y boquillas de alta presión de 8-10 MPa para grandes plantas solares.',
  },
  {
    lang: 'de',
    name: 'Partdro D50R Solar-Reinigungsdrohne',
    short_desc:
      'Intelligente Photovoltaik-Reinigungsdrohne: 50-L-Wassertank, automatische Routenplanung, duale RTK-Positionierung und 8-10-MPa-Hochdruckdüsen für große Solarparks.',
  },
  {
    lang: 'fr',
    name: 'Partdro D50R Drone de Nettoyage Solaire',
    short_desc:
      "Drone intelligent de nettoyage photovoltaïque : réservoir de 50 L, planification automatisée des trajectoires, positionnement double RTK et buses haute pression 8-10 MPa pour les grandes centrales solaires.",
  },
]

// ===== 1. products 行（已存在则复用） =====
let prodId
const { data: existing } = await supabase.from('products').select('id').eq('slug', NS).maybeSingle()
if (existing) {
  prodId = existing.id
  console.log('product row exists, reuse id=', prodId)
} else {
  const { data: d15r, error: d15err } = await supabase
    .from('products')
    .select('id,category,sort_order')
    .eq('slug', 'd15r')
    .maybeSingle()
  if (d15err) {
    console.error('d15r lookup FAILED:', d15err.message)
    process.exit(1)
  }
  console.log('d15r row:', JSON.stringify(d15r))

  let sortOrder
  if (d15r && Number.isFinite(d15r.sort_order)) {
    const desired = d15r.sort_order + 1
    const { data: clash } = await supabase
      .from('products')
      .select('id')
      .eq('sort_order', desired)
      .maybeSingle()
    if (clash) {
      const { data: maxRow } = await supabase
        .from('products')
        .select('sort_order')
        .order('sort_order', { ascending: false })
        .limit(1)
        .maybeSingle()
      sortOrder = (maxRow?.sort_order ?? 0) + 1
    } else {
      sortOrder = desired
    }
  } else {
    const { data: maxRow } = await supabase
      .from('products')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle()
    sortOrder = (maxRow?.sort_order ?? 0) + 1
  }

  const { data: inserted, error: ierr } = await supabase
    .from('products')
    .insert({
      slug: NS,
      category: 'cleaning',
      sort_order: sortOrder,
      published: true,
      image_url: `/images/${NS}/hero.jpg`,
    })
    .select('id')
    .single()
  if (ierr) {
    console.error('products insert FAILED:', ierr.message)
    process.exit(1)
  }
  prodId = inserted.id
  console.log(`products row created id=${prodId} sort_order=${sortOrder}`)
}

// ===== 2. product_langs 四语言（复合主键 product_id+lang，直接 upsert） =====
for (const l of langs) {
  const { error } = await supabase
    .from('product_langs')
    .upsert(
      { product_id: prodId, lang: l.lang, name: l.name, short_desc: l.short_desc },
      { onConflict: 'product_id,lang' },
    )
  if (error) {
    console.error(`product_langs ${l.lang} FAILED:`, error.message)
    process.exit(1)
  }
  console.log(`product_langs ${l.lang} ok`)
}

// ===== 3. landing_content en 行（仅媒体/布局覆盖；文本基底在 src/i18n 静态树） =====
const { error: lerr } = await supabase
  .from('landing_content')
  .upsert({ namespace: NS, lang: 'en', content: { __layout, __images } }, { onConflict: 'namespace,lang' })
if (lerr) {
  console.error('landing_content upsert FAILED:', lerr.message)
  process.exit(1)
}
console.log(`landing_content ${NS}/en upserted (${__layout.length} sections, ${Object.keys(__images).length} images)`)

// ===== 4. 验证 =====
const { data: v, error: verr } = await supabase
  .from('products')
  .select('slug,category,sort_order,published,image_url')
  .eq('slug', NS)
  .single()
if (verr) {
  console.error('VERIFY FAILED:', verr.message)
  process.exit(1)
}
console.log('verify products:', JSON.stringify(v))

const { data: lc } = await supabase
  .from('landing_content')
  .select('lang,content')
  .eq('namespace', NS)
console.log('landing_content rows:', (lc ?? []).map((r) => r.lang).join(','))
console.log('done.')
