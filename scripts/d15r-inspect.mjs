import 'dotenv/config'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const HEADERS = { apikey: KEY, Authorization: `Bearer ${KEY}` }

const url = `${SUPABASE_URL}/rest/v1/landing_content?namespace=eq.d15r&select=lang,content`
const resp = await fetch(url, { headers: HEADERS })
const rows = await resp.json()
for (const row of rows) {
  const c = row.content || {}
  console.log('---', row.lang, '| keys:', Object.keys(c).join(','))
  if (c.hero) console.log('  hero:', JSON.stringify(c.hero))
  if (c.cta) console.log('  cta:', JSON.stringify(c.cta))
  if (c.video) console.log('  video:', JSON.stringify(c.video))
  if (c.__layout) console.log('  __layout:', c.__layout.map((x) => x.id + (x.visible === false ? '!' : '')).join(','))
  if (c.__videos) console.log('  __videos:', JSON.stringify(c.__videos))
  console.log('  __images:', Object.keys(c.__images || {}).length, 'keys:', Object.keys(c.__images || {}).join(','))
}
