import 'dotenv/config'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const HEADERS = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }

// GET en 行完整 content（PATCH jsonb 是整体替换语义，必须基于最新完整对象修改）
const getUrl = `${SUPABASE_URL}/rest/v1/landing_content?namespace=eq.d15r&lang=eq.en&select=content`
const getResp = await fetch(getUrl, { headers: HEADERS })
const rows = await getResp.json()
if (!rows.length) throw new Error('d15r/en row not found')
const content = rows[0].content

// 在 specs 之前插入 kit（幂等）
const layout = Array.isArray(content.__layout) ? content.__layout : []
if (!layout.some((x) => x.id === 'kit')) {
  const idx = layout.findIndex((x) => x.id === 'specs')
  layout.splice(idx === -1 ? layout.length : idx, 0, { id: 'kit', visible: true })
  content.__layout = layout
}

const patchUrl = `${SUPABASE_URL}/rest/v1/landing_content?namespace=eq.d15r&lang=eq.en`
const patchResp = await fetch(patchUrl, {
  method: 'PATCH',
  headers: HEADERS,
  body: JSON.stringify({ content }),
})
console.log('PATCH status:', patchResp.status)
console.log('layout:', content.__layout.map((x) => x.id).join(','))
console.log('keys:', Object.keys(content).join(','))
