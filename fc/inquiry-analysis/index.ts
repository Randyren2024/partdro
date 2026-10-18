// 询盘客户背景调研（inquiries 深度分析，Claude Code 云沙箱架构）：
// inquiry-webhook 发完询盘通知后，经 FC 异步调用（x-fc-invocation-type: Async）进入本函数
//   → 校验 x-webhook-secret → 免费邮箱过滤（跳过不开沙箱）
//   → E2B 创建 Claude Code 沙箱（模板 claude-code-gsc，百炼 deepseek-v4.1-flash 中转）
//   → 沙箱内 claude 联网调研发件人背景（公司/行业/地区/职位/可信度/意向）→ 产出 JSON
//   → 三路输出：飞书私聊卡片 + DM 邮件 + PATCH 写回 inquiries.lead_profile → OSS 存档 → 销毁沙箱
// 失败语义：只记函数日志 + OSS 错误存档 + 表回写 failed 标记，不发飞书/邮件（避免噪音）。
import { Sandbox } from 'e2b'
import * as crypto from 'node:crypto'

const TEMPLATE = process.env.E2B_TEMPLATE || 'claude-code-gsc'
const MODEL = process.env.ANTHROPIC_MODEL || 'deepseek-v4.1-flash'
const DEFAULT_TO = (process.env.DM_TO || 'info@droneworld.tech').trim()

/** 内置免费个人邮箱域（命中即跳过联网调研）；可用 SKIP_FREE_EMAIL_DOMAINS（逗号分隔）追加 */
const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com', 'googlemail.com', 'outlook.com', 'hotmail.com', 'live.com', 'msn.com',
  'yahoo.com', 'yahoo.co.jp', 'yahoo.co.uk', 'aol.com', 'protonmail.com', 'proton.me',
  'icloud.com', 'me.com', 'mac.com',
  'qq.com', 'foxmail.com', '163.com', '126.com', 'yeah.net', 'sina.com', 'sina.cn',
  'sohu.com', '139.com', '189.cn', '21cn.com', 'tom.com', 'vip.qq.com',
])

interface LeadProfile {
  company: string
  industry: string
  region: string
  position: string
  website: string
  credibility: 'high' | 'medium' | 'low'
  intent: string
  summary_cn: string
  sources: string[]
}

interface HttpEvent {
  httpMethod?: string
  rawPath?: string
  requestContext?: { http?: { method?: string; path?: string } }
  headers?: Record<string, string>
  body?: string | null
  isBase64Encoded?: boolean
}

function toEvent(raw: unknown): HttpEvent {
  if (raw && typeof raw === 'object' && ('headers' in (raw as object) || 'httpMethod' in (raw as object) || 'rawPath' in (raw as object))) {
    return raw as HttpEvent
  }
  const s =
    typeof raw === 'string'
      ? raw
      : raw instanceof Uint8Array
        ? Buffer.from(raw).toString('utf8')
        : String(raw)
  try {
    const j = JSON.parse(s) as Record<string, unknown>
    if (j && (j.headers || j.httpMethod || j.rawPath || j.requestContext)) return j as unknown as HttpEvent
    return { body: s }
  } catch {
    return { body: s }
  }
}

/** FC 3.0 HTTP 触发器：方法在 requestContext.http.method；InvokeFunction/旧格式：httpMethod */
function methodOf(event: HttpEvent): string {
  return String(event.httpMethod || event.requestContext?.http?.method || '').toUpperCase()
}

/** HTTP 触发器调用（需验密钥）；OpenAPI InvokeFunction（无 HTTP 上下文）视为内部调用放行 */
function isHttpRequest(event: HttpEvent): boolean {
  return !!(event.httpMethod || event.rawPath || event.requestContext || event.headers)
}

function headerOf(event: HttpEvent, name: string): string {
  // FC 会把 header 规范化成混合大小写（如 X-Webhook-Secret），必须大小写不敏感查找
  const target = name.toLowerCase()
  for (const [k, v] of Object.entries(event.headers || {})) {
    if (k.toLowerCase() === target) return String(v)
  }
  return ''
}

function json(statusCode: number, body: unknown) {
  return { statusCode, headers: { 'Content-Type': 'application/json; charset=utf-8' }, body: JSON.stringify(body) }
}

