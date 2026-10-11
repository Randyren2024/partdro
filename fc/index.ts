// 阿里云函数计算（FC）HTTP 入口：全站 Web 服务器。
//
// 为什么由 FC 承担全站路由：OSS 静态托管不支持子目录 index 解析（/de/cases 无法命中
// de/cases/index.html，只会回退首页或 404），且路由规则仅支持 301 不支持内部改写。
// 本函数直接读 OSS 对象并实现完整路由逻辑，域名 CNAME 指向 FC 自定义域名即可。
//
// 路由规则：
//   OPTIONS                          → 204（CORS 由触发器处理，这里兜底）
//   /sitemap.xml                     → 复用 netlify sitemap handler（运行时生成，永远新鲜）
//   /api/landing-content             → 复用 netlify handler
//   /api/admin-products              → 复用 netlify handler
//   其余 GET/HEAD                    → 静态服务：
//     路径以 /index.html 结尾        → 301 收敛为无 index.html 的规范路径
//     路径以 / 结尾（非根）          → 301 收敛为无斜杠规范路径
//     路径含扩展名                   → 精确对象直出（assets/robots.txt/图片等）
//     路径无扩展名                   → 只尝试 <path>/index.html
//       （不尝试精确对象：避开 OSS 控制台建的 0 字节目录占位对象被当正文返回）
//     全部未命中                     → 干净的 HTML 404（无 JS 跳转）
//   canonical/sitemap 与无斜杠方案一致，前端零改动。
import type { NetlifyEvent, NetlifyResponse } from '../netlify/shared/verifyAdmin'
import { handler as landingContentHandler } from '../netlify/functions/landing-content'
import { handler as adminProductsHandler } from '../netlify/functions/admin-products'
import { handler as sitemapHandler } from '../netlify/functions/sitemap'

// OSS bucket/region 由 CI 构建期注入（见 scripts/build-fc.mjs 的 define），本地可用环境变量覆盖
declare const __OSS_BUCKET__: string
declare const __OSS_REGION__: string

// CORS 统一由 FC 触发器 corsConfig 处理（函数再返回 Allow-Origin 会重复冲突）

const BUCKET = process.env.OSS_BUCKET || __OSS_BUCKET__ || ''
const REGION = process.env.OSS_REGION || __OSS_REGION__ || 'cn-hongkong'
// 本地模拟测试设 OSS_INTERNAL=false 走公网 endpoint；线上默认同区域内网（免流量费、低延迟）
const INTERNAL = (process.env.OSS_INTERNAL ?? 'true') !== 'false'

const SITE_FALLBACK_HOST = 'www.droneworld.tech'

const CONTENT_TYPES: Record<string, string> = {
  html: 'text/html; charset=utf-8',
  js: 'text/javascript; charset=utf-8',
  mjs: 'text/javascript; charset=utf-8',
  css: 'text/css; charset=utf-8',
  json: 'application/json; charset=utf-8',
  xml: 'application/xml; charset=utf-8',
  txt: 'text/plain; charset=utf-8',
  svg: 'image/svg+xml',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  ico: 'image/x-icon',
  woff: 'font/woff',
  woff2: 'font/woff2',
  ttf: 'font/ttf',
  mp4: 'video/mp4',
  pdf: 'application/pdf',
}

const TEXTUAL = new Set(['html', 'js', 'mjs', 'css', 'json', 'xml', 'txt', 'svg'])

