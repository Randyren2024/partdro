import { getSupabase } from '../utils/supabase'

function escapeXml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const base = String(config.public.siteUrl || 'https://www.droneworld.tech').replace(/\/$/, '')
  const db = getSupabase(event)
  const [{ data: products, error: productError }, { data: suppliers, error: supplierError }] = await Promise.all([
    db.from('catalogue_products').select('slug').limit(5000),
    db.from('catalogue_suppliers').select('slug').not('slug', 'is', null).limit(1000)
  ])
  if (productError || supplierError) throw createError({ statusCode: 502, statusMessage: 'Unable to generate sitemap' })
  const urls = [
    '/', '/products', '/suppliers', '/contact',
    ...(products || []).map((item:any) => item.slug ? `/products/${item.slug}` : ''),
    ...(suppliers || []).map((item:any) => item.slug ? `/suppliers/${item.slug}` : '')
  ].filter(Boolean)
  const body = urls.map(path => `<url><loc>${escapeXml(base + path)}</loc></url>`).join('')
  setHeader(event, 'content-type', 'application/xml; charset=utf-8')
  setHeader(event, 'cache-control', 'public, max-age=300, s-maxage=3600')
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`
})
