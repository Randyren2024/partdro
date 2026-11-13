import { createClient } from '@supabase/supabase-js'

// Nuxt auto-imports useRuntimeConfig, but this module-level code runs before setup.
// Use Vite's import.meta.env for client build, and fall back to runtimeConfig via lazy getters.
const url = (import.meta as any).env?.VITE_SUPABASE_URL || ''
const key =
  (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY ||
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  ''

export const supabase = createClient(url, key)
