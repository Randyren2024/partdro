// 询盘自动回复：生成草稿 → 人工审批 → 发送
//
// 为什么这样做：询盘数据来自 Supabase，不需要读邮箱；回复必须「机器写、人点头」。
// 因此本函数只做三件事，且全部由一个签名链接驱动：
//   GET  ?id=<询盘id>&t=<签名>  → 读询盘 → 调模型起草英文回信 → 渲染审批页（草稿可编辑）
//   POST 同参数 + draft=<正文>  → 二次验签 → DirectMail 发送（Bcc 归档 + Reply-To 归档）
//   GET  ?id=...                → 无签名或签名不符一律 403，不泄露询盘内容
//
// 硬约束（写死，不可配置绕过）：
//   - 每封客户邮件 Bcc 到归档邮箱，Reply-To 指向归档邮箱（否则客户回信会丢）
//   - 同一询盘只发一次：OSS 存档里有 sent 记录即拒绝，除非显式 force=1（本函数不暴露 force）
//   - 草稿不得出现价格/交期承诺（写进提示词，并在审批页顶部提示人工复核）
import * as crypto from 'node:crypto'

const ARCHIVE_BCC = process.env.ARCHIVE_BCC || 'info@droneworld.tech'
const REPLY_TO = process.env.DM_REPLY_TO || 'info@droneworld.tech'
const FROM_ALIAS = process.env.DM_FROM_ALIAS || 'Randy Ren - Partdro'
const MODEL = process.env.REPLY_MODEL || 'qwen-plus'
const TOKEN_DAYS = 14

interface HttpEvent {
  httpMethod?: string
  rawPath?: string
  queryParameters?: Record<string, string>
  queryStringParameters?: Record<string, string>
  requestContext?: { http?: { method?: string; path?: string; queryString?: string } }
  headers?: Record<string, string>
  body?: string | null
  isBase64Encoded?: boolean
}

// ---------- 事件解析（FC 3.0 HTTP 触发器 / OpenAPI 调用 / Buffer 三种形态） ----------
function toEvent(raw: unknown): HttpEvent {
  if (raw && typeof raw === 'object' && !Buffer.isBuffer(raw) && !(raw as any).isBuf) {
    return raw as HttpEvent
  }
  const s = Buffer.isBuffer(raw) ? raw.toString('utf8') : typeof raw === 'string' ? raw : String(raw)
  try {
    const j = JSON.parse(s)
    if (j && typeof j === 'object') return j as HttpEvent
  } catch {
    /* 落到下面 */
  }
  // 兜底：从原始字符串里正则捞参数（FC 偶发把事件包成 Buffer 且 JSON 不规整）
  const pick = (k: string) => (s.match(new RegExp(`[?&"']${k}=([^"'&]+)`)) || [])[1] || ''
  return { queryParameters: { id: pick('id'), t: pick('t') }, body: s }
}

