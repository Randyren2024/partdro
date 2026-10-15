// 本地全链路验证 gsc-deep-analysis handler（不经 FC 网关，直接跑业务逻辑）
// 用法（在 partdro 仓库根目录）：
//   $env:E2B_API_KEY="<香港key>"; $env:BAILIAN_API_KEY="<百炼 sk-key>"; node fc/deep-analysis/test-local.mjs
import { build } from 'esbuild'
import { createRequire } from 'node:module'
import { readFileSync, rmSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import os from 'node:os'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..', '..')
const require = createRequire(import.meta.url)

rmSync(join(HERE, 'dist'), { recursive: true, force: true })
await build({
  entryPoints: [join(HERE, 'index.ts')],
  bundle: true, platform: 'node', target: 'node20', format: 'cjs',
  outfile: join(HERE, 'dist', 'index.cjs'), minify: false, logLevel: 'warning',
})

function parseEnv(p) {
  const out = {}
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/)
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
  return out
}

const gsc = parseEnv(resolve(ROOT, '..', 'partdro_related_with_product_files', 'gsc', '.env'))
const aliCfg = JSON.parse(readFileSync(join(os.homedir(), '.aliyun', 'config.json'), 'utf8'))
const profile = aliCfg.profiles.find((p) => p.name === aliCfg.current) || aliCfg.profiles[0]

const apiFn = JSON.parse(execFileSync('aliyun', ['fc', 'GET', '/2023-03-30/functions/partdro-api', '--region', 'cn-hongkong'], { encoding: 'utf8' }))
const apiEnv = apiFn.environmentVariables || {}

Object.assign(process.env, {
  E2B_API_URL: 'https://api.cn-hongkong.e2b.fc.aliyuncs.com',
  E2B_DOMAIN: 'cn-hongkong.e2b.fc.aliyuncs.com',
  E2B_TEMPLATE: 'claude-code-gsc',
  ANTHROPIC_AUTH_TOKEN: process.env.BAILIAN_API_KEY || '',
  ANTHROPIC_BASE_URL: 'https://dashscope.aliyuncs.com/apps/anthropic',
  ANTHROPIC_MODEL: 'qwen3.7-max',
  GSC_CLIENT_ID: gsc.GSC_CLIENT_ID,
  GSC_CLIENT_SECRET: gsc.GSC_CLIENT_SECRET,
  GSC_REFRESH_TOKEN: gsc.GSC_REFRESH_TOKEN,
  GSC_SITE_URL: gsc.GSC_SITE_URL,
  OSS_BUCKET: 'partdro-site',
  OSS_REGION: 'cn-hongkong',
  OSS_AK_ID: profile.access_key_id,
  OSS_AK_SECRET: profile.access_key_secret,
  DM_TO: 'info@droneworld.tech',
  DIRECTMAIL_ACCESS_KEY_ID: apiEnv.DIRECTMAIL_ACCESS_KEY_ID,
  DIRECTMAIL_ACCESS_KEY_SECRET: apiEnv.DIRECTMAIL_ACCESS_KEY_SECRET,
  DIRECTMAIL_ACCOUNT: apiEnv.DIRECTMAIL_ACCOUNT,
  DIRECTMAIL_REGION: apiEnv.DIRECTMAIL_REGION || 'cn-hangzhou',
})

const m = require(join(HERE, 'dist', 'index.cjs'))
console.log('[test] 本地执行 handler 全链路（创建沙箱→拉数据→claude→OSS→邮件）...')
const res = await m.handler()
console.log('[test] 返回:', JSON.stringify(res))
