// Partdro 每日日报（阿里云 FC 定时函数）
// 结构对齐飞书文档既有日报块：H1 日期+结论 → 加粗结论段 → 编号 H2 小节
// 八个部分：结论 / 花费构成 / 询盘归因 / 自然搜索 / 广告投放 / 站点链路 / 系统运行 / 待解问题
// 设计原则：零外部依赖；每段都有真实数据出处；任何一段失败只降级该段，不中断整体。
'use strict'

const crypto = require('node:crypto')

const env = process.env
const SITE = 'https://www.droneworld.tech'
const OSS_BUCKET = env.OSS_BUCKET
const OSS_HOST = `${OSS_BUCKET}.oss-${env.OSS_REGION}.aliyuncs.com`
const GITHUB_REPO = 'Randyren2024/partdro'

// ---------- 通用 ----------
function bjDate(offsetDays = 0) {
  const t = new Date(Date.now() + 8 * 3600 * 1000 - offsetDays * 86400000)
  return t.toISOString().slice(0, 10)
}
function bjNow() {
  return new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 16).replace('T', ' ')
}
function pe(s) {
  return encodeURIComponent(String(s)).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)
}
function rpcSign(params, secret) {
  const cq = Object.keys(params).sort().map((k) => `${pe(k)}=${pe(params[k])}`).join('&')
  const sig = crypto.createHmac('sha1', `${secret}&`).update(`GET&%2F&${pe(cq)}`, 'utf8').digest('base64')
  return `${cq}&Signature=${pe(sig)}`
}
async function rpcCall(host, action, version, params, akId, akSecret, region) {
  const all = {
    Action: action,
    Version: version,
    Format: 'JSON',
    RegionId: region,
    AccessKeyId: akId,
    SignatureMethod: 'HMAC-SHA1',
    SignatureVersion: '1.0',
    SignatureNonce: crypto.randomUUID(),
    Timestamp: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
    ...params,
  }
  const res = await fetch(`https://${host}/?${rpcSign(all, akSecret)}`, { signal: AbortSignal.timeout(20000) })
  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch {
    return { Code: 'ParseError', Message: text.slice(0, 200) }
  }
}

// ---------- OSS ----------
async function ossGet(key) {
  const date = new Date().toUTCString()
  const stringToSign = ['GET', '', '', date, `/${OSS_BUCKET}/${key}`].join('\n')
  const sig = crypto.createHmac('sha1', env.OSS_AK_SECRET).update(stringToSign, 'utf8').digest('base64')
  const res = await fetch(`https://${OSS_HOST}/${encodeURI(key)}`, {
    headers: { Date: date, Authorization: `OSS ${env.OSS_AK_ID}:${sig}` },
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) return { ok: false, status: res.status }
  return { ok: true, text: await res.text() }
}
async function ossPut(key, body) {
  const date = new Date().toUTCString()
  const type = 'application/json; charset=utf-8'
  const stringToSign = ['PUT', '', type, date, `/${OSS_BUCKET}/${key}`].join('\n')
  const sig = crypto.createHmac('sha1', env.OSS_AK_SECRET).update(stringToSign, 'utf8').digest('base64')
  const res = await fetch(`https://${OSS_HOST}/${encodeURI(key)}`, {
    method: 'PUT',
    headers: { Date: date, Authorization: `OSS ${env.OSS_AK_ID}:${sig}`, 'Content-Type': type },
    body,
    signal: AbortSignal.timeout(15000),
  })
  return res.ok
}

// ---------- 数据采集 ----------
async function aliyunDailyBill(dateStr) {
  try {
    const j = await rpcCall(
      'business.aliyuncs.com',
      'QueryAccountBill',
      '2017-12-14',
      { BillingCycle: dateStr.slice(0, 7), BillingDate: dateStr, Granularity: 'DAILY', IsGroupByProduct: 'true' },
      env.OSS_AK_ID,
      env.OSS_AK_SECRET,
      env.OSS_REGION || 'cn-hongkong',
    )
    if (j.Code !== 'Success') return { ok: false, err: `${j.Code}: ${j.Message}` }
    const items = (j.Data?.Items?.Item || [])
      .map((it) => ({ name: it.ProductName || it.ProductCode, amt: Number(it.PretaxAmount || 0) }))
      .filter((x) => x.amt > 0)
      .sort((a, b) => b.amt - a.amt)
    return { ok: true, items, total: items.reduce((a, b) => a + b.amt, 0) }
  } catch (e) {
    return { ok: false, err: e.message }
  }
}

const DS_STATE_KEY = 'state/deepseek-balance.json'
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
    await ossPut(DS_STATE_KEY, JSON.stringify({ checked_at: new Date().toISOString(), balance: now, currency: info.currency }))
    return { ok: true, balance: now, currency: info.currency, delta, prevAt: prev?.checked_at ?? null }
  } catch (e) {
    return { ok: false, err: e.message }
  }
}

