// inquiry-analysis 本地端到端验证：esbuild 打包 → 以真实 HTTP 事件调用 handler →
// 真实创建沙箱 + deepseek-v4.1-flash 联网调研 + 飞书/邮件/Supabase/OSS 推送。
// 用法（partdro 仓库根目录）：
//   $env:E2B_API_KEY="<香港key>"; $env:BAILIAN_API_KEY="<百炼 sk-key>"; node fc/inquiry-analysis/test-local.mjs
// 凭据策略：E2B/BAILIAN 从环境变量读；DIRECTMAIL/FEISHU/SUPABASE/密钥 从线上 partdro-api 环境变量取；OSS 用本机 aliyun AK。
import { execFileSync } from 'node:child_process'
import { build } from 'esbuild'
import { mkdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import os from 'node:os'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..', '..')

const E2B_KEY = process.env.E2B_API_KEY || ''
const BAILIAN_KEY = process.env.BAILIAN_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN || ''
if (!E2B_KEY || !BAILIAN_KEY) {
  throw new Error('缺少 E2B_API_KEY 或 BAILIAN_API_KEY（$env:E2B_API_KEY="..."; $env:BAILIAN_API_KEY="..." 再运行）')
}

// 1) 从线上 partdro-api 取运行时凭据
const apiFn = JSON.parse(execFileSync('aliyun', ['fc', 'GET', '/2023-03-30/functions/partdro-api', '--region', 'cn-hongkong'], { encoding: 'utf8' }))
const apiEnv = apiFn.environmentVariables || {}

const aliCfg = JSON.parse(readFileSync(join(os.homedir(), '.aliyun', 'config.json'), 'utf8'))
const prof = aliCfg.profiles.find((p) => p.name === aliCfg.current) || aliCfg.profiles[0]

Object.assign(process.env, {
  E2B_API_KEY: E2B_KEY,
  E2B_API_URL: 'https://api.cn-hongkong.e2b.fc.aliyuncs.com',
  E2B_DOMAIN: 'cn-hongkong.e2b.fc.aliyuncs.com',
  E2B_TEMPLATE: process.env.E2B_TEMPLATE || 'claude-code-gsc',
  ANTHROPIC_AUTH_TOKEN: BAILIAN_KEY,
  ANTHROPIC_BASE_URL: process.env.ANTHROPIC_BASE_URL || 'https://dashscope.aliyuncs.com/apps/anthropic',
  ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL || 'deepseek-v4.1-flash',
  INQUIRY_WEBHOOK_SECRET: apiEnv.INQUIRY_WEBHOOK_SECRET,
  FEISHU_APP_ID: apiEnv.FEISHU_APP_ID,
  FEISHU_APP_SECRET: apiEnv.FEISHU_APP_SECRET,
  FEISHU_OPEN_ID: apiEnv.FEISHU_OPEN_ID,
  SUPABASE_URL: apiEnv.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: apiEnv.SUPABASE_SERVICE_ROLE_KEY,
  DIRECTMAIL_ACCESS_KEY_ID: apiEnv.DIRECTMAIL_ACCESS_KEY_ID,
  DIRECTMAIL_ACCESS_KEY_SECRET: apiEnv.DIRECTMAIL_ACCESS_KEY_SECRET,
  DIRECTMAIL_ACCOUNT: apiEnv.DIRECTMAIL_ACCOUNT,
  DIRECTMAIL_REGION: apiEnv.DIRECTMAIL_REGION || 'cn-hangzhou',
  DM_TO: process.env.DM_TO || 'info@droneworld.tech',
  OSS_BUCKET: 'partdro-site',
  OSS_REGION: 'cn-hongkong',
  OSS_AK_ID: prof.access_key_id,
  OSS_AK_SECRET: prof.access_key_secret,
})
for (const k of ['INQUIRY_WEBHOOK_SECRET', 'FEISHU_APP_ID', 'SUPABASE_SERVICE_ROLE_KEY', 'DIRECTMAIL_ACCESS_KEY_ID']) {
  if (!process.env[k]) throw new Error(`partdro-api 环境变量缺失: ${k}`)
}

// 2) 打包 handler（CJS：e2b 依赖内部 require('crypto')，ESM bundle 会报 Dynamic require）
import { createRequire } from 'node:module'
mkdirSync(join(HERE, 'dist'), { recursive: true })
await build({
  entryPoints: [join(HERE, 'index.ts')],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  outfile: join(HERE, 'dist', 'test-index.cjs'),
  logLevel: 'warning',
})
const { handler } = createRequire(import.meta.url)(join(HERE, 'dist', 'test-index.cjs'))

// 3) 构造真实 HTTP 事件（默认用自有域名 info@droneworld.tech：企业邮箱、调研自家站点、快且安全）
const record = {
  id: 0,
  name: process.env.TEST_NAME || 'E2E Lead Research Test',
  email: process.env.TEST_EMAIL || 'info@droneworld.tech',
  phone: process.env.TEST_PHONE || '',
  type: 'contact',
  message: process.env.TEST_MESSAGE || '本地端到端测试：请调研该发件人背景并产出 JSON。',
  created_at: new Date().toISOString(),
}
const event = {
  httpMethod: 'POST',
  headers: { 'x-webhook-secret': process.env.INQUIRY_WEBHOOK_SECRET },
  body: JSON.stringify({ type: 'INSERT', table: 'inquiries', record }),
  isBase64Encoded: false,
}

console.log('[test-local] 开始（沙箱+调研约需 1-5 分钟），record:', JSON.stringify(record))
const t0 = Date.now()
const res = await handler(event)
console.log('[test-local] 耗时', Math.round((Date.now() - t0) / 1000), 's')
console.log('[test-local] statusCode =', res.statusCode)
console.log('[test-local] body =', res.body)
process.exit(res.statusCode === 200 ? 0 : 1)
