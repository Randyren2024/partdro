// Supabase Database Webhook 接收端：inquiries 表新增记录 → 阿里云邮件推送(DirectMail) 发信。
//
// 链路：inquiries INSERT → Postgres 触发器(pg_net / supabase_functions) → POST 本接口
//       → DirectMail SingleSendMail API → 收件人 INQUIRY_NOTIFY_TO（默认 info@droneworld.tech）
//
// 安全：Supabase webhook 会带上自定义请求头 x-webhook-secret，必须与
//       FC 环境变量 INQUIRY_WEBHOOK_SECRET 一致，否则拒绝（防止该接口被当开放邮件中继）。
//
// 环境变量（配在阿里云 FC 函数的环境变量里，绝不加 VITE_ 前缀）：
//   DIRECTMAIL_ACCESS_KEY_ID / DIRECTMAIL_ACCESS_KEY_SECRET  （或 ALIYUN_AK / ALIYUN_SK）
//   DIRECTMAIL_ACCOUNT      已通过验证的发信地址，如 noreply@droneworld.tech
//   DIRECTMAIL_REGION       默认 cn-hangzhou（只用于签名 RegionId 参数）
//   DIRECTMAIL_ENDPOINT     可选，默认 https://dm.aliyuncs.com/
//                           注意：dm.<region>.aliyuncs.com 中的 cn-hangzhou 不存在，不要按 region 拼端点
//   DIRECTMAIL_REPLY_TO_ADDRESS  默认 true；若 DirectMail 报回信地址错误可设 false
//   INQUIRY_NOTIFY_TO       默认 info@droneworld.tech
//   INQUIRY_WEBHOOK_SECRET  Supabase webhook 共享密钥
//   FEISHU_APP_ID / FEISHU_APP_SECRET   飞书应用凭据（开放平台开发者后台）
//   FEISHU_OPEN_ID          飞书私聊收件人 open_id（ou_xxx）；任一 FEISHU_* 缺失则跳过飞书
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto'
import {
  Unauthorized,
  UpstreamError,
  errorResponse,
  json,
  methodGuard,
  parseBody,
  requireEnv,
  type NetlifyEvent,
  type NetlifyResponse,
} from '../shared/verifyAdmin'

interface SupabaseWebhookPayload {
  type?: string
  table?: string
  schema?: string
  record?: Record<string, unknown> | null
  old_record?: Record<string, unknown> | null
}

const DEFAULT_TO = 'info@droneworld.tech'
const API_VERSION = '2015-11-23'

/** 阿里云 RPC 签名要求的 URL 编码（在 encodeURIComponent 基础上补漏 ! ' ( ) * 并把 %7E 还原为 ~） */
function percentEncode(value: string): string {
  return encodeURIComponent(value)
    .replace(/\+/g, '%20')
    .replace(/\*/g, '%2A')
    .replace(/%7E/g, '~')
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
}

/** 阿里云 RPC 风格 API 的 HMAC-SHA1 签名 */
function rpcSignature(params: Record<string, string>, accessKeySecret: string, method: string): string {
  const canonical = Object.keys(params)
    .sort()
    .map((k) => `${percentEncode(k)}=${percentEncode(params[k])}`)
    .join('&')
  const stringToSign = `${method}&${percentEncode('/')}&${percentEncode(canonical)}`
  return createHmac('sha1', `${accessKeySecret}&`).update(stringToSign).digest('base64')
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function usableFields(record: Record<string, unknown>): Array<[string, string]> {
  return Object.entries(record)
    .filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== '')
    .map(([k, v]) => [k, String(v)] as [string, string])
}

