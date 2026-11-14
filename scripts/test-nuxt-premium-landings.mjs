import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'
import { contentFor as c500Content } from '../landing/eavision-c500/src/lib/i18n.js'
import { contentFor as vf50pContent } from '../landing/vf50p/src/lib/i18n.js'
import { contentFor as u15Content } from '../landing/u15/src/lib/i18n.js'

const ORIGIN = 'http://127.0.0.1:8793'
const SITE_ORIGIN = 'https://www.droneworld.tech'
const LOCALES = ['en', 'de', 'es', 'fr']
const PRODUCTS = [
  { slug: 'c500-partdro-eavision', formId: 'c500-quote', content: c500Content, hasFaq: false },
  { slug: 'vf50p-long-endurance-vtol-uav', formId: 'vf50p-quote', content: vf50pContent, hasFaq: true },
  { slug: 'u15-multi-mission-drone', formId: 'u15-quote', content: u15Content, hasFaq: true },
]

const server = spawn('npx', ['wrangler', 'pages', 'dev', 'dist', '--ip', '127.0.0.1', '--port', '8793'], {
  stdio: ['ignore', 'pipe', 'pipe'],
  env: { ...process.env, NO_COLOR: '1' },
})
let serverOutput = ''
server.stdout.on('data', chunk => { serverOutput += chunk.toString() })
server.stderr.on('data', chunk => { serverOutput += chunk.toString() })

let browser
let checks = 0

function pass(label) {
  checks += 1
  console.log(`  [ok] ${label}`)
}

function localePath(locale, slug) {
  return `${locale === 'en' ? '' : `/${locale}`}/products/${slug}`
}

function normalize(value) {
  return String(value || '').replace(/\\s+/g, ' ').trim()
}

async function waitForServer() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (server.exitCode !== null) {
      throw new Error(`Wrangler Pages dev exited early:\\n${serverOutput}`)
    }
    try {
      const response = await fetch(`${ORIGIN}/products/c500-partdro-eavision`)
      if (response.ok) return
    } catch {}
    await delay(750)
  }
  throw new Error(`Wrangler Pages dev did not become ready:\\n${serverOutput}`)
}

async function createContext(viewport, responseMode = 'success') {
  const context = await browser.newContext({
    viewport,
    isMobile: viewport.width < 500,
    hasTouch: viewport.width < 500,
    reducedMotion: 'reduce',
  })
  const inquiryRequests = []
  await context.route('https://www.googletagmanager.com/**', route => route.abort())
  await context.route('https://*.clarity.ms/**', route => route.abort())
  await context.route('**/api/inquiry', async route => {
    if (route.request().method() !== 'POST') return route.continue()
    let payload = {}
    try { payload = JSON.parse(route.request().postData() || '{}') } catch {}
    inquiryRequests.push(payload)
    if (responseMode === 'success') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, spam: false }),
      })
    }
    return route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ ok: false, message: 'mock_failure' }),
    })
  })
  return { context, inquiryRequests }
}

