/**
 * C15 清理无人机落地页内容写入（一次性脚本）。
 * 仅在本地 Node 环境使用 service_role（服务端语义，绝不进入前端代码/VITE_*）。
 * 运行：node scripts/c15-content.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const env = readFileSync(new URL('../.env', import.meta.url), 'utf8')
const get = (k) => env.match(new RegExp(`^${k}=(.*)$`, 'm'))?.[1].trim()
const supabase = createClient(get('VITE_SUPABASE_URL'), get('SUPABASE_SERVICE_ROLE_KEY'))

const NS = 'c15'
const VIDEO_URL =
  'https://txgcloud.obs.cn-east-3.myhuaweicloud.com/Overseas/%E6%B5%B7%E5%A4%96%E7%8B%AC%E7%AB%8B%E7%AB%99%E5%BB%BA%E7%AB%99%E7%B4%A0%E6%9D%90/C15/C15%E6%B8%85%E6%B4%97%E7%89%87%E6%AE%B5.mp4'

const content = {
  __layout: [
    { id: 'hero', visible: true },
    { id: 'strip', visible: true },
    { id: 'why', visible: true },
    { id: 'designed', visible: true },
    { id: 'output', visible: true },
    { id: 'safety', visible: true },
    { id: 'multiangle', visible: true },
    { id: 'compare', visible: true },
    { id: 'scenarios', visible: true },
    { id: 'video', visible: true },
    { id: 'specs', visible: true },
    { id: 'cta', visible: true },
  ],
  __images: {
    'hero.mainImg': 'product.png',
    'designed.img': 'design.jpg',
    'multiangle.img': 'strength.jpg',
    'scenarios.0.img': 'app-highrise.jpg',
    'scenarios.1.img': 'app-wind.jpg',
    'scenarios.2.img': 'banner.jpg',
    'scenarios.3.img': 'radar.jpg',
  },
  __videos: { 'video.url': VIDEO_URL },

  hero: {
    kicker: 'Aerial Cleaning',
    title1: 'All-Around Aerial Cleaning,',
    title2: 'Safer & Smarter',
    lead:
      'The Partdro C15 cleaning drone delivers 16 MPa high-pressure washing to facades, glass curtain walls and wind turbine blades — with a 120 m high-pressure hose and up to 100 m operating height, all controlled by a single operator.',
    ctaPrimary: 'Get a Quote',
    ctaSecondary: 'Contact Sales',
    badgeTitle: 'Factory direct',
    badgeText: 'Worldwide shipping and support',
    stats: { 0: '21 kg', 1: '16 MPa', 2: '100 m' },
  },
  strip: {
    0: { value: '21 kg', label: 'Drone weight (incl. battery)' },
    1: { value: '16 MPa', label: 'Rated pressure' },
    2: { value: '20 L/min', label: 'Rated flow rate' },
    3: { value: '120 m', label: 'High-pressure hose' },
    4: { value: '100 m', label: 'Max operating height' },
  },
  why: {
    eyebrow: 'Why choose it',
    title: 'Built for demanding cleaning jobs.',
    lead: 'Six reasons contractors pick the C15 over scaffolding and rope-access teams.',
    cards: {
      0: { title: 'Tethered water supply', desc: 'External water hookup enables continuous operation without frequent refills.' },
      1: { title: 'High-pressure cleaning', desc: '16 MPa maximum pressure easily removes stubborn dirt at 20 L/min.' },
      2: { title: 'Extra-long operating radius', desc: '120 m hose and up to 100 m working height cover large-area facades.' },
      3: { title: 'Lightweight single-person operation', desc: '21 kg airframe is easy for one operator to transport and fly.' },
      4: { title: 'Corrosion-resistant washing system', desc: 'Compatible with multiple cleaning agents and stays like new.' },
      5: { title: 'IP67-rated protection', desc: 'Resistant to wind, rain and dust for reliable outdoor work.' },
    },
  },
  designed: {
    eyebrow: 'Engineering',
    title: 'Lightweight and flexible, easy to operate.',
    lead:
      'A compact airframe designed around the realities of facade work: fast to assemble, simple to maintain, easy to position in tight spaces.',
    items: {
      0: { title: 'Lightweight design', desc: '21 kg including battery for comfortable single-person operation.' },
      1: { title: 'Modular structure', desc: 'Quick assembly and easy maintenance between jobs.' },
      2: { title: 'Compact body', desc: 'Smooth operation in narrow or complex spaces.' },
    },
  },
  output: {
    eyebrow: 'Performance',
    title: 'Output that scales.',
    unitTitle: 'Per-unit capability',
    note: 'Measured figures for the C15 high-pressure washing system.',
    rows: {
      0: { label: 'Rated pressure', value: '16 MPa' },
      1: { label: 'Rated flow rate', value: '20 L/min' },
      2: { label: 'Working height', value: 'Up to 100 m' },
      3: { label: 'High-pressure hose', value: '120 m' },
      4: { label: 'Max flight speed', value: '10 m/s' },
    },
  },
  safety: {
    eyebrow: 'Safety',
    title: 'Full awareness for safer operations.',
    lead: 'Layered sensing keeps the drone at a safe distance while giving the operator a clear view of every stain.',
    cards: {
      0: { title: 'Millimeter-wave radar', desc: 'Accurately detects building distance for a stable standoff.' },
      1: { title: 'Real-time FPV feed', desc: 'Makes even hard-to-reach stains clearly visible to the operator.' },
      2: { title: 'RTK high-precision positioning', desc: 'Centimeter-level accuracy for complete flight control.' },
    },
  },
  multiangle: {
    eyebrow: 'In the field',
    title: 'Every angle covered.',
    lead: 'From the spray boom to the sensor pod, every part of the C15 is built for facade work.',
    items: {
      0: { title: 'Front', desc: 'High-pressure nozzle tracks the stain line across the facade.' },
      1: { title: 'Side', desc: '1.6 m spray boom sweeps a wide, even washing path.' },
      2: { title: 'Top', desc: 'Tethered hose feeds continuous water from the ground supply.' },
      3: { title: 'Detail', desc: 'IP67-rated modules resist wind, rain and dust.' },
    },
  },
  compare: {
    eyebrow: 'Comparison',
    title: 'Drone vs. manual facade cleaning.',
    colD15r: 'Partdro C15',
    colManual: 'Manual method',
    rows: {
      0: { label: 'Efficiency', d15r: 'Large facades in minutes', manual: 'Slow, section by section' },
      1: { label: 'Cost per m²', d15r: 'No scaffolding required', manual: 'Scaffolding and gondola rental' },
      2: { label: 'Safety risk', d15r: 'Operator stays on the ground', manual: 'Workers at height' },
      3: { label: 'Quality consistency', d15r: 'Stable 16 MPa jet', manual: 'Varies by crew' },
      4: { label: 'Access to heights', d15r: 'Up to 100 m working height', manual: 'Restricted by equipment' },
      5: { label: 'Setup time', d15r: 'Minutes', manual: 'Hours of rigging' },
    },
  },
  scenarios: {
    0: { title: 'High-Rise Building Cleaning', desc: 'Wash facades and curtain walls without gondolas or rope access.' },
    1: { title: 'Wind Turbine Maintenance', desc: 'Clean blades and nacelles across the entire wind farm.' },
    2: { title: 'Glass Curtain Wall Cleaning', desc: 'Tethered water supply keeps the jet stable at full height.' },
    3: { title: 'FPV Precision Targeting', desc: 'Real-time camera feed makes hard-to-reach stains clearly visible.' },
  },
  video: {
    eyebrow: 'Watch it work',
    title: 'C15 in action.',
    url: VIDEO_URL,
  },
  specs: {
    eyebrow: 'Specifications',
    title: 'Technical specifications.',
    lead: 'Key figures for the C15 aerial cleaning platform.',
    items: {
      0: { label: 'Drone weight (incl. battery)', value: '21 kg' },
      1: { label: 'Spray boom length', value: '1.6 m' },
      2: { label: 'Max flight speed', value: '10 m/s' },
      3: { label: 'High-pressure hose length', value: '120 m' },
      4: { label: 'Max operating height', value: '100 m' },
      5: { label: 'Battery capacity', value: '20 Ah' },
      6: { label: 'Rated pressure', value: '16 MPa' },
      7: { label: 'Rated flow rate', value: '20 L/min' },
      8: { label: 'Protection rating', value: 'IP67' },
      9: { label: 'Positioning', value: 'RTK high-precision' },
      10: { label: 'Obstacle sensing', value: 'Millimeter-wave radar' },
      11: { label: 'Situational awareness', value: 'Real-time FPV camera' },
      12: { label: 'Airframe', value: 'High-strength aluminum' },
      13: { label: 'Assembly', value: 'Modular, quick-release' },
      14: { label: 'Water supply', value: 'Tethered external hookup' },
      15: { label: 'Cleaning agents', value: 'Multi-agent compatible' },
      16: { label: 'Operation', value: 'Single-person' },
      17: { label: 'Washing system', value: 'Corrosion-resistant' },
      18: { label: 'Applications', value: 'Facades & wind turbines' },
    },
  },
  cta: {
    eyebrow: 'Get started',
    title: 'Ready to see it clean?',
    text: 'Talk to our team about demos, pricing and deployment for your buildings or wind farms.',
    visit: 'Back to home',
  },
}

const langs = [
  {
    lang: 'en',
    name: 'Partdro C15 Cleaning Drone',
    short_desc:
      'All-around aerial cleaning drone — 16 MPa high-pressure washing with a 120 m tethered hose and up to 100 m operating height for facades and wind turbines.',
  },
  {
    lang: 'es',
    name: 'Partdro C15 Dron de Limpieza',
    short_desc:
      'Dron de limpieza aérea integral: lavado a alta presión de 16 MPa con manguera de 120 m y hasta 100 m de altura de trabajo para fachadas y aerogeneradores.',
  },
  {
    lang: 'de',
    name: 'Partdro C15 Reinigungsdrohne',
    short_desc:
      'Allround-Reinigungsdrohne: 16-MPa-Hochdruckreinigung mit 120 m Schlauch und bis zu 100 m Arbeitshöhe für Fassaden und Windturbinen.',
  },
  {
    lang: 'fr',
    name: 'Partdro C15 Drone de Nettoyage',
    short_desc:
      "Drone de nettoyage aérien tout-en-un : lavage haute pression 16 MPa avec tuyau de 120 m et jusqu'à 100 m de hauteur de travail pour façades et éoliennes.",
  },
]

const { data: prod, error: perr } = await supabase.from('products').select('id,slug').eq('slug', NS).single()
if (perr || !prod) {
  console.error('product c15 not found:', perr?.message)
  process.exit(1)
}

for (const l of langs) {
  const { error } = await supabase
    .from('product_langs')
    .update({ name: l.name, short_desc: l.short_desc })
    .eq('product_id', prod.id)
    .eq('lang', l.lang)
  if (error) {
    console.error(`product_langs ${l.lang} FAILED:`, error.message)
    process.exit(1)
  }
  console.log(`product_langs ${l.lang} updated`)
}

const { error: lerr } = await supabase
  .from('landing_content')
  .upsert({ namespace: NS, lang: 'en', content }, { onConflict: 'namespace,lang' })
if (lerr) {
  console.error('landing_content upsert FAILED:', lerr.message)
  process.exit(1)
}
console.log(`landing_content ${NS}/en upserted (${Object.keys(content).length} top-level keys)`)
console.log('done.')
