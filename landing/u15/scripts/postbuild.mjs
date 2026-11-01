/**
 * Generates the localized entry document from the single Vite HTML output.
 * Run after `vite build` and before prerender.
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { BASE_PATH, LOCALES, injectHead, loadContent, loadManifest } from './seo.mjs'

const SITE_ROOT = fileURLToPath(
  new URL('../../../dist-landing/u15/site/', import.meta.url)
)
const ENTRY_DIR = `${SITE_ROOT}${BASE_PATH.replace(/^\//, '')}/`

const allContent = Object.fromEntries(LOCALES.map((locale) => [locale, loadContent(locale)]))
const manifest = loadManifest()
const baseHtml = readFileSync(`${ENTRY_DIR}/index.html`, 'utf8')

const forbidden = [/¥/, /\bCNY\b/, /\bRMB\b/, /\{'\|'\}/, /C500/]
for (const locale of LOCALES) {
  const serialized = JSON.stringify(allContent[locale])
  for (const pattern of forbidden) {
    if (pattern.test(serialized)) {
      throw new Error(`content/${locale}.json contains forbidden text ${pattern}`)
    }
  }
}

for (const locale of LOCALES) {
  const targetDir = locale === 'en' ? ENTRY_DIR : `${SITE_ROOT}${locale}${BASE_PATH}/`
  if (locale !== 'en') rmSync(targetDir, { recursive: true, force: true })
  mkdirSync(targetDir, { recursive: true })

  const html = injectHead(baseHtml, locale, allContent[locale], manifest)
  writeFileSync(`${targetDir}index.html`, html)
  console.log(
    `[u15 postbuild] ${locale}: ${(Buffer.byteLength(html) / 1024).toFixed(1)} kB -> ${targetDir}index.html`
  )
}

console.log('[u15 postbuild] SEO heads written')