function emailDomain(email: string): string {
  const at = String(email || '').trim().toLowerCase().lastIndexOf('@')
  return at > -1 ? email.trim().toLowerCase().slice(at + 1) : ''
}

function isFreeEmail(email: string): boolean {
  const d = emailDomain(email)
  if (!d) return true // 无邮箱：不调研
  if (FREE_EMAIL_DOMAINS.has(d)) return true
  const extra = (process.env.SKIP_FREE_EMAIL_DOMAINS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  return extra.includes(d)
}

/** 容错解析 agent 产出的 JSON（剥 ```json 围栏、取首尾大括号） */
function parseProfileJson(text: string): LeadProfile {
  let t = (text || '').trim()
  t = t.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '')
  const a = t.indexOf('{')
  const b = t.lastIndexOf('}')
  if (a < 0 || b <= a) throw new Error('lead profile JSON not found: ' + t.slice(0, 200))
  const j = JSON.parse(t.slice(a, b + 1)) as Record<string, unknown>
  const str = (v: unknown) => (v === null || v === undefined ? '' : String(v)).trim()
  const cred = str(j.credibility).toLowerCase()
  return {
    company: str(j.company),
    industry: str(j.industry),
    region: str(j.region),
    position: str(j.position),
    website: str(j.website),
    credibility: cred === 'high' || cred === 'medium' ? cred : 'low',
    intent: str(j.intent),
    summary_cn: str(j.summary_cn),
    sources: Array.isArray(j.sources) ? j.sources.map(str).filter(Boolean).slice(0, 8) : [],
  }
}

// ---------- 沙箱内调研提示词 ----------
function buildLeadPrompt(record: Record<string, unknown>): string {
  const data = JSON.stringify({
    id: record.id ?? null,
    name: record.name ?? '',
    email: record.email ?? '',
    phone: record.phone ?? '',
    type: record.type ?? 'contact',
    message: record.message ?? '',
    created_at: record.created_at ?? '',
  }, null, 1)
  return [
    '你是 Partdro（droneworld.tech，无人机/机器人产品 B2B 出口商）的销售情报分析师。',
    '下面是一条来自官网联系表单的询盘 JSON：',
    data,
    '',
    '任务：产出结构化客户画像。',
    '调研方式（重要）：本环境的 WebSearch/WebFetch 工具不可用（网关不支持），必须用 bash 里的 curl 命令联网：',
    '- 抓官网：curl -sL --max-time 20 <url>（跟随重定向；HTML 直接阅读，可用 sed/grep 辅助提取）',
    '- 搜索：curl -sL "https://www.bing.com/search?q=<关键词>" 或 https://html.duckduckgo.com/html/?q=<关键词>',
    '- 搜索引擎可能反爬（返回 202/验证页）：失败就换另一个，仍失败则基于邮箱域名/电话区号推理并如实说明未验证',
    '调研要点：',
    '- 邮箱域名对应公司：官网、注册地/办公地、规模、主营业务',
    '- 姓名+公司 → 职位/LinkedIn/行业曝光（找不到就留空，严禁编造）',
    '- 电话区号/归属地 → 国家或城市',
    '- 询盘内容：判断采购意向强度与关注的产品线',
    '- 可信度：high（公司官网/LinkedIn/行业媒体可验证）/ medium（部分证据）/ low（无法验证或疑似垃圾询盘）',
    '',
    '规则：',
    '- 只依据搜索到的证据；找不到的字段填空字符串，不要编造',
    '- 文本字段全部用中文（公司名/人名/URL 等专有名词除外）',
    '- 把结果写入 /home/user/lead_profile.json（UTF-8，单个 JSON 对象，无 markdown 围栏、无解释文字），格式：',
    '{"company":"","industry":"","region":"","position":"","website":"","credibility":"low","intent":"","summary_cn":"","sources":[]}',
    '- summary_cn 为 2~4 句中文综述（这家公司是谁、可能在找什么、是否值得跟进）；sources 填你实际访问过的 URL',
    '- 写完文件后，标准输出仅回复一行：DONE',
  ].join('\n')
}