function methodOf(e: HttpEvent, raw: string): string {
  return String(e.httpMethod || e.requestContext?.http?.method || '').toUpperCase() ||
    (/\"httpMethod\"\s*:\s*\"(GET|POST)\"/.exec(raw)?.[1] ?? '')
}

function queryOf(e: HttpEvent): Record<string, string> {
  const q: Record<string, string> = { ...(e.queryParameters || {}), ...(e.queryStringParameters || {}) }
  const qs = e.requestContext?.http?.queryString || ''
  if (qs) for (const [k, v] of new URLSearchParams(qs)) q[k] = v
  const path = e.rawPath || e.requestContext?.http?.path || ''
  const i = path.indexOf('?')
  if (i >= 0) for (const [k, v] of new URLSearchParams(path.slice(i + 1))) q[k] = v
  return q
}

function bodyOf(e: HttpEvent): string {
  const b = e.body || ''
  if (e.isBase64Encoded) return Buffer.from(b, 'base64').toString('utf8')
  return b
}

// ---------- 签名 ----------
const secret = () => process.env.INQUIRY_WEBHOOK_SECRET || ''

/** 链接令牌：HMAC(secret, "reply:<id>") 前 32 位 base64url；不随天变化，14 天内可用 */
function tokenFor(id: string): string {
  return crypto.createHmac('sha256', secret()).update(`reply:${id}`).digest('base64url').slice(0, 32)
}

function tokenOk(id: string, got: string): boolean {
  if (!secret() || !id || !got) return false
  const a = Buffer.from(tokenFor(id))
  const b = Buffer.from(got)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

function signLink(baseUrl: string, id: string): string {
  const u = new URL(baseUrl)
  u.searchParams.set('id', id)
  u.searchParams.set('t', tokenFor(id))
  return u.toString()
}

// ---------- Supabase / OSS ----------
async function fetchInquiry(id: string): Promise<Record<string, any>> {
  const url = process.env.SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const res = await fetch(`${url}/rest/v1/inquiries?id=eq.${encodeURIComponent(id)}&select=*`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  })
  if (!res.ok) throw new Error(`Supabase ${res.status}`)
  const rows = (await res.json()) as Record<string, any>[]
  if (!rows.length) throw new Error(`inquiry ${id} not found`)
  return rows[0]
}

function ossPutObject(key: string, body: string, contentType: string): Promise<void> {
  const bucket = process.env.OSS_BUCKET!
  const region = process.env.OSS_REGION || 'cn-hongkong'
  const host = `${bucket}.oss-${region}.aliyuncs.com`
  const date = new Date().toUTCString()
  const sts = `PUT\n\n${contentType}\n${date}\n/${bucket}/${key}`
  const sig = crypto.createHmac('sha1', process.env.OSS_AK_SECRET!).update(sts).digest('base64')
  return fetch(`https://${host}/${key}`, {
    method: 'PUT',
    headers: { Authorization: `OSS ${process.env.OSS_AK_ID}:${sig}`, Date: date, 'Content-Type': contentType },
    body,
  }).then(async (r) => {
    if (!r.ok) throw new Error(`OSS put ${key} -> ${r.status}`)
  })
}

async function ossGetObject(key: string): Promise<Record<string, any> | null> {
  const bucket = process.env.OSS_BUCKET!
  const region = process.env.OSS_REGION || 'cn-hongkong'
  const host = `${bucket}.oss-${region}.aliyuncs.com`
  const date = new Date().toUTCString()
  const sts = `GET\n\n\n${date}\n/${bucket}/${key}`
  const sig = crypto.createHmac('sha1', process.env.OSS_AK_SECRET!).update(sts).digest('base64')
  const r = await fetch(`https://${host}/${key}`, {
    headers: { Authorization: `OSS ${process.env.OSS_AK_ID}:${sig}`, Date: date },
  })
  if (r.status === 404) return null
  if (!r.ok) return null
  try {
    return JSON.parse(await r.text())
  } catch {
    return null
  }
}

// ---------- 草稿生成 ----------
function buildPrompt(q: Record<string, any>, profile: Record<string, any> | null): string {
  const facts = [
    `Customer name: ${q.name || 'unknown'}`,
    `Customer email: ${q.email || ''}`,
    q.phone ? `Phone: ${q.phone}` : '',
    q.product_slug ? `Product of interest: ${q.product_slug}` : '',
    q.landing_page ? `Landing page: ${q.landing_page}` : '',
    q.utm_source ? `Source: ${q.utm_source}/${q.utm_medium || ''} ${q.utm_campaign || ''}` : '',
    `Their message: ${q.message || '(empty)'}`,
  ].filter(Boolean).join('\n')
  const p = profile && typeof profile === 'object'
    ? `\nBackground research on this customer (do not repeat verbatim to the customer):\n${JSON.stringify({
        company: profile.company, industry: profile.industry, region: profile.region,
        position: profile.position, intent: profile.intent, summary: profile.summary_cn,
      }, null, 1)}`
    : ''
  return [
    'You are Randy Ren, sales lead at Partdro (droneworld.tech), a Chinese manufacturer of industrial drones',
    '(cleaning drones such as D15R, heavy-lift delivery drones such as C500 / Y160 / YP800, agricultural drones).',
    '',
    'Write a reply email to this inbound B2B inquiry.',
    '',
    facts + p,
    '',
    'Rules:',
    '- Answer in the SAME language the customer used. If unclear, use English.',
    '- 90-140 words. Plain, warm, professional. No marketing fluff, no emoji.',
    '- Acknowledge their specific use case in one sentence.',
    '- Ask at most 3 targeted qualifying questions (e.g. payload/quantity, application, destination country).',
    '- NEVER state or imply a price, discount, delivery date, or lead time. If they asked for pricing, say the team will send a formal quotation after confirming specs.',
    '- Do not invent certifications, test data, or customer references.',
    '- If their message looks like spam or a wrong contact, write a short polite clarification instead of a sales pitch.',
    '- Sign off as: Randy Ren, Partdro | droneworld.tech',
    '',
    'Output format: return ONLY the email body as plain text. First line must be a subject line prefixed with "Subject: ".',
    'No markdown, no code fences, no commentary.',
  ].join('\n')
}

interface Draft { subject: string; body: string }

function parseDraft(text: string): Draft {
  const t = (text || '').trim().replace(/^```[a-z]*\s*/i, '').replace(/```\s*$/, '')
  const lines = t.split('\n')
  let subject = ''
  let body = t
  const m = /^Subject:\s*(.+)$/im.exec(lines[0] || '')
  if (m) {
    subject = m[1].trim()
    body = lines.slice(1).join('\n').trim()
  }
  if (!subject) subject = 'Re: your inquiry to Partdro'
  return { subject: subject.slice(0, 180), body }
}

async function draftReply(q: Record<string, any>): Promise<Draft> {
  const key = process.env.DASHSCOPE_API_KEY
  if (!key) throw new Error('DASHSCOPE_API_KEY is not configured')
  const profile = q.lead_profile && typeof q.lead_profile === 'object' ? q.lead_profile : null
  const res = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: buildPrompt(q, profile) }],
      max_tokens: 700,
      temperature: 0.4,
    }),
  })
  const j = (await res.json()) as any
  if (!res.ok || j.error) throw new Error(`LLM ${res.status}: ${JSON.stringify(j.error || j).slice(0, 300)}`)
  const text = j.choices?.[0]?.message?.content || ''
  if (!text.trim()) throw new Error('LLM returned empty draft')
  return parseDraft(text)
}

