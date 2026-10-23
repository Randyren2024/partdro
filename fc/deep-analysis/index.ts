// GSC 深度分析（Claude Code 云沙箱架构）：
// Timer 每天 09:30(北京) → 本函数 → E2B 创建 Claude Code 沙箱(模板 claude-code-gsc，百炼 qwen3.7-max 中转)
//   → 沙箱内 python3 直连 GSC 拉取近 30 天多维度数据 → 连同今日日报喂给 claude
//   → claude 产出中文深度分析 Markdown → 取回 → OSS 私有存储 + DM 邮件推送 → 销毁沙箱
// 与 gsc-daily-report 完全独立，互不影响。凭据全部经环境变量注入，不落代码仓库。
import { Sandbox } from 'e2b'
import * as crypto from 'node:crypto'
import { sendFeishuReport } from '../shared/feishu'

const SITE_URL = process.env.GSC_SITE_URL || 'sc-domain:droneworld.tech'
const TARGET_URL =
  process.env.GSC_TARGET_URL || 'https://www.droneworld.tech/products/fp800-agricultural-drone'
const TEMPLATE = process.env.E2B_TEMPLATE || 'claude-code-gsc'
const MODEL = process.env.ANTHROPIC_MODEL || 'deepseek-v4.1-flash'

/**
 * 服务账号 JWT 断言（RS256，纯 node:crypto）。未配置 GSC_SA_JSON 时返回空串 → 回退 refresh_token。
 * 好处：不过期、不受 refresh token 数量上限影响、无需用户再次 consent。
 */
function buildSaAssertion(scope: string): string {
  const raw = process.env.GSC_SA_JSON
  if (!raw) return ''
  const sa = JSON.parse(raw) as { client_email: string; private_key: string }
  const now = Math.floor(Date.now() / 1000)
  const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url')
  const head = b64({ alg: 'RS256', typ: 'JWT' })
  const claims = b64({
    iss: sa.client_email,
    scope,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  })
  const sig = crypto.createSign('RSA-SHA256').update(`${head}.${claims}`).sign(sa.private_key, 'base64url')
  return `${head}.${claims}.${sig}`
}

// ---------- 沙箱内执行的 GSC 数据抓取脚本（仅标准库，凭据在写入时插值） ----------
function buildGscFetchScript(cred: {
  clientId: string
  clientSecret: string
  refreshToken: string
  home: string
  assertion?: string
}): string {
  return `# -*- coding: utf-8 -*-
# GSC 近 30 天多维度数据抓取（沙箱内执行，香港可直连 Google API）。仅用标准库。
import json, urllib.request, urllib.parse, urllib.error
from datetime import date, timedelta

CLIENT_ID = ${JSON.stringify(cred.clientId)}
CLIENT_SECRET = ${JSON.stringify(cred.clientSecret)}
REFRESH_TOKEN = ${JSON.stringify(cred.refreshToken || '')}
ASSERTION = ${JSON.stringify(cred.assertion || '')}
SITE_URL = ${JSON.stringify(SITE_URL)}
TARGET_URL = ${JSON.stringify(TARGET_URL)}
OUT = ${JSON.stringify(cred.home + '/gsc_data.json')}

def http(url, payload=None, headers=None):
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(
        url, data=data,
        headers=dict({"Content-Type": "application/json"}, **(headers or {})),
        method="POST" if data is not None else "GET")
    # 关键：把 HTTP 错误码与响应体打出来。原实现直接让 urlopen 抛裸异常，
    # 上层只能拿到一行 traceback，无法区分「OAuth 失效」还是「沙箱出不了网」。
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        raise SystemExit("FATAL http " + str(e.code) + " " + url + " body=" + e.read().decode(errors="replace")[:400])
    except Exception as e:
        raise SystemExit("FATAL net " + url + " " + repr(e))

# 换 access_token：优先服务账号 JWT 断言（无过期问题），否则回退 refresh_token
if ASSERTION:
    tok = http("https://oauth2.googleapis.com/token", {
        "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer",
        "assertion": ASSERTION})
else:
    tok = http("https://oauth2.googleapis.com/token", {
        "client_id": CLIENT_ID, "client_secret": CLIENT_SECRET,
        "refresh_token": REFRESH_TOKEN, "grant_type": "refresh_token"})
AT = tok.get("access_token")
if not AT:
    raise SystemExit("FATAL token exchange failed: " + json.dumps(tok)[:300])
H = {"Authorization": "Bearer " + AT}

site_enc = urllib.parse.quote(SITE_URL, safe="")
# GSC 数据延迟约 2 天：近 30 天窗口
end = date.today() - timedelta(days=2)
start = end - timedelta(days=29)

def analytics(dimensions, limit):
    body = {"startDate": start.isoformat(), "endDate": end.isoformat(), "dataState": "final"}
    if dimensions:
        body["dimensions"] = dimensions
    if limit:
        body["rowLimit"] = limit
    return http("https://searchconsole.googleapis.com/webmasters/v3/sites/"
                + site_enc + "/searchAnalytics/query", body, headers=H)

def rows(dimensions, limit):
    return analytics(dimensions, limit).get("rows") or []

out = {
    "site": SITE_URL,
    "target_url": TARGET_URL,
    "window": {"start": start.isoformat(), "end": end.isoformat(), "days": 30},
    "totals": (analytics(None, None).get("rows") or [{}])[0],
    "by_date": rows(["date"], 40),
    "by_query": rows(["query"], 60),
    "by_page": rows(["page"], 40),
    "by_country": rows(["country"], 15),
    "by_device": rows(["device"], 5),
}
with open(OUT, "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, indent=1)
print("DATA_READY " + str(len(json.dumps(out))))
`
}