// ---------- 阿里云邮件推送 DM（RPC HMAC-SHA1 手写签名，零依赖，与 deep-analysis 同款） ----------
function dmPercentEncode(value: string): string {
  return encodeURIComponent(value)
    .replace(/\+/g, '%20')
    .replace(/\*/g, '%2A')
    .replace(/%7E/g, '~')
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function escapeMd(s: string): string {
  return s.replace(/([*_~`])/g, '\\$1')
}

async function sendLeadEmail(id: string, name: string, email: string, p: LeadProfile, ossUrl: string): Promise<void> {
  const accessKeyId = process.env.DIRECTMAIL_ACCESS_KEY_ID
  const accessKeySecret = process.env.DIRECTMAIL_ACCESS_KEY_SECRET
  const account = process.env.DIRECTMAIL_ACCOUNT
  if (!accessKeyId || !accessKeySecret || !account) {
    console.log('[inquiry-analysis] DIRECTMAIL_* 未配置，跳过邮件')
    return
  }
  const rows: Array<[string, string]> = [
    ['询盘编号', `#${id}`],
    ['姓名', name || '-'],
    ['邮箱', email || '-'],
    ['公司', p.company || '-'],
    ['行业', p.industry || '-'],
    ['地区', p.region || '-'],
    ['职位', p.position || '-'],
    ['网站', p.website || '-'],
    ['可信度', p.credibility],
    ['采购意向', p.intent || '-'],
  ]
  const table = rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 12px;font-weight:600;background:#f6f7f9;border:1px solid #e5e7eb;white-space:nowrap">${escapeHtml(k)}</td><td style="padding:6px 12px;border:1px solid #e5e7eb">${escapeHtml(v)}</td></tr>`,
    )
    .join('')
  const sources = p.sources.length
    ? `<p style="margin:12px 0 4px;font-weight:600">信息来源</p>${p.sources.map((u) => `<p style="margin:2px 0;font-size:12px"><a href="${escapeHtml(u)}">${escapeHtml(u)}</a></p>`).join('')}`
    : ''
  const link = ossUrl ? `<p style="margin-top:12px;font-size:12px;color:#6b7280">完整存档：<a href="${escapeHtml(ossUrl)}">OSS（7 天有效）</a></p>` : ''
  const htmlBody =
    `<div style="font-family:system-ui,'Segoe UI',sans-serif;color:#111">` +
    `<h2 style="margin:0 0 12px">客户背景调研 #${escapeHtml(id)}</h2>` +
    `<table style="border-collapse:collapse;font-size:14px">${table}</table>` +
    `<p style="margin:12px 0 4px;font-weight:600">综述</p><p style="margin:0;color:#333">${escapeHtml(p.summary_cn || '-')}</p>` +
    sources + link +
    `<p style="color:#6b7280;font-size:12px;margin-top:16px">由 Partdro 询盘分析流水线自动生成（模型 ${escapeHtml(MODEL)}）。</p>` +
    `</div>`
  const textBody = [...rows.map(([k, v]) => `${k}: ${v}`), `综述: ${p.summary_cn}`, ...p.sources].join('\n')

  const params: Record<string, string> = {
    AccessKeyId: accessKeyId,
    Action: 'SingleSendMail',
    Format: 'JSON',
    RegionId: process.env.DIRECTMAIL_REGION || 'cn-hangzhou',
    SignatureMethod: 'HMAC-SHA1',
    SignatureNonce: crypto.randomUUID(),
    SignatureVersion: '1.0',
    Timestamp: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
    Version: '2015-11-23',
    AccountName: account,
    AddressType: '1',
    ReplyToAddress: 'false',
    ToAddress: DEFAULT_TO,
    FromAlias: 'Partdro Lead Intel',
    Subject: `[Partdro] 客户背景调研 #${id} ${name || email}`.slice(0, 90),
    ClickTrace: '1',
    HtmlBody: htmlBody,
    TextBody: textBody,
  }
  const canonical = Object.keys(params).sort()
    .map((k) => `${dmPercentEncode(k)}=${dmPercentEncode(params[k])}`).join('&')
  const stringToSign = `POST&${dmPercentEncode('/')}&${dmPercentEncode(canonical)}`
  params.Signature = crypto.createHmac('sha1', `${accessKeySecret}&`).update(stringToSign).digest('base64')

  const res = await fetch('https://dm.aliyuncs.com/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params).toString(),
  })
  const raw = await res.text()
  let parsed: Record<string, unknown> = {}
  try { parsed = JSON.parse(raw) } catch { /* 非 JSON 走错误分支 */ }
  if (!res.ok || parsed.Code) {
    throw new Error(`DirectMail failed (${res.status}): ${String(parsed.Code || '')} ${String(parsed.Message || raw).slice(0, 300)}`)
  }
  console.log('[inquiry-analysis] 调研邮件已发送至:', DEFAULT_TO, 'EnvId:', String(parsed.EnvId ?? ''))
}

// ---------- 飞书私聊卡片（与 inquiry-webhook 同款 API） ----------
async function feishuPost(url: string, body: unknown, token?: string): Promise<Record<string, any>> {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })
  const data = (await res.json().catch(() => ({}))) as Record<string, any>
  if (data.code !== 0) {
    throw new Error(`Feishu API failed (${res.status}): ${data.code} ${String(data.msg || '')}`)
  }
  return data
}

