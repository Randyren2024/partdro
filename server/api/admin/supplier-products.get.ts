import { getHeader, getQuery, createError, defineEventHandler } from 'h3'
import { getSupabaseServer } from '../../utils/supabase'

const STATUSES = new Set(['draft', 'published', 'archived'])
const VERIFICATION = new Set(['unverified', 'partially_verified', 'verified', 'disputed', 'discontinued'])

export default defineEventHandler(async (event) => {
  const authorization = getHeader(event, 'authorization') || ''
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : ''
  if (!token) throw createError({ statusCode: 401, statusMessage: 'Authentication required' })

  const supabase = getSupabaseServer(event)
  const { data: authData, error: authError } = await supabase.auth.getUser(token)
  if (authError || !authData.user) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid or expired session' })
  }

  const { data: admin, error: adminError } = await supabase
    .from('admins')
    .select('user_id')
    .eq('user_id', authData.user.id)
    .maybeSingle()

  if (adminError || !admin) {
    throw createError({ statusCode: 403, statusMessage: 'Administrator access required' })
  }

  const query = getQuery(event)
  const page = Math.max(1, Number(query.page) || 1)
  const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 25))
  const status = typeof query.status === 'string' ? query.status : ''
  const verification = typeof query.verification === 'string' ? query.verification : ''
  const supplierId = typeof query.supplierId === 'string' ? query.supplierId.trim() : ''
  const search = typeof query.q === 'string' ? query.q.trim().slice(0, 100) : ''

  if (status && !STATUSES.has(status)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid product status' })
  }
  if (verification && !VERIFICATION.has(verification)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid verification status' })
  }

  let request = supabase
    .from('supplier_products')
    .select('id,supplier_id,slug,name,name_en,model,brand,category,product_type,summary,specifications,features,applications,source_url,source_urls,source_type,verification_status,source_verified_at,crawled_at,status,language,updated_at,suppliers!supplier_products_supplier_id_fkey(id,name,name_en,region,province,city)', { count: 'exact' })
    .order('updated_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1)

  if (status) request = request.eq('status', status)
  if (verification) request = request.eq('verification_status', verification)
  if (supplierId) request = request.eq('supplier_id', supplierId)
  if (search) {
    const safe = [...search].filter((char) => {
      const code = char.codePointAt(0) ?? 0
      return (code >= 48 && code <= 57) || (code >= 65 && code <= 90) ||
        (code >= 97 && code <= 122) || (code >= 0x4e00 && code <= 0x9fff) ||
        char === ' ' || char === '-'
    }).join('').trim()
    if (safe) {
      request = request.or(
        'name.ilike.%' + safe + '%,name_en.ilike.%' + safe + '%,model.ilike.%' + safe + '%,brand.ilike.%' + safe + '%',
      )
    }
  }

  const { data, error, count } = await request
  if (error) {
    console.error('[admin/supplier-products] query failed', error.message)
    throw createError({ statusCode: 503, statusMessage: 'Supplier product catalogue is temporarily unavailable' })
  }

  setResponseHeader(event, 'Cache-Control', 'private, no-store')
  return {
    rows: data ?? [],
    page,
    pageSize,
    total: count ?? 0,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  }
})
