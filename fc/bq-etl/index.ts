// BigQuery ETL（自建管道）：
// 一次运行 = 拉取 GSC / Google Ads / GA4 → 按天写入 BigQuery 分区表（重跑幂等）。
// 全程只用 service account（JWT 断言）与 REST，不依赖 gcloud / E2B。
//
// 幂等设计：每个 (表, 日期) 单独发一个 load job，目标是 `表$YYYYMMDD` 分区，写处置 WRITE_TRUNCATE
//   → 同一天重复跑只会覆盖该分区，不会产生重复行。
//
// 事件形态：
//   { mode: 'backfill', days: 90 }       回溯 N 天（含昨天）
//   { mode: 'daily' }                    默认：同步 GSC 最近 7 天 + Ads/GA4 最近 7 天
//   { mode: 'bootstrap' }                只建数据集/表/视图，不拉数
import * as crypto from 'node:crypto'

const PROJECT = process.env.BQ_PROJECT || ''
const DATASET = process.env.BQ_DATASET || 'dw_analytics'
const LOCATION = process.env.BQ_LOCATION || 'asia-east2' // 香港
const SITE_URL = process.env.GSC_SITE_URL || 'sc-domain:droneworld.tech'
const ADS_CUSTOMER = process.env.ADS_CUSTOMER_ID || ''
const ADS_LOGIN = process.env.ADS_LOGIN_CUSTOMER_ID || ''
const ADS_DEV = process.env.ADS_DEVELOPER_TOKEN || ''
const GA4_PROP = process.env.GA4_PROPERTY_ID || ''
const ADS_API = 'https://googleads.googleapis.com/v25/customers'

const ALL_SCOPES = [
  'https://www.googleapis.com/auth/bigquery',
  'https://www.googleapis.com/auth/webmasters.readonly',
  'https://www.googleapis.com/auth/adwords',
  'https://www.googleapis.com/auth/analytics.readonly',
].join(' ')

// ---------------- 鉴权 ----------------
function sa() {
  const raw = process.env.BQ_SA_JSON || process.env.SA_JSON
  if (!raw) throw new Error('missing env: BQ_SA_JSON（服务账号 JSON）')
  return JSON.parse(raw) as { client_email: string; private_key: string; project_id: string }
}
function assertion(scope: string): string {
  const key = sa()
  const now = Math.floor(Date.now() / 1000)
  const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url')
  const head = b64({ alg: 'RS256', typ: 'JWT' })
  const claims = b64({ iss: key.client_email, scope, aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 })
  const sig = crypto.createSign('RSA-SHA256').update(`${head}.${claims}`).sign(key.private_key, 'base64url')
  return `${head}.${claims}.${sig}`
}
let cachedToken = ''
async function token(): Promise<string> {
  if (cachedToken) return cachedToken
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: assertion(ALL_SCOPES) }),
  })
  const j = (await r.json()) as { access_token?: string; error_description?: string }
  if (!r.ok || !j.access_token) throw new Error(`token 失败 ${r.status}: ${j.error_description || JSON.stringify(j).slice(0, 200)}`)
  cachedToken = j.access_token
  return cachedToken
}

async function api(url: string, init: RequestInit = {}, attempts = 4): Promise<any> {
  let last = ''
  for (let i = 0; i < attempts; i++) {
    try {
      const at = await token()
      const r = await fetch(url, {
        ...init,
        headers: { Authorization: `Bearer ${at}`, ...(init.headers || {}) },
        signal: AbortSignal.timeout(120000),
      })
      const text = await r.text()
      if (r.ok) return text ? JSON.parse(text) : {}
      // 5xx / 429 重试；4xx 直接抛出（保留 Google 的原始错误信息）
      if (r.status === 429 || r.status >= 500) last = `HTTP ${r.status} ${text.slice(0, 300)}`
      else throw new Error(`HTTP ${r.status} ${url} -> ${text.slice(0, 500)}`)
    } catch (e) {
      last = String(e).slice(0, 400)
      if (String(e).includes('HTTP 4')) throw e
    }
    if (i < attempts - 1) await new Promise((r) => setTimeout(r, 1500 * (i + 1)))
  }
  throw new Error(`重试 ${attempts} 次仍失败: ${last}`)
}

// ---------------- BigQuery 基础设施 ----------------
const BQ = 'https://bigquery.googleapis.com/bigquery/v2'
const dsRef = () => `${PROJECT}.${DATASET}`

