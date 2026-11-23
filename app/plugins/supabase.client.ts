import { initSupabase, supabase } from '../supabase/client'

/**
 * Create the shared Supabase client from public runtime config and expose it to
 * components that use useNuxtApp(). Runs before app mount, so lazily-created
 * reads in composables always find an initialized client.
 */
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  initSupabase(
    String(config.public.supabaseUrl || ''),
    String(config.public.supabasePublishableKey || config.public.supabaseAnonKey || ''),
  )

  return {
    provide: {
      supabase,
    },
  }
})