import { getSupabase } from '../../utils/supabase'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 400, statusMessage: 'Supplier slug is required' })
  const db = getSupabase(event)
  const { data: supplier, error } = await db.from('catalogue_suppliers')
    .select('id,name,name_en,region,province,city,district,category,category_label,product_models,website,slug,address,founded_year')
    .eq('slug', slug).maybeSingle()
  if (error) throw createError({ statusCode: 502, statusMessage: 'Unable to load supplier' })
  if (!supplier) throw createError({ statusCode: 404, statusMessage: 'Supplier not found' })
  const { data: products, error: productsError } = await db.from('catalogue_products')
    .select('id,slug,name,name_en,model,brand,category,summary,media')
    .eq('supplier_id', supplier.id).order('name_en', { ascending: true, nullsFirst: false })
  if (productsError) throw createError({ statusCode: 502, statusMessage: 'Unable to load supplier products' })
  return { ...supplier, products: products || [] }
})
