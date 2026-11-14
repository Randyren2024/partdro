/**
 * 阿里云 DirectMail 发信（RPC 风格 API，HMAC-SHA1 签名）。
 * 迁移自 partdro/netlify/functions/inquiry-webhook.ts。
 */
import { createHmac, randomUUID } from 'node:crypto'

const API_VERSION = '2015-11-23'

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

export async function sendDirectMail(
  config: {
    accessKeyId: string
    accessKeySecret: string
    account: string
    to: string
    region?: string
    endpoint?: string
    replyToAddress?: string
  },
  subject: string,
  record: Record<string, unknown>,
): Promise<void> {
  const fields = Object.entries(record)
    .filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== '')
    .map(([k, v]) => [k, String(v)] as [string, string])

  const visitorEmail = String(record.email || '')
  const rows = fields
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 12px;font-weight:600;background:#f6f7f9;border:1px solid #e5e7eb;white-space:nowrap">${escapeHtml(k)}</td><td style="padding:6px 12px;border:1px solid #e5e7eb">${escapeHtml(v)}</td></tr>`,
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
    AccessKeyId: config.accessKeyId,
    Action: 'SingleSendMail',
    Format: 'JSON',
    RegionId: config.region || 'cn-hangzhou',
    SignatureMethod: 'HMAC-SHA1',
    SignatureNonce: randomUUID(),
    SignatureVersion: '1.0',
    Timestamp: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
    Version: API_VERSION,
    AccountName: config.account,
    AddressType: '1',
    ReplyToAddress: config.replyToAddress || 'true',
    ToAddress: config.to,
    Subject,
    HtmlBody: htmlBody,
    TextBody: textBody,
  }
  params.Signature = rpcSignature(params, config.accessKeySecret, 'POST')

  const res = await fetch(config.endpoint || 'https://dm.aliyuncs.com/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params).toString(),
  })
  const raw = await res.text()
  let parsed: Record<string, unknown> = {}
  try { parsed = JSON.parse(raw) } catch {}
  if (!res.ok || parsed.Code) {
    throw new Error(`DirectMail failed (${res.status}): ${String(parsed.Code || '')} ${String(parsed.Message || raw).slice(0, 300)}`)
  }
}
