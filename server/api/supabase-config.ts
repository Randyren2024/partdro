export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event)
  const cfEnv = event.context.cloudflare?.env || {}

  return {
    url:
      String(config.public.supabaseUrl || '') ||
      String(config.supabaseUrl || '') ||
      String(process.env.NUXT_SUPABASE_URL || '') ||
      String(process.env.SUPABASE_URL || '') ||
      String(cfEnv.NUXT_SUPABASE_URL || '') ||
      String(cfEnv.SUPABASE_URL || ''),
    key:
      String(config.public.supabasePublishableKey || config.public.supabaseAnonKey || '') ||
      String(process.env.NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '') ||
      String(process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY || '') ||
      String(process.env.SUPABASE_PUBLISHABLE_KEY || '') ||
      String(cfEnv.NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '') ||
      String(cfEnv.SUPABASE_PUBLISHABLE_KEY || ''),
  }
})