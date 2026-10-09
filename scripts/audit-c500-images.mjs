/** 扫描 C500 页所有图片，找出 404 坏图及其 data-edit-img 键 */
import { chromium } from 'playwright'

const port = process.argv[2] || '5173'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const broken = new Map()
page.on('response', (res) => {
  const url = res.url()
  if (res.status() === 404 && /\.(png|jpe?g|webp|gif|svg)(\?|$)/i.test(url)) {
    broken.set(url, null)
  }
})
await page.goto(`http://localhost:${port}/products/c500-delivery-drone`, { waitUntil: 'networkidle', timeout: 90000 }).catch(() => {})
await page.waitForTimeout(3000)
// 滚动到底触发懒加载
await page.evaluate(async () => {
  for (let y = 0; y < document.body.scrollHeight; y += 800) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 150)) }
})
await page.waitForTimeout(2000)
// 收集 img 元素与 data-edit-img 键的对应
const imgs = await page.evaluate(() =>
  [...document.querySelectorAll('img')].map((el) => ({
    src: el.getAttribute('src'),
    key: el.getAttribute('data-edit-img') || el.closest('[data-edit-img]')?.getAttribute('data-edit-img') || '',
    ok: el.complete && el.naturalWidth > 0,
  })),
)
await browser.close()
console.log('=== 404 responses ===')
for (const u of broken.keys()) console.log('404:', u)
console.log('=== img elements ===')
for (const im of imgs) {
  const status = im.ok ? 'OK ' : 'BAD'
  console.log(`${status} ${im.src}  [${im.key}]`)
}