async function fetchInquiries() {
  const h = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` }
  const base = `${env.SUPABASE_URL}/rest/v1/inquiries`
  const SEL =
    'id,created_at,name,email,type,product_slug,gclid,utm_source,utm_medium,utm_campaign,utm_content,utm_term,landing_page,page_path,referrer'
  const iso = (days) => encodeURIComponent(new Date(Date.now() - days * 86400000).toISOString())

  // PostgREST 精确计数：Prefer: count=exact + Range 0-0，从 Content-Range 取总数
  const countSince = async (days) => {
    try {
      const res = await fetch(`${base}?select=id&created_at=gte.${iso(days)}`, {
        headers: { ...h, Prefer: 'count=exact', Range: '0-0' },
        signal: AbortSignal.timeout(15000),
      })
      if (!res.ok) return null
      const total = (res.headers.get('content-range') || '').split('/')[1]
      return total && total !== '*' ? Number(total) : null
    } catch {
      return null
    }
  }

  try {
    const [detailRes, d7, d30, total] = await Promise.all([
      fetch(`${base}?select=${SEL}&created_at=gte.${iso(1)}&order=created_at.desc&limit=50`, {
        headers: h,
        signal: AbortSignal.timeout(15000),
      }),
      countSince(7),
      countSince(30),
      countSince(36500),
    ])
    if (!detailRes.ok) return { ok: false, err: `HTTP ${detailRes.status}`, rows: [], counts: {} }

    const raw = await detailRes.json()
    // 排除自测数据（历史上有 TRAE/TEST 行混进来会污染日报）
    const isTest = (q) => /test|trae/i.test(String(q.name || '')) || /test|trae/i.test(String(q.email || ''))
    const kept = raw.filter((q) => !isTest(q))

    return {
      ok: true,
      rows: kept.slice(0, 20),
      hidden: Math.max(0, kept.length - 20),
      excluded: raw.length - kept.length,
      counts: { d1: kept.length, d7, d30, total },
    }
  } catch (e) {
    return { ok: false, err: e.message, rows: [], counts: {} }
  }
}

async function latestReport(prefix, preferred) {
  // 优先当天（09:00-09:30 已更新，覆盖窗口最新），再回退昨天/前天
  for (const d of [bjDate(), preferred, bjDate(1), bjDate(2)]) {
    const r = await ossGet(`${prefix}/${d}.md`)
    if (r.ok) return { date: d, text: r.text }
  }
  return null
}

/** 截取某个标题之后的若干行（不含标题行本身；遇到下一个标题停止） */
function section(text, headingKeyword, maxLines = 12) {
  if (!text) return '(无报告)'
  const lines = text.split('\n')
  const i = lines.findIndex((l) => l.includes(headingKeyword))
  if (i < 0) return '(未找到章节)'
  const out = []
  for (let j = i + 1; j < lines.length && out.length < maxLines; j++) {
    if (/^#{1,3}\s/.test(lines[j])) break
    out.push(lines[j])
  }
  return out.join('\n')
}

/** 把 markdown 片段转成适合文档/消息的纯文本行（表格降级为 · 分隔，过滤表头与空行） */
function toLines(text, max = 12) {
  if (!text) return []
  return text
    .split('\n')
    .slice(0, max)
    .map((l) => l.replace(/^#{1,6}\s*/, '').replace(/\*\*/g, '').replace(/\|/g, '·').replace(/\s+/g, ' ').trim())
    .filter((l) => l && !/^[-·\s|>]+$/.test(l))
    .filter((l) => l !== '无')
    .filter((l) => !/^· ?(指标|查询词|广告系列|字段|页面)\s·/.test(l))
}

/** 站点巡检：多个关键路径的 HTTP 状态 + 产品页表单 */
async function checkSite() {
  const paths = ['/', '/products', '/products/d15r', '/sitemap.xml']
  const results = await Promise.all(
    paths.map(async (p) => {
      try {
        const r = await fetch(SITE + p, { signal: AbortSignal.timeout(15000) })
        const body = r.ok && p !== '/sitemap.xml' ? await r.text() : ''
        return { path: p, http: r.status, bytes: body.length, html: body }
      } catch (e) {
        return { path: p, http: -1, bytes: 0, err: e.message, html: '' }
      }
    }),
  )
  const d15r = results.find((r) => r.path === '/products/d15r')
  const quote = d15r?.html ? (d15r.html.match(/id="quote"/g) || []).length : 0
  const home = results.find((r) => r.path === '/')
  const quoteHome = home?.html ? (home.html.match(/id="quote"/g) || []).length : 0
  return { results, quote, quoteHome }
}

/** GitHub Actions 最近一次部署 */
async function fetchDeploy() {
  try {
    const r = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/actions/runs?per_page=1`, {
      headers: { 'User-Agent': 'partdro-daily-brief', Accept: 'application/vnd.github+json' },
      signal: AbortSignal.timeout(15000),
    })
    if (!r.ok) return { ok: false, err: `HTTP ${r.status}` }
    const j = await r.json()
    const run = j.workflow_runs?.[0]
    if (!run) return { ok: false, err: '无部署记录' }
    return {
      ok: true,
      name: run.name,
      status: run.status,
      conclusion: run.conclusion,
      at: String(run.created_at).replace('T', ' ').slice(0, 16),
      sha: String(run.head_sha || '').slice(0, 7),
      branch: run.head_branch,
    }
  } catch (e) {
    return { ok: false, err: e.message }
  }
}

