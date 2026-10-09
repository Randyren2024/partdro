/** C500 safety 区块截图（可传语言路径） */
import { chromium } from 'playwright'

const port = process.argv[2] || '5173'
const base = port.startsWith('http') ? port : `http://localhost:${port}`
const path = process.argv[3] || '/products/c500-delivery-drone'
const out = process.argv[4] || 'screenshots/c500-safety-fixed.png'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 1400 } })
await page.goto(`${base}${path}`, { waitUntil: 'networkidle', timeout: 90000 }).catch(() => {})
await page.waitForTimeout(4000)
let sec = null
try {
  sec = await page.waitForSelector('#safety', { timeout: 25000 })
} catch { /* not found */ }
if (sec) {
  await sec.scrollIntoViewIfNeeded()
  await page.waitForTimeout(1500)
  await sec.screenshot({ path: out })
  console.log('safety captured:', out)
} else {
  console.log('NO #safety')
}
await browser.close()
