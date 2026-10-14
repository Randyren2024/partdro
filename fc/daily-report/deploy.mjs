// gsc-daily-report FC 函数部署脚本（本地手动执行，不走 GitHub CI）
// 用法（在 partdro 仓库根目录）：
//   $env:E2B_API_KEY="<key>"; node fc/daily-report/deploy.mjs               # 创建/更新函数
//   $env:E2B_API_KEY="<key>"; node fc/daily-report/deploy.mjs --trigger     # 同时确保 Timer 触发器存在
//   node fc/daily-report/deploy.mjs --invoke                                # 手动触发一次验证
// 依赖：根目录 esbuild；aliyun CLI（default profile，AK 模式）；
//      ../partdro_related_with_product_files/gsc/.env 提供 GSC 凭据。
import { execFileSync } from 'node:child_process'
import { build } from 'esbuild'
import { mkdirSync, readFileSync, existsSync, rmSync, cpSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import os from 'node:os'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..', '..')
const REGION = 'cn-hongkong'
const FUNC = 'gsc-daily-report'
const BUCKET = 'partdro-site'
const OSS_KEY = `fc/${FUNC}.zip`
const TRIGGER_NAME = 'gsc-daily-0900'

const arg = (n) => process.argv.includes(n)

function aliyun(fcArgs, { capture = false } = {}) {
  // execFileSync 直接传参（无 shell 转义/注入问题）
  const out = execFileSync('aliyun', ['fc', ...fcArgs, '--region', REGION], {
    encoding: 'utf8',
    stdio: capture ? ['ignore', 'pipe', 'pipe'] : ['ignore', 'pipe', 'inherit'],
  })
  // aliyun CLI 对 API 错误也可能退出码 0：捕获模式下检查响应体
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

// ---------- 1. 编译（不 bundle，保留 require，规避 CJS interop 问题） ----------
const PKG_DIR = join(HERE, 'dist', 'pkg')
rmSync(PKG_DIR, { recursive: true, force: true })
mkdirSync(PKG_DIR, { recursive: true })
await build({
  entryPoints: [join(HERE, 'index.ts')],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  // e2b 及其 ESM-only 依赖（chalk 等）打包进来转译；@alicloud 保留外部 require（避开 esbuild CJS interop 问题）
  external: ['@alicloud/*'],
  outfile: join(PKG_DIR, 'index.js'),
  minify: false,
  sourcemap: false,
  logLevel: 'info',
})

// 发布目录覆盖为 CommonJS（上层 package.json 是 type:module，会让 index.js 被当 ESM）
writeFileSync(join(PKG_DIR, 'package.json'), JSON.stringify({ type: 'commonjs' }) + '\n')

// 只复制 external 的 @alicloud 运行时依赖（e2b 已 bundle，无需携带）
cpSync(join(HERE, 'node_modules'), join(PKG_DIR, 'node_modules'), {
  recursive: true,
  filter: (s) => {
    const norm = s.replace(/\\/g, '/')
    if (/\/node_modules\/\.bin(\/|$)/.test(norm) || /\/\.cache(\/|$)/.test(norm)) return false
    // 保留 @alicloud scope 及其传递依赖；跳过其余（e2b 已打进 index.js）
    return true
  },
})
console.log('[deploy] 发布目录就绪（index.js + @alicloud node_modules）')

// ---------- 2. zip（正斜杠条目，兼容 FC Linux；不用 Compress-Archive/.NET CreateFromDirectory） ----------
const zipPath = join(HERE, 'dist', `${FUNC}.zip`)
execFileSync('powershell', [
  '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', join(HERE, 'zip-pkg.ps1'),
  '-Src', PKG_DIR, '-Dst', zipPath,
], { stdio: 'inherit' })
console.log('[deploy] zip OK:', zipPath)

// ---------- 3. 上传 zip 到 OSS ----------
execFileSync('aliyun', ['oss', 'cp', zipPath, `oss://${BUCKET}/${OSS_KEY}`, '-f'], { stdio: 'inherit' })

// ---------- 4. 组装环境变量（GSC 凭据 + OSS AK + E2B 端点；不回显） ----------
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
const dmTo = (process.env.DM_TO || '').trim()
if (!arg('--invoke')) {
  if (!e2bKey) throw new Error('缺少 E2B_API_KEY（控制台创建后: $env:E2B_API_KEY="<key>" 再运行）')
  if (!dmTo) throw new Error('缺少 DM_TO 收件人: $env:DM_TO="you@aliyun.com" node fc/daily-report/deploy.mjs')
}

const envVars = {
  E2B_API_KEY: e2bKey,
  E2B_API_URL: `https://api.${REGION}.e2b.fc.aliyuncs.com`,
  E2B_DOMAIN: `${REGION}.e2b.fc.aliyuncs.com`,
  GSC_CLIENT_ID: gsc.GSC_CLIENT_ID,
  GSC_CLIENT_SECRET: gsc.GSC_CLIENT_SECRET,
  GSC_REFRESH_TOKEN: gsc.GSC_REFRESH_TOKEN,
  GSC_SITE_URL: gsc.GSC_SITE_URL,
  OSS_BUCKET: BUCKET,
  OSS_REGION: REGION,
  OSS_AK_ID: profile.access_key_id,
  OSS_AK_SECRET: profile.access_key_secret,
  DM_TO: dmTo,
  DM_FROM: process.env.DM_FROM || 'report@edm.droneworld.tech',
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
      description: 'GSC daily report via cloud sandbox (code-interpreter-v1)',
      runtime: 'nodejs20',
      handler: 'index.handler',
      cpu: 0.5,
      memorySize: 512,
      timeout: 600,
      diskSize: 512,
      code: { ossBucketName: BUCKET, ossObjectName: OSS_KEY },
      environmentVariables: envVars,
    })], { capture: true })
  }

  // ---------- 6. Timer 触发器（北京 09:00 = UTC 01:00，FC cron 按 UTC） ----------
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
        // FC 3.0 要求 triggerConfig 是 JSON 字符串，不是对象
        triggerConfig: JSON.stringify({ cronExpression: '0 0 1 * * *', enable: true, payload: 'gsc-daily' }),
      })], { capture: true })
      console.log(`[deploy] Timer 触发器已创建: ${TRIGGER_NAME}（每天北京时间 09:00）`)
    } else {
      console.log(`[deploy] Timer 触发器已存在: ${TRIGGER_NAME}`)
    }
  }
}

// ---------- 7. 手动触发验证 ----------
if (arg('--invoke')) {
  console.log('[deploy] 手动触发函数（可能需要 1-2 分钟：创建沙箱+脚本执行）...')
  const out = aliyun(['POST', `/2023-03-30/functions/${FUNC}/invocations`, '--body', '{}'], { capture: true })
  console.log('--- 函数返回 ---')
  console.log(out)
}
