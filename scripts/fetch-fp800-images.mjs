// 通过 Playwright 浏览器（走代理 + 浏览器 TLS 指纹）下载 doubaocdn 短链图片
// 背景：本机 shell 的 curl TLS 指纹被字节系 CDN 屏蔽，且域名 DNS 被污染；浏览器环境可正常访问
// 用法: node scripts/fetch-fp800-images.mjs
import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'node:fs'

const OUT = 'public/images/fp800-agricultural-drone'
mkdirSync(OUT, { recursive: true })

const IMAGES = [
  { key: 'uUatigQ8wC', name: 'hero' },
  { key: 'KYO1wCABa1', name: 'gallery-1' },
  { key: 'KomNjiVQJM', name: 'gallery-2' },
  { key: 'JgavHGTlwW', name: 'gallery-3' },
  { key: '6PplZWVtA6', name: 'card' },
]

const browser = await chromium.launch({
  proxy: { server: 'http://127.0.0.1:15236' },
  args: ['--disable-web-security'],
})
const page = await browser.newPage()

// 用一个稳定可达的页面作为 fetch origin
await page.goto('https://www.google.com', { timeout: 30000, waitUntil: 'domcontentloaded' })
console.log('origin 页面已打开')

let ok = 0
for (const img of IMAGES) {
  const shortlink = `https://aka.doubaocdn.com/s/${img.key}`
  try {
    const data = await page.evaluate(async (src) => {
      const res = await fetch(src, { credentials: 'omit', redirect: 'follow' })
      if (!res.ok) return { err: `HTTP ${res.status}` }
      const ct = res.headers.get('content-type') || ''
      const buf = await res.arrayBuffer()
      if (buf.byteLength < 10000) return { err: `too small (${buf.byteLength}B) ct=${ct}` }
      let binary = ''
      const bytes = new Uint8Array(buf)
      for (let j = 0; j < bytes.length; j += 0x8000) {
        binary += String.fromCharCode.apply(null, bytes.subarray(j, j + 0x8000))
      }
      return { b64: btoa(binary), ct }
    }, shortlink)
    if (data.err) { console.log(`  ${img.name}: 失败 — ${data.err}`); continue }
    const ext = (data.ct || '').includes('png') || data.b64.startsWith('iVBOR') ? 'png' : 'jpg'
    const file = `${OUT}/${img.name}.${ext}`
    writeFileSync(file, Buffer.from(data.b64, 'base64'))
    console.log(`  ${img.name}.${ext}: ${(data.b64.length * 0.75 / 1024).toFixed(0)} KB ✓`)
    ok++
  } catch (e) {
    console.log(`  ${img.name}: 异常 — ${e.message.slice(0, 100)}`)
  }
}
console.log(`完成 ${ok}/${IMAGES.length}`)
await browser.close()
process.exit(ok > 0 ? 0 : 1)
