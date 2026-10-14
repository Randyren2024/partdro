// 本地验证 DM 官方 SDK 发信（非 bundle，require 真实 node_modules；只发邮件）
import { build } from 'esbuild'
import { readFileSync, rmSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import os from 'node:os'

const HERE = dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
const OUT_DIR = join(HERE, 'dist', 'local')
rmSync(OUT_DIR, { recursive: true, force: true })
mkdirSync(OUT_DIR, { recursive: true })
await build({
  entryPoints: [join(HERE, 'index.ts')], bundle: true, platform: 'node',
  external: ['@alicloud/*'],
  target: 'node20', format: 'cjs', outfile: join(OUT_DIR, 'index.cjs'),
  logLevel: 'warning',
})

const aliCfg = JSON.parse(readFileSync(join(os.homedir(), '.aliyun', 'config.json'), 'utf8'))
const profile = aliCfg.profiles.find((p) => p.name === aliCfg.current) || aliCfg.profiles[0]
process.env.OSS_AK_ID = profile.access_key_id
process.env.OSS_AK_SECRET = profile.access_key_secret
process.env.DM_TO = 'info@droneworld.com'

const m = require(join(OUT_DIR, 'index.cjs'))
const md = '# GSC 日报（SDK 自测）\n\n## 整体表现\n\n| 指标 | 数值 |\n|---|---|\n| 总点击 | 0 |\n| 总展示 | 114 |\n\n## 建议\n\n- 这是官方 DM SDK 的自测邮件\n'
await m.__test.sendDmReport(md, '2026-10-14')
console.log('本地 SDK 发信调用完成')