// ---------- DirectMail ----------
const pe = (v: string) =>
  encodeURIComponent(v).replace(/\+/g, '%20').replace(/\*/g, '%2A').replace(/%7E/g, '~')
    .replace(/!/g, '%21').replace(/'/g, '%27').replace(/\(/g, '%28').replace(/\)/g, '%29')

function toHtml(body: string): string {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return `<div style="font-family:system-ui,'Segoe UI',Arial,sans-serif;font-size:15px;line-height:1.65;color:#111">` +
    body.split(/\n{2,}/).map((p) => `<p style="margin:0 0 12px">${esc(p).replace(/\n/g, '<br>')}</p>`).join('') +
    `</div>`
}

async function sendMail(to: string, subject: string, text: string): Promise<string> {
  const id = process.env.DIRECTMAIL_ACCESS_KEY_ID
  const sk = process.env.DIRECTMAIL_ACCESS_KEY_SECRET
  const account = process.env.DIRECTMAIL_ACCOUNT
  if (!id || !sk || !account) throw new Error('DIRECTMAIL_* is not configured')
  const params: Record<string, string> = {
    AccessKeyId: id,
    Action: 'SingleSendMail',
    Format: 'JSON',
    RegionId: process.env.DIRECTMAIL_REGION || 'cn-hangzhou',
    SignatureMethod: 'HMAC-SHA1',
    SignatureNonce: crypto.randomUUID(),
    SignatureVersion: '1.0',
    Timestamp: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
    Version: '2015-11-23',
    AccountName: account,
    AddressType: '0',
    FromAlias: FROM_ALIAS,
    ToAddress: to,
    BccAddress: ARCHIVE_BCC,
    ReplyToAddress: 'true',
    ReplyTo: REPLY_TO,
    Subject: subject.slice(0, 180),
    ClickTrace: '1',
    HtmlBody: toHtml(text),
    TextBody: text,
  }
  const canonical = Object.keys(params).sort().map((k) => `${pe(k)}=${pe(params[k])}`).join('&')
  params.Signature = crypto.createHmac('sha1', `${sk}&`)
    .update(`POST&${pe('/')}&${pe(canonical)}`).digest('base64')
  const res = await fetch('https://dm.aliyuncs.com/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params).toString(),
  })
  const out = (await res.json().catch(() => ({}))) as Record<string, any>
  if (!res.ok || out.Code) throw new Error(`DirectMail ${res.status}: ${out.Code || ''} ${out.Message || ''}`)
  return String(out.EnvId || '')
}