// ---------- 沙箱内执行的 python 脚本（读日报 + 数据，产深度分析） ----------
function buildAnalysisPrompt(day: string, home: string): string {
  return [
    `你是资深 SEO 数据分析师。工作目录 ${home}。`,
    '可用文件：',
    `- ${home}/gsc_data.json：Google Search Console 近 30 天数据（totals、by_date 日趋势、by_query、by_page、by_country、by_device）`,
    `- ${home}/daily_report.md：今日日报（可能为空，若为空请忽略）`,
    '',
    `任务：产出一份中文深度分析报告（Markdown），写入 ${home}/deep_analysis.md，日期用 ${day}。`,
    '报告必须包含以下章节：',
    '1) `# GSC 深度分析报告（' + day + '）`',
    '2) `## 一、整体趋势`：近 30 天点击/展示/CTR/排名的走势与拐点，指出明显上升或下降的日期并分析可能原因',
    '3) `## 二、机会词挖掘`：从 by_query 中找出「高展示低 CTR」或「平均排名 4~20 有上升空间」的词，用 Markdown 表格列出（查询词/展示/点击/CTR/平均排名/建议动作）',
    '4) `## 三、页面诊断`：从 by_page 中找出表现最好与最差的页面，分析原因',
    '5) `## 四、地域与设备`：by_country / by_device 中值得关注的信号',
    '6) `## 五、行动清单`：3~6 条具体可执行建议，每条注明针对的页面或关键词',
    '',
    '要求：只写报告文件本身，不要寒暄、不要解释你的过程。全部数据必须来自上述文件，禁止编造数字。',
    '写完文件后，在标准输出仅回复一行：DONE',
  ].join('\n')
}

// ---------- 阿里云邮件推送 DM（RPC HMAC-SHA1 手写签名，零依赖，与 gsc-daily-report 同款） ----------
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