/** 今日三份 FC 日报是否已产出 */
async function checkReportOutputs() {
  const out = {}
  for (const p of ['ads-reports', 'gsc-reports', 'gsc-deep-analysis']) {
    const r = await ossGet(`${p}/${bjDate()}.md`)
    out[p] = r.ok
  }
  return out
}

// ---------- 组装：结构化 sections（一份数据，两种渲染） ----------
function buildSections(d) {
  const S = []
  const add = (h2, lines) => S.push({ h2, lines })

  const bill = d.bills[0].data
  const yBill = d.bills[1]?.data
  const aliyun = bill.ok ? `¥${bill.total.toFixed(2)}` : '查询失败'
  const inqCount = d.inquiries.rows.length
  const gclidCount = d.inquiries.rows.filter((q) => q.gclid).length
  const httpBad = d.site.results.filter((r) => r.http !== 200)
  const billJump = yBill?.ok && bill.ok && yBill.total > 0 && bill.total > yBill.total * 2

  // 结论
  const headline = httpBad.length
    ? '站点异常，最高优先级'
    : inqCount > 0
      ? `新增 ${inqCount} 条询盘，阿里云 ${aliyun}`
      : `0 询盘，阿里云 ${aliyun}，链路正常`

  const verdict = []
  if (httpBad.length) {
    verdict.push(`⚠ 站点有 ${httpBad.length} 个路径非 200（${httpBad.map((r) => `${r.path}=${r.http}`).join('、')}），先修站点再谈获客。`)
  } else if (d.site.quote === 0) {
    verdict.push('⚠ 站点可访问，但产品页询盘表单消失（id="quote" = 0），转化链路已断。')
  } else {
    verdict.push('站点与转化链路正常（关键路径全 200，产品页表单存在）。')
  }
  verdict.push(
    `今日花费：阿里云 ${aliyun}；DeepSeek 余额 ${d.ds.ok ? '¥' + d.ds.balance.toFixed(2) : '查询失败'}；Ads 近 7 天花费 ${adsSpend(d.ads) || '未取到'}。`,
  )
  const cc = d.inquiries.counts || {}
  verdict.push(
    inqCount > 0
      ? `近 24 小时询盘 ${inqCount} 条，其中可精确归因到广告点击（带 gclid）${gclidCount} 条。`
      : `近 24 小时询盘 0 条（近 7 天 ${cc.d7 ?? '?'} 条 / 近 30 天 ${cc.d30 ?? '?'} 条），先看链路再看渠道。`,
  )

  add('1. 结论先行：今天真正发生了什么', verdict)

  // 花费构成
  const costLines = []
  costLines.push('阿里云（BSS 实际计费，自然日，按产品拆分）')
  for (const b of d.bills) {
    if (!b.data.ok) {
      costLines.push(`· ${b.date}：查询失败（${b.data.err}）`)
      continue
    }
    const detail = b.data.items.length
      ? b.data.items.map((x) => `${x.name} ¥${x.amt.toFixed(2)}`).join(' · ')
      : '当日无计费'
    costLines.push(`· ${b.date}：¥${b.data.total.toFixed(2)}（${detail}）`)
  }
  if (billJump) {
    costLines.push(`· ⚠ 今日是昨日 ${(bill.total / yBill.total).toFixed(1)} 倍，重点查是否又有常驻沙箱/预留实例在跑`)
  }
  costLines.push('DeepSeek（余额差值推算，非官方账单）')
  if (d.ds.ok) {
    const since = d.ds.prevAt ? `${d.ds.prevAt.slice(0, 16).replace('T', ' ')}Z 起` : '首次记录'
    costLines.push(
      d.ds.delta === null
        ? `· 余额 ¥${d.ds.balance.toFixed(2)}（首次记录，暂无对比基线）`
        : d.ds.delta >= 0
          ? `· 余额 ¥${d.ds.balance.toFixed(2)}，${since}消耗 ¥${d.ds.delta.toFixed(2)}`
          : `· 余额 ¥${d.ds.balance.toFixed(2)}，${since}增加 ¥${Math.abs(d.ds.delta).toFixed(2)}（疑似充值）`,
    )
  } else {
    costLines.push(`· 查询失败（${d.ds.err}）`)
  }
  costLines.push('Google Ads（口径：近 7 天，非单日）')
  costLines.push(...toLines(section(d.ads?.text, '整体表现', 12), 12))
  costLines.push(`（报告日期：${d.ads?.date || '未找到'}）`)
  add('2. 花费构成（阿里云 / DeepSeek / Ads）', costLines)

  // 询盘与归因
  // 归因字段（gclid/utm_*）2026-10-20 才上线，更早的行没有这些值，
  // 不能把它们判成「自然流量」，否则会把广告客户误报成自然来源。
  const ATTR_LIVE_AT = Date.parse('2026-10-20T00:00:00Z')
  const inqLines = []
  const c = d.inquiries.counts || {}
  if (!d.inquiries.ok) {
    inqLines.push(`查询失败（${d.inquiries.err}）`)
  } else {
    inqLines.push(
      `窗口对比：近 24 小时 ${c.d1 ?? '?'} 条｜近 7 天 ${c.d7 ?? '?'} 条｜近 30 天 ${c.d30 ?? '?'} 条｜历史累计 ${c.total ?? '?'} 条`,
    )
    if (!inqCount) {
      inqLines.push(
        c.d7 === 0 && c.d30 === 0
          ? '近 7 天与近 30 天同样为 0 → 样本不足，不能据此判断渠道无效。'
          : '近 24 小时为 0，但更长窗口有询盘 → 属正常波动，不要据此判断渠道失效。',
      )
      inqLines.push('若怀疑链路问题，先看第 6 段的站点与表单状态，不要先怀疑渠道。')
    } else {
      for (const q of d.inquiries.rows) {
        const legacy = Date.parse(q.created_at) < ATTR_LIVE_AT && !q.gclid && !q.utm_source
        const src = legacy
          ? '归因字段上线前的历史数据（渠道无法判定，不代表自然流量）'
          : q.gclid
            ? `广告点击 gclid=${String(q.gclid).slice(0, 12)}… / ${q.utm_source || '?'} / ${q.utm_term || '?'}`
            : q.utm_source
              ? `${q.utm_source} / ${q.utm_medium || '?'}${q.utm_campaign ? ` / ${q.utm_campaign}` : ''}${q.utm_term ? ` / ${q.utm_term}` : ''}`
              : q.referrer
                ? `无 UTM，来源页 ${q.referrer}`
                : '无归因（直接访问或站外）'
        inqLines.push(`· #${q.id} ${String(q.created_at).slice(0, 16)}｜${q.name} <${q.email}>｜type=${q.type || '-'}`)
        inqLines.push(`  产品页 ${q.product_slug || '-'}｜来源 ${src}`)
        inqLines.push(`  落地页 ${q.landing_page || '-'}｜提交页 ${q.page_path || '-'}`)
      }
      if (d.inquiries.hidden > 0) inqLines.push(`（仅展示最近 20 条，另有 ${d.inquiries.hidden} 条未展示）`)
    }
    if (d.inquiries.excluded > 0) inqLines.push(`（已排除疑似测试行 ${d.inquiries.excluded} 条：name/email 含 test 或 trae）`)
  }
  add('3. 询盘与归因（近 24 小时）', inqLines)

  // 自然搜索
  const gscLines = []
  gscLines.push('整体（GSC 近 7 天）')
  gscLines.push(...toLines(section(d.gsc?.text, '整体表现', 10), 10))
  gscLines.push('Top 查询（零点击优先关注）')
  gscLines.push(...toLines(section(d.gsc?.text, 'Top 10 查询', 14), 14))
  gscLines.push('查询 → 落地页 错配（高意图词是否落在新闻页）')
  gscLines.push(...toLines(section(d.gsc?.text, '查询 → 落地页', 14), 14))
  gscLines.push('深度分析：关键结论')
  gscLines.push(...toLines(section(d.deep?.text, '关键结论速览', 10), 10))
  gscLines.push('关键词机会（A 类：排名 4~20，优先改 title/meta）')
  gscLines.push(
    ...toLines(section(d.deep?.text, 'A 类', 15), 15).map((l) => (l.length > 140 ? `${l.slice(0, 137)}…` : l)),
  )
  gscLines.push(`（报告日期：GSC ${d.gsc?.date || '未找到'} / 深度 ${d.deep?.date || '未找到'}）`)
  add('4. 自然搜索（GSC + 深度分析）', gscLines)

  // 广告投放
  const adsLines = []
  adsLines.push('按广告系列（近 7 天）')
  adsLines.push(...toLines(section(d.ads?.text, '按广告系列', 14), 14))
  adsLines.push('昨日表现')
  adsLines.push(...toLines(section(d.ads?.text, '昨日表现', 12), 12))
  adsLines.push('高花费零转化搜索词（待观察）')
  adsLines.push(...toLines(section(d.ads?.text, '高花费零转化', 10), 10))
  adsLines.push('广告 → 网站漏斗核对')
  adsLines.push(...toLines(section(d.ads?.text, '漏斗核对', 10), 10))
  adsLines.push(
    `数据口径：以上来自 ${d.ads?.date || '未找到'} 09:15 生成的 Ads 日报，反映的是前一日及近 7 天，不代表当前实时状态。`,
  )
  adsLines.push('投放状态：D15R - Search - Global / DE 已于 2026-10-21 人工暂停；暂停效果需次日日报核对（花费应归零）。')
  add('5. 广告投放（近 7 天）', adsLines)

  // 站点与转化链路
  const siteLines = []
  for (const r of d.site.results) {
    siteLines.push(`· ${r.path} → HTTP ${r.http}${r.bytes ? `，${r.bytes} 字节` : ''}`)
  }
  siteLines.push(`· 产品页表单 id="quote"：${d.site.quote}（首页 ${d.site.quoteHome}）`)
  siteLines.push(httpBad.length ? '· ⚠ 存在非 200 路径，需立即排查' : '· 关键路径全部 200')
  add('6. 站点与转化链路', siteLines)

  // 系统运行
  const sysLines = []
  const outs = d.outputs
  sysLines.push(`· 今日 FC 日报产出：Ads ${outs['ads-reports'] ? '✓' : '✗'}｜GSC ${outs['gsc-reports'] ? '✓' : '✗'}｜深度 ${outs['gsc-deep-analysis'] ? '✓' : '✗'}`)
  if (d.deploy.ok) {
    sysLines.push(
      `· 最近一次站点部署：${d.deploy.name} #${d.deploy.sha}（${d.deploy.branch}）→ ${d.deploy.conclusion || d.deploy.status}，${d.deploy.at}Z`,
    )
  } else {
    sysLines.push(`· 部署状态查询失败（${d.deploy.err}）`)
  }
  sysLines.push(`· 本函数：partdro-daily-brief，运行于 ${bjNow()}（北京），产物同时写邮件 / 飞书 / 本文档`)
  add('7. 系统运行与部署', sysLines)

  // 待解问题与下一步
  const todo = []
  let n = 1
  if (httpBad.length) todo.push(`${n++}) 最高优先级：修复站点非 200 路径（先看是否阿里云欠费或 OSS/FC 配置变化）。`)
  if (d.site.quote === 0) todo.push(`${n++}) 最高优先级：恢复产品页询盘表单，否则所有流量都在漏。`)
  if (billJump) todo.push(`${n++}) 阿里云今日 ¥${bill.total.toFixed(2)} 异常高于昨日，重点查常驻资源（E2B 沙箱等）。`)
  if (inqCount === 0 && !httpBad.length && d.site.quote > 0) {
    todo.push(`${n++}) 连续 0 询盘但链路正常 → 属于样本不足，继续观察，不要据此判断渠道无效。`)
  }
  const negWords = toLines(section(d.ads?.text, '疑似无关流量', 8), 6).filter((l) => l.includes('·') && !l.includes('近 7 天搜索词未命中'))
  if (negWords.length) {
    todo.push(`${n++}) 广告侧可执行：把「疑似无关流量」里的词加否定关键词（需你确认后再动）：${negWords.join('；')}`)
  }
  todo.push(`${n++}) 广告系列恢复条件：站点 200 + 表单存在 + 你明确同意 + 明确日预算。四项齐了才动。`)
  todo.push('验收标准：次日同一时间，本文档出现新的日报块，且 inquiries 表有新行或 Ads 转化 > 0。')
  add('8. 待解问题与下一步', todo)

  return { headline, sections: S }
}