interface FcHttpEvent {
  path?: string
  rawPath?: string
  httpMethod?: string
  requestContext?: { domainName?: string; http?: { path?: string; method?: string } }
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

function extOf(key: string): string {
  const last = key.split('/').pop() || ''
  const i = last.lastIndexOf('.')
  return i > 0 ? last.slice(i + 1).toLowerCase() : ''
}

/** 静态响应的缓存策略：指纹资源长缓存，图片一天，HTML 短缓存保证更新可见 */
function cacheControlFor(key: string): string {
  if (key.startsWith('assets/')) return 'public, max-age=31536000, immutable'
  if (key.startsWith('images/')) return 'public, max-age=86400'
  return 'public, max-age=60'
}

function redirect(status: number, location: string): NetlifyResponse {
  return { statusCode: status, headers: { Location: location, 'Cache-Control': 'public, max-age=86400' }, body: '' }
}

function notFound(): NetlifyResponse {
  return {
    statusCode: 404,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
    body:
      '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>404 Not Found</title>' +
      '<meta name="robots" content="noindex"></head>' +
      '<body style="font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0">' +
      '<div style="text-align:center"><h1>404</h1><p>Page not found. / 页面不存在。</p>' +
      '<p><a href="/">Back to home</a></p></div></body></html>',
  }
}

async function serveStatic(path: string, host: string): Promise<NetlifyResponse> {
  // 规范化：去掉尾斜杠与 /index.html 后缀，统一 301 到无斜杠规范形（不依赖 OSS，先行执行）
  if (path !== '/' && path.endsWith('/')) return redirect(301, `https://${host}${path.slice(0, -1)}`)
  if (path.endsWith('/index.html')) {
    const target = (path.slice(0, -10) || '/').replace(/\/+$/, '') || '/'
    return redirect(301, `https://${host}${target}`)
  }

  if (!BUCKET) {
    return { statusCode: 503, headers: { 'Content-Type': 'text/plain' }, body: 'OSS bucket not configured' }
  }

  const keyCandidates: string[] = []
  if (path === '/') {
    keyCandidates.push('index.html')
  } else if (extOf(path)) {
    keyCandidates.push(path.slice(1)) // 有扩展名：精确对象（assets/robots.txt/图片等）
  } else {
    keyCandidates.push(path.slice(1) + '/index.html') // 无扩展名：只命中目录 index，避开 0 字节占位对象
  }

  const ossHost = `${BUCKET}.oss-${REGION}${INTERNAL ? '-internal' : ''}.aliyuncs.com`
  for (const key of keyCandidates) {
    let ossRes: Response
    try {
      ossRes = await fetch(`https://${ossHost}/${encodeURI(key)}`)
    } catch {
      return { statusCode: 502, headers: { 'Content-Type': 'text/plain' }, body: 'OSS fetch failed' }
    }
    if (!ossRes.ok) continue // 404 等错误：尝试下一候选，最终落干净 404

    const ext = extOf(key)
    const ct = CONTENT_TYPES[ext] || 'application/octet-stream'
    const buf = Buffer.from(await ossRes.arrayBuffer())
    const headers: Record<string, string> = {
      'Content-Type': ct,
      'Cache-Control': cacheControlFor(key),
    }
    if (TEXTUAL.has(ext)) return { statusCode: 200, headers, body: buf.toString('utf8') }
    return { statusCode: 200, headers, body: buf.toString('base64'), isBase64Encoded: true }
  }
  return notFound()
}

export const handler = async (raw: FcHttpEvent | string | Uint8Array): Promise<NetlifyResponse> => {
  const fcEvent = toEvent(raw)
  // HTTP 触发器的路径在 rawPath / requestContext.http.path，InvokeFunction 在 path
  const rawPath = fcEvent.rawPath || fcEvent.path || fcEvent.requestContext?.http?.path || '/'
  let path = rawPath.split('?')[0]
  try {
    path = decodeURI(path)
  } catch {
    /* 畸形百分号编码：保留原样走 404 */
  }
  const method = (fcEvent.httpMethod || fcEvent.requestContext?.http?.method || 'GET').toUpperCase()

  if (method === 'OPTIONS') {
    return { statusCode: 204, body: '' }
  }

  const host =
    fcEvent.requestContext?.domainName || fcEvent.headers?.host || fcEvent.headers?.Host || SITE_FALLBACK_HOST
  // FC 网关不透传 x-forwarded-proto（headers 只有客户端头），event 里也拿不到 scheme，
  // 因此自定义域名协议设为 HTTPS-only（见 fc-domain-setup.mjs），这里一律按 https 处理。

  if (path === '/sitemap.xml') {
    const event: NetlifyEvent = { httpMethod: method, headers: {}, body: null, isBase64Encoded: false }
    return sitemapHandler(event)
  }
  if (path === '/api/landing-content' || path === '/api/admin-products') {
    const event: NetlifyEvent = {
      httpMethod: method,
      // FC 保留 header 原始大小写（Accept/User-Agent），统一小写以兼容大小写敏感查找
      headers: Object.fromEntries(Object.entries(fcEvent.headers || {}).map(([k, v]) => [k.toLowerCase(), v])),
      body: fcEvent.body ?? null,
      isBase64Encoded: !!fcEvent.isBase64Encoded,
    }
    return path === '/api/landing-content' ? landingContentHandler(event) : adminProductsHandler(event)
  }

  if (method !== 'GET' && method !== 'HEAD') {
    return { statusCode: 405, headers: { 'Content-Type': 'text/plain' }, body: 'Method Not Allowed' }
  }
  const hostRedirect = canonicalHostRedirect(host, path)
  if (hostRedirect) return hostRedirect
  return serveStatic(path, host)
}

/** 主机规范化：仅对自有域名生效，FC 触发器域名（fcapp.run/devsapp.net）不受影响。
 *  裸域 droneworld.tech → www（证书与 SEO 规范均以 www 为主机）。
 *  http→https 由网关层保证（自定义域名 protocol=HTTPS），event 无 scheme 可判。 */
function canonicalHostRedirect(host: string, path: string): NetlifyResponse | null {
  if (host !== SITE_FALLBACK_HOST && host !== 'droneworld.tech' && !host.endsWith('.droneworld.tech')) return null
  if (host !== SITE_FALLBACK_HOST) return redirect(301, `https://${SITE_FALLBACK_HOST}${path}`)
  return null
}