async function openProductPage(context, product, locale, viewportLabel) {
  const page = await context.newPage()
  const pageErrors = []
  const failedLocalAssets = []
  page.on('pageerror', error => pageErrors.push(error.message))
  page.on('requestfailed', request => {
    if (request.url().startsWith(ORIGIN) && /\\.(png|jpe?g|webp|svg|mp4)(\\?|$)/i.test(request.url())) {
      failedLocalAssets.push(request.url())
    }
  })

  const path = localePath(locale, product.slug)
  const query = new URLSearchParams({
    gclid: `qa-gclid-${product.slug}`,
    utm_source: 'acceptance-qa',
    utm_medium: 'test',
    utm_campaign: 'nuxt-migration',
    utm_content: product.slug,
  })
  await page.goto(`${ORIGIN}${path}?${query}`, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.locator(`#${product.formId} form.quote__form`).waitFor({ state: 'attached', timeout: 20000 })

  const actual = await page.evaluate(() => ({
    lang: document.documentElement.lang,
    title: document.title,
    description: document.querySelector('meta[name="description"]')?.content || '',
    canonical: document.querySelector('link[rel="canonical"]')?.href || '',
    alternates: [...document.querySelectorAll('link[rel="alternate"][hreflang]')].map(node => node.hreflang),
    h1: document.querySelector('h1')?.textContent || '',
    quote: Boolean(document.querySelector('form.quote__form')),
    footer: Boolean(document.querySelector('footer.site-footer')),
    productSchema: [...document.querySelectorAll('script[type="application/ld+json"]')].some(node => node.textContent.includes('"@type":"Product"')),
    faqSchema: [...document.querySelectorAll('script[type="application/ld+json"]')].some(node => node.textContent.includes('"@type":"FAQPage"')),
    imageCount: document.images.length,
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }))

  const expected = product.content(locale)
  assert.ok(actual.lang.toLowerCase().startsWith(locale), `${product.slug} ${locale}: wrong html lang ${actual.lang}`)
  assert.equal(normalize(actual.title), normalize(expected.meta.title), `${product.slug} ${locale}: title mismatch`)
  assert.equal(normalize(actual.description), normalize(expected.meta.description), `${product.slug} ${locale}: description mismatch`)
  assert.ok(actual.canonical === `${SITE_ORIGIN}${path}`, `${product.slug} ${locale}: unexpected canonical ${actual.canonical}`)
  assert.ok(LOCALES.every(code => actual.alternates.includes(code)) && actual.alternates.includes('x-default'), `${product.slug} ${locale}: missing hreflang alternates`)
  assert.equal(normalize(actual.h1), normalize(expected.hero.title), `${product.slug} ${locale}: H1 mismatch`)
  assert.ok(actual.quote && actual.footer, `${product.slug} ${locale}: quote form or footer missing`)
  assert.ok(actual.productSchema, `${product.slug} ${locale}: Product JSON-LD missing`)
  if (product.hasFaq) assert.ok(actual.faqSchema, `${product.slug} ${locale}: FAQ JSON-LD missing`)
  assert.ok(actual.imageCount > 0, `${product.slug} ${locale}: no images rendered`)
  assert.ok(actual.scrollWidth <= actual.clientWidth + 2, `${product.slug} ${locale}: horizontal overflow ${actual.scrollWidth} > ${actual.clientWidth}`)
  assert.deepEqual(pageErrors, [], `${product.slug} ${locale}: browser errors: ${pageErrors.join('; ')}`)
  assert.deepEqual(failedLocalAssets, [], `${product.slug} ${locale}: failed local media: ${failedLocalAssets.join('; ')}`)
  pass(`${viewportLabel} ${locale} ${product.slug}: localized SSR, SEO, form, footer and no overflow`)
  return page
}

async function fillAndSubmit(page, product) {
  const section = page.locator(`#${product.formId}`)
  await section.scrollIntoViewIfNeeded()
  await section.locator('input[name="name"]').fill('Acceptance QA Lead')
  await section.locator('input[name="email"]').fill('acceptance-qa@example.com')
  await section.locator('input[name="phone"]').fill('+1 555 0100')
  await section.locator('input[name="company"]').fill('Acceptance QA')
  await section.locator('input[name="region"]').fill('Canada')
  await section.locator('textarea[name="message"]').fill('Automated browser test; no real inquiry is stored.')
  const select = section.locator('select').first()
  if (await select.count()) {
    const firstValue = await select.locator('option').evaluateAll(options => options.map(option => option.value).find(Boolean) || '')
    if (firstValue) await select.selectOption(firstValue)
  }
  await section.locator('button[type="submit"]').click()
}

try {
  await waitForServer()
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })

  console.log('\\n[1/3] Mobile route acceptance: all products and locales')
  for (const product of PRODUCTS) {
    for (const locale of LOCALES) {
      const { context } = await createContext({ width: 390, height: 844 })
      const page = await openProductPage(context, product, locale, 'mobile')
      await page.close()
      await context.close()
    }
  }

  console.log('\\n[2/3] Desktop route acceptance: all three products')
  for (const product of PRODUCTS) {
    const { context } = await createContext({ width: 1440, height: 1000 })
    const page = await openProductPage(context, product, 'en', 'desktop')
    await page.close()
    await context.close()
  }

  console.log('\\n[3/3] Mocked inquiry submission and conversion-event acceptance')
  for (const product of PRODUCTS) {
    const { context, inquiryRequests } = await createContext({ width: 390, height: 844 }, 'success')
    const page = await openProductPage(context, product, 'en', 'form-test')
    await fillAndSubmit(page, product)
    await page.locator(`#${product.formId} .quote__success`).waitFor({ state: 'visible', timeout: 15000 })
    assert.equal(inquiryRequests.length, 1, `${product.slug}: expected one inquiry request`)
    const payload = inquiryRequests[0]
    assert.equal(payload.country, 'Canada', `${product.slug}: country was not persisted`)
    assert.equal(payload.product_slug, product.slug, `${product.slug}: wrong product_slug`)
    assert.equal(payload.type, 'contact', `${product.slug}: wrong inquiry type`)
    assert.equal(payload.gclid, `qa-gclid-${product.slug}`, `${product.slug}: gclid attribution missing`)
    assert.equal(payload.utm_source, 'acceptance-qa', `${product.slug}: UTM attribution missing`)
    assert.ok(String(payload.page_path).includes(product.slug), `${product.slug}: page_path missing`)
    const conversion = await page.evaluate(() => (window.dataLayer || []).find(item => item.event === 'contact_form_submission'))
    assert.equal(conversion?.form_type, 'contact', `${product.slug}: success conversion event missing or malformed`)
    pass(`${product.slug}: mocked submit, country, product slug, GCLID/UTM and success event`)
    await context.close()
  }

  const failedProduct = PRODUCTS[2]
  const { context: failedContext, inquiryRequests: failedRequests } = await createContext({ width: 390, height: 844 }, 'failure')
  const failedPage = await openProductPage(failedContext, failedProduct, 'en', 'failure-test')
  await fillAndSubmit(failedPage, failedProduct)
  await failedPage.locator(`#${failedProduct.formId} [role="alert"]`).waitFor({ state: 'visible', timeout: 15000 })
  assert.equal(failedRequests.length, 1, 'failure test: expected one inquiry request')
  const failedConversion = await failedPage.evaluate(() => (window.dataLayer || []).some(item => item.event === 'contact_form_submission'))
  assert.equal(failedConversion, false, 'failure test: conversion fired despite failed inquiry')
  pass('U15: failed inquiry shows an error and does not fire a conversion')
  await failedContext.close()

  console.log(`\\nPASS: ${checks} premium landing browser acceptance checks`)
} catch (error) {
  console.error('\\nFAIL: premium landing browser acceptance')
  console.error(error)
  console.error(serverOutput.slice(-6000))
  process.exitCode = 1
} finally {
  if (browser) await browser.close().catch(() => {})
  if (server.exitCode === null) server.kill('SIGTERM')
}