async function sendLeadFeishu(id: string, name: string, email: string, p: LeadProfile, ossUrl: string): Promise<void> {
  const appId = process.env.FEISHU_APP_ID
  const appSecret = process.env.FEISHU_APP_SECRET
  const openId = process.env.FEISHU_OPEN_ID
  if (!appId || !appSecret || !openId) {
    console.log('[inquiry-analysis] FEISHU_* 未配置，跳过飞书')
    return
  }
  const credLabel = p.credibility === 'high' ? 'high 高' : p.credibility === 'medium' ? 'medium 中' : 'low 低'
  const fields: Array<[string, string]> = [
    ['公司', p.company || '-'],
    ['行业', p.industry || '-'],
    ['地区', p.region || '-'],
    ['职位', p.position || '-'],
    ['可信度', credLabel],
    ['采购意向', p.intent || '-'],
  ]
  const elements: Array<Record<string, any>> = [
    {
      tag: 'div',
      fields: fields.map(([k, v]) => ({
        is_short: true,
        text: { tag: 'lark_md', content: `**${escapeMd(k)}**\n${escapeMd(v)}` },
      })),
    },
    { tag: 'hr' },
    { tag: 'div', text: { tag: 'lark_md', content: escapeMd(p.summary_cn || '（无综述）') } },
  ]
  if (p.website || p.sources.length) {
    const links = [p.website, ...p.sources].filter(Boolean).slice(0, 5)
    elements.push({ tag: 'div', text: { tag: 'lark_md', content: links.map((u) => `<${u}|${escapeMd(u.slice(0, 60))}>`).join('\n') } })
  }
  elements.push({
    tag: 'note',
    elements: [{
      tag: 'plain_text',
      content: `询盘 #${id} · ${name || '-'} · ${email || '-'}${ossUrl ? ' · 存档 7 天有效' : ''}`,
    }],
  })
  const card = {
    config: { wide_screen_mode: true },
    header: { template: 'green', title: { tag: 'plain_text', content: `[Partdro] 客户背景调研 #${id}${name ? ' · ' + name : ''}` } },
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

// ---------- Supabase 写回（REST PATCH，service_role，零新增依赖） ----------
async function patchLeadProfile(id: string | number, profile: unknown): Promise<void> {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.log('[inquiry-analysis] SUPABASE_* 未配置，跳过写回')
    return
  }
  const res = await fetch(`${url}/rest/v1/inquiries?id=eq.${encodeURIComponent(String(id))}`, {
    method: 'PATCH',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ lead_profile: profile }),
  })
  if (!res.ok) {
    throw new Error(`Supabase PATCH failed (${res.status}): ${(await res.text()).slice(0, 300)}`)
  }
}

// ---------- OSS 私有读写（V1 签名，与 deep-analysis 同款） ----------
function ossPutObject(key: string, body: string, contentType: string): Promise<void> {
  const bucket = process.env.OSS_BUCKET!
  const region = process.env.OSS_REGION || 'cn-hongkong'
  const ak = process.env.OSS_AK_ID!
  const sk = process.env.OSS_AK_SECRET!
  const host = `${bucket}.oss-${region}.aliyuncs.com`
  const date = new Date().toUTCString()
  const stringToSign = `PUT\n\n${contentType}\n${date}\n/${bucket}/${key}`
  const sig = crypto.createHmac('sha1', sk).update(stringToSign).digest('base64')
  return fetch(`https://${host}/${key}`, {
    method: 'PUT',
    headers: { Authorization: `OSS ${ak}:${sig}`, Date: date, 'Content-Type': contentType },
    body,
  }).then(async (res) => {
    if (!res.ok) throw new Error(`OSS put ${key} -> ${res.status}: ${(await res.text()).slice(0, 300)}`)
  })
}

