import 'dotenv/config'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY
const HEADERS = {
  'apikey': SUPABASE_SECRET,
  'Authorization': `Bearer ${SUPABASE_SECRET}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation',
}

// 完整 content：恢复原始结构 + 更新 videos
const fullContent = {
  "cta": { "eyebrow": "Partdro Cleaning Drone Series D15R" },
  "hero": { "kicker": "PARTDRO Cleaning Drone Series D15R" },
  "video": { "title": "D15r Video" },
  "__images": { "d15r.hero.mainImg": "banner.png" },
  "__layout": [
    { "id": "hero", "visible": true },
    { "id": "strip", "visible": true },
    { "id": "why", "visible": true },
    { "id": "designed", "visible": true },
    { "id": "output", "visible": true },
    { "id": "spray", "visible": true },
    { "id": "intelligence", "visible": true },
    { "id": "safety", "visible": true },
    { "id": "multiangle", "visible": true },
    { "id": "compare", "visible": true },
    { "id": "applications", "visible": true },
    { "id": "scenarios", "visible": true },
    { "id": "video", "visible": true },
    { "id": "specs", "visible": true },
    { "id": "cta", "visible": true },
  ],
  "__videos": {
    "d15r.video.url": "https://youtu.be/2QOWvibN60c",
    "d15r.video.poster": "/d15r/images/page014_img001.png",
  },
}

const patchUrl = `${SUPABASE_URL}/rest/v1/landing_content?namespace=eq.d15r&lang=eq.en`
const resp = await fetch(patchUrl, {
  method: 'PATCH',
  headers: HEADERS,
  body: JSON.stringify({ content: fullContent }),
})
const data = await resp.json()
console.log('恢复结果:', resp.status, 'keys:', Object.keys(data.content).join(', '))
