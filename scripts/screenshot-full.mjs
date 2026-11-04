// VF50P 桌面 + 移动端分区块截图（1440×900 / 390×844）
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

const OUT_DIR = join(process.cwd(), 'screenshots', 'vf50p-audit')
mkdirSync(OUT_DIR, { recursive: true })

const URL =
  process.env.VF50P_URL ||
  'http://localhost:5176/products/vf50p-long-endurance-vtol-uav/'

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 }
]

const SECTIONS = [
  { selector: '.hero', label: '01-hero' },
  { selector: '#vf50p-overview', label: '02-overview' },
  { selector: '#vf50p-architecture', label: '03-architecture' },
  { selector: '#vf50p-endurance', label: '04-endurance' },
  { selector: '.section--safety', label: '05-envelope' },
  { selector: '#vf50p-applications', label: '06-applications' },
  { selector: '.section--video', label: '07-video' },
  { selector: '#vf50p-specs', label: '08-specs' },
  { selector: '#vf50p-faq', label: '09-faq' },
  { selector: '#vf50p-quote', label: '10-quote' },
  { selector: '.notes', label: '11-notes' },
  { selector: 'footer', label: '12-footer' }
]

async function forceVisible(page) {
  await page.evaluate(() => {
    const style = document.createElement('style')
    style.textContent = `
      .reveal { opacity: 1 !important; transform: none !important; }
      .hero__copy > *, .hero__stats { opacity: 1 !important; transform: none !important; }
    `
    document.head.appendChild(style)
  })
}

async function capture(page, vp) {
  await forceVisible(page)
  await page.waitForTimeout(500)

  const fullPath = join(OUT_DIR, `${vp.name}-00-full.png`)
  await page.screenshot({ path: fullPath, fullPage: true })
  console.log(`  ✓ ${vp.name}/00-full`)

  for (const sec of SECTIONS) {
    try {
      const locator = page.locator(sec.selector).first()
      if ((await locator.count()) === 0) {
        console.log(`  ⚠ ${sec.label}: not found (${sec.selector})`)
        continue
      }
      await locator.scrollIntoViewIfNeeded()
      await page.waitForTimeout(350)
      const bounds = await locator.boundingBox()
      if (!bounds) {
        console.log(`  ⚠ ${sec.label}: no bounds`)
        continue
      }
      const pad = 10
      const clip = {
        x: Math.max(0, bounds.x - pad),
        y: Math.max(0, bounds.y - pad),
        width: Math.min(vp.width - Math.max(0, bounds.x - pad), bounds.width + pad * 2),
        height: Math.min(vp.height * 3, bounds.height + pad * 2)
      }
      const path = join(OUT_DIR, `${vp.name}-${sec.label}.png`)
      await page.screenshot({ path, clip })
      console.log(
        `  ✓ ${vp.name}/${sec.label} (${Math.round(clip.width)}×${Math.round(clip.height)})`
      )
    } catch (error) {
      console.log(`  ✗ ${sec.label}: ${error.message}`)
    }
  }
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  for (const vp of VIEWPORTS) {
    console.log(`\n=== ${vp.name} (${vp.width}×${vp.height}) ===`)
    const context = await browser.newContext({ viewport: vp, deviceScaleFactor: 1 })
    const page = await context.newPage()
    try {
      await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 45000 })
      await page.waitForSelector('#app h1', { state: 'attached', timeout: 30000 })
      await page.waitForTimeout(2500)
      await capture(page, vp)
    } catch (error) {
      console.log(`  ✗ Fatal: ${error.message}`)
    }
    await context.close()
  }

  await browser.close()
  console.log('\nDone!')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
