<script setup lang="ts">
import C500Landing from '../../../landing/eavision-c500/src/App.vue'
import { contentFor } from '../../../landing/eavision-c500/src/lib/i18n'
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
const imageUrl = `${origin}${path}/images/og-c500.jpg`

const productJsonLd = computed(() => ({
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: content.value.meta.productName,
  description: content.value.meta.description,
  sku: 'C500',
  category: 'Heavy-lift cargo drone',
  brand: { '@type': 'Brand', name: 'EAVision' },
  manufacturer: { '@type': 'Organization', name: 'EAVision' },
  image: [imageUrl],
  url: `${origin}${localizedPath.value}`,
}))
const breadcrumbJsonLd = computed(() => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${origin}${localeCode.value === 'en' ? '/' : `/${localeCode.value}`}` },
    { '@type': 'ListItem', position: 2, name: 'Products', item: `${origin}${localeCode.value === 'en' ? '/products' : `/${localeCode.value}/products`}` },
    { '@type': 'ListItem', position: 3, name: content.value.meta.productName, item: `${origin}${localizedPath.value}` },
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
    { property: 'og:title', content: content.value.meta.title },
    { property: 'og:description', content: content.value.meta.description },
    { property: 'og:url', content: `${origin}${localizedPath.value}` },
    { property: 'og:image', content: imageUrl },
    { property: 'og:locale', content: content.value.meta.ogLocale },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: content.value.meta.title },
    { name: 'twitter:description', content: content.value.meta.description },
    { name: 'twitter:image', content: imageUrl },
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
  ],
  script: [
    { key: 'c500-product-jsonld', type: 'application/ld+json', innerHTML: JSON.stringify(productJsonLd.value) },
    { key: 'c500-breadcrumb-jsonld', type: 'application/ld+json', innerHTML: JSON.stringify(breadcrumbJsonLd.value) },
  ],
}))
</script>

<template>
  <C500Landing :locale="localeCode" />
</template>
