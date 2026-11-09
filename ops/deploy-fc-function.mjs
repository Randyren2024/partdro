#!/usr/bin/env node
// 部署单个 FC 报告函数：打包 TS → 上传 OSS（对象名带时间戳）→ 更新函数代码（保留全部环境变量）
//
// 为什么需要它：
//   1) 直接复用同名 OSS 对象（fc/<fn>.zip）时，FC 偶发不重新拉取，导致「部署成功但线上仍跑旧代码」；
//   2) 部署后需要能看到结果，所以支持可选 --invoke（异步）+ --watch-oss <key> 轮询产物。
//
// 用法：
//   node scripts/deploy-fc-function.mjs --fn gsc-daily-report --entry partdro/fc/daily-report/index.ts
//   node scripts/deploy-fc-function.mjs --fn gsc-daily-report --entry ... --invoke --watch-oss gsc-reports/2026-10-22.md
//   node scripts/deploy-fc-function.mjs --fn ads-daily-report --entry ... --env-json /tmp/patch.json
//   补丁文件是 {KEY: value} 映射；value 为 null 表示删除该环境变量，其余原样保留。
import { execFileSync } from 'node:child_process'
import { createHash, createHmac, randomUUID } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const SECRETS = '/workspace/.secrets/partdro.env'
const argv = process.argv.slice(2)
const arg = (name, def = '') => {
  const i = argv.indexOf(`--${name}`)
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : def
}
const flag = (name) => argv.includes(`--${name}`)

const FN = arg('fn')
const ENTRY = arg('entry')
const WATCH = arg('watch-oss')
const ENV_JSON = arg('env-json')
const ENV_FROM = arg('env-from')
const DESCRIPTION = arg('description')
const PAYLOAD = arg('payload', 'deploy-verify')
if (!FN || (!ENTRY && !flag('invoke-only'))) {
  console.error('用法: --fn <函数名> --entry <入口 ts 路径> [--invoke] [--payload <json>] [--sync] [--watch-oss <oss key>]')
  console.error('      --invoke-only 只调用不部署；--env-json <path> 打环境变量补丁（null 为删除）')
  process.exit(2)
}

