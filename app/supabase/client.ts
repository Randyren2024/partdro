import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Public values only: the URL and publishable key are intentionally shipped in
// the browser bundle. Never reference the secret key (sb_secret_...) here.
//
// The client is created lazily so this module can be imported at module scope
// (including during SSR) without touching the Nuxt runtime context. The plugin
// in app/plugins/supabase.client.ts calls initSupabase() with public runtime
// config, so the URL/key can switch between production and a local WSL instance:
//   NUXT_PUBLIC_SUPABASE_URL / NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
let client: SupabaseClient | null = null

export function initSupabase(url: string, key: string): SupabaseClient {
  if (client) return client
  if (!url || !key) {
    throw new Error(
      'Supabase public URL / publishable key 未配置' +
        '（NUXT_PUBLIC_SUPABASE_URL / NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY）',
    )
  }
  client = createClient(url, key)
  return client
}

function getClient(): SupabaseClient {
  if (!client) {
    throw new Error('Supabase client 尚未初始化：请确认 app/plugins/supabase.client.ts 已执行')
  }
  return client
}

// Keep the ergonomic `supabase.from(...)` call sites while deferring creation.
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const instance = getClient()
    const value = Reflect.get(instance, prop, instance)
    return typeof value === 'function' ? value.bind(instance) : value
  },
  has(_target, prop) {
    return prop in getClient()
  },
})