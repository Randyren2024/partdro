import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

export const SITE_URL = 'https://www.droneworld.tech'
export const BASE_PATH = '/products/vf50p-long-endurance-vtol-uav'
export const ASSET_BASE = `${BASE_PATH}/`
export const LOCALES = ['en']

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

export function localePath(locale, path) {
  return locale === 'en' ? path : `/${locale}${path}`
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
    alternateName: 'PD-VF50P',
    sku: 'PD-VF50P',
    model: 'PD-VF50P',
    description: content.meta.description,
    image: [assetUrl(manifest.og.file)],
    url: canonical,
    category: 'Long-endurance VTOL fixed-wing UAV',
    brand: { '@type': 'Brand', name: 'Partdro' },
    additionalProperty: [
      { '@type': 'PropertyValue', name: 'Max take-off weight', value: '55 kg' },
      { '@type': 'PropertyValue', name: 'Max payload', value: '15 kg' },
      { '@type': 'PropertyValue', name: 'Endurance at 15 kg', value: '3 h' },
      { '@type': 'PropertyValue', name: 'Endurance at 10 kg', value: '5 h' },
      { '@type': 'PropertyValue', name: 'Ground-station range', value: '30 km' },
      { '@type': 'PropertyValue', name: 'Service ceiling', value: '3,000 m' },
      { '@type': 'PropertyValue', name: 'Wingspan', value: '3.8 m' },
      { '@type': 'PropertyValue', name: 'Fuel capacity', value: '12 L' },
      { '@type': 'PropertyValue', name: 'Wind resistance', value: '12 m/s' },
      { '@type': 'PropertyValue', name: 'Operating temperature', value: '-10 °C to 45 °C' },
    ],
  }
}

function faqJsonLd(locale, content) {
  const canonical = absoluteUrl(canonicalPath(locale))
  return {
    '@type': 'FAQPage',
    '@id': `${canonical}#faq`,
    mainEntity: content.faq.items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  }
}

function breadcrumbJsonLd(locale, content) {
  const homePath = '/'
  const productsPath = '/products'
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
      availableLanguage: ['English'],
    },
  }
}

export function buildStructuredData(locale, content, manifest) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      productJsonLd(locale, content, manifest),
      breadcrumbJsonLd(locale, content),
      faqJsonLd(locale, content),
      organizationJsonLd(),
    ],
  }
}

export function buildHead(locale, content, manifest) {
  const canonical = absoluteUrl(canonicalPath(locale))
  const ogImage = assetUrl(manifest.og.file)
  const title = content.meta.title
  const description = content.meta.description

  return [
    `    <title>${escapeHtml(title)}</title>`,
    `    <meta name="description" content="${escapeHtml(description)}" />`,
    `    <meta name="keywords" content="${escapeHtml(content.meta.keywords)}" />`,
    `    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />`,
    `    <link rel="canonical" href="${canonical}" />`,
    `    <meta name="theme-color" content="#060708" />`,
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
    `    <meta name="twitter:card" content="summary_large_image" />`,
    `    <meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `    <meta name="twitter:description" content="${escapeHtml(description)}" />`,
    `    <meta name="twitter:image" content="${ogImage}" />`,
    `    <meta name="twitter:image:alt" content="${escapeHtml(content.hero.imageAlt)}" />`,
    `    ${jsonLdScript(buildStructuredData(locale, content, manifest))}`,
  ].join('\n')
}

export function injectHead(html, locale, content, manifest) {
  const pattern = /<!-- SEO_HEAD_START -->[\s\S]*?<!-- SEO_HEAD_END -->/
  if (!pattern.test(html)) throw new Error('SEO head markers missing from built HTML')
  const block = `<!-- SEO_HEAD_START -->\n${buildHead(
    locale,
    content,
    manifest
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
  for (const line of content.hero.titleLines) {
    expect(html.includes(line), `hero h1 line missing: ${line}`)
  }
  expect((html.match(/id="vf50p-quote"/g) || []).length === 1, 'quote section missing/duplicated')
  expect(html.includes('GTM-KJ7GJ3V5'), 'GTM container missing')
  expect(html.includes(`href="${canonical}"`), 'canonical missing')
  expect(html.includes('id="vf50p-architecture"'), 'architecture section missing')
  expect(html.includes('id="vf50p-endurance"'), 'endurance section missing')
  expect(html.includes('id="vf50p-applications"'), 'applications section missing')
  expect(html.includes('id="vf50p-specs"'), 'specs section missing')
  expect(
    (html.match(/app-card app-card--icon reveal/g) || []).length ===
      content.applications.items.length,
    'application card count mismatch'
  )
  expect(html.includes('demo-flight-poster.webp'), 'demo video poster missing')
  expect(html.includes('id="vf50p-faq"'), 'FAQ section missing')
  for (const item of content.faq.items) {
    expect(html.includes(escapeHtml(item.q)), `FAQ question missing: ${item.q}`)
  }
  for (const row of content.specs.items) {
    expect(html.includes(escapeHtml(row.label)), `spec row missing: ${row.label}`)
  }
  expect(html.includes('wa.me/8616788684420'), 'WhatsApp link missing')
  expect(html.includes('mailto:info@droneworld.tech'), 'Partdro email link missing')
  expect(html.includes('width=device-width'), 'responsive viewport missing')
  expect(!html.includes('user-scalable=no'), 'viewport blocks zoom')
  expect(!html.includes('¥'), 'legacy CNY price leaked')
  expect(!html.includes('undefined'), 'undefined leaked into markup')
  expect(!html.includes('NaN'), 'NaN leaked into markup')
  expect(!html.includes('C500'), 'C500 copy leaked into the VF50P page')

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
      expect(types.includes('FAQPage'), 'FAQPage JSON-LD missing')
      expect(types.includes('Organization'), 'Organization JSON-LD missing')
      for (const node of graph) {
        expect(node.offers === undefined, 'fabricated offers in JSON-LD')
      }
      const product = graph.find((node) => node['@type'] === 'Product')
      expect(product?.sku === 'PD-VF50P', 'Product sku missing')
      const faq = graph.find((node) => node['@type'] === 'FAQPage')
      expect(
        faq?.mainEntity?.length === content.faq.items.length,
        'FAQPage question count mismatch'
      )
    } catch (error) {
      failures.push(`JSON-LD is not valid JSON: ${error.message}`)
    }
  }

  return failures
}
