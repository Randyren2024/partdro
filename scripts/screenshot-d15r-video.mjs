/** D15R 视频区块截图（主视频 + 附加视频网格） */
import { chromium } from 'playwright'

const port = process.argv[2] || '5173'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 2400 } })
await page.goto(`http://localhost:${port}/products/d15r`, { waitUntil: 'load', timeout: 60000 })
await page.waitForTimeout(5000)
const el = await page.$('#video')
if (el) {
  await el.scrollIntoViewIfNeeded()
  await page.waitForTimeout(1500)
  await el.screenshot({ path: 'screenshots/d15r-video-multi.png' })
  console.log('video section captured')
} else {
  console.log('NO #video section')
}
await browser.close()