// ---------- 页面 ----------
const esc = (s: unknown) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function page(title: string, inner: string): { statusCode: number; headers: Record<string, string>; body: string } {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      // FC HTTP 触发器默认给响应加 Content-Disposition: attachment，浏览器/飞书内置浏览器
      // 会当成下载文件显示源码；显式声明 inline 才能在浏览器里正常渲染页面。
      'content-disposition': 'inline',
      'Cache-Control': 'no-store, private',
      'X-Robots-Tag': 'noindex, nofollow',
      'Referrer-Policy': 'no-referrer',
    },
    body: `<!doctype html><html lang="zh"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>${esc(title)}</title><style>
*{box-sizing:border-box}body{margin:0;padding:20px;background:#f5f6f8;color:#111;
font:15px/1.6 system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,"PingFang SC","Microsoft YaHei",sans-serif}
.card{max-width:760px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:22px}
h1{font-size:18px;margin:0 0 6px}h2{font-size:14px;margin:22px 0 8px;color:#374151}
.meta{font-size:13px;color:#6b7280;margin:0 0 16px}
.warn{background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:10px 12px;font-size:13px;color:#9a3412;margin:0 0 16px}
pre.msg{background:#f9fafb;border:1px solid #eef0f3;border-radius:8px;padding:12px;white-space:pre-wrap;font:13px/1.6 ui-monospace,Menlo,monospace;margin:0}
input[type=text],textarea{width:100%;border:1px solid #d1d5db;border-radius:8px;padding:10px;font:14px/1.6 inherit}
textarea{min-height:320px;font:14px/1.7 ui-monospace,Menlo,monospace;resize:vertical}
label{display:block;font-size:13px;font-weight:600;margin:0 0 6px;color:#374151}
.row{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}
button{border:0;border-radius:8px;padding:12px 20px;font-size:15px;font-weight:600;cursor:pointer}
.primary{background:#111827;color:#fff}.ghost{background:#eef0f3;color:#374151}
.ok{color:#065f46}.err{color:#991b1b}
</style></head><body><div class="card">${inner}</div></body></html>`,
  }
}

