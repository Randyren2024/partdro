// Google 配置读写函数（跑在阿里云 FC 香港，直连 Google API）
// 目的：本沙箱连不上 Google，所有「查看/修改」GA4 / Ads / GSC 配置的动作都在这里执行。
//
// 事件形态：
//   { mode: 'probe' }                                          只读体检 + 用 validateOnly 试探写权限
//   { mode: 'query', query: '<GAQL>' }                         任意 Ads 只读查询
//   { mode: 'ads', action: 'pause-campaign', campaignId, validateOnly? }
//   { mode: 'ads', action: 'pause-keyword', criterion, validateOnly? }   criterion = 'adGroupId~criterionId'
//   { mode: 'ads', action: 'network', campaignId, content?, partners?, validateOnly? }
//   { mode: 'ads', action: 'negative', campaignId, keywords: [] , validateOnly? }
//   { mode: 'ga4-keys' }                                      列出 GA4 关键事件
//   { mode: 'ga4-key-delete', eventName }                     删除指定关键事件（按名字找 id）
import * as crypto from 'node:crypto'

const ADS_CUSTOMER = process.env.ADS_CUSTOMER_ID || ''
const ADS_LOGIN = process.env.ADS_LOGIN_CUSTOMER_ID || ''
const ADS_DEV = process.env.ADS_DEVELOPER_TOKEN || ''
const GA4_PROP = process.env.GA4_PROPERTY_ID || ''
const ADS_API = 'https://googleads.googleapis.com/v25/customers'
const GA4_ADMIN = 'https://analyticsadmin.googleapis.com/v1beta'

const SCOPES = {
  ads: 'https://www.googleapis.com/auth/adwords',
  ga4: 'https://www.googleapis.com/auth/analytics.edit',
  gsc: 'https://www.googleapis.com/auth/webmasters',
}

// ---------------- 鉴权（纯 node:crypto，不引第三方库） ----------------
function sa() {
  const raw = process.env.BQ_SA_JSON || process.env.SA_JSON || process.env.GCFG_SA_JSON
  if (!raw) throw new Error('missing env: BQ_SA_JSON')
  return JSON.parse(raw) as { client_email: string; private_key: string }
}
const tokenCache: Record<string, string> = {}
async function token(scope: string): Promise<string> {
  if (tokenCache[scope]) return tokenCache[scope]
  const key = sa()
  const now = Math.floor(Date.now() / 1000)
  const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url')
  const head = b64({ alg: 'RS256', typ: 'JWT' })
  const claims = b64({ iss: key.client_email, scope, aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 })
  const sig = crypto.createSign('RSA-SHA256').update(`${head}.${claims}`).sign(key.private_key, 'base64url')
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${head}.${claims}.${sig}` }),
  })
  const j = (await r.json()) as { access_token?: string; error_description?: string }
  if (!r.ok || !j.access_token) throw new Error(`token 失败 ${r.status}: ${j.error_description || JSON.stringify(j).slice(0, 300)}`)
  tokenCache[scope] = j.access_token
  return tokenCache[scope]
}

async function call(url: string, scope: string, init: RequestInit = {}): Promise<any> {
  const r = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${await token(scope)}`, ...(init.headers || {}) },
    signal: AbortSignal.timeout(60000),
  })
  const text = await r.text()
  if (!r.ok) {
    // 保留 Google 原始报错（权限/字段不可变都能从里面读出来）
    throw new Error(`HTTP ${r.status} ${url.split('?')[0].split('/v25/')[1]?.split('/v1beta/')[1] || ''} -> ${text.slice(0, 900)}`)
  }
  return text ? JSON.parse(text) : {}
}

// ---------------- Google Ads ----------------
function adsHeaders() {
  const h: Record<string, string> = { 'Content-Type': 'application/json', 'developer-token': ADS_DEV }
  if (ADS_LOGIN) h['login-customer-id'] = ADS_LOGIN
  return h
}
async function gaql(query: string): Promise<any[]> {
  const out: any[] = []
  let pageToken = ''
  for (let i = 0; i < 40; i++) {
    const body: any = { query }
    if (pageToken) body.pageToken = pageToken
    const r = await call(`${ADS_API}/${ADS_CUSTOMER}/googleAds:search`, SCOPES.ads, {
      method: 'POST', headers: adsHeaders(), body: JSON.stringify(body),
    })
    out.push(...(r.results || []))
    pageToken = r.nextPageToken || ''
    if (!pageToken) break
  }
  return out
}
async function adsMutate(resource: string, operations: any[], validateOnly: boolean) {
  return call(`${ADS_API}/${ADS_CUSTOMER}/${resource}:mutate`, SCOPES.ads, {
    method: 'POST',
    headers: adsHeaders(),
    body: JSON.stringify({ operations, validateOnly, partialFailure: false }),
  })
}

