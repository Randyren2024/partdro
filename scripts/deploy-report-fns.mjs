#!/usr/bin/env node
// 部署三个日报函数（GSC 日报 / Ads 日报 / GSC 深度分析）到阿里云 FC。
//
// 为什么单独一个脚本：这三个函数不在 CI 的静态站点流程里，且它们的凭据（GSC/Ads/E2B）
// 已经存在于函数环境变量中。这里只做「重新打包 + 上传代码 + 合并飞书凭据」，
// 绝不覆盖已有凭据——避免因为 CI 缺少某个 secret 而把线上凭据清空。
//
// 环境变量（CI 里来自 GitHub Secrets）：
//   OSS_AK_ID / OSS_AK_SECRET     阿里云 AK（也用于 FC API 签名）
//   ALIYUN_OSS_BUCKET             代码包存放桶
//   ALIYUN_OSS_REGION             默认 cn-hongkong
//   FC_API_HOST                   默认 fcv3.cn-hongkong.aliyuncs.com
import { execFileSync } from 'node:child_process'
import { createHash, createHmac, randomUUID } from 'node:crypto'
import { mkdirSync, rmSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { build } from 'esbuild'

const REGION = process.env.ALIYUN_OSS_REGION || 'cn-hongkong'
const BUCKET = process.env.ALIYUN_OSS_BUCKET
const AK = process.env.OSS_AK_ID
const SK = process.env.OSS_AK_SECRET
if (!BUCKET || !AK || !SK) {
  throw new Error('缺少 ALIYUN_OSS_BUCKET / OSS_AK_ID / OSS_AK_SECRET')
}

const FC_HOST = process.env.FC_API_HOST || `fcv3.${REGION}.aliyuncs.com`

const TARGETS = [
  { dir: 'fc/daily-report', fn: 'gsc-daily-report' },
  { dir: 'fc/ads-daily-report', fn: 'ads-daily-report' },
  { dir: 'fc/deep-analysis', fn: 'gsc-deep-analysis' },
]

const sha256hex = (s) => createHash('sha256').update(s, 'utf8').digest('hex')
const hmacHex = (k, s) => createHmac('sha256', k).update(s, 'utf8').digest('hex')

/** 阿里云 FC 3.0 OpenAPI（ACS3-HMAC-SHA256 签名） */
async function fcRequest(method, path, body = '') {
  const date = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
  const nonce = randomUUID()
  const contentSha = sha256hex(body)
  const headers = {
    host: FC_HOST,
    'x-acs-date': date,
    'x-acs-content-sha256': contentSha,
    'x-acs-signature-nonce': nonce,
  }
  if (body) headers['content-type'] = 'application/json'

  const signedHeaders = Object.keys(headers).map((h) => h.toLowerCase()).sort()
  const canonicalHeaders = signedHeaders.map((h) => `${h}:${headers[h]}\n`).join('')
  const canonicalRequest = [method, path, '', canonicalHeaders, signedHeaders.join(';'), contentSha].join('\n')
  const signature = hmacHex(SK, 'ACS3-HMAC-SHA256\n' + sha256hex(canonicalRequest))
  const authorization =
    `ACS3-HMAC-SHA256 Credential=${AK},SignedHeaders=${signedHeaders.join(';')},Signature=${signature}`

  const res = await fetch(`https://${FC_HOST}${path}`, {
    method,
    headers: { ...headers, Authorization: authorization },
    body: body || undefined,
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`FC ${method} ${path} -> ${res.status}: ${text.slice(0, 400)}`)
  return text ? JSON.parse(text) : {}
}

/** OSS V1 签名 PUT（代码包） */
async function ossPut(key, filePath) {
  const { readFileSync } = await import('node:fs')
  const contentType = 'application/zip'
  const date = new Date().toUTCString()
  const stringToSign = ['PUT', '', contentType, date, `/${BUCKET}/${key}`].join('\n')
  const signature = createHmac('sha1', SK).update(stringToSign, 'utf8').digest('base64')
  const res = await fetch(`https://${BUCKET}.oss-${REGION}.aliyuncs.com/${key}`, {
    method: 'PUT',
    headers: { Date: date, 'Content-Type': contentType, Authorization: `OSS ${AK}:${signature}` },
    body: readFileSync(filePath),
  })
  if (!res.ok) throw new Error(`OSS PUT ${key} -> ${res.status}: ${(await res.text()).slice(0, 300)}`)
}

// 飞书凭据统一从 partdro-api 继承，避免每个函数各配一份
const apiFn = await fcRequest('GET', '/2023-03-30/functions/partdro-api')
const apiEnv = apiFn.environmentVariables || {}
const feishu = {
  FEISHU_APP_ID: apiEnv.FEISHU_APP_ID || '',
  FEISHU_APP_SECRET: apiEnv.FEISHU_APP_SECRET || '',
  FEISHU_OPEN_ID: apiEnv.FEISHU_OPEN_ID || '',
}
if (!feishu.FEISHU_APP_ID) console.warn('[report-fn] partdro-api 没有 FEISHU_APP_ID，日报将只发邮件')

for (const { dir, fn } of TARGETS) {
  const outDir = join(dir, 'dist')
  mkdirSync(outDir, { recursive: true })
  const jsPath = join(outDir, 'index.js')

  await build({
    entryPoints: [join(dir, 'index.ts')],
    bundle: true,
    platform: 'node',
    target: 'node20',
    format: 'cjs',
    minify: true,
    outfile: jsPath,
    logLevel: 'warning',
  })

  const zipPath = join(outDir, `${fn}.zip`)
  rmSync(zipPath, { force: true })
  execFileSync('zip', ['-q', '-j', zipPath, jsPath])

  const key = `fc/${fn}.zip`
  await ossPut(key, zipPath)

  const cur = await fcRequest('GET', `/2023-03-30/functions/${fn}`)
  const payload = {
    runtime: cur.runtime,
    handler: cur.handler,
    cpu: cur.cpu ?? 0.5,
    memorySize: cur.memorySize,
    timeout: cur.timeout,
    diskSize: cur.diskSize,
    description: cur.description,
    code: { ossBucketName: BUCKET, ossObjectName: key },
    // 只合并飞书凭据，其余环境变量（GSC/Ads/E2B/DirectMail）原样保留
    environmentVariables: { ...(cur.environmentVariables || {}), ...feishu },
  }
  await fcRequest('PUT', `/2023-03-30/functions/${fn}`, JSON.stringify(payload))

  const size = (statSync(zipPath).size / 1024).toFixed(0)
  console.log(`[report-fn] ${fn.padEnd(20)} deployed  ${size} KB  feishu=${feishu.FEISHU_APP_ID ? 'on' : 'off'}`)
}
console.log('[report-fn] 全部完成')
