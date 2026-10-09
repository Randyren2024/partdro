/** /news 列表 + 一条视频新闻详情截图 */
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const port = process.argv[2] || '5173'
mkdirSync('screenshots/news', { recursive: true })
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

await page.goto(`http://localhost:${port}/news`, { waitUntil: 'load', timeout: 60000 })
await page.waitForTimeout(4000)
await page.screenshot({ path: 'screenshots/news/list.png', fullPage: true })
console.log('news list captured')

await page.goto(`http://localhost:${port}/news/d15r-stadium-facade-cleaning-demo`, { waitUntil: 'load', timeout: 60000 })
await page.waitForTimeout(4000)
await page.screenshot({ path: 'screenshots/news/detail-stadium.png', fullPage: true })
console.log('news detail captured')

await browser.close()