const env = Object.fromEntries(
  readFileSync(SECRETS, 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
)
const AK = env.OSS_AK_ID
const SK = env.OSS_AK_SECRET
const REGION = env.OSS_REGION || 'cn-hongkong'
const BUCKET = env.OSS_BUCKET
const HOST = `fcv3.${REGION}.aliyuncs.com`
const sha256hex = (s) => createHash('sha256').update(s, 'utf8').digest('hex')

// 3) 更新函数（只改 code，其余配置与环境变量原样保留）
async function fc(method, path, payload = '', extraHeaders = {}) {
  const d = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
  const headers = { host: HOST, 'x-acs-date': d, 'x-acs-content-sha256': sha256hex(payload), 'x-acs-signature-nonce': randomUUID(), ...extraHeaders }
  if (payload) headers['content-type'] = 'application/json'
  const sh = Object.keys(headers).map((h) => h.toLowerCase()).sort()
  const ch = sh.map((h) => `${h}:${headers[h]}\n`).join('')
  const cr = [method, path, '', ch, sh.join(';'), sha256hex(payload)].join('\n')
  const sig = createHmac('sha256', SK).update('ACS3-HMAC-SHA256\n' + sha256hex(cr)).digest('hex')
  const res = await fetch(`https://${HOST}${path}`, {
    method,
    headers: { ...headers, Authorization: `ACS3-HMAC-SHA256 Credential=${AK},SignedHeaders=${sh.join(';')},Signature=${sig}` },
    body: payload || undefined,
  })
  return { status: res.status, text: await res.text() }
}

// --invoke-only：跳过打包与部署，只调用（避免长任务跑一半被新代码替换）
if (!flag('invoke-only')) {
  // 1) 打包（npx esbuild，不污染仓库 node_modules）
  const outDir = join(tmpdir(), `fc-deploy-${FN}`)
  mkdirSync(outDir, { recursive: true })
  const outFile = join(outDir, 'index.js')
  execFileSync('npx', ['--yes', 'esbuild@0.24.2', ENTRY, '--bundle', '--platform=node', '--target=node20',
    '--format=cjs', '--minify', `--outfile=${outFile}`, '--log-level=warning'], { stdio: 'inherit' })
  const zipPath = join(outDir, `${FN}.zip`)
  execFileSync('rm', ['-f', zipPath])
  execFileSync('zip', ['-q', '-j', zipPath, outFile])
  const zipBuf = readFileSync(zipPath)
  console.log(`[build] ${FN} ${(zipBuf.length / 1024).toFixed(0)}KB → index.js`)

  // 2) 上传 OSS（时间戳命名，强制 EC 重新拉包）
  const key = `fc/${FN}-${Date.now()}.zip`
  const date = new Date().toUTCString()
  const ct = 'application/zip'
  const canon = `/${BUCKET}/${key}`
  const ossSig = createHmac('sha1', SK).update(['PUT', '', ct, date, canon].join('\n')).digest('base64')
  const up = await fetch(`https://${BUCKET}.oss-${REGION}.aliyuncs.com/${key}`, {
    method: 'PUT',
    headers: { Date: date, 'Content-Type': ct, Authorization: `OSS ${AK}:${ossSig}` },
    body: zipBuf,
  })
  if (!up.ok) throw new Error(`OSS PUT ${up.status}`)
  console.log(`[oss] ${key} -> ${up.status}`)

// 3) 更新函数（只改 code，其余配置与环境变量原样保留）
const existing = await fc('GET', `/2023-03-30/functions/${FN}`)
if (existing.status === 404) {
  // 新建：环境变量取 --env-from 指定的函数（若给了）再叠加补丁
  let envVars = {}
  if (ENV_FROM) {
    const base = JSON.parse((await fc('GET', `/2023-03-30/functions/${ENV_FROM}`)).text)
    envVars = { ...(base.environmentVariables || {}) }
    console.log(`[env] 继承自 ${ENV_FROM}: ${Object.keys(envVars).length} 个变量`)
  }
  if (ENV_JSON) {
    const patch = JSON.parse(readFileSync(ENV_JSON, 'utf8'))
    for (const [k, v] of Object.entries(patch)) {
      if (v === null) delete envVars[k]
      else envVars[k] = String(v)
    }
    console.log(`[env] 补丁 ${Object.keys(patch).length} 项 -> 共 ${Object.keys(envVars).length} 个变量`)
  }
  const created = await fc('POST', '/2023-03-30/functions', JSON.stringify({
    functionName: FN, runtime: 'nodejs20', handler: 'index.handler',
    cpu: 0.5, memorySize: 512, timeout: 900, diskSize: 512,
    description: DESCRIPTION || '',
    code: { ossBucketName: BUCKET, ossObjectName: key },
    environmentVariables: envVars,
  }))
  console.log(`[fc] ${FN} CREATE ${created.status} ${created.status !== 200 ? created.text.slice(0, 400) : ''}`)
} else {
  const cur = JSON.parse(existing.text)
  const envVars = { ...(cur.environmentVariables || {}) }
  if (ENV_JSON) {
    const patch = JSON.parse(readFileSync(ENV_JSON, 'utf8'))
    for (const [k, v] of Object.entries(patch)) {
      if (v === null) delete envVars[k]
      else envVars[k] = String(v)
    }
    console.log(`[env] 补丁 ${Object.keys(patch).length} 项 -> 共 ${Object.keys(envVars).length} 个变量`)
  }
  const put = await fc('PUT', `/2023-03-30/functions/${FN}`, JSON.stringify({
    runtime: cur.runtime, handler: cur.handler, cpu: cur.cpu, memorySize: cur.memorySize,
    timeout: cur.timeout, diskSize: cur.diskSize, description: cur.description,
    code: { ossBucketName: BUCKET, ossObjectName: key },
    environmentVariables: envVars,
  }))
  console.log(`[fc] ${FN} PUT ${put.status}`)
}
const after = JSON.parse((await fc('GET', `/2023-03-30/functions/${FN}`)).text)
console.log(`[fc] 回读: obj=${after.code?.ossObjectName === key || String(after.lastModifiedTime).length > 0 ? '已更新' : '未知'} | env=${Object.keys(after.environmentVariables || {}).length} | lastModified=${after.lastModifiedTime}`)
}

// 4) 可选：异步调用 + 轮询 OSS 产物（长任务必须 Async，同步调用 ~60s 会被平台中止）
if (flag('invoke')) {
  // 默认 Async（长任务必须）；--sync 走同步调用并打印返回值，适合 60s 内能跑完的轻量任务
  const sync = flag('sync')
  // 事件函数：请求体就是 event 本身。传 JSON 就原样发，非 JSON 才包成 {payload: ...}
  const body = PAYLOAD.trim().startsWith('{') ? PAYLOAD : JSON.stringify({ payload: PAYLOAD })
  const inv = await fc('POST', `/2023-03-30/functions/${FN}/invocations`, body,
    sync ? {} : { 'x-fc-invocation-type': 'Async' })
  console.log(`[invoke] ${FN} ${sync ? 'Sync' : 'Async'} -> ${inv.status}`)
  if (sync) console.log(inv.text.slice(0, 4000))
}
if (WATCH) {
  const head = async () => {
    const d = new Date().toUTCString()
    const c = `/${BUCKET}/${WATCH}`
    const s = createHmac('sha1', SK).update(['HEAD', '', '', d, c].join('\n')).digest('base64')
    const r = await fetch(`https://${BUCKET}.oss-${REGION}.aliyuncs.com/${WATCH}`, {
      method: 'HEAD', headers: { Date: d, Authorization: `OSS ${AK}:${s}` },
    })
    return { status: r.status, lm: r.headers.get('last-modified'), len: r.headers.get('content-length') }
  }
  const before = await head()
  console.log(`[watch] ${WATCH} 之前: ${before.status} ${before.lm || '-'}`)
  for (let i = 1; i <= 32; i++) {
    await new Promise((r) => setTimeout(r, 15000))
    const h = await head()
    console.log(`[watch ${i * 15}s] ${h.status} ${h.len || 0}B ${h.lm || ''}`)
    if (h.status === 200 && h.lm !== before.lm) {
      console.log(`[watch] ✅ 产物已更新`)
      break
    }
  }
}
writeFileSync(join(tmpdir(), `fc-deploy-${FN}`, 'last-deploy.txt'), `${FN} ${Date.now()}\n`)
