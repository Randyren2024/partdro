/**
 * Local end-to-end checks for the built landing pages. Uses the same static
 * server rules as production FC and mocks only the Supabase inquiry endpoint.
 *
 *   npm run landing:c500:test
 */
import { readFileSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { startServer } from './serve.mjs'
import {
  BASE_PATH,
  LOCALES,
  canonicalPath,
  loadContent,
  loadManifest,
} from './seo.mjs'

const SITE_ROOT = fileURLToPath(
  new URL('../../../dist-landing/c500/site/', import.meta.url)
)
const ENTRY = `${SITE_ROOT}${BASE_PATH.replace(/^\//, '')}/index.html`
const PORT = Number(process.env.C500_TEST_PORT || 4188)
const QUERY =
  '?gclid=test-gclid-c500&utm_source=google&utm_medium=cpc&utm_campaign=c500_test&utm_term=cargo%20drone&utm_content=ad_variant_a'

const checks = []
function check(label, condition, detail = '') {
  checks.push({ label, ok: Boolean(condition), detail })
  const status = condition ? 'ok  ' : 'FAIL'
  console.log(`  [${status}] ${label}${condition || !detail ? '' : ` — ${detail}`}`)
}

function sameText(actual, expected) {
  return (actual || '').replace(/\s+/g, ' ').trim() ===
    (expected || '').replace(/\s+/g, ' ').trim()
}

function collectBytes(node, seen = new Set(), total = { bytes: 0 }) {
  if (!node || typeof node !== 'object') return total
  if (node.file && typeof node.bytes === 'number' && !seen.has(node.file)) {
    seen.add(node.file)
    total.bytes += node.bytes
    return total
  }
  for (const value of Object.values(node)) collectBytes(value, seen, total)
  return total
}

const content = Object.fromEntries(LOCALES.map((locale) => [locale, loadContent(locale)]))
const manifest = loadManifest()

const { origin, close } = await startServer({ root: SITE_ROOT, port: PORT })
const browser = await chromium.launch()

let inquiryMock = null
let inquiryRequests = []

async function makeContext(viewport = { width: 1440, height: 900 }) {
  const context = await browser.newContext({ viewport })
  await context.route('**/*', async (route) => {
    const request = route.request()
    const url = new URL(request.url())

    if (url.pathname.endsWith('/rest/v1/inquiries') && inquiryMock) {
      return inquiryMock(route)
    }
    if (url.origin !== origin) return route.abort()
    if (['image', 'media', 'font'].includes(request.resourceType())) return route.abort()
    return route.continue()
  })
  return context
}

async function openPage(context, locale) {
  const page = await context.newPage()
  await page.goto(`${origin}${canonicalPath(locale)}${QUERY}`, {
    waitUntil: 'domcontentloaded',
    timeout: 20000,
  })
  await page.waitForFunction(
    () => document.documentElement.dataset.landingReady === 'true',
    null,
    { timeout: 20000 }
  )
  await page.waitForSelector('#c500-quote', { state: 'attached', timeout: 20000 })
  return page
}

function corsHeaders() {
  return {
    'access-control-allow-origin': '*',
    'access-control-allow-headers': 'apikey, authorization, content-type, prefer',
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-max-age': '600',
  }
}

function mockInquiry(status) {
  inquiryMock = async (route) => {
    const request = route.request()
    if (request.method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: corsHeaders() })
    }
    if (request.method() !== 'POST') {
      return route.fulfill({ status: 405, headers: corsHeaders() })
    }
    inquiryRequests.push({
      headers: request.headers(),
      payload: JSON.parse(request.postData() || '{}'),
    })
    return route.fulfill({
      status,
      headers: { ...corsHeaders(), 'content-type': 'application/json' },
      body: status === 201 ? '' : JSON.stringify({ message: 'mock failure' }),
    })
  }
}

