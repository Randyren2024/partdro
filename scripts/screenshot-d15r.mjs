/**
 * /products/d15r 截图审查脚本（一次性）。
 * 运行：node scripts/screenshot-d15r.mjs [port]
 */
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const port = process.argv[2] || '5173'
const base = `http://localhost:${port}`
mkdirSync('screenshots/d15r', { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto(`${base}/products/d15r`, { waitUntil: 'load', timeout: 60000 })
// 等待 Supabase 内容合并 + 图片加载
await page.waitForTimeout(6000)
await page.evaluate(async () => {
  await Promise.all(
    Array.from(document.images)
      .filter((i) => !i.complete)
      .map((i) => new Promise((r) => ((i.onload = r), (i.onerror = r)))),
  )
  window.scrollTo(0, document.body.scrollHeight)
  await new Promise((r) => setTimeout(r, 1200))
  window.scrollTo(0, 0)
  await new Promise((r) => setTimeout(r, 600))
})

await page.screenshot({ path: 'screenshots/d15r/hero.png' })
await page.screenshot({ path: 'screenshots/d15r/full.png', fullPage: true })

const sections = page.locator('.lp-section')
const n = await sections.count()
for (let i = 0; i < n; i++) {
  await sections.nth(i).scrollIntoViewIfNeeded()
  await page.waitForTimeout(300)
  await sections.nth(i).screenshot({ path: `screenshots/d15r/section-${String(i).padStart(2, '0')}.png` })
}
console.log(`hero + full + ${n} sections captured`)
await browser.close()