async function ensureDataset() {
  const r = await fetch(`${BQ}/projects/${PROJECT}/datasets/${DATASET}`, {
    headers: { Authorization: `Bearer ${await token()}` },
  })
  if (r.ok) return 'exists'
  if (r.status !== 404) throw new Error(`dataset 检查失败 ${r.status}: ${(await r.text()).slice(0, 400)}`)
  await api(`${BQ}/projects/${PROJECT}/datasets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ datasetReference: { projectId: PROJECT, datasetId: DATASET }, location: LOCATION }),
  })
  return 'created'
}

/** 尝试把 Sandbox 的 60 天过期改成「永不过期」。Sandbox 通常拒绝，返回结果里能看清是被拒还是生效。 */
async function clearExpiry() {
  const out: Record<string, unknown> = {}
  try {
    out.dataset = await api(`${BQ}/projects/${PROJECT}/datasets/${DATASET}?updateMask=defaultTableExpirationMs,defaultPartitionExpirationMs`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ defaultTableExpirationMs: null, defaultPartitionExpirationMs: null }),
    }).then((r: any) => ({ ok: true, defaultTableExpirationMs: r.defaultTableExpirationMs ?? null }))
  } catch (e) {
    out.dataset = { ok: false, error: String(e).slice(0, 300) }
  }
  for (const tableId of Object.keys(TABLES)) {
    try {
      await api(`${BQ}/projects/${PROJECT}/datasets/${DATASET}/tables/${tableId}?updateMask=expirationTime,timePartitioning.expirationMs`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expirationTime: null, timePartitioning: { type: 'DAY', expirationMs: null } }),
      })
      out[tableId] = { ok: true }
    } catch (e) {
      out[tableId] = { ok: false, error: String(e).slice(0, 200) }
    }
  }
  out.after = await expiryInfo()
  return out
}

/** 读取数据集与各表的过期时间，用于确认 Sandbox 的 60 天限制是否可覆盖。 */
async function expiryInfo() {
  const ds = await api(`${BQ}/projects/${PROJECT}/datasets/${DATASET}`)
  const tables: Record<string, unknown> = {}
  for (const tableId of Object.keys(TABLES)) {
    try {
      const t = await api(`${BQ}/projects/${PROJECT}/datasets/${DATASET}/tables/${tableId}`)
      tables[tableId] = { expirationTime: t.expirationTime || null, partitionExpirationMs: t.timePartitioning?.expirationMs || null }
    } catch (e) {
      tables[tableId] = { error: String(e).slice(0, 200) }
    }
  }
  return {
    datasetDefaultTableExpirationMs: ds.defaultTableExpirationMs || null,
    datasetDefaultPartitionExpirationMs: ds.defaultPartitionExpirationMs || null,
    tables,
  }
}

type Field = { name: string; type: string; mode?: string }

const TABLES: Record<string, { fields: Field[]; cluster?: string[] }> = {
  gsc_query_page: {
    fields: [
      { name: 'date', type: 'DATE' },
      { name: 'site', type: 'STRING' },
      { name: 'query', type: 'STRING' },
      { name: 'page', type: 'STRING' },
      { name: 'country', type: 'STRING' },
      { name: 'device', type: 'STRING' },
      { name: 'clicks', type: 'INTEGER' },
      { name: 'impressions', type: 'INTEGER' },
      { name: 'ctr', type: 'FLOAT' },
      { name: 'position', type: 'FLOAT' },
    ],
    cluster: ['page'],
  },
  ads_campaign_daily: {
    fields: [
      { name: 'date', type: 'DATE' },
      { name: 'customer_id', type: 'STRING' },
      { name: 'campaign_id', type: 'STRING' },
      { name: 'campaign_name', type: 'STRING' },
      { name: 'campaign_status', type: 'STRING' },
      { name: 'impressions', type: 'INTEGER' },
      { name: 'clicks', type: 'INTEGER' },
      { name: 'cost', type: 'FLOAT' },
      { name: 'conversions', type: 'FLOAT' },
      { name: 'ctr', type: 'FLOAT' },
      { name: 'avg_cpc', type: 'FLOAT' },
    ],
    cluster: ['campaign_name'],
  },
  ads_keyword_daily: {
    fields: [
      { name: 'date', type: 'DATE' },
      { name: 'campaign_id', type: 'STRING' },
      { name: 'campaign_name', type: 'STRING' },
      { name: 'ad_group_id', type: 'STRING' },
      { name: 'ad_group_name', type: 'STRING' },
      { name: 'keyword', type: 'STRING' },
      { name: 'match_type', type: 'STRING' },
      { name: 'impressions', type: 'INTEGER' },
      { name: 'clicks', type: 'INTEGER' },
      { name: 'cost', type: 'FLOAT' },
      { name: 'conversions', type: 'FLOAT' },
    ],
    cluster: ['keyword'],
  },
  ga4_traffic_daily: {
    fields: [
      { name: 'date', type: 'DATE' },
      { name: 'property_id', type: 'STRING' },
      { name: 'source', type: 'STRING' },
      { name: 'medium', type: 'STRING' },
      { name: 'campaign', type: 'STRING' },
      { name: 'landing_page', type: 'STRING' },
      { name: 'sessions', type: 'INTEGER' },
      { name: 'engaged_sessions', type: 'INTEGER' },
      { name: 'key_events', type: 'FLOAT' },
      { name: 'screen_page_views', type: 'INTEGER' },
      { name: 'avg_session_duration', type: 'FLOAT' },
    ],
    cluster: ['landing_page'],
  },
  // 搜索词报告：Google 实际匹配到的查询。关键词层看不到浪费，浪费都在这一层。
  ads_search_term_daily: {
    fields: [
      { name: 'date', type: 'DATE' },
      { name: 'campaign_id', type: 'STRING' },
      { name: 'campaign_name', type: 'STRING' },
      { name: 'ad_group_id', type: 'STRING' },
      { name: 'ad_group_name', type: 'STRING' },
      { name: 'keyword', type: 'STRING' },
      { name: 'match_type', type: 'STRING' },
      { name: 'search_term', type: 'STRING' },
      { name: 'impressions', type: 'INTEGER' },
      { name: 'clicks', type: 'INTEGER' },
      { name: 'cost', type: 'FLOAT' },
      { name: 'conversions', type: 'FLOAT' },
    ],
    cluster: ['search_term'],
  },
  // 只存「真正的线索事件」。GA4 把 click / scroll 也登记成了关键事件，
  // 直接用 keyEvents 会把滚动当成转化，所以线索必须按 eventName 过滤后单独落表。
  ga4_leads_daily: {
    fields: [
      { name: 'date', type: 'DATE' },
      { name: 'property_id', type: 'STRING' },
      { name: 'source', type: 'STRING' },
      { name: 'medium', type: 'STRING' },
      { name: 'campaign', type: 'STRING' },
      { name: 'landing_page', type: 'STRING' },
      { name: 'event_name', type: 'STRING' },
      { name: 'events', type: 'INTEGER' },
    ],
    cluster: ['event_name'],
  },
}

async function ensureTables(): Promise<string[]> {
  const changed: string[] = []
  const list = await api(`${BQ}/projects/${PROJECT}/datasets/${DATASET}/tables?maxResults=100`)
  const have = new Set(((list.tables || []) as any[]).map((t) => t.tableReference.tableId))
  for (const [tableId, def] of Object.entries(TABLES)) {
    if (have.has(tableId)) continue
    await api(`${BQ}/projects/${PROJECT}/datasets/${DATASET}/tables`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tableReference: { projectId: PROJECT, datasetId: DATASET, tableId },
        schema: { fields: def.fields },
        timePartitioning: { type: 'DAY', field: 'date' },
        ...(def.cluster ? { clustering: { fields: def.cluster } } : {}),
      }),
    })
    changed.push(tableId)
  }
  return changed
}

/** 统一视图：按天把三源聚合到一行，供快速看整体漏斗。 */
async function ensureView() {
  const view = `
    WITH g AS (
      SELECT date, SUM(clicks) AS organic_clicks, SUM(impressions) AS organic_impressions,
             SAFE_DIVIDE(SUM(clicks), SUM(impressions)) AS organic_ctr,
             SAFE_DIVIDE(SUM(position * impressions), SUM(impressions)) AS avg_position
      FROM \`${dsRef()}.gsc_query_page\` GROUP BY date),
    a AS (
      SELECT date, SUM(cost) AS ads_cost, SUM(clicks) AS ads_clicks,
             SUM(impressions) AS ads_impressions, SUM(conversions) AS ads_conversions
      FROM \`${dsRef()}.ads_campaign_daily\` GROUP BY date),
    s AS (
      SELECT date, SUM(sessions) AS sessions, SUM(engaged_sessions) AS engaged_sessions
      FROM \`${dsRef()}.ga4_traffic_daily\` GROUP BY date),
    l AS (
      SELECT date, SUM(events) AS leads
      FROM \`${dsRef()}.ga4_leads_daily\` GROUP BY date)
    SELECT COALESCE(g.date, a.date, s.date, l.date) AS date,
      g.organic_clicks, g.organic_impressions, g.organic_ctr, g.avg_position,
      a.ads_cost, a.ads_clicks, a.ads_impressions, a.ads_conversions,
      s.sessions, s.engaged_sessions, l.leads
    FROM g FULL JOIN a USING (date) FULL JOIN s USING (date) FULL JOIN l USING (date)`
  const sql = `CREATE OR REPLACE VIEW \`${dsRef()}.v_daily_overview\` AS ${view}`
  await runQuery(sql)
}

async function runQuery(sql: string) {
  const jobId = `etl_view_${Date.now()}`
  const res = await api(`${BQ}/projects/${PROJECT}/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jobReference: { projectId: PROJECT, jobId, location: LOCATION },
      // 数据集在香港，作业必须显式带 location，否则 GET job 会按默认区域找不到 → 404
      configuration: { query: { query: sql, useLegacySql: false } },
    }),
  })
  await waitJob(jobId)
  return res
}

async function waitJob(jobId: string, tries = 60) {
  for (let i = 0; i < tries; i++) {
    const s = await api(`${BQ}/projects/${PROJECT}/jobs/${jobId}?location=${LOCATION}`)
    const st = s.status?.state
    if (st === 'DONE') {
      if (s.status?.errorResult) throw new Error(`job ${jobId} 失败: ${JSON.stringify(s.status.errorResult).slice(0, 400)}`)
      return s
    }
    await new Promise((r) => setTimeout(r, 1000))
  }
  throw new Error(`job ${jobId} 超时未完成`)
}

/** 同步查询（jobs.query），用于验收：直接返回结果行。 */
async function queryRows(sql: string): Promise<any[]> {
  const r = await api(`${BQ}/projects/${PROJECT}/queries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql, useLegacySql: false, location: LOCATION, timeoutMs: 30000 }),
  })
  if (r.jobComplete === false) throw new Error('jobs.query 未在 30s 内完成')
  const fields = (r.schema?.fields || []).map((f: any) => f.name)
  return (r.rows || []).map((row: any) => {
    const o: Record<string, string> = {}
    ;(row.f || []).forEach((c: any, i: number) => { o[fields[i]] = c.v })
    return o
  })
}

