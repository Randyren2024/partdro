#!/usr/bin/env node
// Cloudflare Pages 专用构建脚本
// 与 package.json 的 npm run build 区别：
//   1. 显式 npx playwright install chromium（Pages 环境有 playwright 但没装浏览器）
//   2. 关掉非必要的 CI 输出，减少日志噪音
//
// Cloudflare Pages Dashboard 配置：
//   Framework preset:  Vite
//   Build command:     node scripts/build-cf-pages.mjs
//   Build output:      dist
//   Root directory:     partdro    （仓库根目录如果有多个子项目）
//   Environment vars:  同阿里云 FC partdro-api 的环境变量清单（见下方注释）
//
// 环境变量（Cloudflare Pages Functions 会自动传给 Worker）：
//   SUPABASE_URL              → Supabase 项目 URL
//   SUPABASE_ANON_KEY         → Supabase 匿名 key（客户端用）
//   GTM_CONTAINER_ID          → GTM 容器 ID（GTM-KJ7GJ3V5）
//   VITE_ADS_CONVERSION_ID    → Ads 转化 ID
//   VITE_ADS_CONVERSION_LABEL → Ads 转化 label
import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'

const ROOT = process.cwd()
console.log(`[cf-pages] working dir: ${ROOT}`)

// 1. 装依赖（Pages CI 里会 npm ci，但这里再保险一次）
console.log('[cf-pages] npm ci')
execSync('npm ci', { stdio: 'inherit', cwd: ROOT })

// 2. 装 Chromium（Pages 构建环境预装 playwright 包，但浏览器二进制要手动拉）
console.log('[cf-pages] playwright install chromium')
execSync('npx playwright install chromium', { stdio: 'inherit', cwd: ROOT })

// 3. Vite 构建（npm run build 里第一行就是 playwright install chromium，
//    已经在上面装过了，这里跳过安装步骤，只用 vite build + seo + sitemap + prerender）
console.log('[cf-pages] vite build')
execSync('npx vite build', { stdio: 'inherit', cwd: ROOT })

// 4. SEO 链接注入
console.log('[cf-pages] inject SEO links')
if (existsSync('scripts/inject-seo-links.mjs')) execSync('node scripts/inject-seo-links.mjs', { stdio: 'inherit', cwd: ROOT })

// 5. 预渲染（用刚装的 chromium）
console.log('[cf-pages] prerender')
if (existsSync('scripts/prerender.mjs')) execSync('node scripts/prerender.mjs', { stdio: 'inherit', cwd: ROOT })

// 6. sitemap
console.log('[cf-pages] sitemap')
if (existsSync('scripts/generate-sitemap.mjs')) execSync('node scripts/generate-sitemap.mjs', { stdio: 'inherit', cwd: ROOT })

console.log('\n[cf-pages] ✅ 构建完成。dist/ 目录结构：')
const dist = require('node:fs').readdirSync('dist')
console.log(dist.join('  '))