// 轻量 Markdown→HTML（h1/h2/h3、表格、列表、段落）
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
      out.push(`<h2 style="font-size:16px;margin:20px 0 8px;color:#1a1a1a;border-left:4px solid #7c3aed;padding-left:8px;">${escapeHtml(line.slice(3))}</h2>`)
      i++
    } else if (line.startsWith('### ')) {
      out.push(`<h3 style="font-size:14px;margin:14px 0 6px;color:#333;">${escapeHtml(line.slice(4))}</h3>`)
      i++
    } else if (line.includes('|') && isTableSep(lines[i + 1] || '')) {
      const header = line.split('|').slice(1, -1).map((c) => c.trim())
      const rowsOut: string[][] = []
      i += 2
      while (i < lines.length && lines[i].includes('|') && lines[i].trim().startsWith('|')) {
        rowsOut.push(lines[i].split('|').slice(1, -1).map((c) => c.trim()))
        i++
      }
      const th = (c: string) => `<th style="padding:6px 10px;text-align:left;background:#f3f0ff;border-bottom:2px solid #7c3aed;">${escapeHtml(c)}</th>`
      const td = (c: string) => `<td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;">${escapeHtml(c)}</td>`
      out.push(
        '<table style="border-collapse:collapse;font-size:13px;margin:8px 0 12px;">',
        `<tr>${header.map(th).join('')}</tr>`,
        ...rowsOut.map((r) => `<tr>${r.map(td).join('')}</tr>`),
        '</table>',
      )
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      out.push(`<p style="margin:4px 0;padding-left:16px;">• ${escapeHtml(line.slice(2))}</p>`)
      i++
    } else if (/^\s*\d+\.\s/.test(line)) {
      out.push(`<p style="margin:4px 0;padding-left:16px;">${escapeHtml(line.trim())}</p>`)
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
    console.log('[deep-analysis] DIRECTMAIL_* 未配置，跳过邮件推送')
    return
  }
  const params: Record<string, string> = {
    AccessKeyId: accessKeyId,
    Action: 'SingleSendMail',
    Format: 'JSON',
    RegionId: process.env.DIRECTMAIL_REGION || 'cn-hangzhou',
    SignatureMethod: 'HMAC-SHA1',
    SignatureNonce: crypto.randomUUID(),
    SignatureVersion: '1.0', // DM 只接受 1.0
    Timestamp: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
    Version: '2015-11-23',
    AccountName: account,
    AddressType: '1',
    ReplyToAddress: 'false',
    ToAddress: to,
    FromAlias: 'Partdro GSC',
    Subject: `[Partdro] GSC 深度分析 ${day}`,
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
  console.log('[deep-analysis] 深度分析邮件已发送至:', to, 'EnvId:', String(parsed.EnvId ?? ''))
}

// ---------- OSS 私有读写（V1 签名） ----------
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

/** 读 OSS 文本对象；不存在/失败返回 null（日报缺失不致命） */
async function ossGetText(key: string): Promise<string | null> {
  const url = ossSignedGetUrl(key)
  if (!url) return null
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    return await res.text()
  } catch {
    return null
  }
}

async function readSandboxFile(sbx: Sandbox, path: string): Promise<string> {
  const f = await sbx.files.read(path)
  return typeof f === 'string' ? f : Buffer.from(f as unknown as ArrayBuffer).toString('utf8')
}

// 本地测试用导出
export const __test = { buildGscFetchScript, buildAnalysisPrompt, mdToHtml, sendDmReport }