async function verify() {
  const q = (t: string) => `SELECT '${t}' AS t, COUNT(*) AS n, CAST(MIN(date) AS STRING) AS mn, CAST(MAX(date) AS STRING) AS mx FROM \`${dsRef()}.${t}\``
  const rows = await queryRows([q('gsc_query_page'), q('ads_campaign_daily'), q('ads_keyword_daily'), q('ads_search_term_daily'), q('ga4_traffic_daily'), q('ga4_leads_daily')].join(' UNION ALL '))
  const overview = await queryRows(`SELECT CAST(COUNT(*) AS STRING) AS n FROM \`${dsRef()}.v_daily_overview\``)
  return { tables: rows, viewRows: overview[0]?.n }
}

/** NDJSON 走 multipart 上传，直接 load 到当天分区（WRITE_TRUNCATE → 幂等）。 */
async function loadPartition(tableId: string, date: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return { table: tableId, date, rows: 0, skipped: true }
  const ndjson = rows.map((r) => JSON.stringify(r)).join('\n')
  const boundary = `bq_${crypto.randomBytes(8).toString('hex')}`
  const jobId = `etl_${tableId}_${date.replace(/-/g, '')}_${Date.now()}`
  const config = {
    jobReference: { projectId: PROJECT, jobId, location: LOCATION },
    configuration: {
      load: {
        destinationTable: { projectId: PROJECT, datasetId: DATASET, tableId: `${tableId}$${date.replace(/-/g, '')}` },
        sourceFormat: 'NEWLINE_DELIMITED_JSON',
        writeDisposition: 'WRITE_TRUNCATE',
        createDisposition: 'CREATE_IF_NEEDED',
      },
    },
  }
  const body = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    JSON.stringify(config),
    `--${boundary}`,
    'Content-Type: application/octet-stream',
    '',
    ndjson,
    `--${boundary}--`,
    '',
  ].join('\r\n')
  await api(`https://bigquery.googleapis.com/upload/bigquery/v2/projects/${PROJECT}/jobs?uploadType=multipart`, {
    method: 'POST',
    headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
    body,
  })
  await waitJob(jobId)
  return { table: tableId, date, rows: rows.length }
}