async function sendInquiryEmail(record: Record<string, unknown>): Promise<void> {
  const accessKeyId = requireEnv('DIRECTMAIL_ACCESS_KEY_ID', 'ALIYUN_ACCESS_KEY_ID', 'ALIYUN_AK')
  const accessKeySecret = requireEnv('DIRECTMAIL_ACCESS_KEY_SECRET', 'ALIYUN_ACCESS_KEY_SECRET', 'ALIYUN_SK')
  const account = requireEnv('DIRECTMAIL_ACCOUNT')
  const to = process.env.INQUIRY_NOTIFY_TO || DEFAULT_TO
  const region = process.env.DIRECTMAIL_REGION || 'cn-hangzhou'
  const endpoint = process.env.DIRECTMAIL_ENDPOINT || 'https://dm.aliyuncs.com/'

  const fields = usableFields(record)
  const type = String(record.type || 'contact')
  const name = String(record.name || 'Website visitor')
  const visitorEmail = String(record.email || '')
  const subject = `[Partdro] New ${type} inquiry from ${name}`

  const rows = fields
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 12px;font-weight:600;background:#f6f7f9;border:1px solid #e5e7eb;white-space:nowrap">${escapeHtml(
          k,
        )}</td><td style="padding:6px 12px;border:1px solid #e5e7eb">${escapeHtml(v)}</td></tr>`,
    )
    .join('')
  const replyHint = visitorEmail
    ? `<p style="margin-top:12px">Reply directly to: <a href="mailto:${escapeHtml(visitorEmail)}">${escapeHtml(visitorEmail)}</a></p>`
    : ''
  const htmlBody =
    `<div style="font-family:system-ui,'Segoe UI',sans-serif;color:#111">` +
    `<h2 style="margin:0 0 12px">New inquiry received</h2>` +
    `<table style="border-collapse:collapse;font-size:14px">${rows}</table>${replyHint}` +
    `<p style="color:#6b7280;font-size:12px;margin-top:16px">Sent automatically from the Partdro website contact form.</p>` +
    `</div>`
  const textBody = fields.map(([k, v]) => `${k}: ${v}`).join('\n')

  const params: Record<string, string> = {
    AccessKeyId: accessKeyId,
    Action: 'SingleSendMail',
    Format: 'JSON',
    RegionId: region,
    SignatureMethod: 'HMAC-SHA1',
    SignatureNonce: randomUUID(),
    SignatureVersion: '1.0',
    Timestamp: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
    Version: API_VERSION,
    AccountName: account,
    AddressType: '1',
    ReplyToAddress: process.env.DIRECTMAIL_REPLY_TO_ADDRESS || 'true',
    ToAddress: to,
    Subject: subject,
    HtmlBody: htmlBody,
    TextBody: textBody,
  }
  params.Signature = rpcSignature(params, accessKeySecret, 'POST')

  let res: Response
  try {
    res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(params).toString(),
    })
  } catch (e) {
    // undici 的 fetch failed 只有 message，根因在 cause（DNS/连接超时等）
    const cause = e instanceof Error && e.cause instanceof Error ? e.cause.message : ''
    throw new UpstreamError(502, `DirectMail unreachable (${endpoint}): ${cause || String(e)}`)
  }
  const raw = await res.text()
  let parsed: Record<string, unknown> = {}
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>
  } catch {
    /* 非 JSON 响应：走下面的通用错误分支 */
  }
  if (!res.ok || parsed.Code) {
    throw new UpstreamError(
      502,
      `DirectMail failed (${res.status}): ${String(parsed.Code || '')} ${String(parsed.Message || raw).slice(0, 300)}`,
    )
  }
}

/** lark_md 里会解析 * _ ~ `，对用户输入做转义 */
function escapeMd(value: string): string {
  return value.replace(/([*_~`])/g, '\\$1')
}

async function feishuPost(url: string, body: unknown, token?: string): Promise<Record<string, any>> {
  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    })
  } catch (e) {
    const cause = e instanceof Error && e.cause instanceof Error ? e.cause.message : ''
    throw new UpstreamError(502, `Feishu unreachable (${url}): ${cause || String(e)}`)
  }
  const data = (await res.json().catch(() => ({}))) as Record<string, any>
  if (data.code !== 0) {
    throw new UpstreamError(502, `Feishu API failed (${res.status}): ${data.code} ${String(data.msg || '')}`)
  }
  return data
}

/** 飞书私聊卡片通知；未配置 FEISHU_* 时静默跳过（与邮件并行，互不影响） */
async function sendFeishuNotification(record: Record<string, unknown>): Promise<void> {
  const appId = process.env.FEISHU_APP_ID
  const appSecret = process.env.FEISHU_APP_SECRET
  const openId = process.env.FEISHU_OPEN_ID
  if (!appId || !appSecret || !openId) return

  const fields = usableFields(record)
  const type = String(record.type || 'contact')
  const name = String(record.name || 'Website visitor')
  const subject = `[Partdro] New ${type} inquiry from ${name}`

  const md = (pairs: Array<[string, string]>): string =>
    pairs.map(([k, v]) => `**${escapeMd(k)}**\n${escapeMd(v)}`).join('\n')

  const elements: Array<Record<string, any>> = []
  if (fields.length > 4) {
    elements.push({
      tag: 'div',
      fields: fields
        .slice(0, 4)
        .map(([k, v]) => ({
          is_short: true,
          text: { tag: 'lark_md', content: `**${escapeMd(k)}**\n${escapeMd(v)}` },
        })),
    })
    elements.push({ tag: 'div', text: { tag: 'lark_md', content: md(fields.slice(4)) } })
  } else {
    elements.push({ tag: 'div', text: { tag: 'lark_md', content: md(fields) } })
  }
  elements.push({ tag: 'hr' })
  elements.push({
    tag: 'note',
    elements: [{ tag: 'plain_text', content: 'Sent automatically from the Partdro website contact form.' }],
  })

  const card = {
    config: { wide_screen_mode: true },
    header: { template: 'blue', title: { tag: 'plain_text', content: subject } },
    elements,
  }

  const tok = await feishuPost('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
    app_id: appId,
    app_secret: appSecret,
  })
  await feishuPost(
    'https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=open_id',
    { receive_id: openId, msg_type: 'interactive', content: JSON.stringify(card) },
    String(tok.tenant_access_token),
  )
}

function assertWebhookSecret(event: NetlifyEvent): void {
  const expected = process.env.INQUIRY_WEBHOOK_SECRET
  if (!expected) throw new UpstreamError(503, 'INQUIRY_WEBHOOK_SECRET is not configured')
  const got = event.headers['x-webhook-secret'] || event.headers['X-Webhook-Secret'] || ''
  const a = Buffer.from(expected)
  const b = Buffer.from(got)
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new Unauthorized('Invalid webhook secret')
  }
}

export const handler = async (event: NetlifyEvent): Promise<NetlifyResponse> => {
  try {
    const guard = methodGuard(event, 'POST')
    if (guard) return guard

    assertWebhookSecret(event)

    const payload = parseBody<SupabaseWebhookPayload>(event)
    if (payload.type && payload.type !== 'INSERT') {
      return json(200, { ok: true, skipped: payload.type })
    }
    const record = payload.record
    if (!record || typeof record !== 'object') {
      return json(200, { ok: true, skipped: 'no record' })
    }

    const [mail, feishu] = await Promise.allSettled([
      sendInquiryEmail(record),
      sendFeishuNotification(record),
    ])
    if (mail.status === 'rejected') throw mail.reason
    if (feishu.status === 'rejected') {
      console.error('[inquiry-webhook] feishu notify failed:', feishu.reason)
    }
    console.log('[inquiry-webhook] email sent for inquiry', String(record.id ?? '(no id)'))
    return json(200, { ok: true, feishu: feishu.status === 'fulfilled' })
  } catch (e) {
    return errorResponse(e)
  }
}