/**
 * Renders the four localized landing documents with Playwright and writes the
 * resulting DOM back into the static HTML files. External tags, images, video
 * and fonts are blocked so the run is deterministic and needs no network.
 *
 * Run after `vite build` + `postbuild.mjs`:
 *   npm run landing:c500:build
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { startServer } from './serve.mjs'
import {
  BASE_PATH,
  LOCALES,
  canonicalPath,
  loadContent,
  validatePage,
} from './seo.mjs'

const SITE_ROOT = fileURLToPath(
  new URL('../../../dist-landing/c500/site/', import.meta.url)
)
const PORT = Number(process.env.C500_PRERENDER_PORT || 4187)
const READY_TIMEOUT = Number(process.env.C500_PRERENDER_TIMEOUT || 20000)

function fileFor(locale) {
  return locale === 'en'
    ? `${SITE_ROOT}${BASE_PATH.replace(/^\//, '')}/index.html`
    : `${SITE_ROOT}${locale}${BASE_PATH}/index.html`
}

const routes = LOCALES.map((locale) => ({
  locale,
  path: `${canonicalPath(locale)}/`,
  file: fileFor(locale),
}))

const { origin, close } = await startServer({ root: SITE_ROOT, port: PORT })
const browser = await chromium.launch()
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
  userAgent:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
})

// Nothing during prerender may depend on an external network or on decoding media.
await context.route('**/*', (route) => {
  const request = route.request()
  const url = new URL(request.url())
  if (url.origin !== origin) return route.abort()
  if (['image', 'media', 'font'].includes(request.resourceType())) return route.abort()
  return route.continue()
})

const failures = []
const pageErrors = []

try {
  for (const { locale, path, file } of routes) {
    const page = await context.newPage()
    page.on('pageerror', (error) => pageErrors.push(`${locale}: ${error.message}`))

    console.log(`[c500 prerender] ${locale} ${path}`)
    await page.goto(`${origin}${path}`, {
      waitUntil: 'domcontentloaded',
      timeout: READY_TIMEOUT,
    })
    await page.waitForFunction(
      () => document.documentElement.dataset.landingReady === 'true',
      null,
      { timeout: READY_TIMEOUT }
    )
    await page.waitForSelector('#app h1', { state: 'attached', timeout: READY_TIMEOUT })
    await page.waitForSelector('#c500-quote', { state: 'attached', timeout: READY_TIMEOUT })

    const html = await page.evaluate(() => {
      // GTM's inline bootstrap runs while rendering and appends its loader. That
      // loader must not be frozen into the static page (it would load twice).
      document
        .querySelectorAll(
          'script[src*="googletagmanager.com"], script[src*="google-analytics.com"]'
        )
        .forEach((node) => node.remove())

      document.querySelectorAll('.reveal').forEach((node) => node.classList.add('is-visible'))
      document.querySelector('.hero')?.classList.add('hero--ready')

      // Runtime readiness flags must not be frozen into static HTML, otherwise
      // tests and monitors would treat the prerendered shell as fully mounted.
      delete document.documentElement.dataset.landingReady
      delete document.documentElement.dataset.landingLocale

      return '<!doctype html>\n' + document.documentElement.outerHTML
    })

    if (!html.includes('<main')) {
      failures.push(`${locale}: rendered document has no <main>`)
    }

    writeFileSync(file, html)
    const content = loadContent(locale)
    const pageFailures = validatePage(html, locale, content)
    failures.push(...pageFailures.map((failure) => `${locale}: ${failure}`))

    console.log(
      `[c500 prerender] ${locale} wrote ${(Buffer.byteLength(html) / 1024).toFixed(1)} kB`
    )
    await page.close()
  }
} finally {
  await browser.close()
  await close()
}

const unchanged = routes
  .filter(({ file }) => readFileSync(file, 'utf8').includes('<div id="app"></div>'))
  .map(({ locale }) => `${locale}: app root still empty`)

failures.push(...pageErrors, ...unchanged)

if (failures.length) {
  console.error('[c500 prerender] FAILED')
  for (const failure of failures) console.error(`  - ${failure}`)
  process.exit(1)
}

console.log(`[c500 prerender] ${routes.length} localized pages validated`)
