import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

export const SITE_URL = 'https://www.droneworld.tech'
export const BASE_PATH = '/products/c500-partdro-eavision'
export const ASSET_BASE = `${BASE_PATH}/`
export const LOCALES = ['en', 'es', 'de', 'fr']
export const HERO_VIDEO_HOST = 'https://eavision-front-prod.oss-cn-hangzhou.aliyuncs.com'

const here = fileURLToPath(new URL('.', import.meta.url))
const CONTENT_DIR = `${here}../src/data/content/`

export function loadContent(locale) {
  return JSON.parse(readFileSync(`${CONTENT_DIR}${locale}.json`, 'utf8'))
}

export function loadManifest() {
  return JSON.parse(readFileSync(`${here}../src/data/image-manifest.json`, 'utf8'))
}

export function canonicalPath(locale) {
  return locale === 'en' ? BASE_PATH : `/${locale}${BASE_PATH}`
}

export function absoluteUrl(path) {
  return `${SITE_URL}${path}`
}

export function assetUrl(file) {
  return `${SITE_URL}${ASSET_BASE}${file}`
}

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function jsonLdScript(value) {
  return `<script type="application/ld+json">${JSON.stringify(value).replace(
    /</g,
    '\\u003c'
  )}</script>`
}

function productJsonLd(locale, content, manifest) {
  const canonical = absoluteUrl(canonicalPath(locale))
  return {
    '@type': 'Product',
    '@id': `${canonical}#product`,
    name: content.meta.productName,
    description: content.meta.description,
    image: [assetUrl(manifest.og.file)],
    url: canonical,
    category: 'Heavy-lift cargo drone',
    brand: { '@type': 'Brand', name: 'EAVision' },
    manufacturer: { '@type': 'Organization', name: 'EAVision' },
    additionalProperty: [
      { '@type': 'PropertyValue', name: 'Max payload', value: '240 kg' },
      { '@type': 'PropertyValue', name: 'Max flight speed', value: '90 km/h' },
      { '@type': 'PropertyValue', name: 'Video transmission', value: '4G+ up to 30 km' },
    ],
  }
}

function breadcrumbJsonLd(locale, content) {
  const homePath = locale === 'en' ? '/' : `/${locale}/`
  const productsPath = locale === 'en' ? '/products' : `/${locale}/products`
  const current = absoluteUrl(canonicalPath(locale))
  return {
    '@type': 'BreadcrumbList',
    '@id': `${current}#breadcrumb`,
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: content.seo.breadcrumbHome,
        item: absoluteUrl(homePath),
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: content.seo.breadcrumbProducts,
        item: absoluteUrl(productsPath),
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: content.seo.breadcrumbCurrent,
        item: current,
      },
    ],
  }
}

function organizationJsonLd() {
  return {
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: 'Partdro',
    url: `${SITE_URL}/`,
    email: 'info@droneworld.tech',
    telephone: '+86 16788684420',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'sales',
      email: 'info@droneworld.tech',
      telephone: '+86 16788684420',
      availableLanguage: ['English', 'Spanish', 'German', 'French'],
    },
  }
}

export function buildStructuredData(locale, content, manifest) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      productJsonLd(locale, content, manifest),
      breadcrumbJsonLd(locale, content),
      organizationJsonLd(),
    ],
  }
}

