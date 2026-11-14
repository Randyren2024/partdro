<script setup lang="ts">
import U15Landing from '../../../landing/u15/src/App.vue'
import { contentFor } from '../../../landing/u15/src/lib/i18n'
import { imageSize, media, ogImage } from '../../../landing/u15/src/data/media'
import '../../../landing/u15/src/styles/base.css'
import '../../../landing/u15/src/styles/shell.css'
import '../../../landing/u15/src/styles/u15.css'

definePageMeta({ layout: false })

const { locale } = useI18n()
const route = useRoute()
const origin = 'https://www.droneworld.tech'
const path = '/products/u15-multi-mission-drone'
const locales = ['en', 'de', 'es', 'fr']
const localeCode = computed(() => {
  const value = String(locale.value || 'en').toLowerCase().split('-')[0]
  return locales.includes(value) ? value : 'en'
})
const content = computed(() => contentFor(localeCode.value))
const localizedPath = computed(() => localeCode.value === 'en' ? path : `/${localeCode.value}${path}`)
const search = computed(() => {
  const fullPath = String(route.fullPath || '')
  const index = fullPath.indexOf('?')
  return index >= 0 ? fullPath.slice(index) : ''
})
const absoluteOgImage = `${origin}${ogImage}`
const ogDimensions = imageSize('og')
const allContent = Object.fromEntries(locales.map(code => [code, contentFor(code)]))

const structuredData = computed(() => ({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Product',
      '@id': `${origin}${localizedPath.value}#product`,
      name: content.value.meta.productName,
      alternateName: 'PD-U15',
      sku: 'PD-U15',
      model: 'PD-U15',
      description: content.value.meta.description,
      image: [absoluteOgImage],
      url: `${origin}${localizedPath.value}`,
      category: 'Multi-mission industrial drone',
      brand: { '@type': 'Brand', name: 'Partdro' },
      additionalProperty: [
        { '@type': 'PropertyValue', name: 'Max payload', value: '15 kg' },
        { '@type': 'PropertyValue', name: 'Endurance, no payload', value: '75 min' },
        { '@type': 'PropertyValue', name: 'Endurance, full payload', value: '31 min' },
        { '@type': 'PropertyValue', name: 'Communication range', value: '15 km' },
        { '@type': 'PropertyValue', name: 'Service ceiling', value: '5,000 m' },
        { '@type': 'PropertyValue', name: 'Wheelbase', value: '1,300 mm' },
        { '@type': 'PropertyValue', name: 'Ingress protection', value: 'IP55' },
        { '@type': 'PropertyValue', name: 'Operating temperature', value: '-20 °C to 50 °C' },
        { '@type': 'PropertyValue', name: 'Compatible payloads', value: '12' }
      ]
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${origin}${localizedPath.value}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: content.value.seo.breadcrumbHome, item: `${origin}${localeCode.value === 'en' ? '/' : `/${localeCode.value}`}` },
        { '@type': 'ListItem', position: 2, name: content.value.seo.breadcrumbProducts, item: `${origin}${localeCode.value === 'en' ? '/products' : `/${localeCode.value}/products`}` },
        { '@type': 'ListItem', position: 3, name: content.value.seo.breadcrumbCurrent, item: `${origin}${localizedPath.value}` }
      ]
    },
    {
      '@type': 'FAQPage',
      '@id': `${origin}${localizedPath.value}#faq`,
      mainEntity: content.value.faq.items.map((item: { q: string; a: string }) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a }
      }))
    },
    {
      '@type': 'Organization',
      '@id': `${origin}/#organization`,
      name: 'Partdro',
      url: `${origin}/`,
      email: 'info@droneworld.tech',
      telephone: '+86 16788684420'
    }
  ]
}))

useHead(() => ({
  title: content.value.meta.title,
  titleTemplate: (title) => title || content.value.meta.title,
  htmlAttrs: { lang: localeCode.value },
  meta: [
    { name: 'description', content: content.value.meta.description },
    { name: 'keywords', content: content.value.meta.keywords },
    { name: 'robots', content: 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1' },
    { name: 'theme-color', content: '#060708' },
    { property: 'og:type', content: 'product' },
    { property: 'og:site_name', content: 'Partdro' },
    { property: 'og:title', content: content.value.meta.title },
    { property: 'og:description', content: content.value.meta.description },
    { property: 'og:url', content: `${origin}${localizedPath.value}` },
    { property: 'og:image', content: absoluteOgImage },
    { property: 'og:image:secure_url', content: absoluteOgImage },
    { property: 'og:image:type', content: 'image/jpeg' },
    { property: 'og:image:width', content: String(ogDimensions.width) },
    { property: 'og:image:height', content: String(ogDimensions.height) },
    { property: 'og:image:alt', content: content.value.hero.imageAlt },
    { property: 'og:locale', content: content.value.meta.ogLocale },
    ...locales.filter(code => code !== localeCode.value).map(code => ({ property: 'og:locale:alternate', content: allContent[code].meta.ogLocale })),
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: content.value.meta.title },
    { name: 'twitter:description', content: content.value.meta.description },
    { name: 'twitter:image', content: absoluteOgImage },
    { name: 'twitter:image:alt', content: content.value.hero.imageAlt }
  ],
  link: [
    { rel: 'canonical', href: `${origin}${localizedPath.value}` },
    ...locales.map(code => ({
      rel: 'alternate',
      hreflang: code,
      href: `${origin}${code === 'en' ? path : `/${code}${path}`}`
    })),
    { rel: 'alternate', hreflang: 'x-default', href: `${origin}${path}` },
    { rel: 'preload', as: 'image', href: media.hero.image, fetchpriority: 'high' }
  ],
  script: [{
    key: 'u15-structured-data',
    type: 'application/ld+json',
    innerHTML: JSON.stringify(structuredData.value).replace(/</g, '\\u003c')
  }]
}))
</script>

<template>
  <U15Landing :locale="localeCode" :search="search" />
</template>
