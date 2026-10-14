// GSC 日报（云沙箱架构）：
// Timer 每天 09:00(北京) → 本函数 → E2B 兼容 API 创建阿里云云沙箱(code-interpreter-v1)
//   → 写入 python 脚本(标准库直连 Google Search Console API) → 执行 → 取回 Markdown
//   → OSS PutObject(私有) + 函数日志全文输出 → 销毁沙箱
// 凭据全部经环境变量注入，不落代码仓库。
import { Sandbox } from 'e2b'
import * as crypto from 'node:crypto'

const SITE_URL = process.env.GSC_SITE_URL || 'sc-domain:droneworld.tech'
const TARGET_URL =
  process.env.GSC_TARGET_URL || 'https://www.droneworld.tech/products/fp800-agricultural-drone'

// ---------- 沙箱内执行的 Python 脚本（仅标准库，凭据在写入时插值） ----------
function buildReportScript(cred: {
  clientId: string
  clientSecret: string
  refreshToken: string
}): string {
  return `# -*- coding: utf-8 -*-
# GSC 日报脚本：在云沙箱内执行（香港沙箱可直连 Google API）。仅用标准库。
import json, urllib.request, urllib.parse, os
from datetime import date, timedelta

CLIENT_ID = ${JSON.stringify(cred.clientId)}
CLIENT_SECRET = ${JSON.stringify(cred.clientSecret)}
REFRESH_TOKEN = ${JSON.stringify(cred.refreshToken)}
SITE_URL = ${JSON.stringify(SITE_URL)}
TARGET_URL = ${JSON.stringify(TARGET_URL)}
OUT = "/home/user/report.md" if os.path.isdir("/home/user") else os.path.join(os.getcwd(), "report.md")

def http(url, payload=None, headers=None):
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(
        url, data=data,
        headers=dict({"Content-Type": "application/json"}, **(headers or {})),
        method="POST" if data is not None else "GET")
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode())

# 1) refresh_token -> access_token
tok = http("https://oauth2.googleapis.com/token", {
    "client_id": CLIENT_ID, "client_secret": CLIENT_SECRET,
    "refresh_token": REFRESH_TOKEN, "grant_type": "refresh_token"})
AT = tok.get("access_token")
if not AT:
    raise SystemExit("FATAL token exchange failed: " + json.dumps(tok)[:300])
H = {"Authorization": "Bearer " + AT}

site_enc = urllib.parse.quote(SITE_URL, safe="")
# GSC 数据延迟约 2 天，日报窗口=往前数的最近 7 个自然日
end = date.today() - timedelta(days=2)
start = end - timedelta(days=6)

def analytics(dimensions, limit):
    body = {"startDate": start.isoformat(), "endDate": end.isoformat(), "dataState": "final"}
    if dimensions:
        body["dimensions"] = dimensions
    if limit:
        body["rowLimit"] = limit
    return http("https://searchconsole.googleapis.com/webmasters/v3/sites/"
                + site_enc + "/searchAnalytics/query", body, headers=H)

# 2) 总览（dimensions 省略时返回聚合行）
totals = (analytics(None, None).get("rows") or [{}])[0]
top_q = analytics(["query"], 10).get("rows") or []
top_p = analytics(["page"], 10).get("rows") or []

# 3) 重点页面收录状态
insp = http("https://searchconsole.googleapis.com/v1/urlInspection/index:inspect",
            {"inspectionUrl": TARGET_URL, "siteUrl": SITE_URL}, headers=H)
ix = (insp.get("inspectionResult") or {}).get("indexStatusResult") or {}

# 4) 组装 Markdown
def fmt_pos(v):
    try:
        return "{:.1f}".format(float(v))
    except Exception:
        return "-"

L = []
L.append("# GSC 每日日报（" + start.isoformat() + " ~ " + end.isoformat() + "）")
L.append("")
L.append("## 一、整体表现（近 7 天）")
L.append("")
L.append("| 指标 | 数值 |")
L.append("|---|---|")
L.append("| 总点击 | " + str(totals.get("clicks", 0)) + " |")
L.append("| 总展示 | " + str(totals.get("impressions", 0)) + " |")
L.append("| CTR | " + "{:.2%}".format(totals.get("ctr") or 0) + " |")
L.append("| 平均排名 | " + fmt_pos(totals.get("position")) + " |")
L.append("")
L.append("## 二、Top 10 查询")
L.append("")
L.append("| 查询词 | 点击 | 展示 | CTR | 平均排名 |")
L.append("|---|---|---|---|---|")
for r in top_q:
    L.append("| " + str((r.get("keys") or ["-"])[0]) + " | " + str(r.get("clicks", 0))
             + " | " + str(r.get("impressions", 0)) + " | " + "{:.2%}".format(r.get("ctr") or 0)
             + " | " + fmt_pos(r.get("position")) + " |")
if not top_q:
    L.append("| （无数据） | - | - | - | - |")
L.append("")
L.append("## 三、Top 10 页面")
L.append("")
L.append("| 页面 | 点击 | 展示 | CTR | 平均排名 |")
L.append("|---|---|---|---|---|")
for r in top_p:
    L.append("| " + str((r.get("keys") or ["-"])[0]) + " | " + str(r.get("clicks", 0))
             + " | " + str(r.get("impressions", 0)) + " | " + "{:.2%}".format(r.get("ctr") or 0)
             + " | " + fmt_pos(r.get("position")) + " |")
if not top_p:
    L.append("| （无数据） | - | - | - | - |")
L.append("")
L.append("## 四、重点页面收录状态")
L.append("")
L.append("- 页面: " + TARGET_URL)
L.append("- verdict: " + str(ix.get("verdict", "-")))
L.append("- coverageState: " + str(ix.get("coverageState", "-")))
L.append("- lastCrawlTime: " + str(ix.get("lastCrawlTime", "-")))
L.append("- googleCanonical: " + str(ix.get("googleCanonical", "-")))
L.append("")

# 5) 一句话结论建议
tips = []
cov = str(ix.get("coverageState", ""))
if cov and "Submitted and indexed" not in cov:
    tips.append("FP800 页面未正常收录（" + cov + "），建议检查 sitemap 并重新提交收录")
opp = [r for r in top_q if (r.get("impressions") or 0) >= 20
       and 4 <= (r.get("position") or 99) <= 20 and (r.get("ctr") or 0) < 0.03]
if opp:
    tips.append("查询 \\"" + str(opp[0].get("keys")[0]) + "\\" 排名 4-20 但 CTR<3%，建议优化标题/描述/内链")
if not tips:
    tips.append("整体表现平稳，无需紧急操作")
L.append("## 五、建议")
L.append("")
for t in tips:
    L.append("- " + t)
L.append("")

md = "\\n".join(L)
with open(OUT, "w", encoding="utf-8") as f:
    f.write(md)
print("REPORT_READY " + str(len(md)) + " chars")
`
}

