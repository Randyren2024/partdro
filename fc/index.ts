// 阿里云函数计算（FC）HTTP 入口：把 FC HTTP 触发器事件转成 Netlify 事件格式，
// 复用 netlify/functions 下的三个 handler（单一代码源，Netlify 保留可回退）。
import type { NetlifyEvent, NetlifyResponse } from '../netlify/shared/verifyAdmin'
import { handler as landingContentHandler } from '../netlify/functions/landing-content'
import { handler as adminProductsHandler } from '../netlify/functions/admin-products'
import { handler as sitemapHandler } from '../netlify/functions/sitemap'

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization,Content-Type',
}

interface FcHttpEvent {
  path?: string
  rawPath?: string
  httpMethod?: string
  requestContext?: { http?: { path?: string; method?: string } }
  headers?: Record<string, string>
  body?: string | null
  isBase64Encoded?: boolean
}

/** FC 的 event 实测是 String 对象包装的 JSON，或普通对象（InvokeFunction），统一规范化 */
function toEvent(raw: unknown): FcHttpEvent {
  if (raw && typeof raw === 'object' && ('path' in (raw as object) || 'httpMethod' in (raw as object) || 'rawPath' in (raw as object))) {
    return raw as FcHttpEvent
  }
  const s =
    typeof raw === 'string'
      ? raw
      : raw instanceof Uint8Array
        ? Buffer.from(raw).toString('utf8')
        : String(raw)
  return JSON.parse(s) as FcHttpEvent
}

export const handler = async (raw: FcHttpEvent | string | Uint8Array): Promise<NetlifyResponse> => {
  const fcEvent = toEvent(raw)
  // HTTP 触发器的路径在 rawPath / requestContext.http.path，InvokeFunction 在 path
  const rawPath = fcEvent.rawPath || fcEvent.path || fcEvent.requestContext?.http?.path || '/'
  const path = rawPath.replace(/\/+$/, '') || '/'
  const method = (fcEvent.httpMethod || fcEvent.requestContext?.http?.method || 'GET').toUpperCase()

  if (method === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' }
  }

  const event: NetlifyEvent = {
    httpMethod: method,
    headers: fcEvent.headers || {},
    body: fcEvent.body ?? null,
    isBase64Encoded: !!fcEvent.isBase64Encoded,
  }

  let res: NetlifyResponse
  if (path === '/sitemap.xml') {
    res = await sitemapHandler(event)
  } else if (path === '/api/landing-content') {
    res = await landingContentHandler(event)
  } else if (path === '/api/admin-products') {
    res = await adminProductsHandler(event)
  } else {
    res = { statusCode: 404, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Not found' }) }
  }

  return { ...res, headers: { ...(res.headers || {}), ...CORS_HEADERS } }
}
