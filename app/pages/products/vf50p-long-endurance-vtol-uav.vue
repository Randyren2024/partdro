<script setup lang="ts">
import VF50PLanding from '../../../landing/vf50p/src/App.vue'
import { contentFor } from '../../../landing/vf50p/src/lib/i18n'
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
const imageUrl = `${origin}${path}/images/vf50p/vf50p-og.jpg`
const productJsonLd = computed(() => ({ '@context':'https://schema.org','@type':'Product',name:content.value.meta.productName,description:content.value.meta.description,sku:'VF50P',category:'Long-endurance VTOL UAV',brand:{'@type':'Brand',name:'Partdro'},manufacturer:{'@type':'Organization',name:'Partdro'},image:[imageUrl],url:`${origin}${localizedPath.value}` }))
const breadcrumbJsonLd = computed(() => ({ '@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Home',item:`${origin}${localeCode.value === 'en' ? '/' : `/${localeCode.value}`}`},{'@type':'ListItem',position:2,name:'Products',item:`${origin}${localeCode.value === 'en' ? '/products' : `/${localeCode.value}/products`}`},{'@type':'ListItem',position:3,name:content.value.meta.productName,item:`${origin}${localizedPath.value}`}] }))
useHead(() => ({
 title:content.value.meta.title,titleTemplate:(title)=>title||content.value.meta.title,htmlAttrs:{lang:localeCode.value},
 meta:[{name:'description',content:content.value.meta.description},{name:'keywords',content:content.value.meta.keywords},{name:'robots',content:'index,follow'},{name:'theme-color',content:'#060708'},{property:'og:type',content:'product'},{property:'og:title',content:content.value.meta.title},{property:'og:description',content:content.value.meta.description},{property:'og:url',content:`${origin}${localizedPath.value}`},{property:'og:image',content:imageUrl},{property:'og:locale',content:content.value.meta.ogLocale},{name:'twitter:card',content:'summary_large_image'},{name:'twitter:title',content:content.value.meta.title},{name:'twitter:description',content:content.value.meta.description},{name:'twitter:image',content:imageUrl}],
 link:[{rel:'canonical',href:`${origin}${localizedPath.value}`},...locales.map(code=>({rel:'alternate',hreflang:code,href:`${origin}${code==='en'?path:`/${code}${path}`}`})),{rel:'alternate',hreflang:'x-default',href:`${origin}${path}`}],
 script:[{key:'vf50p-product-jsonld',type:'application/ld+json',innerHTML:JSON.stringify(productJsonLd.value)},{key:'vf50p-breadcrumb-jsonld',type:'application/ld+json',innerHTML:JSON.stringify(breadcrumbJsonLd.value)}]
}))
</script>
<template><VF50PLanding :locale="localeCode" :search="String(route.fullPath.includes('?') ? route.fullPath.slice(route.fullPath.indexOf('?')) : '')" /></template>
