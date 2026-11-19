import { createClient } from '@supabase/supabase-js'

/** Public, read-only catalogue client. RLS and narrow catalogue views enforce access. */
export function getSupabase(event: Parameters<typeof useRuntimeConfig>[0]) {
  const config = useRuntimeConfig(event)
  const url = config.public.supabaseUrl || process.env.NUXT_PUBLIC_SUPABASE_URL
  const key = config.public.supabasePublishableKey || process.env.NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) throw createError({ statusCode: 503, statusMessage: 'Catalogue database is not configured' })
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

/** Privileged client for server-only inquiry writes. Never import into app/ code. */
export function getSupabaseServer(event: Parameters<typeof useRuntimeConfig>[0]) {
  const config = useRuntimeConfig(event)
  const url = config.supabaseUrl || process.env.NUXT_SUPABASE_URL
  const key = config.supabaseServiceRoleKey || process.env.NUXT_SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw createError({ statusCode: 503, statusMessage: 'Inquiry service is not configured' })
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}