// ---------- FC 入口 ----------
export const handler = async () => {
  const required = [
    'E2B_API_KEY', 'E2B_API_URL', 'E2B_DOMAIN', 'ANTHROPIC_AUTH_TOKEN',
    'OSS_BUCKET', 'OSS_AK_ID', 'OSS_AK_SECRET',
  ]
  for (const k of required) {
    if (!process.env[k]) throw new Error(`missing env: ${k}`)
  }
  // 鉴权二选一：服务账号（首选）或 OAuth refresh token（回退）
  if (!process.env.GSC_SA_JSON && !process.env.GSC_REFRESH_TOKEN) {
    throw new Error('missing env: 需要 GSC_SA_JSON 或 GSC_REFRESH_TOKEN 其一')
  }
  if (!process.env.GSC_SA_JSON) {
    for (const k of ['GSC_CLIENT_ID', 'GSC_CLIENT_SECRET']) {
      if (!process.env[k]) throw new Error(`missing env: ${k}`)
    }
  }

  const day = new Date().toISOString().slice(0, 10)

  // 步骤日志（进函数日志，便于排查）
  const beat = async (m: string) => { console.log('[deep-analysis] ' + m) }

  let sbx: Sandbox | null = null
  let md = ''
  let stage = 'init'
  try {
    await beat('handler start')
    // 1) 读今日日报（gsc-daily-report 09:00 产出），作为分析输入之一
    const dailyKey = `gsc-reports/${day}.md`
    const dailyMd = (await ossGetText(dailyKey)) || ''
    await beat(`daily ${dailyKey}: ${dailyMd ? dailyMd.length + ' chars' : '(缺失)'}`)

    // 2) 创建 Claude Code 沙箱（注入百炼中转）
    // 沙箱自身寿命 600s：即使 kill 失败或函数被平台强杀，服务端也会在 10 分钟内回收
    await beat('creating sandbox: ' + TEMPLATE)
    stage = 'create'
    sbx = await Sandbox.create(TEMPLATE, {
      apiKey: process.env.E2B_API_KEY!,
      apiUrl: process.env.E2B_API_URL!,
      domain: process.env.E2B_DOMAIN!,
      timeoutMs: 600_000,
      envs: {
        ANTHROPIC_AUTH_TOKEN: process.env.ANTHROPIC_AUTH_TOKEN!,
        ANTHROPIC_BASE_URL: process.env.ANTHROPIC_BASE_URL || 'https://dashscope.aliyuncs.com/apps/anthropic',
        ANTHROPIC_MODEL: MODEL,
        ANTHROPIC_DEFAULT_HAIKU_MODEL: MODEL,
        ANTHROPIC_DEFAULT_SONNET_MODEL: MODEL,
        ANTHROPIC_DEFAULT_OPUS_MODEL: MODEL,
      },
    })
    await beat('sandbox created: ' + sbx.sandboxId)
    stage = 'probe'

    // 3) 沙箱环境探测 + 统一命令封装：
    //    模板换代后不能再假设 home 是 /home/user、cli 在固定路径；
    //    任何命令失败都必须把 exitCode / stderr 带进错误消息，否则 FC 只回一个空的 CommandExitError（本次排查踩过）。
    const run = async (cmd: string, timeoutMs = 120_000) => {
      try {
        return await sbx!.commands.run(cmd, { timeoutMs })
      } catch (e) {
        const err = e as { exitCode?: number; stdout?: string; stderr?: string; message?: string }
        throw new Error(
          `sandbox cmd failed [${cmd.slice(0, 80)}] | exit=${err.exitCode} | stderr=${String(err.stderr || '').slice(0, 400)} | stdout=${String(err.stdout || '').slice(0, 200)} | msg=${String(err.message || '').slice(0, 150)}`,
        )
      }
    }
    const probe = await run(
      'echo "HOME=$HOME"; command -v claude || echo "claude=missing"; command -v python3 || echo "python3=missing"; python3 -V 2>&1 || true',
      30_000,
    )
    const probeOut = (probe.stdout || '').trim()
    const probeLine = probeOut.replace(/\n/g, ' | ')
    await beat('probe: ' + probeLine)
    const home = ((probeOut.match(/HOME=(\/[^\s]*)/) || [])[1] || '').replace(/\/+$/, '')
    if (!home) throw new Error('无法解析 HOME（沙箱默认 shell 可能不是 sh/bash）| probe: ' + probeLine)
    if (/claude=missing/.test(probeOut)) throw new Error('模板内缺少 claude CLI | probe: ' + probeLine)
    if (/python3=missing/.test(probeOut)) throw new Error('模板内缺少 python3 | probe: ' + probeLine)
    await beat('home resolved: ' + home)

    // 4) 初始化 claude 配置
    stage = 'init-config'
    await run(`cd ${home} && echo '{}' > .claude.json`)

    // 5) 沙箱内拉取 GSC 近 30 天数据
    const fetchScript = buildGscFetchScript({
      clientId: process.env.GSC_CLIENT_ID!,
      clientSecret: process.env.GSC_CLIENT_SECRET!,
      refreshToken: process.env.GSC_REFRESH_TOKEN!,
      home,
      assertion: buildSaAssertion('https://www.googleapis.com/auth/webmasters.readonly'),
    })
    await sbx.files.write(`${home}/fetch_gsc.py`, fetchScript)
    stage = 'fetch'
    const fr = await run(`cd ${home} && python3 fetch_gsc.py`, 180_000)
    if (fr.exitCode !== 0) {
      throw new Error(`GSC fetch failed (exit ${fr.exitCode}): ${(fr.stderr || fr.stdout || '').slice(-800)}`)
    }
    const gscJson = await readSandboxFile(sbx, `${home}/gsc_data.json`)
    if (!gscJson || gscJson.length < 50) throw new Error('GSC 数据为空')
    await beat('gsc data: ' + gscJson.length + ' bytes')

    // 6) 写入日报，供 claude 参考
    await sbx.files.write(`${home}/daily_report.md`, dailyMd || '(今日日报缺失)')

    // 7) claude 产出深度分析
    // 720s → 480s：FC 函数超时 900s，抓取 180s + 分析 480s = 660s，留 240s 给收尾
    // 原 720s 加起来正好 900s，函数被平台强杀时 finally 的 kill 不会执行 → 沙箱泄漏（实测跑 9.6~12.5 小时）
    const prompt = buildAnalysisPrompt(day, home)
    stage = 'claude'
    const claudeCmd = `cd ${home} && claude --dangerously-skip-permissions < /dev/null -p ${JSON.stringify(prompt)}`
    const cr = await run(claudeCmd, 480_000)
    await beat('claude exit: ' + cr.exitCode + (cr.stderr ? ' | stderr: ' + cr.stderr.slice(-300) : ''))
    md = await readSandboxFile(sbx, `${home}/deep_analysis.md`)
    if (!md || md.trim().length < 100) {
      md = (cr.stdout || '').trim()
      if (md.length < 100) {
        throw new Error(`深度分析产出为空（exit ${cr.exitCode}）stderr: ${(cr.stderr || '').slice(-600)}`)
      }
    }
    await beat('report: ' + md.length + ' chars')

    // 分析已完成，立刻销毁沙箱 —— 不等 finally。
    // 原因：函数若在 900s 被 FC 强杀，finally 根本不执行，沙箱会一直计费。
    await beat('killing sandbox early: ' + sbx.sandboxId)
    await sbx.kill().catch((e) => beat('early kill failed: ' + String((e as Error).message).slice(0, 120)))
  } catch (e) {
    // 一律把 stage + 原始错误细节写进 message 再抛出：
    // 该函数未接 SLS，FC 只回 errorMessage/errorType，空 message 的 CommandExitError 无法定位（本次故障即为此）。
    const err = e as { name?: string; message?: string; exitCode?: number; stdout?: string; stderr?: string; stack?: string }
    const detail =
      `stage=${stage} | type=${err?.name || 'Error'} | exit=${err?.exitCode ?? '-'} | ` +
      `stderr=${String(err?.stderr || '').slice(0, 500)} | stdout=${String(err?.stdout || '').slice(0, 300)} | ` +
      `msg=${String(err?.message || '').slice(0, 300)} | at=${String(err?.stack || '').split('\n')[1] || ''}`
    await beat('ERROR ' + detail)
    throw new Error(detail)
  } finally {
    if (sbx) await sbx.kill().catch(() => {})
  }

  // 7) OSS 存档
  const key = `gsc-deep-analysis/${day}.md`
  await ossPutObject(key, md)
  const viewUrl = ossSignedGetUrl(key)

  console.log('===== GSC DEEP ANALYSIS (' + key + ') =====')
  console.log(md)
  console.log('===== END DEEP ANALYSIS =====')
  console.log('[deep-analysis] 报告已存 OSS，7 天有效下载链接:', viewUrl)

  // 8) 邮件推送
  let email: { ok: boolean; error?: string } = { ok: false }
  try {
    await sendDmReport(md, day)
    email = { ok: true }
  } catch (e) {
    email = { ok: false, error: (e as Error).message }
    console.error('[deep-analysis] 邮件推送失败（OSS 存档不受影响）:', (e as Error).message)
  }
  // 飞书推送（与邮件并行、互不影响；未配置 FEISHU_* 时静默跳过）
  let feishu: { ok: boolean; error?: string } = { ok: false }
  try {
    feishu = {
      ok: await sendFeishuReport({
        title: `[Partdro] GSC 深度分析 ${day}`,
        md,
        template: 'orange',
        footer: 'GSC 深度分析 · 与邮件同源',
      }),
    }
  } catch (e) {
    feishu = { ok: false, error: (e as Error).message }
    console.error('[deep-analysis] 飞书推送失败（邮件与 OSS 不受影响）:', (e as Error).message)
  }
  await beat('done, email=' + JSON.stringify(email) + ', feishu=' + JSON.stringify(feishu))

  return { statusCode: 200, body: JSON.stringify({ ok: true, ossKey: key, email, feishu }) }
}
