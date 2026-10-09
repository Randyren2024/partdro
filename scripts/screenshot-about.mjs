/** /about 截图（一次性验证团队区） */
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const port = process.argv[2] || '5173'
mkdirSync('screenshots/about', { recursive: true })
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto(`http://localhost:${port}/about`, { waitUntil: 'load', timeout: 60000 })
await page.waitForTimeout(4000)
const team = page.locator('.team-section')
await team.scrollIntoViewIfNeeded()
await page.waitForTimeout(1000)
await team.screenshot({ path: 'screenshots/about/team.png' })
console.log('about team captured')
await browser.close()
