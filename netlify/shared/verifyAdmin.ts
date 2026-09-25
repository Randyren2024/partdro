import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import ws from 'ws'

/** Node 20 无全局 WebSocket，supabase-js RealtimeClient 构造时会抛错 → 注入 ws */
const clientOptions = {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: { transport: ws as unknown as typeof WebSocket },
} as const

export interface NetlifyEvent {
  httpMethod: string
  headers: Record<string, string>
  body: string | null
  isBase64Encoded?: boolean
}

export interface NetlifyResponse {
  statusCode: number
  headers?: Record<string, string>
  body: string
}

export function json(statusCode: number, payload: unknown): NetlifyResponse {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }
}

function env(...names: string[]): string {
  for (const n of names) {
    const v = process.env[n]
    if (v) return v
  }
  return ''
}

export function requireEnv(...names: string[]): string {
  const v = env(...names)
  if (!v) {
    throw new Error(`Missing environment variable: ${names.join(' / ')}`)
  }
  return v
}

export function supabaseUrl(): string {
  return requireEnv('SUPABASE_URL', 'VITE_SUPABASE_URL')
}

export function anonKey(): string {
  return requireEnv('SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY')
}

export function serviceRoleClient(): SupabaseClient {
  return createClient(supabaseUrl(), requireEnv('SUPABASE_SERVICE_ROLE_KEY'), clientOptions)
}

export function parseBody<T>(event: NetlifyEvent): T {
  if (!event.body) throw new BadRequest('Missing request body')
  const raw = event.isBase64Encoded
    ? Buffer.from(event.body, 'base64').toString('utf8')
    : event.body
  try {
    return JSON.parse(raw) as T
  } catch {
    throw new BadRequest('Invalid JSON body')
  }
}

export class HttpError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message)
  }
}

export class BadRequest extends HttpError {
  constructor(message: string) {
    super(400, message)
  }
}

export class Unauthorized extends HttpError {
  constructor(message = 'Unauthorized') {
    super(401, message)
  }
}

export class Forbidden extends HttpError {
  constructor(message = 'Forbidden') {
    super(403, message)
  }
}

export class UpstreamError extends HttpError {
  constructor(statusCode: number, message: string) {
    super(statusCode, message)
  }
}

function bearerToken(event: NetlifyEvent): string | null {
  const header =
    event.headers?.authorization || event.headers?.Authorization || event.headers?.AUTHORIZATION
  if (!header) return null
  const m = /^Bearer\s+(.+)$/i.exec(header.trim())
  return m ? m[1].trim() : null
}

export interface AdminContext {
  userId: string
  username: string
}

/**
 * 1. 用 anon client 校验 Bearer JWT（来自浏览器 supabase.auth session）
 * 2. 用 service_role 查 admins 表确认在册
 * 失败抛 401/403。
 */
export async function verifyAdmin(event: NetlifyEvent): Promise<AdminContext> {
  const token = bearerToken(event)
  if (!token) throw new Unauthorized('Missing Authorization bearer token')

  const anon = createClient(supabaseUrl(), anonKey(), clientOptions)
  const { data, error } = await anon.auth.getUser(token)
  if (error || !data.user) throw new Unauthorized('Invalid or expired session')

  const admin = serviceRoleClient()
  const { data: row, error: aerr } = await admin
    .from('admins')
    .select('username')
    .eq('user_id', data.user.id)
    .maybeSingle()
  if (aerr || !row) throw new Forbidden('Not an administrator')

  return { userId: data.user.id, username: row.username as string }
}

/** 统一错误 → JSON 响应；未知错误记日志并返回 500。 */
export function errorResponse(e: unknown): NetlifyResponse {
  if (e instanceof HttpError) {
    return json(e.statusCode, { error: e.message })
  }
  console.error('Unhandled function error:', e)
  const msg = e instanceof Error ? e.message : 'Internal error'
  return json(500, { error: msg })
}

export function methodGuard(event: NetlifyEvent, method: string): NetlifyResponse | null {
  if (event.httpMethod !== method) {
    return json(405, { error: `Method ${event.httpMethod} not allowed` })
  }
  return null
}
