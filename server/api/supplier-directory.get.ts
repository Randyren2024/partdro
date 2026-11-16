import { createClient } from '@supabase/supabase-js'
import supplierSource from '../../app/data/suppliers.json'

/**
 * Public, read-only supplier data endpoint.
 * Uses the publishable/anon key and relies on the tables' SELECT-only RLS policies.
 * Never use the service_role key for this public directory.
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const url = config.public.supabaseUrl
  const key = config.public.supabaseAnonKey

  if (!url || !key) {
    setResponseStatus(event, 503)
    return { error: 'Supplier directory data source is not configured' }
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const [supplierResult, profileResult] = await Promise.all([
    supabase.from('suppliers').select('*').order('region').order('name'),
    supabase.from('supplier_profiles').select('supplier_id, slug, profile_data').order('slug'),
  ])

  if (supplierResult.error || profileResult.error) {
    console.error('[supplier-directory] Supabase read failed', {
      suppliers: supplierResult.error?.message,
      profiles: profileResult.error?.message,
    })
    setResponseStatus(event, 503)
    return { error: 'Supplier directory data is temporarily unavailable' }
  }

  const suppliers = supplierResult.data ?? []
  const profiles = (profileResult.data ?? []).map((row) => row.profile_data)
  const timestamps = suppliers
    .map((row) => row.updated_at)
    .filter((value): value is string => Boolean(value))
    .sort()

  setResponseHeader(event, 'Cache-Control', 'public, max-age=300, s-maxage=600, stale-while-revalidate=3600')

  return {
    suppliers,
    profiles,
    updated: timestamps.length ? timestamps[timestamps.length - 1].slice(0, 10) : supplierSource.updated,
    source: 'supabase',
  }
})