export function buildHead(locale, content, manifest, allContent) {
  const canonical = absoluteUrl(canonicalPath(locale))
  const ogImage = assetUrl(manifest.og.file)
  const title = content.meta.title
  const description = content.meta.description
  const alternates = LOCALES.map((code) => {
    const href = absoluteUrl(canonicalPath(code))
    return `    <link rel="alternate" hreflang="${code}" href="${href}" />`
  })
  alternates.push(
    `    <link rel="alternate" hreflang="x-default" href="${absoluteUrl(
      canonicalPath('en')
    )}" />`
  )

  const ogAlternates = LOCALES.filter((code) => code !== locale).map(
    (code) =>
      `    <meta property="og:locale:alternate" content="${escapeHtml(
        allContent[code].meta.ogLocale
      )}" />`
  )

  return [
    `    <title>${escapeHtml(title)}</title>`,
    `    <meta name="description" content="${escapeHtml(description)}" />`,
    `    <meta name="keywords" content="${escapeHtml(content.meta.keywords)}" />`,
    `    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />`,
    `    <link rel="canonical" href="${canonical}" />`,
    ...alternates,
    `    <meta name="theme-color" content="#080808" />`,
    `    <link rel="icon" href="/favicon.ico" sizes="any" />`,
    `    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />`,
    `    <link rel="preload" as="image" href="${ASSET_BASE}${manifest.hero.file}" type="image/webp" fetchpriority="high" />`,
    `    <meta property="og:type" content="product" />`,
    `    <meta property="og:site_name" content="Partdro" />`,
    `    <meta property="og:title" content="${escapeHtml(title)}" />`,
    `    <meta property="og:description" content="${escapeHtml(description)}" />`,
    `    <meta property="og:url" content="${canonical}" />`,
    `    <meta property="og:image" content="${ogImage}" />`,
    `    <meta property="og:image:secure_url" content="${ogImage}" />`,
    `    <meta property="og:image:type" content="image/jpeg" />`,
    `    <meta property="og:image:width" content="${manifest.og.width}" />`,
    `    <meta property="og:image:height" content="${manifest.og.height}" />`,
    `    <meta property="og:image:alt" content="${escapeHtml(content.hero.imageAlt)}" />`,
    `    <meta property="og:locale" content="${escapeHtml(content.meta.ogLocale)}" />`,
    ...ogAlternates,
    `    <meta name="twitter:card" content="summary_large_image" />`,
    `    <meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `    <meta name="twitter:description" content="${escapeHtml(description)}" />`,
    `    <meta name="twitter:image" content="${ogImage}" />`,
    `    <meta name="twitter:image:alt" content="${escapeHtml(content.hero.imageAlt)}" />`,
    `    ${jsonLdScript(buildStructuredData(locale, content, manifest))}`,
  ].join('\n')
}

export function injectHead(html, locale, content, manifest, allContent) {
  const pattern = /<!-- SEO_HEAD_START -->[\s\S]*?<!-- SEO_HEAD_END -->/
  if (!pattern.test(html)) throw new Error('SEO head markers missing from built HTML')
  const block = `<!-- SEO_HEAD_START -->\n${buildHead(
    locale,
    content,
    manifest,
    allContent
  )}\n    <!-- SEO_HEAD_END -->`
  return html.replace(pattern, block).replace(/<html lang="[^"]*">/, `<html lang="${locale}">`)
}

/** Structural checks used after prerender. Returns a list of human-readable failures. */
export function validatePage(html, locale, content) {
  const failures = []
  const canonical = absoluteUrl(canonicalPath(locale))
  const expect = (condition, message) => {
    if (!condition) failures.push(message)
  }

  expect(html.includes(`<html lang="${locale}"`), `html lang is not ${locale}`)
  expect(
    html.includes(`<title>${escapeHtml(content.meta.title)}</title>`),
    'localized title missing'
  )
  expect(html.includes(content.hero.title), 'localized h1 text missing')
  expect((html.match(/id="c500-quote"/g) || []).length === 1, 'quote section missing/duplicated')
  expect(html.includes('GTM-KJ7GJ3V5'), 'GTM container missing')
  expect(html.includes(`href="${canonical}"`), 'canonical missing')
  expect(html.includes('rel="alternate" hreflang="x-default"'), 'x-default hreflang missing')
  for (const code of LOCALES) {
    expect(html.includes(`hreflang="${code}"`), `hreflang ${code} missing`)
  }
  expect(html.includes('data-package="standard-charger"'), 'package CTA missing')
  expect(html.includes('wa.me/8616788684420'), 'WhatsApp link missing')
  expect(html.includes('mailto:info@droneworld.tech'), 'Partdro email link missing')
  expect(html.includes('info@droneworld.tech'), 'Partdro email missing')
  expect(html.includes('width=device-width'), 'responsive viewport missing')
  expect(!html.includes('user-scalable=no'), 'viewport blocks zoom')
  expect(!html.includes('sales@eavision.com'), 'EAVision sales email leaked')
  expect(!html.includes('¥'), 'legacy CNY price leaked')
  expect(!html.includes("{'|'}"), 'vue-i18n literal escape leaked')

  expect(html.includes(`<meta name="description" content="${escapeHtml(
    content.meta.description
  )}"`), 'localized description missing')

  const ld = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
  expect(ld.length >= 1, 'JSON-LD missing')
  for (const [, raw] of ld) {
    try {
      const parsed = JSON.parse(raw)
      const graph = parsed['@graph'] || [parsed]
      const types = graph.map((node) => node['@type'])
      expect(types.includes('Product'), 'Product JSON-LD missing')
      expect(types.includes('BreadcrumbList'), 'BreadcrumbList JSON-LD missing')
      expect(types.includes('Organization'), 'Organization JSON-LD missing')
      for (const node of graph) {
        expect(node.offers === undefined, 'fabricated offers in JSON-LD')
      }
    } catch (error) {
      failures.push(`JSON-LD is not valid JSON: ${error.message}`)
    }
  }

  return failures
}