/** 从 ads 报告整体表现里抠出花费数值，用于结论句 */
function adsSpend(report) {
  const m = String(report?.text || '').match(/花费\s*\|?\s*¥([\d.]+)/)
  return m ? `¥${m[1]}` : null
}

// ---------- 渲染 ----------
function renderMarkdown(meta) {
  const L = [`# ${bjDate()} 日报：${meta.headline}`, '', `**${meta.sections[0].lines[0]}**`, '']
  for (const s of meta.sections) {
    L.push(`## ${s.h2}`)
    for (const line of s.lines) L.push(line)
    L.push('')
  }
  return L.join('\n')
}

function renderBlocks(meta) {
  const blocks = []
  const h1 = (t) => blocks.push({ block_type: 3, heading1: { elements: [{ text_run: { content: t } }] } })
  const h2 = (t) => blocks.push({ block_type: 4, heading2: { elements: [{ text_run: { content: t } }] } })
  const p = (t, bold) =>
    blocks.push({
      block_type: 2,
      text: { elements: [{ text_run: { content: t, text_element_style: bold ? { bold: true } : {} } }] },
    })

  h1(`${bjDate()} 日报：${meta.headline}`)
  p(meta.sections[0].lines.slice(0, 2).join(' '), true)
  for (const s of meta.sections) {
    h2(s.h2)
    for (const line of s.lines) p(line)
  }
  return blocks
}