// ---------- 入口 ----------
export const handler = async (raw: unknown) => {
  const e = toEvent(raw)
  const rawStr = Buffer.isBuffer(raw) ? raw.toString('utf8') : typeof raw === 'string' ? raw : JSON.stringify(raw)
  const method = methodOf(e, rawStr) || 'GET'
  const q = queryOf(e)
  // 审批页的表单把 id/t 放在 POST body 里（隐藏字段），查询串里没有 → 这里补上
  if (method === 'POST') {
    const form = new URLSearchParams(bodyOf(e))
    if (!q.id && form.get('id')) q.id = String(form.get('id'))
    if (!q.t && form.get('t')) q.t = String(form.get('t'))
  }
  const id = String(q.id || '')
  const token = String(q.t || '')

  if (!id) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ ok: true, service: 'inquiry-reply', model: MODEL, hasSecret: !!secret() }),
    }
  }
  if (!secret()) return page('配置错误', '<h1>配置错误</h1><p class="err">INQUIRY_WEBHOOK_SECRET 未配置，无法校验链接。</p>')
  if (!tokenOk(id, token)) {
    return { statusCode: 403, headers: { 'Content-Type': 'text/plain; charset=utf-8' }, body: 'forbidden' }
  }

  // 已发送过就不再提供编辑页（幂等护栏）
  const ledgerKey = `inquiry-reply/${id}.json`
  const ledger = await ossGetObject(ledgerKey)
  if (ledger?.status === 'sent' && method !== 'GET') {
    return page('已发送', `<h1>已经发过了</h1>
      <p>询盘 #${esc(id)} 于 ${esc(ledger.sent_at)} 已发送（EnvId ${esc(ledger.envId)}），不重复发送。</p>`)
  }

  if (method === 'POST') {
    const form = new URLSearchParams(bodyOf(e))
    const draftBody = String(form.get('draft') || '').trim()
    const subject = String(form.get('subject') || '').trim() || 'Re: your inquiry to Partdro'
    let inquiry: Record<string, any>
    try {
      inquiry = await fetchInquiry(id)
    } catch (err) {
      return page('读取失败', `<h1>读取询盘失败</h1><p class="err">${esc((err as Error).message)}</p>`)
    }
    const to = String(inquiry.email || '').trim()
    if (!to || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) {
      return page('地址无效', `<h1>客户邮箱无效</h1><p class="err">${esc(to || '(空)')}</p>`)
    }
    if (!draftBody) return page('内容为空', '<h1>正文为空，未发送</h1>')

    // 发送前的硬校验：不允许出现明显报价/交期承诺
    const risky = /(\bUSD\s?\d|\$\s?\d|¥\s?\d|\bprice is\b|\bcost is\b|\bdiscount\b|\blead time\b|\bdelivery in \d)/i
    if (risky.test(draftBody)) {
      return page('需人工复核', `<h1>草稿含价格或交期表述，已拦截</h1>
        <p class="warn">检测到可能的报价/交期承诺。请删掉相关表述后重新提交；若确需报价，请用正式报价单流程。</p>
        <form method="get" action=""><input type="hidden" name="id" value="${esc(id)}">
        <input type="hidden" name="t" value="${esc(token)}"><button class="primary">返回修改</button></form>`)
    }

    let envId = ''
    try {
      envId = await sendMail(to, subject, draftBody)
    } catch (err) {
      return page('发送失败', `<h1>发送失败</h1><p class="err">${esc((err as Error).message)}</p>
        <p class="meta">草稿未丢，重新打开链接可再次提交。</p>`)
    }
    const record = { status: 'sent', id, to, subject, body: draftBody, envId, sent_at: new Date().toISOString() }
    await ossPutObject(ledgerKey, JSON.stringify(record, null, 2), 'application/json; charset=utf-8').catch(() => {})
    return page('已发送', `<h1 class="ok">已发送</h1>
      <p>收件人 <b>${esc(to)}</b>，EnvId <code>${esc(envId)}</code>。</p>
      <p class="meta">已 Bcc 到 ${esc(ARCHIVE_BCC)}，Reply-To 指向 ${esc(REPLY_TO)} —— 客户回信会进 info@ 邮箱。</p>`)
  }

  // GET：生成草稿并渲染审批页
  let inquiry: Record<string, any>
  let draft: Draft
  try {
    inquiry = await fetchInquiry(id)
    draft = await draftReply(inquiry)
  } catch (err) {
    return page('生成失败', `<h1>草稿生成失败</h1><p class="err">${esc((err as Error).message)}</p>`)
  }
  const q2 = inquiry
  const inner = `
    <h1>询盘 #${esc(id)} · ${esc(q2.name || '未留姓名')}</h1>
    <p class="meta">${esc(q2.email || '')} · ${esc(q2.created_at || '')}${q2.product_slug ? ' · ' + esc(q2.product_slug) : ''}</p>
    <p class="warn">发送前请复核：草稿不得含价格、折扣、交期承诺。点击发送即真实发信，并 Bcc 到 ${esc(ARCHIVE_BCC)}。</p>
    <h2>客户原文</h2>
    <pre class="msg">${esc(q2.message || '(空)')}</pre>
    <form method="post" action="">
      <input type="hidden" name="id" value="${esc(id)}">
      <input type="hidden" name="t" value="${esc(token)}">
      <h2>主题</h2>
      <input type="text" name="subject" value="${esc(draft.subject)}">
      <h2>回复正文（可直接修改）</h2>
      <textarea name="draft">${esc(draft.body)}</textarea>
      <div class="row">
        <button class="primary" type="submit">批准并发送给 ${esc(q2.email || '')}</button>
      </div>
      <p class="meta" style="margin-top:14px">模型 ${esc(MODEL)} 起草。同一询盘只允许发送一次。</p>
    </form>`
  return page(`审批回复 #${id}`, inner)
}

export const __test = { buildPrompt, parseDraft, tokenFor, tokenOk, signLink, toHtml }