function ossSignedGetUrl(key: string, hours = 168): string {
  const bucket = process.env.OSS_BUCKET
  const region = process.env.OSS_REGION || 'cn-hongkong'
  const ak = process.env.OSS_AK_ID
  const sk = process.env.OSS_AK_SECRET
  if (!bucket || !ak || !sk) return ''
  const host = `${bucket}.oss-${region}.aliyuncs.com`
  const expires = Math.floor(Date.now() / 1000) + hours * 3600
  const stringToSign = `GET\n\n\n${expires}\n/${bucket}/${key}`
  const sig = crypto.createHmac('sha1', sk).update(stringToSign).digest('base64')
  return `https://${host}/${key}?OSSAccessKeyId=${encodeURIComponent(ak)}&Expires=${expires}&Signature=${encodeURIComponent(sig)}`
}

async function readSandboxFile(sbx: Sandbox, path: string): Promise<string> {
  const f = await sbx.files.read(path)
  return typeof f === 'string' ? f : Buffer.from(f as unknown as ArrayBuffer).toString('utf8')
}

// 本地测试用导出
export const __test = { buildLeadPrompt, isFreeEmail, parseProfileJson, toEvent }

// ---------- FC 入口 ----------
export const handler = async (raw: unknown) => {
  const event = toEvent(raw)
  const method = methodOf(event)

  // GET 健康检查
  if (method === 'GET') return json(200, { ok: true, service: 'inquiry-analysis' })
  if (method && method !== 'POST') return json(405, { ok: false, error: 'method not allowed' })

  // 密钥校验：HTTP 触发器调用必须带 x-webhook-secret；FC OpenAPI 直调（无 HTTP 上下文）视为内部调用放行
  if (isHttpRequest(event)) {
    const expected = process.env.INQUIRY_WEBHOOK_SECRET
    if (!expected) return json(503, { ok: false, error: 'INQUIRY_WEBHOOK_SECRET is not configured' })
    const got = headerOf(event, 'x-webhook-secret')
    const a = Buffer.from(expected)
    const b = Buffer.from(got)
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return json(401, { ok: false, error: 'invalid webhook secret' })
    }
  }

  // 解析 body：{type, record} 或裸 record
  let body: Record<string, unknown> = {}
  try {
    const s = event.isBase64Encoded && event.body ? Buffer.from(event.body, 'base64').toString('utf8') : event.body || '{}'
    body = JSON.parse(s) as Record<string, unknown>
  } catch {
    return json(400, { ok: false, error: 'invalid JSON body' })
  }
  const record = (body.record && typeof body.record === 'object' ? body.record : body) as Record<string, unknown>
  const email = String(record.email || '').trim()
  const name = String(record.name || '').trim()
  const id = record.id === null || record.id === undefined ? '' : String(record.id)
  const tag = `[inquiry-analysis #${id || '?'}]`

  if (!email && !name) {
    return json(200, { ok: true, skipped: 'empty record' })
  }

  // 免费邮箱过滤：不开沙箱、不写回、不推送
  if (isFreeEmail(email)) {
    console.log(tag, 'skip free/missing email:', emailDomain(email) || '(none)')
    return json(200, { ok: true, skipped: 'free email', domain: emailDomain(email) })
  }

  const required = ['E2B_API_KEY', 'E2B_API_URL', 'E2B_DOMAIN', 'ANTHROPIC_AUTH_TOKEN']
  for (const k of required) {
    if (!process.env[k]) return json(503, { ok: false, error: `missing env: ${k}` })
  }

  let sbx: Sandbox | null = null
  let profile: LeadProfile | null = null
  let error: Error | null = null
  try {
    console.log(tag, 'creating sandbox:', TEMPLATE)
    sbx = await Sandbox.create(TEMPLATE, {
      apiKey: process.env.E2B_API_KEY!,
      apiUrl: process.env.E2B_API_URL!,
      domain: process.env.E2B_DOMAIN!,
      timeoutMs: 900_000,
      envs: {
        ANTHROPIC_AUTH_TOKEN: process.env.ANTHROPIC_AUTH_TOKEN!,
        ANTHROPIC_BASE_URL: process.env.ANTHROPIC_BASE_URL || 'https://dashscope.aliyuncs.com/apps/anthropic',
        ANTHROPIC_MODEL: MODEL,
        ANTHROPIC_DEFAULT_HAIKU_MODEL: MODEL,
        ANTHROPIC_DEFAULT_SONNET_MODEL: MODEL,
        ANTHROPIC_DEFAULT_OPUS_MODEL: MODEL,
      },
    })
    console.log(tag, 'sandbox created:', sbx.sandboxId)
    await sbx.commands.run("echo '{}' > /home/user/.claude.json")

    const prompt = buildLeadPrompt(record)
    const claudeCmd = `claude --dangerously-skip-permissions < /dev/null -p ${JSON.stringify(prompt)}`
    const cr = await sbx.commands.run(claudeCmd, { timeoutMs: 600_000 })
    console.log(tag, 'claude exit:', cr.exitCode, cr.stderr ? '| stderr: ' + cr.stderr.slice(-300) : '')

    const jsonText = await readSandboxFile(sbx, '/home/user/lead_profile.json')
    profile = parseProfileJson(jsonText)
    console.log(tag, 'profile parsed:', JSON.stringify({ company: profile.company, credibility: profile.credibility }))
  } catch (e) {
    error = e as Error
    console.error(tag, 'ERROR', error.message, '|', (error.stack || '').slice(0, 400))
  } finally {
    if (sbx) await sbx.kill().catch(() => {})
  }

  // OSS 存档 + 三路输出（失败语义：不抛出，只记日志；表回写 failed 标记）
  const archiveKey = `inquiry-leads/${id || 'unknown'}-${Date.now()}.json`
  let ossUrl = ''
  try {
    if (profile) {
      await ossPutObject(archiveKey, JSON.stringify(profile, null, 2), 'application/json; charset=utf-8')
      ossUrl = ossSignedGetUrl(archiveKey)
      console.log(tag, 'archived:', archiveKey)
    } else {
      await ossPutObject(
        archiveKey,
        JSON.stringify({ status: 'failed', id, name, email, error: error?.message || 'unknown' }, null, 2),
        'application/json; charset=utf-8',
      )
    }
  } catch (e) {
    console.error(tag, 'OSS archive failed:', (e as Error).message)
  }

  const results: Record<string, { ok: boolean; error?: string }> = {}
  if (profile && id) {
    const settled = await Promise.allSettled([
      sendLeadFeishu(id, name, email, profile, ossUrl),
      sendLeadEmail(id, name, email, profile, ossUrl),
      patchLeadProfile(id, profile),
    ])
    results.feishu = settled[0].status === 'fulfilled' ? { ok: true } : { ok: false, error: (settled[0] as PromiseRejectedResult).reason?.message }
    results.email = settled[1].status === 'fulfilled' ? { ok: true } : { ok: false, error: (settled[1] as PromiseRejectedResult).reason?.message }
    results.supabase = settled[2].status === 'fulfilled' ? { ok: true } : { ok: false, error: (settled[2] as PromiseRejectedResult).reason?.message }
    for (const [k, v] of Object.entries(results)) {
      if (!v.ok) console.error(tag, `${k} failed:`, v.error)
    }
  } else if (id) {
    // 调研失败：回写 failed 标记，便于表内排查
    try {
      await patchLeadProfile(id, { status: 'failed', error: error?.message || 'unknown' })
      results.supabase = { ok: true, note: 'failed flag written' }
    } catch (e) {
      results.supabase = { ok: false, error: (e as Error).message }
    }
  }

  const ok = !!profile
  console.log(tag, 'done, ok=' + ok, JSON.stringify(results))
  return json(ok ? 200 : 500, {
    ok,
    id,
    domain: emailDomain(email),
    profile: profile || undefined,
    error: error ? error.message : undefined,
    outputs: results,
    archiveKey: profile ? archiveKey : undefined,
  })
}
