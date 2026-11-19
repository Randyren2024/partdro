import { getSupabase } from '../../utils/supabase'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = Math.max(1, Number(query.page) || 1)
  const pageSize = Math.min(250, Math.max(1, Number(query.limit) || 200))
  const db = getSupabase(event)
  let request = db.from('catalogue_suppliers')
    .select('id,name,name_en,region,province,city,category,category_label,product_models,website,slug,address,founded_year', { count: 'exact' })
    .order('name_en', { ascending: true, nullsFirst: false })
  if (typeof query.q === 'string' && query.q.trim()) {
    const term = query.q.trim().slice(0, 80).replace(/[^\p{L}\p{N}\s_-]/gu, ' ').replace(/\s+/g, ' ')
    request = request.or(`name.ilike.%${term}%,name_en.ilike.%${term}%,city.ilike.%${term}%,province.ilike.%${term}%`)
  }
  const { data, error, count } = await request.range((page - 1) * pageSize, page * pageSize - 1)
  if (error) throw createError({ statusCode: 502, statusMessage: 'Unable to load suppliers' })
  return { items: data || [], total: count || 0, page, pageSize }
})
