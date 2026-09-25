import type { NetlifyEvent, NetlifyResponse } from '../shared/verifyAdmin'

const SITE_URL = 'https://www.droneworld.tech'

interface SlugRow {
  slug: string
}

async function fetchSlugs(table: 'products' | 'posts'): Promise<string[]> {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !anonKey) return []
  try {
    const res = await fetch(`${url}/rest/v1/${table}?select=slug&published=eq.true`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
    })
    if (!res.ok) return []
    const rows = (await res.json()) as SlugRow[]
    return rows.map((r) => r.slug).filter(Boolean)
  } catch {
    return []
  }
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export const handler = async (event: NetlifyEvent): Promise<NetlifyResponse> => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, body: '' }
  }

  // Supabase 查询失败时降级为纯静态路由，保证 sitemap 始终可用
  const [productSlugs, postSlugs] = await Promise.all([fetchSlugs('products'), fetchSlugs('posts')])

  const paths = [
    '/',
    '/products',
    ...productSlugs.map((s) => `/products/${s}`),
    '/cases',
    '/news',
    ...postSlugs.map((s) => `/news/${s}`),
    '/documents',
    '/about',
    '/contact',
  ]

  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    paths.map((p) => `  <url>\n    <loc>${SITE_URL}${escapeXml(p)}</loc>\n  </url>`).join('\n') +
    `\n</urlset>\n`

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
    body,
  }
}