// ---------- 阿里云邮件推送 DM（RPC HMAC-SHA1 手写签名，零依赖，与 partdro-api inquiry-webhook 同款） ----------
// 环境变量（与 partdro-api 共用专用 RAM 用户 partdro-directmail）：
//   DIRECTMAIL_ACCESS_KEY_ID / DIRECTMAIL_ACCESS_KEY_SECRET / DIRECTMAIL_ACCOUNT
//   DM_TO 收件人（默认 info@droneworld.tech）
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
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// 轻量 Markdown→HTML（只覆盖日报用到的：h1/h2、表格、列表、段落）
function mdToHtml(md: string): string {
  const lines = md.split('\n')
  const out: string[] = []
  let i = 0
  const isTableSep = (l: string) => /^\s*\|?[\s:|-]+\|?\s*$/.test(l)
  while (i < lines.length) {
    const line = lines[i]
    if (line.startsWith('# ')) {
      out.push(`<h1 style="font-size:20px;margin:0 0 12px;color:#1a1a1a;">${escapeHtml(line.slice(2))}</h1>`)
      i++
    } else if (line.startsWith('## ')) {
      out.push(`<h2 style="font-size:16px;margin:20px 0 8px;color:#1a1a1a;border-left:4px solid #4285f4;padding-left:8px;">${escapeHtml(line.slice(3))}</h2>`)
      i++
    } else if (line.includes('|') && isTableSep(lines[i + 1] || '')) {
      const header = line.split('|').slice(1, -1).map((c) => c.trim())
      const rows: string[][] = []
      i += 2
      while (i < lines.length && lines[i].includes('|') && lines[i].trim().startsWith('|')) {
        rows.push(lines[i].split('|').slice(1, -1).map((c) => c.trim()))
        i++
      }
      const th = (c: string) => `<th style="padding:6px 10px;text-align:left;background:#f1f5ff;border-bottom:2px solid #4285f4;">${escapeHtml(c)}</th>`
      const td = (c: string) => `<td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;">${escapeHtml(c)}</td>`
      out.push(
        '<table style="border-collapse:collapse;font-size:13px;margin:8px 0 12px;">',
        `<tr>${header.map(th).join('')}</tr>`,
        ...rows.map((r) => `<tr>${r.map(td).join('')}</tr>`),
        '</table>',
      )
    } else if (line.startsWith('- ')) {
      out.push(`<p style="margin:4px 0;padding-left:16px;">• ${escapeHtml(line.slice(2))}</p>`)
      i++
    } else if (line.trim() === '') {
      i++
    } else {
      out.push(`<p style="margin:6px 0;color:#333;">${escapeHtml(line)}</p>`)
      i++
    }
  }
  return `<div style="font-family:-apple-system,'Segoe UI',Arial,sans-serif;color:#1a1a1a;max-width:760px;">${out.join('\n')}</div>`
}

