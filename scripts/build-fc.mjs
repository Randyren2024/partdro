// 打包阿里云函数计算（FC）代码：fc/index.ts + netlify/functions/* + shared/* → 单文件 CJS。
// 输出 dist-fc/index.js，由 workflow zip 后上传（handler = index.handler）。
import { mkdirSync, statSync } from 'node:fs'
import { build } from 'esbuild'

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
})

const { size } = statSync('dist-fc/index.js')
console.log(`[fc] dist-fc/index.js  ${(size / 1024).toFixed(1)} KB`)