async function fillRequired(page, suffix = '') {
  await page.fill('input[name="name"]', `Test Lead${suffix}`)
  await page.fill('input[name="email"]', `test${suffix || ''}@example.com`)
  await page.fill('input[name="phone"]', '+1 555 0100')
  await page.fill('input[name="company"]', 'Test Drone Co')
  await page.fill('input[name="region"]', 'Canada')
  await page.fill('textarea[name="message"]', 'Please quote two units for delivery this quarter.')
}

try {
  for (const locale of LOCALES) {
    console.log(`\n[${locale}] SEO + shell`)
    const page = await openPage(await makeContext(), locale)
    const copy = content[locale]

    const dom = await page.evaluate(() => ({
      lang: document.documentElement.lang,
      title: document.title,
      description: document.querySelector('meta[name="description"]')?.content,
      canonical: document.querySelector('link[rel="canonical"]')?.href,
      alternates: [...document.querySelectorAll('link[rel="alternate"][hreflang]')].map(
        (node) => ({ lang: node.hreflang, href: node.href })
      ),
      h1: document.querySelector('#app h1')?.textContent,
      quote: Boolean(document.querySelector('#c500-quote')),
      footer: Boolean(document.querySelector('footer.site-footer')),
      packageLinks: document.querySelectorAll('a[data-package]').length,
      footerLanguages: [...document.querySelectorAll('.site-footer__languages a')].map(
        (node) => ({ lang: node.lang, href: node.href })
      ),
      body: document.body.innerText,
      viewport: document.querySelector('meta[name="viewport"]')?.content,
    }))

    check(`${locale}: html lang`, dom.lang === locale, dom.lang)
    check(`${locale}: title`, sameText(dom.title, copy.meta.title), dom.title)
    check(`${locale}: description`, sameText(dom.description, copy.meta.description))
    check(
      `${locale}: canonical`,
      dom.canonical === `https://www.droneworld.tech${canonicalPath(locale)}`,
      dom.canonical
    )
    check(
      `${locale}: five hreflang links`,
      dom.alternates.length === 5 &&
        LOCALES.every((code) => dom.alternates.some((item) => item.lang === code)) &&
        dom.alternates.some((item) => item.lang === 'x-default'),
      JSON.stringify(dom.alternates.map((item) => item.lang))
    )
    check(`${locale}: h1`, sameText(dom.h1, copy.hero.title), dom.h1)
    check(`${locale}: quote section`, dom.quote)
    check(`${locale}: Partdro footer`, dom.footer)
    check(`${locale}: four package CTAs`, dom.packageLinks === 4, String(dom.packageLinks))
    check(
      `${locale}: language links keep gclid/utm`,
      dom.footerLanguages.length === 4 &&
        dom.footerLanguages.every((item) => item.href.includes('gclid=test-gclid-c500')) &&
        dom.footerLanguages.every((item) => item.href.includes('utm_source=google'))
    )
    check(
      `${locale}: no legacy EAVision email/CNY`,
      !dom.body.includes('sales@eavision.com') && !dom.body.includes('¥')
    )
    check(
      `${locale}: viewport allows zoom`,
      dom.viewport?.includes('width=device-width') && !dom.viewport?.includes('user-scalable=no'),
      dom.viewport
    )

    const ld = await page.evaluate(() =>
      [...document.querySelectorAll('script[type="application/ld+json"]')].map((node) =>
        JSON.parse(node.textContent)
      )
    )
    const graph = ld.flatMap((entry) => entry['@graph'] || [entry])
    const types = graph.map((node) => node['@type'])
    const product = graph.find((node) => node['@type'] === 'Product')
    check(
      `${locale}: JSON-LD Product/Breadcrumb/Organization`,
      ['Product', 'BreadcrumbList', 'Organization'].every((type) => types.includes(type))
    )
    check(
      `${locale}: Product brand is EAVision, no offers`,
      product?.brand?.name === 'EAVision' && product?.offers === undefined && product?.name === copy.meta.productName,
      JSON.stringify({ brand: product?.brand, offers: product?.offers })
    )

    await page.close()
  }

  console.log('\n[form] package CTA + successful inquiry')
  mockInquiry(201)
  inquiryRequests = []
  {
    const page = await openPage(await makeContext(), 'en')
    await page.click('a[data-package="standard-charger"]')
    await page.waitForFunction(
      () => document.querySelector('select[name="package"]')?.value === 'standard-charger'
    )
    const selected = await page.inputValue('select[name="package"]')
    check('package CTA preselects package', selected === 'standard-charger', selected)
    const focused = await page
      .waitForFunction(() => document.activeElement?.getAttribute('name') === 'name', null, {
        timeout: 5000,
      })
      .then(() => true)
      .catch(() => false)
    check('package CTA focuses first empty field', focused)

    await fillRequired(page, '-ok')
    await page.click('.quote__submit')
    await page.waitForSelector('.quote__success', { state: 'visible', timeout: 15000 })

    const layer = await page.evaluate(() => window.dataLayer || [])
    const conversions = layer.filter((entry) => entry.event === 'contact_form_submission')
    check('success panel visible', true)
    check('conversion event fired once', conversions.length === 1, String(conversions.length))
    check('conversion form_type=contact', conversions[0]?.form_type === 'contact')
    check('exactly one POST sent', inquiryRequests.length === 1, String(inquiryRequests.length))

    const payload = inquiryRequests[0]?.payload || {}
    check('payload name/email/phone', payload.name === 'Test Lead-ok' && payload.email === 'test-ok@example.com' && payload.phone === '+1 555 0100')
    check('payload type=contact', payload.type === 'contact', payload.type)
    check(
      'payload product slug + page path',
      payload.product_slug === 'c500-partdro-eavision' && payload.page_path === canonicalPath('en'),
      JSON.stringify({ slug: payload.product_slug, page: payload.page_path })
    )
    check(
      'payload gclid/utm attributed',
      payload.gclid === 'test-gclid-c500' &&
        payload.utm_source === 'google' &&
        payload.utm_medium === 'cpc' &&
        payload.utm_campaign === 'c500_test' &&
        payload.utm_term === 'cargo drone' &&
        payload.utm_content === 'ad_variant_a'
    )
    check(
      'payload message has package/company/region/page',
      payload.message?.includes('Package:') &&
        payload.message?.includes('Company: Test Drone Co') &&
        payload.message?.includes('Country / region: Canada') &&
        payload.message?.includes('Page: /products/c500-partdro-eavision'),
      payload.message
    )

    // WhatsApp tracking, with navigation suppressed so the external app is never opened.
    await page.evaluate(() => {
      const link = document.querySelector('.whatsapp-fab')
      link.addEventListener('click', (event) => event.preventDefault(), { capture: true })
      link.click()
    })
    const waEvents = await page.evaluate(() =>
      (window.dataLayer || []).filter((entry) => entry.event === 'whatsapp_chat_initiated')
    )
    check('WhatsApp click tracked', waEvents.length === 1 && waEvents[0].phone === '8616788684420')
    await page.close()
  }

  console.log('\n[form] Supabase failure')
  mockInquiry(500)
  inquiryRequests = []
  {
    const page = await openPage(await makeContext(), 'en')
    await fillRequired(page, '-fail')
    await page.click('.quote__submit')
    await page.waitForSelector('.quote__status--error', { state: 'visible', timeout: 15000 })
    const fallback = await page.getAttribute(
      '.quote__status--error a[href^="mailto:info@droneworld.tech"]',
      'href'
    )
    const conversions = await page.evaluate(
      () => (window.dataLayer || []).filter((entry) => entry.event === 'contact_form_submission')
    )
    check('error panel visible', true)
    check('Partdro email fallback offered', Boolean(fallback), fallback)
    check('no conversion on failure', conversions.length === 0, String(conversions.length))
    check('no success panel on failure', (await page.locator('.quote__success').count()) === 0)
    await page.close()
  }

  console.log('\n[form] honeypot')
  mockInquiry(201)
  inquiryRequests = []
  {
    const page = await openPage(await makeContext(), 'en')
    await fillRequired(page, '-bot')
    await page.fill('input[name="website"]', 'https://spam.example')
    await page.click('.quote__submit')
    await page.waitForSelector('.quote__success', { state: 'visible', timeout: 15000 })
    const conversions = await page.evaluate(
      () => (window.dataLayer || []).filter((entry) => entry.event === 'contact_form_submission')
    )
    check('honeypot sends no inquiry', inquiryRequests.length === 0, String(inquiryRequests.length))
    check('honeypot fires no conversion', conversions.length === 0, String(conversions.length))
    await page.close()
  }

  console.log('\n[mobile] no horizontal overflow')
  {
    const page = await openPage(await makeContext({ width: 390, height: 844 }), 'en')
    const widths = await page.evaluate(() => ({
      viewport: window.innerWidth,
      document: document.documentElement.scrollWidth,
      body: document.body.scrollWidth,
    }))
    check(
      '390px viewport has no horizontal scroll',
      widths.document <= widths.viewport + 1 && widths.body <= widths.viewport + 1,
      JSON.stringify(widths)
    )

    const initiallyHidden = await page.evaluate(() =>
      document.querySelector('.whatsapp-fab')?.classList.contains('whatsapp-fab--hidden')
    )
    check('WhatsApp visible at top of page', !initiallyHidden)

    await page.evaluate(() => {
      const section = document.querySelector('#c500-quote')
      window.scrollTo(0, section.getBoundingClientRect().top + window.scrollY)
    })
    const hiddenAtQuote = await page
      .waitForFunction(
        () =>
          document.querySelector('.whatsapp-fab')?.classList.contains('whatsapp-fab--hidden'),
        null,
        { timeout: 5000 }
      )
      .then(() => true)
      .catch(() => false)
    check('WhatsApp hides over the quote form', hiddenAtQuote)

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    const hiddenAtFooter = await page
      .waitForFunction(
        () =>
          document.querySelector('.whatsapp-fab')?.classList.contains('whatsapp-fab--hidden'),
        null,
        { timeout: 5000 }
      )
      .then(() => true)
      .catch(() => false)
    check('WhatsApp hides over footer language links', hiddenAtFooter)
    await page.close()
  }

  console.log('\n[perf] first screen + image budget')
  {
    const html = readFileSync(ENTRY, 'utf8')
    const assetPaths = [
      ...html.matchAll(
        /(?:src|href)="(\/products\/c500-partdro-eavision\/assets\/[^"]+\.(?:js|css))"/g
      ),
    ].map((match) => match[1])
    const assetBytes = assetPaths.reduce((total, assetPath) => {
      return total + statSync(`${SITE_ROOT}${assetPath.replace(/^\//, '')}`).size
    }, 0)
    const firstScreen =
      Buffer.byteLength(html) + assetBytes + (manifest.hero?.bytes || 0)
    const imageBytes = collectBytes(manifest).bytes
    console.log(
      `  first screen: ${(firstScreen / 1024).toFixed(1)} kB; images: ${(
        imageBytes /
        1024 /
        1024
      ).toFixed(2)} MB`
    )
    check('first screen < 500 kB', firstScreen < 500 * 1024, `${firstScreen} bytes`)
    check('total images < 8 MB', imageBytes < 8 * 1024 * 1024, `${imageBytes} bytes`)
  }
} finally {
  await browser.close()
  await close()
}

const failed = checks.filter((item) => !item.ok)
console.log(`\n[c500 test] ${checks.length - failed.length}/${checks.length} checks passed`)
if (failed.length) {
  for (const item of failed) console.error(`  - ${item.label}${item.detail ? ` (${item.detail})` : ''}`)
  process.exit(1)
}
