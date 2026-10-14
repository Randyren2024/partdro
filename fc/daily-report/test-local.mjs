// 本地验证沙箱内 python 日报脚本（不经沙箱，直接本机 python + 系统代理跑一遍）
// 用法: node fc/daily-report/test-local.mjs
import { build } from 'esbuild'
import { createRequire } from 'node:module'
import { readFileSync, writeFileSync, rmSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..', '..')
const require = createRequire(import.meta.url)

rmSync(join(HERE, 'dist'), { recursive: true, force: true })
await build({
  entryPoints: [join(HERE, 'index.ts')],
  bundle: true, platform: 'node', target: 'node20', format: 'cjs',
  outfile: join(HERE, 'dist', 'index.cjs'), minify: true, logLevel: 'warning',
})

const m = require(join(HERE, 'dist', 'index.cjs'))
const envText = readFileSync(resolve(ROOT, '..', 'partdro_related_with_product_files', 'gsc', '.env'), 'utf8')
const e = {}
for (const line of envText.split('\n')) {
  const mm = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/)
  if (mm) e[mm[1]] = mm[2].replace(/^["']|["']$/g, '')
}
const script = m.__test.buildReportScript({
  clientId: e.GSC_CLIENT_ID, clientSecret: e.GSC_CLIENT_SECRET, refreshToken: e.GSC_REFRESH_TOKEN,
})
const pyPath = join(HERE, 'dist', 'gsc_report_local.py')
writeFileSync(pyPath, script)
console.log('[test] python 脚本已生成，执行中（GSC 数据延迟 2 天为正常）...')
execFileSync('python', [pyPath], { stdio: 'inherit' })
