import { createClient } from '@supabase/supabase-js'

// Browser-side public key only. Never expose the Supabase service_role key here.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseKey) {
  console.warn('[supabase] Missing VITE_SUPABASE_URL or public anon/publishable key')
}

export const supabase = createClient(supabaseUrl || 'https://example.supabase.co', supabaseKey || 'missing-public-key')