// ---------------- 数据源 ----------------
const ymd = (d: Date) => d.toISOString().slice(0, 10)
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000)

type Row = Record<string, unknown>

async function fetchGsc(start: string, end: string): Promise<Row[]> {
  const out: Row[] = []
  const siteEnc = encodeURIComponent(SITE_URL)
  let startRow = 0
  for (let page = 0; page < 40; page++) {
    const r = await api(`https://searchconsole.googleapis.com/webmasters/v3/sites/${siteEnc}/searchAnalytics/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startDate: start,
        endDate: end,
        dimensions: ['date', 'query', 'page', 'country', 'device'],
        dataState: 'final',
        rowLimit: 25000,
        startRow,
      }),
    })
    const rows = (r.rows || []) as any[]
    for (const x of rows) {
      const k = x.keys || []
      out.push({
        date: k[0], site: SITE_URL, query: k[1] || '', page: k[2] || '',
        country: k[3] || '', device: k[4] || '',
        clicks: x.clicks || 0, impressions: x.impressions || 0,
        ctr: x.ctr || 0, position: x.position || 0,
      })
    }
    if (rows.length < 25000) break
    startRow += rows.length
  }
  return out
}

async function adsSearch(query: string): Promise<any[]> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', 'developer-token': ADS_DEV }
  if (ADS_LOGIN) headers['login-customer-id'] = ADS_LOGIN
  const out: any[] = []
  let pageToken = ''
  for (let i = 0; i < 40; i++) {
    const body: any = { query }
    if (pageToken) body.pageToken = pageToken
    const r = await api(`${ADS_API}/${ADS_CUSTOMER}/googleAds:search`, {
      method: 'POST', headers, body: JSON.stringify(body),
    })
    out.push(...(r.results || []))
    pageToken = r.nextPageToken || ''
    if (!pageToken) break
  }
  return out
}

const n = (v: unknown) => { const x = Number(v); return Number.isFinite(x) ? x : 0 }

async function fetchAdsCampaign(start: string, end: string): Promise<Row[]> {
  const rows = await adsSearch(
    'SELECT segments.date, campaign.id, campaign.name, campaign.status, metrics.impressions,' +
    ' metrics.clicks, metrics.ctr, metrics.average_cpc, metrics.cost_micros, metrics.conversions' +
    ` FROM campaign WHERE segments.date BETWEEN '${start}' AND '${end}'`,
  )
  return rows.map((r) => {
    const imp = n(r.metrics?.impressions)
    const clk = n(r.metrics?.clicks)
    const cost = n(r.metrics?.costMicros) / 1e6
    return {
      date: r.segments?.date, customer_id: ADS_CUSTOMER,
      campaign_id: String(r.campaign?.id || ''), campaign_name: r.campaign?.name || '',
      campaign_status: r.campaign?.status || '',
      impressions: imp, clicks: clk, cost,
      conversions: n(r.metrics?.conversions),
      ctr: imp ? clk / imp : 0, avg_cpc: clk ? cost / clk : 0,
    }
  })
}

async function fetchAdsKeyword(start: string, end: string): Promise<Row[]> {
  const rows = await adsSearch(
    'SELECT segments.date, campaign.id, campaign.name, ad_group.id, ad_group.name,' +
    ' ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type,' +
    ' metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions' +
    ` FROM keyword_view WHERE segments.date BETWEEN '${start}' AND '${end}'`,
  )
  return rows.map((r) => ({
    date: r.segments?.date,
    campaign_id: String(r.campaign?.id || ''), campaign_name: r.campaign?.name || '',
    ad_group_id: String(r.adGroup?.id || ''), ad_group_name: r.adGroup?.name || '',
    keyword: r.adGroupCriterion?.keyword?.text || '',
    match_type: r.adGroupCriterion?.keyword?.matchType || '',
    impressions: n(r.metrics?.impressions), clicks: n(r.metrics?.clicks),
    cost: n(r.metrics?.costMicros) / 1e6, conversions: n(r.metrics?.conversions),
  }))
}

async function fetchAdsSearchTerms(start: string, end: string): Promise<Row[]> {
  const rows = await adsSearch(
    'SELECT segments.date, campaign.id, campaign.name, ad_group.id, ad_group.name,' +
    ' search_term_view.search_term, segments.keyword.info.text, segments.keyword.info.match_type,' +
    ' metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions' +
    ` FROM search_term_view WHERE segments.date BETWEEN '${start}' AND '${end}'`,
  )
  return rows.map((r) => ({
    date: r.segments?.date,
    campaign_id: String(r.campaign?.id || ''), campaign_name: r.campaign?.name || '',
    ad_group_id: String(r.adGroup?.id || ''), ad_group_name: r.adGroup?.name || '',
    keyword: r.segments?.keyword?.info?.text || '',
    match_type: r.segments?.keyword?.info?.matchType || '',
    search_term: r.searchTermView?.searchTerm || '',
    impressions: n(r.metrics?.impressions), clicks: n(r.metrics?.clicks),
    cost: n(r.metrics?.costMicros) / 1e6, conversions: n(r.metrics?.conversions),
  }))
}

/** 真正的线索事件（人工审核过的事件名单）。click / scroll 被误标为关键事件，必须排除。 */
const LEAD_EVENTS = ['contact_form_submission', 'generate_lead', 'whatsapp_chat_initiated', 'email_click', 'purchase']

async function fetchGa4Leads(start: string, end: string): Promise<Row[]> {
  const out: Row[] = []
  let offset = 0
  for (let page = 0; page < 40; page++) {
    const r = await api(`https://analyticsdata.googleapis.com/v1beta/properties/${GA4_PROP}:runReport`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dateRanges: [{ startDate: start, endDate: end }],
        dimensions: [
          { name: 'date' }, { name: 'sessionSource' }, { name: 'sessionMedium' },
          { name: 'sessionCampaignName' }, { name: 'landingPage' }, { name: 'eventName' },
        ],
        metrics: [{ name: 'eventCount' }],
        dimensionFilter: { filter: { fieldName: 'eventName', inListFilter: { values: LEAD_EVENTS } } },
        limit: 100000,
        offset,
      }),
    })
    const rows = (r.rows || []) as any[]
    for (const x of rows) {
      const d = (x.dimensionValues || []).map((v: any) => v.value)
      const m = (x.metricValues || []).map((v: any) => v.value)
      const raw = String(d[0] || '')
      const date = raw.length === 8 ? `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}` : raw
      out.push({
        date, property_id: GA4_PROP,
        source: d[1] || '', medium: d[2] || '', campaign: d[3] || '',
        landing_page: d[4] || '', event_name: d[5] || '', events: n(m[0]),
      })
    }
    if (rows.length < 100000) break
    offset += rows.length
  }
  return out
}