// ---------- 推送：邮件 ----------
async function sendMail(subject, html) {
  if (!env.DIRECTMAIL_ACCESS_KEY_ID || !env.DIRECTMAIL_ACCOUNT || !env.DM_TO) {
    return { ok: false, err: '缺少 DIRECTMAIL_* / DM_TO' }
  }
  try {
    const j = await rpcCall(
      'dm.aliyuncs.com',
      'SingleSendMail',
      '2015-11-23',
      {
        AccountName: env.DIRECTMAIL_ACCOUNT,
        AddressType: '1',
        ReplyToAddress: 'false',
        ToAddress: env.DM_TO,
        Subject: subject,
        HtmlBody: html,
      },
      env.DIRECTMAIL_ACCESS_KEY_ID,
      env.DIRECTMAIL_ACCESS_KEY_SECRET,
      env.DIRECTMAIL_REGION || 'cn-hongkong',
    )
    return j.Code === 'OK' || j.RequestId ? { ok: true } : { ok: false, err: `${j.Code}: ${j.Message}` }
  } catch (e) {
    return { ok: false, err: e.message }
  }
}

// ---------- 推送：飞书消息 ----------
const FEISHU_API = 'https://open.feishu.cn/open-apis'

async function feishuToken() {
  const j = await fetch(`${FEISHU_API}/auth/v3/tenant_access_token/internal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ app_id: env.FEISHU_APP_ID, app_secret: env.FEISHU_APP_SECRET }),
    signal: AbortSignal.timeout(15000),
  }).then((r) => r.json())
  return j.tenant_access_token || null
}

async function sendFeishu(text) {
  if (!env.FEISHU_APP_ID || !env.FEISHU_APP_SECRET || !env.FEISHU_OPEN_ID) {
    return { ok: false, err: '未配置 FEISHU_*' }
  }
  try {
    const token = await feishuToken()
    if (!token) return { ok: false, err: 'tenant_access_token 获取失败' }
    const res = await fetch(`${FEISHU_API}/im/v1/messages?receive_id_type=open_id`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ receive_id: env.FEISHU_OPEN_ID, msg_type: 'text', content: JSON.stringify({ text }) }),
      signal: AbortSignal.timeout(15000),
    }).then((r) => r.json())
    return res.code === 0 ? { ok: true } : { ok: false, err: `${res.code}: ${res.msg}` }
  } catch (e) {
    return { ok: false, err: e.message }
  }
}

// ---------- 推送：飞书文档 ----------
/** 目标文档 ID：优先用显式配置的 docx document_id，否则把 wiki 节点解析成 docx id */
async function resolveDocId(token) {
  if (env.FEISHU_DOC_TOKEN) return env.FEISHU_DOC_TOKEN
  if (!env.FEISHU_WIKI_TOKEN) return null
  const node = await fetch(`${FEISHU_API}/wiki/v2/spaces/get_node?token=${env.FEISHU_WIKI_TOKEN}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(15000),
  }).then((r) => r.json())
  return node.code === 0 ? node.data.node.obj_token : null
}

