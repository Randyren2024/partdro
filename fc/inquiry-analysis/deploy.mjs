// inquiry-analysis FC 函数部署脚本（本地手动执行，不走 GitHub CI）
// 用法（在 partdro 仓库根目录）：
//   $env:E2B_API_KEY="<香港key>"; $env:BAILIAN_API_KEY="<百炼 sk-key>"; node fc/inquiry-analysis/deploy.mjs
//   node fc/inquiry-analysis/deploy.mjs --invoke          # 异步触发一次（会真实调研+推送）
// 依赖：根目录 esbuild；aliyun CLI（default profile，AK 模式）。
// 说明：部署末尾自动把 inquiry-analysis 的 HTTP URL 写入 partdro-api 的 INQUIRY_ANALYSIS_URL；
//       partdro-api 的 webhook 代码改动需另行 build-fc.mjs 重新部署后才生效。
import { execFileSync } from 'node:child_process'
import { build } from 'esbuild'
import { mkdirSync, readFileSync, rmSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import os from 'node:os'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..', '..')
const REGION = 'cn-hongkong'
const FUNC = 'inquiry-analysis'
const API_FUNC = 'partdro-api'
const BUCKET = 'partdro-site'
const OSS_KEY = `fc/${FUNC}.zip`
const TEMPLATE = process.env.E2B_TEMPLATE || 'claude-code-gsc'
const ANTHROPIC_BASE_URL = process.env.ANTHROPIC_BASE_URL || 'https://dashscope.aliyuncs.com/apps/anthropic'
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'deepseek-v4.1-flash'

const arg = (n) => process.argv.includes(n)

function aliyun(fcArgs, { capture = false } = {}) {
  // partdro-api 配置更新较慢，默认读超时会报 context deadline exceeded → 统一放宽到 60s
  const out = execFileSync('aliyun', [...fcArgs, '--region', REGION, '--read-timeout', '60'], {
    encoding: 'utf8',
    stdio: capture ? ['ignore', 'pipe', 'pipe'] : ['ignore', 'pipe', 'inherit'],
  })
  if (capture) {
    try {
      const j = JSON.parse(out)
      if (j.Code || j.error_code) throw new Error(`FC API 错误: ${j.Code || j.error_code} ${j.Message || j.message || ''}`)
    } catch (e) {
      if (e.message.startsWith('FC API 错误')) throw e
    }
  }
  return out
}

// ---------- 1. 单文件 bundle ----------
mkdirSync(join(HERE, 'dist'), { recursive: true })
await build({
  entryPoints: [join(HERE, 'index.ts')],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  outfile: join(HERE, 'dist', 'index.js'),
  minify: true,
  sourcemap: false,
  logLevel: 'info',
})

// ---------- 2. zip ----------
const zipPath = join(HERE, 'dist', `${FUNC}.zip`)
rmSync(zipPath, { force: true })
execFileSync('powershell', [
  '-NoProfile', '-Command',
  `Compress-Archive -Path '${join(HERE, 'dist', 'index.js')}' -DestinationPath '${zipPath}' -Force`,
])
console.log('[deploy] zip OK:', zipPath)

// ---------- 3. 上传 zip 到 OSS ----------
execFileSync('aliyun', ['oss', 'cp', zipPath, `oss://${BUCKET}/${OSS_KEY}`, '-f'], { stdio: 'inherit' })

// ---------- 4. 组装环境变量 ----------
const e2bKey = process.env.E2B_API_KEY || ''
const bailianKey = process.env.BAILIAN_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN || ''
if (!arg('--invoke') && (!e2bKey || !bailianKey)) {
  throw new Error('缺少 E2B_API_KEY 或 BAILIAN_API_KEY（控制台获取后: $env:E2B_API_KEY="..."; $env:BAILIAN_API_KEY="..." 再运行）')
}

const aliCfg = JSON.parse(readFileSync(join(os.homedir(), '.aliyun', 'config.json'), 'utf8'))
const profile = aliCfg.profiles.find((p) => p.name === aliCfg.current) || aliCfg.profiles[0]
if (!profile.access_key_id || !profile.access_key_secret) throw new Error('aliyun CLI 配置缺 AK')

// 从 partdro-api 继承：DirectMail 发信 + 飞书 + Supabase 写回 + webhook 共享密钥（与询价通知同身份）
const apiFn = JSON.parse(aliyun(['fc', 'GET', `/2023-03-30/functions/${API_FUNC}`], { capture: true }))
const apiEnv = apiFn.environmentVariables || {}
const INHERIT = [
  'DIRECTMAIL_ACCESS_KEY_ID', 'DIRECTMAIL_ACCESS_KEY_SECRET', 'DIRECTMAIL_ACCOUNT', 'DIRECTMAIL_REGION',
  'FEISHU_APP_ID', 'FEISHU_APP_SECRET', 'FEISHU_OPEN_ID',
  'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY',
  'INQUIRY_WEBHOOK_SECRET',
]
for (const k of INHERIT) {
  if (!apiEnv[k]) throw new Error(`partdro-api 缺少环境变量 ${k}（无法继承）`)
}
console.log('[deploy] 已从 partdro-api 继承', INHERIT.length, '个环境变量')

const envVars = {
  E2B_API_KEY: e2bKey,
  E2B_API_URL: `https://api.${REGION}.e2b.fc.aliyuncs.com`,
  E2B_DOMAIN: `${REGION}.e2b.fc.aliyuncs.com`,
  E2B_TEMPLATE: TEMPLATE,
  ANTHROPIC_AUTH_TOKEN: bailianKey,
  ANTHROPIC_BASE_URL: ANTHROPIC_BASE_URL,
  ANTHROPIC_MODEL: ANTHROPIC_MODEL,
  INQUIRY_WEBHOOK_SECRET: apiEnv.INQUIRY_WEBHOOK_SECRET,
  FEISHU_APP_ID: apiEnv.FEISHU_APP_ID,
  FEISHU_APP_SECRET: apiEnv.FEISHU_APP_SECRET,
  FEISHU_OPEN_ID: apiEnv.FEISHU_OPEN_ID,
  SUPABASE_URL: apiEnv.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: apiEnv.SUPABASE_SERVICE_ROLE_KEY,
  DM_TO: (process.env.DM_TO || 'info@droneworld.tech').trim(),
  DIRECTMAIL_ACCESS_KEY_ID: apiEnv.DIRECTMAIL_ACCESS_KEY_ID,
  DIRECTMAIL_ACCESS_KEY_SECRET: apiEnv.DIRECTMAIL_ACCESS_KEY_SECRET,
  DIRECTMAIL_ACCOUNT: apiEnv.DIRECTMAIL_ACCOUNT,
  DIRECTMAIL_REGION: apiEnv.DIRECTMAIL_REGION || 'cn-hangzhou',
  OSS_BUCKET: BUCKET,
  OSS_REGION: REGION,
  OSS_AK_ID: profile.access_key_id,
  OSS_AK_SECRET: profile.access_key_secret,
}
if (process.env.SKIP_FREE_EMAIL_DOMAINS) envVars.SKIP_FREE_EMAIL_DOMAINS = process.env.SKIP_FREE_EMAIL_DOMAINS

// ---------- 5. 创建或更新函数 ----------
if (!arg('--invoke')) {
  let exists = true
  try {
    aliyun(['fc', 'GET', `/2023-03-30/functions/${FUNC}`], { capture: true })
  } catch {
    exists = false
  }

  if (exists) {
    console.log('[deploy] 函数已存在 → 更新代码与配置')
    const cur = JSON.parse(aliyun(['fc', 'GET', `/2023-03-30/functions/${FUNC}`], { capture: true }))
    const merged = {
      runtime: cur.runtime,
      handler: cur.handler,
      cpu: cur.cpu ?? 0.5,
      memorySize: cur.memorySize,
      timeout: cur.timeout,
      diskSize: cur.diskSize,
      description: cur.description,
      environmentVariables: { ...(cur.environmentVariables || {}), ...envVars },
      code: { ossBucketName: BUCKET, ossObjectName: OSS_KEY },
    }
    aliyun(['fc', 'PUT', `/2023-03-30/functions/${FUNC}`, '--body', JSON.stringify(merged)], { capture: true })
    console.log('[deploy] 函数代码/配置已更新')
  } else {
    console.log('[deploy] 函数不存在 → 创建')
    aliyun(['fc', 'POST', '/2023-03-30/functions', '--body', JSON.stringify({
      functionName: FUNC,
      description: 'Inquiry lead background research via Claude Code cloud sandbox (bailian deepseek flash)',
      runtime: 'nodejs20',
      handler: 'index.handler',
      cpu: 0.5,
      memorySize: 512,
      timeout: 900,
      diskSize: 512,
      code: { ossBucketName: BUCKET, ossObjectName: OSS_KEY },
      environmentVariables: envVars,
    })], { capture: true })
  }

  // ---------- 6. HTTP 触发器（webhook 以 x-fc-invocation-type: Async 调用） ----------
  let hasTrigger = false
  try {
    const list = JSON.parse(aliyun(['fc', 'GET', `/2023-03-30/functions/${FUNC}/triggers`], { capture: true }))
    hasTrigger = (list.triggers || []).some((t) => t.triggerName === 'http')
  } catch { /* ignore */ }
  if (!hasTrigger) {
    aliyun(['fc', 'POST', `/2023-03-30/functions/${FUNC}/triggers`, '--body', JSON.stringify({
      triggerName: 'http',
      triggerType: 'http',
      // FC 3.0 要求 triggerConfig 是 JSON 字符串；鉴权靠函数内 x-webhook-secret，触发器放行匿名
      triggerConfig: JSON.stringify({
        authType: 'anonymous',
        methods: ['POST', 'GET'],
        corsConfig: { allowOrigins: ['*'], allowCredentials: false },
      }),
    })], { capture: true })
    console.log('[deploy] HTTP 触发器已创建（anonymous，函数内验 secret）')
  } else {
    console.log('[deploy] HTTP 触发器已存在')
  }

  // ---------- 7. 把本函数 URL 写入 partdro-api 的 INQUIRY_ANALYSIS_URL ----------
  // 自动域名是函数名式（如 https://inquiryanalysis-xxx.cn-hongkong.fcapp.run），从触发器读取
  const trig = JSON.parse(aliyun(['fc', 'GET', `/2023-03-30/functions/${FUNC}/triggers/http`], { capture: true }))
  const internetUrl = trig.httpTrigger?.urlInternet
  if (!internetUrl) throw new Error('触发器未返回 urlInternet')
  const analysisUrl = `${internetUrl}/invoke`
  if (apiEnv.INQUIRY_ANALYSIS_URL === analysisUrl) {
    console.log('[deploy] partdro-api INQUIRY_ANALYSIS_URL 已是最新:', analysisUrl)
  } else {
    // FC PUT 只需传 environmentVariables 即可部分更新；带 code/runtime 全量体反而会
    // 触发 "Either ossBucketName/ossObjectName or zipFile must be set"（GET 不回 code 对象）
    aliyun(['fc', 'PUT', `/2023-03-30/functions/${API_FUNC}`, '--body', JSON.stringify({
      environmentVariables: { ...apiEnv, INQUIRY_ANALYSIS_URL: analysisUrl },
    })], { capture: true })
    console.log('[deploy] 已写入 partdro-api 环境变量 INQUIRY_ANALYSIS_URL =', analysisUrl)
  }
}

// ---------- 8. 手动异步触发验证 ----------
if (arg('--invoke')) {
  console.log('[deploy] 异步触发函数（调研约需 1-5 分钟：创建沙箱+联网调研+推送）')
  const body = JSON.stringify({
    record: {
      id: 0,
      name: 'Deploy Invoke Test',
      email: 'info@droneworld.tech',
      phone: '',
      type: 'contact',
      message: 'deploy.mjs --invoke smoke test',
    },
  })
  const out = aliyun([
    'fc', 'POST', `/2023-03-30/functions/${FUNC}/invocations`, '--body', body,
    '--header', 'x-fc-invocation-type=Async',
  ], { capture: true })
  console.log('[deploy] 已受理（后台异步执行中）。完成后可查飞书/邮件/OSS inquiry-leads/。')
  if (out.trim()) console.log(out.trim())
}
