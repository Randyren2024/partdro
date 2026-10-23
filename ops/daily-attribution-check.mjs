#!/usr/bin/env node
// 每日获客体检：只读。产出「昨天花了多少 → 有没有新询盘 → 询盘归因是什么」三段事实。
// 不包含任何判断，判断留给调用方（人或有判断力的 agent）。
//
// 用法：node scripts/daily-attribution-check.mjs [YYYY-MM-DD]
// 凭据：/workspace/.secrets/partdro.env
import { createHmac, randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'

const SECRETS = '/workspace/.secrets/partdro.env'

function loadEnv(path) {
  try {
    return Object.fromEntries(
      readFileSync(path, 'utf8')
        .split('\n')
        .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
        .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
    )
  } catch {
    console.error(`缺少凭据文件：${path}`)
    process.exit(2)
  }
}

const env = loadEnv(SECRETS)
const BUCKET = env.OSS_BUCKET
const REGION = env.OSS_REGION
const HOST = `${BUCKET}.oss-${REGION}.aliyuncs.com`

/** OSS V1 签名读取对象（私有桶） */
async function ossGet(key) {
  const date = new Date().toUTCString()
  const stringToSign = ['GET', '', '', date, `/${BUCKET}/${key}`].join('\n')
  const sig = createHmac('sha1', env.OSS_AK_SECRET).update(stringToSign, 'utf8').digest('base64')
  const res = await fetch(`https://${HOST}/${encodeURI(key)}`, {
    headers: { Date: date, Authorization: `OSS ${env.OSS_AK_ID}:${sig}` },
  })
  if (!res.ok) return { ok: false, status: res.status }
  return { ok: true, text: await res.text() }
}

/** OSS V1 签名写入（私有桶，JSON） */
async function ossPut(key, body) {
  const date = new Date().toUTCString()
  const type = 'application/json; charset=utf-8'
  const stringToSign = ['PUT', '', type, date, `/${BUCKET}/${key}`].join('\n')
  const sig = createHmac('sha1', env.OSS_AK_SECRET).update(stringToSign, 'utf8').digest('base64')
  const res = await fetch(`https://${HOST}/${encodeURI(key)}`, {
    method: 'PUT',
    headers: { Date: date, Authorization: `OSS ${env.OSS_AK_ID}:${sig}`, 'Content-Type': type },
    body,
  })
  return res.ok
}

const DS_STATE_KEY = 'state/deepseek-balance.json'

/** DeepSeek 官方只开放 /user/balance（余额），没有按日账单或用量明细 API。
 *  因此这里用「上次记录余额 − 当前余额」推算期间消耗，属推算值，不是账单。 */
async function deepseekSpend() {
  if (!env.DEEPSEEK_API_KEY) return { ok: false, err: '未配置 DEEPSEEK_API_KEY' }
  try {
    const res = await fetch('https://api.deepseek.com/user/balance', {
      headers: { Authorization: `Bearer ${env.DEEPSEEK_API_KEY}` },
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) return { ok: false, err: `HTTP ${res.status}` }
    const j = await res.json()
    const infos = j.balance_infos || []
    const info = infos.find((b) => b.currency === 'CNY') || infos[0]
    if (!info) return { ok: false, err: '响应中无余额信息' }
    const now = Number(info.total_balance)
    const prevRaw = await ossGet(DS_STATE_KEY)
    let prev = null
    if (prevRaw.ok) {
      try {
        prev = JSON.parse(prevRaw.text)
      } catch {
        prev = null
      }
    }
    const delta = prev && Number.isFinite(prev.balance) ? prev.balance - now : null
    await ossPut(
      DS_STATE_KEY,
      JSON.stringify({ checked_at: new Date().toISOString(), balance: now, currency: info.currency }),
    )
    return { ok: true, balance: now, currency: info.currency, delta, prevAt: prev?.checked_at ?? null }
  } catch (e) {
    return { ok: false, err: e.message }
  }
}

/** 北京时间日期 */
function bjDate(offsetDays = 0) {
  const t = new Date(Date.now() + 8 * 3600 * 1000 - offsetDays * 86400000)
  return t.toISOString().slice(0, 10)
}

/** RFC3986 编码（阿里云 RPC 签名要求） */
function pe(s) {
  return encodeURIComponent(String(s)).replace(
    /[!'()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  )
}

/** 阿里云 BSS OpenAPI：查询某个自然日的账单合计（RPC 风格 V1 签名，零依赖） */
async function aliyunDailyBill(dateStr) {
  const params = {
    Action: 'QueryAccountBill',
    Version: '2017-12-14',
    Format: 'JSON',
    RegionId: 'cn-hongkong',
    BillingCycle: dateStr.slice(0, 7),
    BillingDate: dateStr,
    Granularity: 'DAILY',
    IsGroupByProduct: 'true',
    Timestamp: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
    SignatureMethod: 'HMAC-SHA1',
    SignatureVersion: '1.0',
    SignatureNonce: randomUUID(),
    AccessKeyId: env.OSS_AK_ID,
  }
  const cq = Object.keys(params)
    .sort()
    .map((k) => `${pe(k)}=${pe(params[k])}`)
    .join('&')
  const sig = createHmac('sha1', `${env.OSS_AK_SECRET}&`)
    .update(`GET&%2F&${pe(cq)}`, 'utf8')
    .digest('base64')
  try {
    const res = await fetch(`https://business.aliyuncs.com/?Signature=${pe(sig)}&${cq}`, {
      signal: AbortSignal.timeout(15000),
    })
    const j = await res.json()
    if (j.Code !== 'Success') return { ok: false, err: `${j.Code}: ${j.Message}` }
    const items = (j.Data?.Items?.Item || [])
      .map((it) => ({ name: it.ProductName || it.ProductCode, amt: Number(it.PretaxAmount || 0) }))
      .filter((x) => x.amt > 0)
    return { ok: true, items, total: items.reduce((a, b) => a + b.amt, 0) }
  } catch (e) {
    return { ok: false, err: e.message }
  }
}

async function latestReport(prefix, preferred) {
  for (const d of [preferred, bjDate(), bjDate(1), bjDate(2)]) {
    const r = await ossGet(`${prefix}/${d}.md`)
    if (r.ok) return { date: d, text: r.text }
  }
  return null
}

function section(text, headingKeyword, maxLines = 14) {
  if (!text) return '(无报告)'
  const lines = text.split('\n')
  const i = lines.findIndex((l) => l.includes(headingKeyword))
  if (i < 0) return '(未找到章节)'
  const out = []
  for (let j = i; j < lines.length && out.length < maxLines; j++) {
    if (j > i && /^##\s/.test(lines[j])) break
    out.push(lines[j])
  }
  return out.join('\n')
}

const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString()
const inqRes = await fetch(
  `${env.SUPABASE_URL}/rest/v1/inquiries?select=id,created_at,name,email,type,product_slug,utm_source,utm_term,gclid,landing_page,page_path&created_at=gte.${since}&order=id.desc`,
  { headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` } },
)
const inquiries = inqRes.ok ? await inqRes.json() : []
if (!inqRes.ok) console.error('询盘查询失败 http', inqRes.status)

const ads = await latestReport('ads-reports', bjDate(1))
const gsc = await latestReport('gsc-reports', bjDate(1))

console.log(`# 获客日报（${bjDate()} 09:00 前生成）\n`)

console.log('## 1. 近 24 小时新询盘')
if (!inquiries.length) {
  console.log('0 条。')
} else {
  console.log(`共 ${inquiries.length} 条：`)
  for (const q of inquiries) {
    const src = q.gclid
      ? `广告点击 gclid=${String(q.gclid).slice(0, 12)}… / ${q.utm_source || '?'} / ${q.utm_term || '?'}`
      : q.utm_source
        ? `${q.utm_source} / ${q.utm_medium || '?'}`
        : '无归因（可能是自然/直接/站外）'
    console.log(`- #${q.id} ${q.created_at.slice(0, 16)} | ${q.name} <${q.email}>`)
    console.log(`  产品页=${q.product_slug || '-'} | 来源=${src}`)
    console.log(`  落地页=${q.landing_page || '-'} | 提交页=${q.page_path || '-'}`)
  }
}

console.log('\n## 2. 花费构成')
console.log('### 阿里云（BSS 实际计费，自然日）')
for (const d of [bjDate(), bjDate(1)]) {
  const b = await aliyunDailyBill(d)
  if (!b.ok) {
    console.log(`- ${d}: 查询失败（${b.err}）`)
    continue
  }
  const detail = b.items.length
    ? b.items.map((x) => `${x.name} ¥${x.amt.toFixed(2)}`).join(' · ')
    : '当日无计费'
  console.log(`- ${d}: **¥${b.total.toFixed(2)}**（${detail}）`)
}
console.log('### DeepSeek（余额差值推算，非官方账单）')
const ds = await deepseekSpend()
if (!ds.ok) {
  console.log(`- 查询失败（${ds.err}）`)
} else {
  const since = ds.prevAt ? `${ds.prevAt.slice(0, 16).replace('T', ' ')}Z 起` : '首次记录'
  const deltaText =
    ds.delta === null
      ? '暂无对比基线'
      : ds.delta >= 0
        ? `${since}消耗 ¥${ds.delta.toFixed(2)}`
        : `${since}余额增加 ¥${Math.abs(ds.delta).toFixed(2)}（疑似充值）`
  console.log(`- 余额 ¥${ds.balance.toFixed(2)} ${ds.currency}，${deltaText}`)
}
console.log('### Google Ads')
console.log('- 见下一段（Ads 日报口径为近 7 天，不是单日）')

console.log('\n## 3. Google Ads 花费与转化')
console.log(section(ads?.text, '整体表现', 12))
console.log(`\n（报告日期：${ads?.date || '未找到'}）`)

console.log('\n## 4. 自然搜索')
const gscOverview = section(gsc?.text, '概览', 10)
console.log(gscOverview === '(未找到章节)' ? section(gsc?.text, '整体', 10) : gscOverview)
console.log(`\n（报告日期：${gsc?.date || '未找到'}）`)

console.log('\n## 5. 需要人工判断的信号')
const withGclid = inquiries.filter((q) => q.gclid).length
console.log(`- 带 gclid 的询盘：${withGclid} 条（可归因到具体广告点击）`)
console.log(`- 无归因询盘：${inquiries.filter((q) => !q.gclid && !q.utm_source).length} 条（可能是站外/直接访问）`)
if (inquiries.length === 0) console.log('- 连续无询盘时，优先怀疑转化链路是否被改坏，而不是渠道无效。')

// 运行痕迹：把每次执行写入 OSS，供外部核验「定时任务是否真的跑过」。
// 平台只回传 Executions 计数，不回传成功/失败，所以必须有独立证据。
try {
  const RUN_LOG_KEY = 'state/run-log.json'
  const prevRun = await ossGet(RUN_LOG_KEY)
  let entries = []
  if (prevRun.ok) {
    try {
      const parsed = JSON.parse(prevRun.text)
      if (Array.isArray(parsed)) entries = parsed
    } catch {
      entries = []
    }
  }
  entries.unshift({
    at: new Date().toISOString(),
    bj: new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 16).replace('T', ' '),
    cwd: process.cwd(),
  })
  await ossPut(RUN_LOG_KEY, JSON.stringify(entries.slice(0, 20), null, 1))
  console.log(`\n<!-- run-log 已写入 ${entries[0].at} -->`)
} catch (e) {
  console.error('运行痕迹写入失败:', e.message)
}