async function sendDmReport(md: string, day: string): Promise<void> {
  const to = (process.env.DM_TO || 'info@droneworld.tech').trim()
  const accessKeyId = process.env.DIRECTMAIL_ACCESS_KEY_ID
  const accessKeySecret = process.env.DIRECTMAIL_ACCESS_KEY_SECRET
  const account = process.env.DIRECTMAIL_ACCOUNT
  if (!accessKeyId || !accessKeySecret || !account) {
    console.log('[daily-report] DIRECTMAIL_* 未配置，跳过邮件推送')
    return
  }
  const params: Record<string, string> = {
    AccessKeyId: accessKeyId,
    Action: 'SingleSendMail',
    Format: 'JSON',
    RegionId: process.env.DIRECTMAIL_REGION || 'cn-hangzhou',
    SignatureMethod: 'HMAC-SHA1',
    SignatureNonce: crypto.randomUUID(),
    SignatureVersion: '1.0', // 关键：DM 只接受 1.0（不是通用 POP 的 1.1）
    Timestamp: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
    Version: '2015-11-23',
    AccountName: account,
    AddressType: '1',
    ReplyToAddress: 'false',
    ToAddress: to,
    FromAlias: 'Partdro GSC',
    Subject: `[Partdro] GSC 搜索日报 ${day}`,
    ClickTrace: '1',
    HtmlBody: mdToHtml(md),
    TextBody: md,
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
  console.log('[daily-report] 日报邮件已发送至:', to, 'EnvId:', String(parsed.EnvId ?? ''))
}

// ---------- OSS 私有写 + 签名读 URL（V1 签名） ----------
function ossPutObject(key: string, body: string): Promise<void> {
  const bucket = process.env.OSS_BUCKET!
  const region = process.env.OSS_REGION || 'cn-hongkong'
  const ak = process.env.OSS_AK_ID!
  const sk = process.env.OSS_AK_SECRET!
  const host = `${bucket}.oss-${region}.aliyuncs.com`
  const date = new Date().toUTCString()
  const ct = 'text/markdown; charset=utf-8'
  const stringToSign = `PUT\n\n${ct}\n${date}\n/${bucket}/${key}`
  const sig = crypto.createHmac('sha1', sk).update(stringToSign).digest('base64')
  return fetch(`https://${host}/${key}`, {
    method: 'PUT',
    headers: { Authorization: `OSS ${ak}:${sig}`, Date: date, 'Content-Type': ct },
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

// 本地测试用导出（deploy/invoke 不受影响）
export const __test = { buildReportScript, mdToHtml, sendDmReport }

// ---------- FC 入口 ----------
export const handler = async () => {
  const required = [
    'E2B_API_KEY', 'E2B_API_URL', 'E2B_DOMAIN',
    'GSC_CLIENT_ID', 'GSC_CLIENT_SECRET', 'GSC_REFRESH_TOKEN',
    'OSS_BUCKET', 'OSS_AK_ID', 'OSS_AK_SECRET',
  ]
  for (const k of required) {
    if (!process.env[k]) throw new Error(`missing env: ${k}`)
  }

  const sbx = await Sandbox.create('code-interpreter-v1', {
    apiKey: process.env.E2B_API_KEY,
    apiUrl: process.env.E2B_API_URL,
    domain: process.env.E2B_DOMAIN,
    timeoutMs: 300_000,
  })
  console.log('[daily-report] sandbox created:', sbx.sandboxId)
  let md = ''
  try {
    const script = buildReportScript({
      clientId: process.env.GSC_CLIENT_ID!,
      clientSecret: process.env.GSC_CLIENT_SECRET!,
      refreshToken: process.env.GSC_REFRESH_TOKEN!,
    })
    await sbx.files.write('/home/user/gsc_report.py', script)
    const run = await sbx.commands.run('python3 /home/user/gsc_report.py')
    if (run.exitCode !== 0) {
      throw new Error(`report script failed (exit ${run.exitCode}): ${(run.stderr || run.stdout || '').slice(-800)}`)
    }
    const f = await sbx.files.read('/home/user/report.md')
    md = typeof f === 'string' ? f : Buffer.from(f as unknown as ArrayBuffer).toString('utf8')
  } finally {
    await sbx.kill().catch(() => {})
  }

  const day = new Date().toISOString().slice(0, 10)
  const key = `gsc-reports/${day}.md`
  await ossPutObject(key, md)
  const viewUrl = ossSignedGetUrl(key)

  console.log('===== GSC DAILY REPORT (' + key + ') =====')
  console.log(md)
  console.log('===== END REPORT =====')
  console.log('[daily-report] 报告已存 OSS，7 天有效下载链接:', viewUrl)

  // 邮件推送（失败不影响 OSS 存档与下次调度；结果写入返回体便于核对）
  let email: { ok: boolean; error?: string } = { ok: false }
  try {
    await sendDmReport(md, day)
    email = { ok: true }
  } catch (e) {
    email = { ok: false, error: (e as Error).message }
    console.error('[daily-report] 邮件推送失败（OSS 存档不受影响）:', (e as Error).message)
  }

  return { statusCode: 200, body: JSON.stringify({ ok: true, ossKey: key, email }) }
}
