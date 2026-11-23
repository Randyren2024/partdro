/**
 * 服务端 Supabase 客户端（secret key，仅 Nitro server 可用）。
 * 与 shopify-vesper/web 的 server/utils/shopify.ts 角色相同。
 *
 * secret key（sb_secret_...，替代原 service_role key）拥有数据库全部权限，
 * 绝不能出现在客户端 bundle。所有前端→Supabase 写操作都必须走 server/api/* 路由。
 */
import { createClient } from '@supabase/supabase-js'

export function getSupabaseServer(event: any = null) {
  const config = event ? useRuntimeConfig(event) : useRuntimeConfig()
  const secretKey = config.supabaseSecretKey || config.supabaseServiceRoleKey
  if (!config.supabaseUrl || !secretKey) {
    throw new Error(
      'Supabase 服务端凭据未配置: NUXT_SUPABASE_URL / NUXT_SUPABASE_SECRET_KEY' +
        '（legacy: NUXT_SUPABASE_SERVICE_ROLE_KEY）',
    )
  }
  return createClient(config.supabaseUrl, secretKey)
}