// ---------------- 各 mode ----------------
async function probe() {
  const out: Record<string, unknown> = {}

  // 1) Ads：系列网络设置（展示扩展 / 搜索伙伴）
  out.campaigns = (await gaql(
    'SELECT campaign.id, campaign.name, campaign.status, campaign.advertising_channel_type,' +
    ' campaign.network_settings.target_google_search, campaign.network_settings.target_search_network,' +
    ' campaign.network_settings.target_content_network, campaign.network_settings.target_partner_search_network,' +
    ' campaign_budget.amount_micros' +
    ' FROM campaign WHERE campaign.status != \'REMOVED\'',
  )).map((r) => ({
    id: String(r.campaign?.id), name: r.campaign?.name, status: r.campaign?.status,
    type: r.campaign?.advertisingChannelType,
    googleSearch: r.campaign?.networkSettings?.targetGoogleSearch,
    searchPartners: r.campaign?.networkSettings?.targetSearchNetwork,
    contentNetwork: r.campaign?.networkSettings?.targetContentNetwork,
    partnerSearchNetwork: r.campaign?.networkSettings?.targetPartnerSearchNetwork,
    budget: Number(r.campaignBudget?.amountMicros || 0) / 1e6,
  }))

  // 2) 写权限试探：用 validateOnly 提交一次「把已暂停系列再暂停一次」的空操作
  const first = (out.campaigns as any[])[0]
  if (first) {
    try {
      await adsMutate('campaigns', [{ update: { resourceName: `customers/${ADS_CUSTOMER}/campaigns/${first.id}`, status: 'PAUSED' }, updateMask: 'status' }], true)
      out.adsWrite = { ok: true, how: 'validateOnly PAUSED' }
    } catch (e) {
      out.adsWrite = { ok: false, error: String(e).slice(0, 700) }
    }
  }

  // 3) GA4 读关键事件 + 写权限试探（PATCH 成同一个值，语义上是空操作）
  try {
    const k = await call(`${GA4_ADMIN}/properties/${GA4_PROP}/keyEvents`, SCOPES.ga4)
    out.ga4Keys = k
    const target = (k.keyEvents || []).find((x: any) => x.deletable !== false)
    if (target) {
      try {
        await call(`${GA4_ADMIN}/${target.name}?updateMask=countingMethod`, SCOPES.ga4, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ countingMethod: target.countingMethod }),
        })
        out.ga4Write = { ok: true, how: `PATCH ${target.eventName} 同值` }
      } catch (e) {
        out.ga4Write = { ok: false, error: String(e).slice(0, 700) }
      }
    }
  } catch (e) {
    out.ga4Keys = { ok: false, error: String(e).slice(0, 700) }
  }

  // 写权限结论放最前，避免长输出被截断时看不到
  return { adsWrite: out.adsWrite, ga4Write: out.ga4Write, campaigns: out.campaigns, ga4Keys: out.ga4Keys }
}

