<script setup lang="ts">
import C500Landing from '../../../landing/eavision-c500/src/App.vue'
import { contentFor } from '../../../landing/eavision-c500/src/lib/i18n'
import { imageSize, media, ogImage } from '../../../landing/eavision-c500/src/data/media'
import '../../../landing/eavision-c500/src/styles/base.css'
import '../../../landing/eavision-c500/src/styles/c500.css'
import '../../../landing/eavision-c500/src/styles/shell.css'

definePageMeta({ layout: false })

const { locale } = useI18n()
const localeCode = computed(() => {
  const value = String(locale.value || 'en').toLowerCase().split('-')[0]
  return ['en', 'es', 'de', 'fr'].includes(value) ? value : 'en'
})
const content = computed(() => contentFor(localeCode.value))
const origin = 'https://www.droneworld.tech'
const path = '/products/c500-partdro-eavision'
const localizedPath = computed(() => localeCode.value === 'en' ? path : `/${localeCode.value}${path}`)
const locales = ['en', 'es', 'de', 'fr']
const imageUrl = `${origin}${ogImage}`
const ogDimensions = imageSize('og')
const allContent = Object.fromEntries(locales.map(code => [code, contentFor(code)]))

const productJsonLd = computed(() => ({
  '@context': 'https://schema.org',
  '@type': 'Product',
  '@id': `${origin}${localizedPath.value}#product`,
  name: content.value.meta.productName,
  description: content.value.meta.description,
  sku: 'C500',
  category: 'Heavy-lift cargo drone',
  brand: { '@type': 'Brand', name: 'EAVision' },
  manufacturer: { '@type': 'Organization', name: 'EAVision' },
  image: [imageUrl],
  url: `${origin}${localizedPath.value}`,
  additionalProperty: [
    { '@type': 'PropertyValue', name: 'Max payload', value: '240 kg' },
    { '@type': 'PropertyValue', name: 'Max flight speed', value: '90 km/h' },
    { '@type': 'PropertyValue', name: 'Video transmission', value: '4G+ up to 30 km' },
  ],
}))
const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${origin}/#organization`,
  name: 'Partdro',
  url: `${origin}/`,
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
const breadcrumbJsonLd = computed(() => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: content.value.seo.breadcrumbHome, item: `${origin}${localeCode.value === 'en' ? '/' : `/${localeCode.value}`}` },
    { '@type': 'ListItem', position: 2, name: content.value.seo.breadcrumbProducts, item: `${origin}${localeCode.value === 'en' ? '/products' : `/${localeCode.value}/products`}` },
    { '@type': 'ListItem', position: 3, name: content.value.seo.breadcrumbCurrent, item: `${origin}${localizedPath.value}` },
  ],
}))

useHead(() => ({
  title: content.value.meta.title,
  titleTemplate: (title) => title || content.value.meta.title,
  htmlAttrs: { lang: localeCode.value },
  meta: [
    { name: 'description', content: content.value.meta.description },
    { name: 'keywords', content: content.value.meta.keywords },
    { name: 'robots', content: 'index,follow' },
    { name: 'theme-color', content: '#000000' },
    { property: 'og:type', content: 'product' },
    { property: 'og:site_name', content: 'Partdro' },
    { property: 'og:title', content: content.value.meta.title },
    { property: 'og:description', content: content.value.meta.description },
    { property: 'og:url', content: `${origin}${localizedPath.value}` },
    { property: 'og:image', content: imageUrl },
    { property: 'og:image:secure_url', content: imageUrl },
    { property: 'og:image:type', content: 'image/jpeg' },
    { property: 'og:image:width', content: String(ogDimensions.width) },
    { property: 'og:image:height', content: String(ogDimensions.height) },
    { property: 'og:image:alt', content: content.value.hero.imageAlt },
    { property: 'og:locale', content: content.value.meta.ogLocale },
    ...locales.filter(code => code !== localeCode.value).map(code => ({ property: 'og:locale:alternate', content: allContent[code].meta.ogLocale })),
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: content.value.meta.title },
    { name: 'twitter:description', content: content.value.meta.description },
    { name: 'twitter:image', content: imageUrl },
    { name: 'twitter:image:alt', content: content.value.hero.imageAlt },
  ],
  link: [
    { rel: 'canonical', href: `${origin}${localizedPath.value}` },
    ...locales.map(code => ({
      rel: 'alternate',
      hreflang: code,
      href: `${origin}${code === 'en' ? path : `/${code}${path}`}`,
    })),
    { rel: 'alternate', hreflang: 'x-default', href: `${origin}${path}` },
    { rel: 'preconnect', href: 'https://eavision-front-prod.oss-cn-hangzhou.aliyuncs.com', crossorigin: '' },
    { rel: 'preload', as: 'image', href: media.hero.image, fetchpriority: 'high' },
  ],
  script: [
    { key: 'c500-product-jsonld', type: 'application/ld+json', innerHTML: JSON.stringify(productJsonLd.value) },
    { key: 'c500-breadcrumb-jsonld', type: 'application/ld+json', innerHTML: JSON.stringify(breadcrumbJsonLd.value) },
    { key: 'c500-organization-jsonld', type: 'application/ld+json', innerHTML: JSON.stringify(organizationJsonLd) },
  ],
}))
</script>

<template>
  <C500Landing :locale="localeCode" />
</template>
