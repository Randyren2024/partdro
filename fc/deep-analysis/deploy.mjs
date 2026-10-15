// gsc-deep-analysis FC 函数部署脚本（本地手动执行，不走 GitHub CI）
// 用法（在 partdro 仓库根目录）：
//   $env:E2B_API_KEY="<香港key>"; $env:BAILIAN_API_KEY="<百炼 sk-key>"; node fc/deep-analysis/deploy.mjs
//   ... node fc/deep-analysis/deploy.mjs --trigger     # 同时确保 Timer 触发器存在
//   node fc/deep-analysis/deploy.mjs --invoke          # 手动触发一次验证
// 依赖：根目录 esbuild；aliyun CLI（default profile，AK 模式）；
//      ../partdro_related_with_product_files/gsc/.env 提供 GSC 凭据。
import { execFileSync } from 'node:child_process'
import { build } from 'esbuild'
import { mkdirSync, readFileSync, existsSync, rmSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import os from 'node:os'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..', '..')
const REGION = 'cn-hongkong'
const FUNC = 'gsc-deep-analysis'
const BUCKET = 'partdro-site'
const OSS_KEY = `fc/${FUNC}.zip`
const TRIGGER_NAME = 'gsc-deep-0930'
const TEMPLATE = process.env.E2B_TEMPLATE || 'claude-code-gsc'
const ANTHROPIC_BASE_URL = process.env.ANTHROPIC_BASE_URL || 'https://dashscope.aliyuncs.com/apps/anthropic'
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'qwen3.7-max'

const arg = (n) => process.argv.includes(n)

function aliyun(fcArgs, { capture = false } = {}) {
  const out = execFileSync('aliyun', ['fc', ...fcArgs, '--region', REGION], {
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
function parseDotEnv(p) {
  const out = {}
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/)
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
  return out
}
const gscEnvPath = resolve(ROOT, '..', 'partdro_related_with_product_files', 'gsc', '.env')
if (!existsSync(gscEnvPath)) throw new Error(`GSC 凭据文件不存在: ${gscEnvPath}`)
const gsc = parseDotEnv(gscEnvPath)
for (const k of ['GSC_CLIENT_ID', 'GSC_CLIENT_SECRET', 'GSC_REFRESH_TOKEN', 'GSC_SITE_URL']) {
  if (!gsc[k]) throw new Error(`gsc/.env 缺少 ${k}`)
}

const aliCfg = JSON.parse(readFileSync(join(os.homedir(), '.aliyun', 'config.json'), 'utf8'))
const profile = aliCfg.profiles.find((p) => p.name === aliCfg.current) || aliCfg.profiles[0]
if (!profile.access_key_id || !profile.access_key_secret) throw new Error('aliyun CLI 配置缺 AK')

const e2bKey = process.env.E2B_API_KEY || ''
const bailianKey = process.env.BAILIAN_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN || ''
const dmTo = (process.env.DM_TO || 'info@droneworld.tech').trim()
if (!arg('--invoke') && (!e2bKey || !bailianKey)) {
  throw new Error('缺少 E2B_API_KEY 或 BAILIAN_API_KEY（控制台获取后: $env:E2B_API_KEY="..."; $env:BAILIAN_API_KEY="..." 再运行）')
}

// 从 partdro-api 继承 DirectMail 专用 RAM 用户凭据（与询价/日报同身份）
const apiFn = JSON.parse(aliyun(['GET', '/2023-03-30/functions/partdro-api'], { capture: true }))
const apiEnv = apiFn.environmentVariables || {}
for (const k of ['DIRECTMAIL_ACCESS_KEY_ID', 'DIRECTMAIL_ACCESS_KEY_SECRET', 'DIRECTMAIL_ACCOUNT']) {
  if (!apiEnv[k]) throw new Error(`partdro-api 缺少环境变量 ${k}（无法继承发信凭据）`)
}
console.log('[deploy] 已从 partdro-api 继承 DIRECTMAIL 发信凭据，发信地址:', apiEnv.DIRECTMAIL_ACCOUNT)

const envVars = {
  E2B_API_KEY: e2bKey,
  E2B_API_URL: `https://api.${REGION}.e2b.fc.aliyuncs.com`,
  E2B_DOMAIN: `${REGION}.e2b.fc.aliyuncs.com`,
  E2B_TEMPLATE: TEMPLATE,
  ANTHROPIC_AUTH_TOKEN: bailianKey,
  ANTHROPIC_BASE_URL: ANTHROPIC_BASE_URL,
  ANTHROPIC_MODEL: ANTHROPIC_MODEL,
  GSC_CLIENT_ID: gsc.GSC_CLIENT_ID,
  GSC_CLIENT_SECRET: gsc.GSC_CLIENT_SECRET,
  GSC_REFRESH_TOKEN: gsc.GSC_REFRESH_TOKEN,
  GSC_SITE_URL: gsc.GSC_SITE_URL,
  OSS_BUCKET: BUCKET,
  OSS_REGION: REGION,
  OSS_AK_ID: profile.access_key_id,
  OSS_AK_SECRET: profile.access_key_secret,
  DM_TO: dmTo,
  DIRECTMAIL_ACCESS_KEY_ID: apiEnv.DIRECTMAIL_ACCESS_KEY_ID,
  DIRECTMAIL_ACCESS_KEY_SECRET: apiEnv.DIRECTMAIL_ACCESS_KEY_SECRET,
  DIRECTMAIL_ACCOUNT: apiEnv.DIRECTMAIL_ACCOUNT,
  DIRECTMAIL_REGION: apiEnv.DIRECTMAIL_REGION || 'cn-hangzhou',
}

// ---------- 5. 创建或更新函数 ----------
if (!arg('--invoke')) {
  let exists = true
  try {
    aliyun(['GET', `/2023-03-30/functions/${FUNC}`], { capture: true })
  } catch {
    exists = false
  }

  if (exists) {
    console.log('[deploy] 函数已存在 → 更新代码与配置')
    const cur = JSON.parse(aliyun(['GET', `/2023-03-30/functions/${FUNC}`], { capture: true }))
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
    aliyun(['PUT', `/2023-03-30/functions/${FUNC}`, '--body', JSON.stringify(merged)], { capture: true })
    console.log('[deploy] 函数代码/配置已更新')
  } else {
    console.log('[deploy] 函数不存在 → 创建')
    aliyun(['POST', '/2023-03-30/functions', '--body', JSON.stringify({
      functionName: FUNC,
      description: 'GSC deep analysis via Claude Code cloud sandbox (bailian qwen3.7-max)',
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

  // ---------- 6. Timer 触发器（北京 09:30 = UTC 01:30） ----------
  if (arg('--trigger')) {
    let has = false
    try {
      const list = JSON.parse(aliyun(['GET', `/2023-03-30/functions/${FUNC}/triggers`], { capture: true }))
      has = (list.triggers || []).some((t) => t.triggerName === TRIGGER_NAME)
    } catch { /* ignore */ }
    if (!has) {
      aliyun(['POST', `/2023-03-30/functions/${FUNC}/triggers`, '--body', JSON.stringify({
        triggerName: TRIGGER_NAME,
        triggerType: 'timer',
        // FC 3.0 要求 triggerConfig 是 JSON 字符串
        triggerConfig: JSON.stringify({ cronExpression: '0 30 1 * * *', enable: true, payload: 'gsc-deep' }),
      })], { capture: true })
      console.log(`[deploy] Timer 触发器已创建: ${TRIGGER_NAME}（每天北京时间 09:30）`)
    } else {
      console.log(`[deploy] Timer 触发器已存在: ${TRIGGER_NAME}`)
    }
  }
}

// ---------- 7. 手动触发验证 ----------
if (arg('--invoke')) {
  // 深度分析耗时 1-4 分钟，超过 FC 同步调用的网关等待上限（会返回 503）→ 用异步调用
  // （Timer 触发器同样是异步调用，此路径与线上一致）
  console.log('[deploy] 异步触发函数（深度分析约需 1-4 分钟：创建沙箱+拉数据+claude 分析）')
  const out = aliyun([
    'POST', `/2023-03-30/functions/${FUNC}/invocations`, '--body', '{}',
    '--header', 'x-fc-invocation-type=Async',
  ], { capture: true })
  console.log('[deploy] 已受理（后台异步执行中）。完成后可查 OSS gsc-deep-analysis/<日期>.md 或收件邮箱。')
  if (out.trim()) console.log(out.trim())
}
