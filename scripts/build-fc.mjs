// 打包阿里云函数计算（FC）代码：fc/index.ts + netlify/functions/* + shared/* → 单文件 CJS。
// 输出 dist-fc/index.js，由 workflow zip 后上传（handler = index.handler）。
// OSS bucket/region 在构建期通过 define 注入（CI 里来自 secrets，本地可用 .env / 环境变量覆盖）。
import { mkdirSync, statSync, existsSync, readFileSync } from 'node:fs'
import { build } from 'esbuild'

// 本地构建时从 .env 兜底读取（CI 里 process.env 已带 secrets）
if (existsSync('.env')) {
  for (const line of readFileSync('.env', 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/)
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}

mkdirSync('dist-fc', { recursive: true })

await build({
  entryPoints: ['fc/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  outfile: 'dist-fc/index.js',
  minify: true,
  sourcemap: false,
  logLevel: 'info',
  define: {
    __OSS_BUCKET__: JSON.stringify(process.env.ALIYUN_OSS_BUCKET || process.env.OSS_BUCKET || ''),
    __OSS_REGION__: JSON.stringify(process.env.ALIYUN_OSS_REGION || 'cn-hongkong'),
  },
})

const { size } = statSync('dist-fc/index.js')
console.log(`[fc] dist-fc/index.js  ${(size / 1024).toFixed(1)} KB`)
