import { supabase } from '../supabase/client'

/**
 * API 基地址：本地 / Netlify 部署留空（同源 /api/*）；
 * 阿里云部署时构建注入 VITE_API_BASE 指向函数计算自定义域名。
 */
const API_BASE = ((import.meta.env.VITE_API_BASE as string | undefined) || '').replace(/\/+$/, '')

/** 取当前 Supabase session 的 Bearer 头；未登录抛错。 */
export async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Not logged in')
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

/**
 * 调用后端函数：POST <VITE_API_BASE>/api/<path>
 * 自动附带 admin session token；非 2xx 抛出服务端 error 消息。
 */
export async function callFunction<T = unknown>(path: string, body: unknown): Promise<T> {
  const headers = await authHeaders()
  const res = await fetch(`${API_BASE}/api/${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
  const text = await res.text()
  let json: any = null
  if (text) {
    try {
      json = JSON.parse(text)
    } catch {
      /* non-JSON body */
    }
  }
  if (!res.ok) {
    throw new Error(json?.error || `Request failed (${res.status})`)
  }
  return json as T
}
