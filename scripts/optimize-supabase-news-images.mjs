import sharp from 'sharp'

const SUPABASE_URL = process.env.SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const POST_ID = Number(process.env.POST_ID || 200)
const DRY_RUN = process.env.DRY_RUN === 'true'
const MAX_EDGE = Number(process.env.MAX_EDGE || 1920)
const QUALITY = Number(process.env.WEBP_QUALITY || 82)
const BUCKET = 'news-images'

if (!SUPABASE_URL || !SERVICE_KEY) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
if (!Number.isInteger(POST_ID) || POST_ID <= 0) throw new Error('Invalid POST_ID')
const base = SUPABASE_URL.replace(/\/+$/, '')
const headers = { apikey: SERVICE_KEY, Authorization: 'Bearer ' + SERVICE_KEY }

async function request(url, options = {}) {
  const response = await fetch(url, options)
  if (!response.ok) throw new Error((options.method || 'GET') + ' ' + url + ' failed (' + response.status + '): ' + await response.text())
  return response
}

const rowsResponse = await request(base + '/rest/v1/posts?id=eq.' + POST_ID + '&select=id,slug,image_url,gallery', { headers })
const rows = await rowsResponse.json()
if (rows.length !== 1) throw new Error('Expected exactly one post with id=' + POST_ID + '; got ' + rows.length)
const post = rows[0]
const oldUrls = [...new Set([post.image_url, ...(post.gallery || [])].filter(Boolean))]
if (!oldUrls.length) throw new Error('Post ' + POST_ID + ' has no images')
const replacements = new Map()
let totalBefore = 0
let totalAfter = 0

for (const oldUrl of oldUrls) {
  const marker = '/storage/v1/object/public/' + BUCKET + '/'
  const markerIndex = oldUrl.indexOf(marker)
  if (markerIndex < 0) throw new Error('Image URL is not a public ' + BUCKET + ' object: ' + oldUrl)
  const oldPath = decodeURIComponent(oldUrl.slice(markerIndex + marker.length))
  const source = await request(oldUrl)
  const input = Buffer.from(await source.arrayBuffer())
  const metadata = await sharp(input, { failOn: 'error' }).metadata()
  if (!metadata.width || !metadata.height) throw new Error('Cannot read image dimensions: ' + oldPath)
  const output = await sharp(input, { failOn: 'error' }).rotate().resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true }).webp({ quality: QUALITY, effort: 5, smartSubsample: true }).toBuffer()
  const newPath = 'optimized/' + oldPath.replace(/\.[^.]+$/, '') + '.webp'
  const newUrl = base + '/storage/v1/object/public/' + BUCKET + '/' + newPath.split('/').map(encodeURIComponent).join('/')
  replacements.set(oldUrl, newUrl)
  totalBefore += input.length
  totalAfter += output.length
  console.log(JSON.stringify({ source: oldPath, sourceBytes: input.length, dimensions: metadata.width + 'x' + metadata.height, optimizedPath: newPath, optimizedBytes: output.length, reductionPercent: Number((1 - output.length / input.length) * 100).toFixed(1) }))
  if (!DRY_RUN) await request(base + '/storage/v1/object/' + BUCKET + '/' + newPath.split('/').map(encodeURIComponent).join('/'), { method: 'POST', headers: { ...headers, 'Content-Type': 'image/webp', 'Cache-Control': '31536000', 'x-upsert': 'true' }, body: output })
}

if (DRY_RUN) {
  console.log('DRY RUN: no files or database rows changed. ' + oldUrls.length + ' images analyzed.')
} else {
  const replace = (url) => replacements.get(url) || url
  const gallery = (post.gallery || []).map(replace)
  const image_url = replace(post.image_url)
  await request(base + '/rest/v1/posts?id=eq.' + POST_ID, { method: 'PATCH', headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=representation' }, body: JSON.stringify({ image_url, gallery }) })
  console.log('Updated post ' + POST_ID + ' (' + post.slug + ') to ' + replacements.size + ' optimized WebP images.')
}
console.log(JSON.stringify({ images: oldUrls.length, totalBeforeBytes: totalBefore, totalAfterBytes: totalAfter, savedBytes: totalBefore - totalAfter, estimatedReductionPercent: Number((1 - totalAfter / totalBefore) * 100).toFixed(1), dryRun: DRY_RUN }, null, 2))