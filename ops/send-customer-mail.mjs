#!/usr/bin/env node
// 客户邮件发信器（阿里云 DirectMail）
//
// 为什么要这个脚本：DirectMail 是发信通道，不保存「已发送」副本，也不回写任何邮箱。
// 之前给客户发的信在阿里邮箱里完全看不到，回信也差点丢。这里把归档固化成硬约束：
//   每一封客户邮件都必须 Bcc 到归档邮箱（默认 info@droneworld.tech），Reply-To 也指向它。
//
// 用法：
//   node scripts/send-customer-mail.mjs --to t.kruger@x.co.za \
//        --subject "Re: C-500 inquiry" --html ./mail.html [--text ./mail.txt] [--dry-run]
//
// 凭据：优先读环境变量；缺省时从阿里云 FC 函数 gsc-deep-analysis 的环境变量里取（与日报同一套）。
// 依赖：零外部依赖（node 18+ 内置 fetch）。
import { createHash, createHmac, randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'

const SECRETS = '/workspace/.secrets/partdro.env'
const ARCHIVE = process.env.ARCHIVE_BCC || 'info@droneworld.tech'
const FROM_ALIAS = process.env.DM_FROM_ALIAS || 'Randy Ren - Partdro'
const REPLY_TO = process.env.DM_REPLY_TO || 'info@droneworld.tech'
const DRY = process.argv.includes('--dry-run')

function arg(name, fallback = '') {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback
}

const to = arg('to')
const cc = arg('cc')
const subject = arg('subject')
const htmlFile = arg('html')
const textFile = arg('text')
if (!to || !subject || (!htmlFile && !textFile)) {
  console.error('缺少参数：--to / --subject，以及 --html 或 --text 至少一个')
  process.exit(2)
}
const html = htmlFile ? readFileSync(htmlFile, 'utf8') : ''
const text = textFile ? readFileSync(textFile, 'utf8') : ''

const env = Object.fromEntries(
  readFileSync(SECRETS, 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
)

const sha256hex = (s) => createHash('sha256').update(s, 'utf8').digest('hex')

/** 从 FC 函数读 DirectMail 凭据（ACS3-HMAC-SHA256 签名） */
async function loadDirectMail() {
  if (process.env.DIRECTMAIL_ACCESS_KEY_ID && process.env.DIRECTMAIL_ACCOUNT) {
    return {
      id: process.env.DIRECTMAIL_ACCESS_KEY_ID,
      secret: process.env.DIRECTMAIL_ACCESS_KEY_SECRET,
      account: process.env.DIRECTMAIL_ACCOUNT,
      region: process.env.DIRECTMAIL_REGION || 'cn-hangzhou',
    }
  }
  const r = env.OSS_REGION || 'cn-hongkong'
  const host = `fcv3.${r}.aliyuncs.com`
  const path = '/2023-03-30/functions/gsc-deep-analysis'
  const d = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
  const headers = {
    host,
    'x-acs-date': d,
    'x-acs-content-sha256': sha256hex(''),
    'x-acs-signature-nonce': randomUUID(),
  }
  const sh = Object.keys(headers).map((h) => h.toLowerCase()).sort()
  const ch = sh.map((h) => `${h}:${headers[h]}\n`).join('')
  const cr = ['GET', path, '', ch, sh.join(';'), sha256hex('')].join('\n')
  const sig = createHmac('sha256', env.OSS_AK_SECRET).update('ACS3-HMAC-SHA256\n' + sha256hex(cr)).digest('hex')
  const res = await fetch(`https://${host}${path}`, {
    headers: {
      ...headers,
      Authorization: `ACS3-HMAC-SHA256 Credential=${env.OSS_AK_ID},SignedHeaders=${sh.join(';')},Signature=${sig}`,
    },
  })
  const j = await res.json()
  const e = j.environmentVariables || {}
  if (!e.DIRECTMAIL_ACCESS_KEY_ID) throw new Error('FC 里没有 DIRECTMAIL_* 凭据')
  return {
    id: e.DIRECTMAIL_ACCESS_KEY_ID,
    secret: e.DIRECTMAIL_ACCESS_KEY_SECRET,
    account: e.DIRECTMAIL_ACCOUNT,
    region: e.DIRECTMAIL_REGION || 'cn-hangzhou',
  }
}

const pe = (v) =>
  encodeURIComponent(v)
    .replace(/\+/g, '%20')
    .replace(/\*/g, '%2A')
    .replace(/%7E/g, '~')
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')

const dm = await loadDirectMail()
const params = {
  Action: 'SingleSendMail',
  AccountName: dm.account,
  AddressType: '0',
  FromAlias: FROM_ALIAS,
  ToAddress: to,
  BccAddress: ARCHIVE,
  Subject: subject,
  ReplyToAddress: 'true',
  ReplyTo: REPLY_TO,
  RegionId: dm.region,
  ClickTrace: '1',
}
if (cc) params.CcAddress = cc
if (html) params.HtmlBody = html
if (text) params.TextBody = text

if (DRY) {
  console.log(JSON.stringify({
    dryRun: true,
    from: `${FROM_ALIAS} <${dm.account}>`,
    to,
    cc: cc || null,
    bcc: ARCHIVE,
    replyTo: REPLY_TO,
    subject,
    htmlBytes: Buffer.byteLength(html),
    textBytes: Buffer.byteLength(text),
  }, null, 1))
  process.exit(0)
}

const p = {
  ...params,
  Format: 'JSON',
  SignatureMethod: 'HMAC-SHA1',
  SignatureNonce: randomUUID(),
  SignatureVersion: '1.0',
  Timestamp: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
  AccessKeyId: dm.id,
  Version: '2015-11-23',
}
const canonical = Object.keys(p).sort().map((k) => `${pe(k)}=${pe(p[k])}`).join('&')
const sts = `POST&${pe('/')}&${pe(canonical)}`
p.Signature = createHmac('sha1', `${dm.secret}&`).update(sts).digest('base64')

const res = await fetch('https://dm.aliyuncs.com/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams(p).toString(),
})
const out = await res.json()
console.log(JSON.stringify({
  ok: res.ok && !out.Code,
  httpStatus: res.status,
  envId: out.EnvId || null,
  requestId: out.RequestId || null,
  error: out.Code ? `${out.Code}: ${out.Message}` : null,
  from: `${FROM_ALIAS} <${dm.account}>`,
  to,
  cc: cc || null,
  bcc: ARCHIVE,
  replyTo: REPLY_TO,
  subject,
}, null, 1))
process.exit(res.ok && !out.Code ? 0 : 1)