async function fetchGa4(start: string, end: string): Promise<Row[]> {
  const out: Row[] = []
  let offset = 0
  for (let page = 0; page < 40; page++) {
    const r = await api(`https://analyticsdata.googleapis.com/v1beta/properties/${GA4_PROP}:runReport`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dateRanges: [{ startDate: start, endDate: end }],
        dimensions: [
          { name: 'date' }, { name: 'sessionSource' }, { name: 'sessionMedium' },
          { name: 'sessionCampaignName' }, { name: 'landingPage' },
        ],
        metrics: [
          { name: 'sessions' }, { name: 'engagedSessions' }, { name: 'keyEvents' },
          { name: 'screenPageViews' }, { name: 'averageSessionDuration' },
        ],
        limit: 100000,
        offset,
      }),
    })
    const rows = (r.rows || []) as any[]
    for (const x of rows) {
      const d = (x.dimensionValues || []).map((v: any) => v.value)
      const m = (x.metricValues || []).map((v: any) => v.value)
      const raw = String(d[0] || '')
      const date = raw.length === 8 ? `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}` : raw
      out.push({
        date, property_id: GA4_PROP,
        source: d[1] || '', medium: d[2] || '', campaign: d[3] || '', landing_page: d[4] || '',
        sessions: n(m[0]), engaged_sessions: n(m[1]), key_events: n(m[2]),
        screen_page_views: n(m[3]), avg_session_duration: n(m[4]),
      })
    }
    if (rows.length < 100000) break
    offset += rows.length
  }
  return out
}

