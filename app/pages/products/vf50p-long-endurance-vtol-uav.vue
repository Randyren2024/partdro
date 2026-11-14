<script setup lang="ts">
import VF50PLanding from '../../../landing/vf50p/src/App.vue'
import { contentFor } from '../../../landing/vf50p/src/lib/i18n'
import { imageSize, media, ogImage } from '../../../landing/vf50p/src/data/media'
import '../../../landing/vf50p/src/styles/base.css'
import '../../../landing/vf50p/src/styles/shell.css'
import '../../../landing/vf50p/src/styles/vf50p.css'
definePageMeta({ layout: false })
const { locale } = useI18n()
const localeCode = computed(() => { const v = String(locale.value || 'en').toLowerCase().split('-')[0]; return ['en','es','de','fr'].includes(v) ? v : 'en' })
const content = computed(() => contentFor(localeCode.value))
const route = useRoute()
const origin = 'https://www.droneworld.tech'
const path = '/products/vf50p-long-endurance-vtol-uav'
const localizedPath = computed(() => localeCode.value === 'en' ? path : `/${localeCode.value}${path}`)
const locales = ['en','es','de','fr']
const imageUrl = `${origin}${ogImage}`
const ogDimensions = imageSize('og')
const allContent = Object.fromEntries(locales.map(code => [code, contentFor(code)]))
const productJsonLd = computed(() => ({
  '@context': 'https://schema.org',
  '@type': 'Product',
  '@id': `${origin}${localizedPath.value}#product`,
  name: content.value.meta.productName,
  alternateName: 'PD-VF50P',
  sku: 'PD-VF50P',
  model: 'PD-VF50P',
  description: content.value.meta.description,
  category: 'Long-endurance VTOL fixed-wing UAV',
  brand: { '@type': 'Brand', name: 'Partdro' },
  manufacturer: { '@type': 'Organization', name: 'Partdro' },
  image: [imageUrl],
  url: `${origin}${localizedPath.value}`,
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
    { '@type': 'PropertyValue', name: 'Operating temperature', value: '-10 °C to 45 °C' }
  ]
}))
const breadcrumbJsonLd = computed(() => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  '@id': `${origin}${localizedPath.value}#breadcrumb`,
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: content.value.seo.breadcrumbHome, item: `${origin}${localeCode.value === 'en' ? '/' : `/${localeCode.value}`}` },
    { '@type': 'ListItem', position: 2, name: content.value.seo.breadcrumbProducts, item: `${origin}${localeCode.value === 'en' ? '/products' : `/${localeCode.value}/products`}` },
    { '@type': 'ListItem', position: 3, name: content.value.seo.breadcrumbCurrent, item: `${origin}${localizedPath.value}` }
  ]
}))
const faqJsonLd = computed(() => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  '@id': `${origin}${localizedPath.value}#faq`,
  mainEntity: content.value.faq.items.map((item: { q: string; a: string }) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: { '@type': 'Answer', text: item.a }
  }))
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
    availableLanguage: ['English', 'Spanish', 'German', 'French']
  }
}
useHead(() => ({
 title:content.value.meta.title,titleTemplate:(title)=>title||content.value.meta.title,htmlAttrs:{lang:localeCode.value},
 meta:[{name:'description',content:content.value.meta.description},{name:'keywords',content:content.value.meta.keywords},{name:'robots',content:'index,follow'},{name:'theme-color',content:'#060708'},{property:'og:type',content:'product'},{property:'og:site_name',content:'Partdro'},{property:'og:title',content:content.value.meta.title},{property:'og:description',content:content.value.meta.description},{property:'og:url',content:`${origin}${localizedPath.value}`},{property:'og:image',content:imageUrl},{property:'og:image:secure_url',content:imageUrl},{property:'og:image:type',content:'image/jpeg'},{property:'og:image:width',content:String(ogDimensions.width)},{property:'og:image:height',content:String(ogDimensions.height)},{property:'og:image:alt',content:content.value.hero.imageAlt},{property:'og:locale',content:content.value.meta.ogLocale},...locales.filter(code=>code!==localeCode.value).map(code=>({property:'og:locale:alternate',content:allContent[code].meta.ogLocale})),{name:'twitter:card',content:'summary_large_image'},{name:'twitter:title',content:content.value.meta.title},{name:'twitter:description',content:content.value.meta.description},{name:'twitter:image',content:imageUrl},{name:'twitter:image:alt',content:content.value.hero.imageAlt}],
 link:[{rel:'canonical',href:`${origin}${localizedPath.value}`},...locales.map(code=>({rel:'alternate',hreflang:code,href:`${origin}${code==='en'?path:`/${code}${path}`}`})),{rel:'alternate',hreflang:'x-default',href:`${origin}${path}`},{rel:'preload',as:'image',href:media.hero.image,fetchpriority:'high'}],
 script:[{key:'vf50p-product-jsonld',type:'application/ld+json',innerHTML:JSON.stringify(productJsonLd.value)},{key:'vf50p-breadcrumb-jsonld',type:'application/ld+json',innerHTML:JSON.stringify(breadcrumbJsonLd.value)},{key:'vf50p-faq-jsonld',type:'application/ld+json',innerHTML:JSON.stringify(faqJsonLd.value)},{key:'vf50p-organization-jsonld',type:'application/ld+json',innerHTML:JSON.stringify(organizationJsonLd)}]
}))
</script>
<template><VF50PLanding :locale="localeCode" :search="String(route.fullPath.includes('?') ? route.fullPath.slice(route.fullPath.indexOf('?')) : '')" /></template>
