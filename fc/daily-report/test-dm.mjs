// 本地验证 DM 手写 HMAC-SHA1 签名发信（SignatureVersion 1.0），凭据从 partdro-api 继承。只发邮件。
import { build } from 'esbuild'
import { execFileSync } from 'node:child_process'
import { rmSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const HERE = dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
const OUT_DIR = join(HERE, 'dist', 'local')
rmSync(OUT_DIR, { recursive: true, force: true })
mkdirSync(OUT_DIR, { recursive: true })
await build({
  entryPoints: [join(HERE, 'index.ts')], bundle: true, platform: 'node',
  target: 'node20', format: 'cjs', outfile: join(OUT_DIR, 'index.cjs'),
  logLevel: 'warning',
})

// 从 partdro-api 读 DIRECTMAIL_* 环境变量（不回显 SK）
const raw = execFileSync('aliyun', ['fc', 'GET', '/2023-03-30/functions/partdro-api', '--region', 'cn-hongkong'], { encoding: 'utf8' })
const e = JSON.parse(raw).environmentVariables || {}
process.env.DIRECTMAIL_ACCESS_KEY_ID = e.DIRECTMAIL_ACCESS_KEY_ID
process.env.DIRECTMAIL_ACCESS_KEY_SECRET = e.DIRECTMAIL_ACCESS_KEY_SECRET
process.env.DIRECTMAIL_ACCOUNT = e.DIRECTMAIL_ACCOUNT
process.env.DIRECTMAIL_REGION = e.DIRECTMAIL_REGION || 'cn-hangzhou'
process.env.DM_TO = process.env.DM_TO || 'info@droneworld.tech'

const m = require(join(OUT_DIR, 'index.cjs'))
const md = '# GSC 日报（手写签名自测）\n\n## 整体表现\n\n| 指标 | 数值 |\n|---|---|\n| 总点击 | 0 |\n| 总展示 | 114 |\n\n## 建议\n\n- 这是手写 RPC 1.0 签名的自测邮件\n'
await m.__test.sendDmReport(md, '2026-10-15')
console.log('本地手写签名发信完成 →', process.env.DM_TO)