function groupByDate(rows: Row[]): Map<string, Row[]> {
  const m = new Map<string, Row[]>()
  for (const r of rows) {
    const d = String(r.date || '')
    if (!d) continue
    if (!m.has(d)) m.set(d, [])
    m.get(d)!.push(r)
  }
  return m
}

// ---------------- 入口 ----------------
export const handler = async (event: any) => {
  const t0 = Date.now()
  // FC 的调用方式多样：请求体可能是 JSON 字符串、Buffer，或已被包成 {payload}。统一剥到业务参数
  const rawStr = Buffer.isBuffer(event) ? event.toString() : String(event)
  const echo = {
    t: typeof event, isBuf: Buffer.isBuffer(event),
    keys: event && typeof event === 'object' ? Object.keys(event).slice(0, 10) : null,
    raw: rawStr.slice(0, 300),
  }
  let ev: any = event
  for (let i = 0; i < 3; i++) {
    if (typeof ev === 'string') { try { ev = JSON.parse(ev) } catch { ev = {}; break } }
    else if (Buffer.isBuffer(ev)) { try { ev = JSON.parse(ev.toString()) } catch { ev = {}; break } }
    else if (ev && typeof ev === 'object' && typeof ev.payload === 'string') {
      try { ev = JSON.parse(ev.payload) } catch { break }
    } else break
  }
  // 兜底：从原始请求体里抠出 mode/days，规避 FC 各调用方式对 event 包装不一致
  const rawMode = (rawStr.match(/"mode"\s*:\s*"([a-z]+)"/) || [])[1]
  const rawDays = Number((rawStr.match(/"days"\s*:\s*(\d+)/) || [])[1]) || 0
  const mode = ev?.mode || rawMode || 'daily'
  const requested = Number(ev?.days) || rawDays || 7
  // BigQuery Sandbox 限制：所有表/视图/分区 60 天后自动过期 → 可用历史最多 59 天（含昨天）
  const SANDBOX_MAX_DAYS = 59
  const days = Math.min(Math.max(requested, 1), SANDBOX_MAX_DAYS)
  if (!PROJECT) throw new Error('missing env: BQ_PROJECT')

  const report: Record<string, unknown> = { mode, dataset: dsRef(), echo, steps: [] }
  if (requested > SANDBOX_MAX_DAYS) {
    report.clamped = { requested, used: days, reason: 'BigQuery Sandbox 强制 60 天过期，最多回溯 59 天' }
  }
  const steps = report.steps as any[]
  const step = async (name: string, fn: () => Promise<unknown>) => {
    const s = Date.now()
    try {
      const v = await fn()
      // 数组结果（抓取到的行）只回传条数，避免同步调用响应体被几万行撑爆
      steps.push({ name, ok: true, ms: Date.now() - s, result: Array.isArray(v) ? { rows: v.length } : v })
      return v
    } catch (e) {
      steps.push({ name, ok: false, ms: Date.now() - s, error: String(e).slice(0, 500) })
      throw e
    }
  }

  try {
    await step('dataset', ensureDataset)
    await step('tables', ensureTables)
    if (mode === 'noexpiry') {
      report.noexpiry = await step('noexpiry', clearExpiry)
      report.ok = true
      report.ms = Date.now() - t0
      return report
    }
    if (mode === 'ga4keys') {
      // 核实 GA4 把哪些事件登记为「关键事件」——决定 keyEvents 指标的口径
      report.keyEvents = await api(`https://analyticsadmin.googleapis.com/v1beta/properties/${GA4_PROP}/keyEvents`)
      report.ok = true
      report.ms = Date.now() - t0
      return report
    }
    if (mode === 'adsnetwork') {
      // 按广告网络拆分：搜索词报告只覆盖搜索网络，差额就是搜索伙伴/展示扩展等
      const from = String(ev?.from || '2026-09-01')
      const to = String(ev?.to || ymd(new Date()))
      const rows = await adsSearch(
        'SELECT segments.date, segments.ad_network_type, campaign.name,' +
        ' metrics.impressions, metrics.clicks, metrics.cost_micros' +
        ` FROM campaign WHERE segments.date BETWEEN '${from}' AND '${to}'`,
      )
      const agg: Record<string, { campaign: string; network: string; imp: number; clk: number; cost: number }> = {}
      for (const r of rows) {
        const k = `${r.campaign?.name || ''}|${r.segments?.adNetworkType || 'UNKNOWN'}`
        if (!agg[k]) agg[k] = { campaign: r.campaign?.name || '', network: r.segments?.adNetworkType || 'UNKNOWN', imp: 0, clk: 0, cost: 0 }
        agg[k].imp += n(r.metrics?.impressions)
        agg[k].clk += n(r.metrics?.clicks)
        agg[k].cost += n(r.metrics?.costMicros) / 1e6
      }
      report.networks = Object.values(agg).map((x) => ({ ...x, cost: Number(x.cost.toFixed(2)) }))
      report.ok = true
      report.ms = Date.now() - t0
      return report
    }
    if (mode === 'terms') {
      // 只回补搜索词表，不重跑其它数据源
      const today = new Date()
      const end = ymd(addDays(today, -1))
      const start = ymd(addDays(today, -days))
      report.range = { start, end }
      const t = await step('fetch_ads_search_terms', () => fetchAdsSearchTerms(start, end)) as Row[]
      await step('load_ads_search_terms', async () => {
        for (const [d, list] of groupByDate(t)) await loadPartition('ads_search_term_daily', d, list)
        return { rows: t.length }
      })
      report.fetched = { ads_search_terms: t.length }
      report.ok = true
      report.ms = Date.now() - t0
      return report
    }
    if (mode === 'adsconv') {
      // 按「转化动作」拆解：到底是表单在转化，还是 scroll/click 在冒充转化
      const from = String(ev?.from || '2026-09-01')
      const to = String(ev?.to || ymd(new Date()))
      const rows = await adsSearch(
        'SELECT segments.date, campaign.name, segments.conversion_action_name, metrics.conversions' +
        ` FROM campaign WHERE segments.date BETWEEN '${from}' AND '${to}' AND metrics.conversions > 0`,
      )
      report.conversions = rows.map((r) => ({
        date: r.segments?.date, campaign: r.campaign?.name,
        action: r.segments?.conversionActionName, conv: n(r.metrics?.conversions),
      }))
      report.ok = true
      report.ms = Date.now() - t0
      return report
    }
    if (mode === 'adsaudit') {
      // 投放前体检：自动标记、系列状态与预算、转化动作是否仍启用
      const cust = await adsSearch('SELECT customer.id, customer.auto_tagging_enabled, customer.currency_code, customer.time_zone FROM customer')
      const camps = await adsSearch(
        'SELECT campaign.id, campaign.name, campaign.status, campaign_budget.amount_micros,' +
        ' campaign.bidding_strategy_type FROM campaign ORDER BY campaign.name')
      const convs = await adsSearch(
        'SELECT conversion_action.id, conversion_action.name, conversion_action.status,' +
        ' conversion_action.type, conversion_action.counting_type FROM conversion_action')
      report.audit = {
        customer: cust.map((r) => ({
          id: String(r.customer?.id || ''), autoTagging: r.customer?.autoTaggingEnabled,
          currency: r.customer?.currencyCode, timeZone: r.customer?.timeZone,
        })),
        campaigns: camps.map((r) => ({
          name: r.campaign?.name, status: r.campaign?.status,
          budget: n(r.campaignBudget?.amountMicros) / 1e6,
          bidding: r.campaign?.biddingStrategyType,
        })),
        conversions: convs.map((r) => ({
          name: r.conversionAction?.name, status: r.conversionAction?.status,
          type: r.conversionAction?.type, counting: r.conversionAction?.countingType,
        })),
      }
      report.ok = true
      report.ms = Date.now() - t0
      return report
    }
    if (mode === 'leads') {
      // 只回补 GA4 线索事件表（不动其它表），用于修正历史口径
      const today = new Date()
      const end = ymd(addDays(today, -1))
      const start = ymd(addDays(today, -days))
      report.range = { start, end }
      const leads = await step('fetch_ga4_leads', () => fetchGa4Leads(start, end)) as Row[]
      await step('load_ga4_leads', async () => {
        for (const [d, list] of groupByDate(leads)) await loadPartition('ga4_leads_daily', d, list)
        return { rows: leads.length }
      })
      await step('view', ensureView)
      report.fetched = { ga4_leads: leads.length }
      report.ok = true
      report.ms = Date.now() - t0
      return report
    }
    if (mode === 'sql') {
      // 只读查询通道：{mode:'sql', sql:'SELECT ...'}，最多回 500 行，供临时分析/导出
      const sql = String(ev?.sql || '')
      if (!sql) throw new Error('missing ev.sql')
      const rows = await queryRows(sql)
      report.rowCount = rows.length
      report.rows = rows.slice(0, 500)
      report.ok = true
      report.ms = Date.now() - t0
      return report
    }
    if (mode === 'verify') {
      report.verify = await step('verify', verify)
      report.ok = true
      report.ms = Date.now() - t0
      return report
    }
    if (mode === 'bootstrap') {
      await step('view', ensureView)
      report.expiry = await step('expiry', expiryInfo)
      report.ok = true
      report.ms = Date.now() - t0
      return report
    }

    const today = new Date()
    const end = ymd(addDays(today, -1)) // 昨天
    const start = ymd(addDays(today, mode === 'backfill' ? -days : -7))
    report.range = { start, end }

    // GSC 数据延迟约 2 天：窗口各自截断，缺数据的天不会有行（不会写空分区）
    const gscEnd = ymd(addDays(today, -2))
    const gsc = await step('fetch_gsc', () => fetchGsc(start, gscEnd))
    const adsC = await step('fetch_ads_campaign', () => fetchAdsCampaign(start, end))
    const adsK = await step('fetch_ads_keyword', () => fetchAdsKeyword(start, end))
    const terms = await step('fetch_ads_search_terms', () => fetchAdsSearchTerms(start, end))
    const ga4 = await step('fetch_ga4', () => fetchGa4(start, end))
    const leads = await step('fetch_ga4_leads', () => fetchGa4Leads(start, end))
    report.fetched = {
      gsc: (gsc as Row[]).length, ads_campaign: (adsC as Row[]).length,
      ads_keyword: (adsK as Row[]).length, ga4: (ga4 as Row[]).length,
      ga4_leads: (leads as Row[]).length, ads_search_terms: (terms as Row[]).length,
    }

    const loaded: Record<string, number> = {}
    const loadAll = async (table: string, rows: Row[]) => {
      for (const [date, list] of groupByDate(rows)) {
        await loadPartition(table, date, list)
        loaded[table] = (loaded[table] || 0) + list.length
      }
    }
    await step('load_gsc', () => loadAll('gsc_query_page', gsc as Row[]))
    await step('load_ads_campaign', () => loadAll('ads_campaign_daily', adsC as Row[]))
    await step('load_ads_keyword', () => loadAll('ads_keyword_daily', adsK as Row[]))
    await step('load_ads_search_terms', () => loadAll('ads_search_term_daily', terms as Row[]))
    await step('load_ga4', () => loadAll('ga4_traffic_daily', ga4 as Row[]))
    await step('load_ga4_leads', () => loadAll('ga4_leads_daily', leads as Row[]))
    await step('view', ensureView)

    report.loaded = loaded
    report.ok = true
    report.ms = Date.now() - t0
    return report
  } catch (e) {
    report.ok = false
    report.error = String(e).slice(0, 800)
    report.ms = Date.now() - t0
    return report
  }
}
