<script setup lang="ts">
import { captureAttribution } from '~/composables/useAttribution'
const config = useRuntimeConfig()
const gtmId = config.public.gtmId as string
onMounted(captureAttribution)
if (gtmId) {
  useHead({
    script: [{
      key: 'gtm-loader',
      innerHTML: `window.dataLayer=window.dataLayer||[];window.dataLayer.push({'gtm.start':new Date().getTime(),event:'gtm.js'});var s=document.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtm.js?id='${gtmId};document.head.appendChild(s);`
    }]
  })
}
</script>

<template>
  <div class="site-shell">
    <header class="site-header">
      <NuxtLink to="/" class="brand" aria-label="Drone World home">
        <img src="/droneworld_favicon.png" alt="" width="34" height="34">
        <span>DRONE WORLD</span>
      </NuxtLink>
      <nav class="main-nav" aria-label="Main navigation">
        <NuxtLink to="/products">Products</NuxtLink>
        <NuxtLink to="/suppliers">Suppliers</NuxtLink>
        <NuxtLink to="/contact">Contact</NuxtLink>
      </nav>
      <NuxtLink class="header-cta" to="/products">Explore catalogue <span>↗</span></NuxtLink>
    </header>
    <main><NuxtPage /></main>
    <footer class="site-footer">
      <NuxtLink to="/" class="footer-brand">DRONE WORLD</NuxtLink>
      <span>Professional UAV catalogue · Powered by supplier data</span>
      <span>© {{ new Date().getFullYear() }} Drone World</span>
    </footer>
  </div>
</template>
