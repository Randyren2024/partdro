import { getSupabase } from '../../utils/supabase'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = Math.max(1, Number(query.page) || 1)
  const pageSize = Math.min(48, Math.max(1, Number(query.limit) || 24))
  const db = getSupabase(event)
  let request = db.from('catalogue_products')
    .select('id,slug,name,name_en,model,brand,category,product_type,summary,description,specifications,features,applications,media,supplier_id', { count: 'exact' })
    .order('name_en', { ascending: true, nullsFirst: false })
  if (typeof query.q === 'string' && query.q.trim()) {
    const term = query.q.trim().slice(0, 80).replace(/[^\p{L}\p{N}\s_-]/gu, ' ').replace(/\s+/g, ' ')
    request = request.or(`name.ilike.%${term}%,name_en.ilike.%${term}%,model.ilike.%${term}%,brand.ilike.%${term}%`)
  }
  if (typeof query.category === 'string' && query.category) request = request.ilike('category', `%${query.category.slice(0, 40)}%`)
  const { data, error, count } = await request.range((page - 1) * pageSize, page * pageSize - 1)
  if (error) throw createError({ statusCode: 502, statusMessage: 'Unable to load products' })
  return { items: data || [], total: count || 0, page, pageSize }
})
