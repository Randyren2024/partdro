import { initSupabase, supabase } from '../supabase/client'

/**
 * Create the shared Supabase client from public runtime config and expose it to
 * components that use useNuxtApp(). Runs before app mount, so lazily-created
 * reads in composables always find an initialized client.
 */
export default defineNuxtPlugin(async () => {
  const config = useRuntimeConfig()
  let url = String(config.public.supabaseUrl || '')
  let key = String(config.public.supabasePublishableKey || config.public.supabaseAnonKey || '')

  if (!url || !key) {
    try {
      const runtime = await $fetch<{ url?: string; key?: string }>('/api/supabase-config')
      url = runtime.url || url
      key = runtime.key || key
    } catch {
      // Keep the public runtime config values; initSupabase reports the missing value.
    }
  }

  initSupabase(url, key)

  return {
    provide: {
      supabase,
    },
  }
})