async function hasTodayBlock(docId, token) {
  const content = await fetch(`${FEISHU_API}/docx/v1/documents/${docId}/raw_content?lang=0`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(20000),
  }).then((r) => r.json())
  return content.code === 0 && String(content.data?.content || '').includes(`${bjDate()} 日报`)
}

/** 写一条运行痕迹到 OSS。无论正常跑、跳过还是失败都要留痕，
 *  否则「cron 到底有没有触发」无法从外部核验（历史坑：skip 分支提前 return，日志里查不到任何记录）。 */
async function appendRunLog(source) {
  try {
    const prev = await ossGet('state/run-log.json')
    let entries = []
    if (prev.ok) {
      try {
        const p = JSON.parse(prev.text)
        if (Array.isArray(p)) entries = p
      } catch {
        entries = []
      }
    }
    entries.unshift({ at: new Date().toISOString(), bj: bjNow(), source })
    await ossPut('state/run-log.json', JSON.stringify(entries.slice(0, 20), null, 1))
    return true
  } catch {
    return false
  }
}

/** 追加块到文档末尾；单次上限 50 块，自动分批。同日已存在则跳过。 */
async function appendToDoc(blocks, token) {
  if (!env.FEISHU_DOC_TOKEN && !env.FEISHU_WIKI_TOKEN) {
    return { ok: false, err: '未配置 FEISHU_DOC_TOKEN / FEISHU_WIKI_TOKEN' }
  }
  try {
    const docId = await resolveDocId(token)
    if (!docId) return { ok: false, err: 'wiki get_node 失败' }
    if (await hasTodayBlock(docId, token)) return { ok: true, skipped: '今天已写过' }

    let written = 0
    for (let i = 0; i < blocks.length; i += 50) {
      const chunk = blocks.slice(i, i + 50)
      const res = await fetch(`${FEISHU_API}/docx/v1/documents/${docId}/blocks/${docId}/children`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ children: chunk }),
        signal: AbortSignal.timeout(30000),
      }).then((r) => r.json())
      if (res.code !== 0) return { ok: false, err: `第 ${i / 50 + 1} 批失败 ${res.code}: ${res.msg}`, written }
      written += chunk.length
    }
    return { ok: true, docId: String(docId).slice(0, 8) + '…', blocks: written }
  } catch (e) {
    return { ok: false, err: e.message }
  }
}