async function adsAction(ev: any) {
  const validateOnly = ev.validateOnly !== false // 默认演练，必须显式 validateOnly:false 才真改
  const cid = `customers/${ADS_CUSTOMER}`

  if (ev.action === 'pause-campaign') {
    const r = await adsMutate('campaigns', [{
      update: { resourceName: `${cid}/campaigns/${ev.campaignId}`, status: 'PAUSED' },
      updateMask: 'status',
    }], validateOnly)
    return { action: ev.action, validateOnly, campaignId: ev.campaignId, result: r }
  }

  if (ev.action === 'pause-keyword') {
    // criterion: "adGroupId~criterionId"
    const r = await adsMutate('adGroupCriteria', [{
      update: { resourceName: `${cid}/adGroupCriteria/${ev.criterion}`, status: 'PAUSED' },
      updateMask: 'status',
    }], validateOnly)
    return { action: ev.action, validateOnly, criterion: ev.criterion, result: r }
  }

  if (ev.action === 'network') {
    const upd: any = { resourceName: `${cid}/campaigns/${ev.campaignId}` }
    const mask: string[] = []
    if (typeof ev.content === 'boolean') {
      upd.networkSettings = { ...(upd.networkSettings || {}), targetContentNetwork: ev.content }
      mask.push('network_settings.target_content_network')
    }
    if (typeof ev.partners === 'boolean') {
      upd.networkSettings = { ...(upd.networkSettings || {}), targetPartnerSearchNetwork: ev.partners }
      mask.push('network_settings.target_partner_search_network')
    }
    if (typeof ev.searchPartners === 'boolean') {
      upd.networkSettings = { ...(upd.networkSettings || {}), targetSearchNetwork: ev.searchPartners }
      mask.push('network_settings.target_search_network')
    }
    if (!mask.length) throw new Error('network 需要 content / partners / searchPartners 至少一个布尔值')
    const r = await adsMutate('campaigns', [{ update: upd, updateMask: mask.join(',') }], validateOnly)
    return { action: ev.action, validateOnly, campaignId: ev.campaignId, updateMask: mask, result: r }
  }

  if (ev.action === 'negative') {
    const ops = (ev.keywords as string[]).map((kw) => ({
      create: {
        resourceName: `${cid}/campaignCriteria/${ev.campaignId}~${Date.now()}${Math.floor(Math.random() * 1000)}`,
        campaign: `${cid}/campaigns/${ev.campaignId}`,
        negative: true,
        keyword: { text: kw, matchType: 'PHRASE' },
      },
    }))
    const r = await adsMutate('campaignCriteria', ops, validateOnly)
    return { action: ev.action, validateOnly, campaignId: ev.campaignId, keywords: ev.keywords, result: r }
  }

  throw new Error(`未知 action: ${ev.action}`)
}

async function ga4Keys() {
  const k = await call(`${GA4_ADMIN}/properties/${GA4_PROP}/keyEvents`, SCOPES.ga4)
  return { property: GA4_PROP, keyEvents: k.keyEvents || [] }
}

async function ga4KeyDelete(ev: any) {
  const k = await call(`${GA4_ADMIN}/properties/${GA4_PROP}/keyEvents`, SCOPES.ga4)
  const hit = (k.keyEvents || []).find((x: any) => x.eventName === ev.eventName)
  if (!hit) return { ok: true, skipped: true, reason: `未登记为关键事件: ${ev.eventName}` }
  if (hit.deletable === false) return { ok: false, reason: `不可删除（系统事件）: ${ev.eventName}`, name: hit.name }
  const r = await fetch(`${GA4_ADMIN}/${hit.name}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${await token(SCOPES.ga4)}` },
    signal: AbortSignal.timeout(30000),
  })
  const text = await r.text()
  return { ok: r.ok, status: r.status, deleted: hit.eventName, name: hit.name, body: text.slice(0, 300) }
}

// ---------------- 入口 ----------------
function parseEvent(event: any) {
  const raw = Buffer.isBuffer(event) ? event.toString() : typeof event === 'string' ? event : ''
  let ev: any = event
  for (let i = 0; i < 3; i++) {
    if (typeof ev === 'string') { try { ev = JSON.parse(ev) } catch { ev = {}; break } }
    else if (Buffer.isBuffer(ev)) { try { ev = JSON.parse(ev.toString()) } catch { ev = {}; break } }
    else if (ev && typeof ev === 'object' && typeof ev.payload === 'string') { try { ev = JSON.parse(ev.payload) } catch { break } }
    else break
  }
  if (!ev || typeof ev !== 'object') ev = {}
  if (!ev.mode) {
    const m = raw.match(/"mode"\s*:\s*"([a-z0-9-]+)"/i)
    if (m) ev.mode = m[1]
  }
  return ev as Record<string, any>
}

export const handler = async (event: any) => {
  const ev = parseEvent(event)
  const t0 = Date.now()
  try {
    let out: any
    switch (ev.mode) {
      case 'probe': out = await probe(); break
      case 'query': out = { rows: await gaql(ev.query) }; break
      case 'ads': out = await adsAction(ev); break
      case 'ga4-keys': out = await ga4Keys(); break
      case 'ga4-key-delete': out = await ga4KeyDelete(ev); break
      default: throw new Error(`未知 mode: ${ev.mode}`)
    }
    return { ok: true, mode: ev.mode, ms: Date.now() - t0, ...out }
  } catch (e) {
    return { ok: false, mode: ev.mode, ms: Date.now() - t0, error: String(e).slice(0, 1200) }
  }
}
