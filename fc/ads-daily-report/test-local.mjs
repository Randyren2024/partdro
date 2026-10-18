// 本地验证沙箱内 python 日报脚本（不经沙箱，直接本机 python + 系统代理跑一遍）
// 用法: node fc/ads-daily-report/test-local.mjs
import { build } from 'esbuild'
import { createRequire } from 'node:module'
import { readFileSync, writeFileSync, rmSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..', '..')
const require = createRequire(import.meta.url)

mkdirSync(join(HERE, 'dist'), { recursive: true })
await build({
  entryPoints: [join(HERE, 'index.ts')],
  bundle: true, platform: 'node', target: 'node20', format: 'cjs',
  outfile: join(HERE, 'dist', 'index.cjs'), minify: true, logLevel: 'warning',
})

function parseDotEnv(p) {
  const out = {}
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/)
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
  return out
}
const base = resolve(ROOT, '..', 'partdro_related_with_product_files')
const ads = parseDotEnv(join(base, 'google-ads', '.env'))
const ga4 = parseDotEnv(join(base, 'ga4', '.env'))

const m = require(join(HERE, 'dist', 'index.cjs'))
const script = m.__test.buildAdsReportScript({
  adsClientId: ads.GOOGLE_ADS_CLIENT_ID,
  adsClientSecret: ads.GOOGLE_ADS_CLIENT_SECRET,
  adsRefreshToken: ads.GOOGLE_ADS_REFRESH_TOKEN,
  adsDeveloperToken: ads.GOOGLE_ADS_DEVELOPER_TOKEN,
  adsCustomerId: ads.GOOGLE_ADS_CUSTOMER_ID,
  adsLoginCustomerId: ads.GOOGLE_ADS_LOGIN_CUSTOMER_ID || '',
  ga4ClientId: ga4.GA4_CLIENT_ID,
  ga4ClientSecret: ga4.GA4_CLIENT_SECRET,
  ga4RefreshToken: ga4.GA4_REFRESH_TOKEN,
  ga4PropertyId: ga4.GA4_PROPERTY_ID,
})
const pyPath = join(HERE, 'dist', 'ads_report_local.py')
writeFileSync(pyPath, script)
console.log('[test] python 脚本已生成，执行中...')
execFileSync('python', [pyPath], { stdio: 'inherit', cwd: join(HERE, 'dist') })
console.log('[test] 报告:', join(HERE, 'dist', 'report.md'))