// ---------- 入口 ----------
exports.handler = async () => {
  const out = { ok: true }
  const DRY = env.DRY_RUN === '1'

  // 当日已推送则整体跳过：避免重复邮件/飞书，也让兜底触发器不产生额外打扰
  // 预检模式（DRY_RUN=1）跳过此判断，便于随时核对内容
  if (!DRY) {
    try {
      const tk = await feishuToken()
      if (tk && (env.FEISHU_DOC_TOKEN || env.FEISHU_WIKI_TOKEN)) {
        const docId = await resolveDocId(tk)
        if (docId && (await hasTodayBlock(docId, tk))) {
          // 先留痕再返回：否则晚间 cron 触发但被跳过时，run-log 里完全看不到它跑过
          await appendRunLog('fc-daily-brief:skipped')
          return { ok: true, skipped: '今日已推送（文档中已有当天日报块）' }
        }
      }
    } catch (e) {
      out.precheck = { ok: false, err: e.message }
    }
  }

  // 数据采集（并发）
  const [inquiries, ads, gsc, deep, site, deploy, outputs] = await Promise.all([
    fetchInquiries(),
    latestReport('ads-reports', bjDate(1)),
    latestReport('gsc-reports', bjDate(1)),
    latestReport('gsc-deep-analysis', bjDate(1)),
    checkSite(),
    fetchDeploy(),
    checkReportOutputs(),
  ])

  const bills = []
  for (const d of [bjDate(), bjDate(1)]) bills.push({ date: d, data: await aliyunDailyBill(d) })
  const ds = await deepseekSpend()

  const meta = buildSections({ inquiries, bills, ds, ads, gsc, deep, site, deploy, outputs })
  const md = renderMarkdown(meta)
  const blocks = renderBlocks(meta)

  // 预检模式：只生成不推送，便于本地核对内容
  if (env.DRY_RUN === '1') {
    return { ok: true, dryRun: true, sections: meta.sections.length, blocks: blocks.length, markdown: md }
  }

  const bill0 = bills[0].data
  const subject = `Partdro 日报 ${bjDate()}｜阿里云 ${bill0.ok ? '¥' + bill0.total.toFixed(2) : '?'}｜询盘 ${inquiries.rows.length} 条${site.results.some((r) => r.http !== 200) ? '｜⚠站点异常' : ''}`

  const html = `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.75;color:#222">
<pre style="white-space:pre-wrap;font-family:inherit;font-size:14px;margin:0">${md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')}</pre></div>`

  const [email, feishu] = await Promise.all([sendMail(subject, html), sendFeishu(md)])
  out.email = email
  out.feishu = feishu

  try {
    const tk = await feishuToken()
    out.doc = tk ? await appendToDoc(blocks, tk) : { ok: false, err: 'tenant_access_token 获取失败' }
  } catch (e) {
    out.doc = { ok: false, err: e.message }
  }

  // 运行痕迹：外部核验「定时任务是否真的跑了」
  out.runLog = await appendRunLog('fc-daily-brief')

  out.summary = {
    date: bjDate(),
    headline: meta.headline,
    sections: meta.sections.length,
    blocks: blocks.length,
    inquiries: inquiries.rows.length,
    aliyunToday: bill0.ok ? bill0.total : null,
    deepseekBalance: ds.ok ? ds.balance : null,
    siteBad: site.results.filter((r) => r.http !== 200).length,
    quote: site.quote,
    deploy: deploy.ok ? deploy.conclusion : null,
  }
  return out
}
