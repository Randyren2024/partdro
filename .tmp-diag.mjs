import { chromium } from 'playwright'
const b = await chromium.launch()
const p = await b.newPage()
const logs = []
p.on('response', r => { if (r.status() >= 400) logs.push(`[resp ${r.status()}] ${r.url()}`) })
p.on('console', m => logs.push(`[console:${m.type()}] ${m.text().slice(0,150)}`))
p.on('pageerror', e => logs.push(`[pageerror] ${String(e).slice(0,300)}`))
p.on('requestfailed', r => logs.push(`[reqfail] ${r.url()} ${r.failure()?.errorText}`))
try {
  const resp = await p.goto('https://www.droneworld.tech/', { waitUntil: 'domcontentloaded', timeout: 40000 })
  logs.push('[goto] status=' + resp?.status() + ' url=' + p.url())
} catch (e) { logs.push('[goto-err] ' + String(e).slice(0, 250)) }
await p.waitForTimeout(5000)
const info = await p.evaluate(() => ({
  hasApp: !!document.getElementById('app'),
  appChildren: document.getElementById('app')?.children.length ?? -1,
  appHtml: (document.getElementById('app')?.innerHTML || '').slice(0, 300),
  bodyLen: document.body.innerHTML.length,
  title: document.title,
}))
logs.push('[page] ' + JSON.stringify(info))
console.log(logs.join('\n'))
await p.screenshot({ path: process.env.TEMP + '\\diag-blank.png' })
await b.close()
