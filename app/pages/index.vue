<script setup lang="ts">
const { data: products } = await useFetch<{items:any[],total:number}>('/api/products', { query: { limit: 6 } })
const { data: suppliers } = await useFetch<{items:any[],total:number}>('/api/suppliers', { query: { limit: 6 } })
useSeoMeta({ title: 'Professional UAV Catalogue', description: 'Explore professional cargo, agricultural and industrial drones from specialist manufacturers.' })
</script>
<template>
  <section class="hero">
    <div class="eyebrow">Independent UAV catalogue</div>
    <h1>Find the right aircraft for the work that matters.</h1>
    <p>Explore professional unmanned aircraft and specialist manufacturers across cargo, agriculture, cleaning, mapping and industrial applications.</p>
    <div class="hero-actions"><NuxtLink class="button-primary" to="/products">Explore products ↗</NuxtLink><NuxtLink class="button-ghost" to="/suppliers">Meet suppliers</NuxtLink></div>
    <div class="stats"><div class="stat"><strong>{{ products?.total ?? '—' }}</strong><span>Published products</span></div><div class="stat"><strong>{{ suppliers?.total ?? '—' }}</strong><span>Listed suppliers</span></div><div class="stat"><strong>Global</strong><span>UAV applications</span></div></div>
  </section>
  <section class="section">
    <div class="section-head"><div><div class="eyebrow">Catalogue</div><h2>Featured products</h2><p>Published products from our supplier network.</p></div><NuxtLink class="text-link" to="/products">View all products ↗</NuxtLink></div>
    <div v-if="products?.items?.length" class="card-grid"><NuxtLink v-for="p in products.items" :key="p.id" class="product-card" :to="`/products/${p.slug}`"><div class="product-art"><img v-if="Array.isArray(p.media) && p.media[0]?.url" :src="p.media[0].url" :alt="p.name_en || p.name" loading="lazy"><span v-else>UAV</span></div><div class="product-content"><span class="tag">{{ p.category || 'UAV' }}</span><h3>{{ p.name_en || p.name }}</h3><p>{{ p.summary || p.model || 'Professional unmanned aircraft system' }}</p></div></NuxtLink></div>
    <div v-else class="empty">Product catalogue is loading or no products are published yet.</div>
  </section>
  <section class="section">
    <div class="section-head"><div><div class="eyebrow">Manufacturer network</div><h2>Meet the suppliers</h2><p>Discover specialist manufacturers and their capabilities.</p></div><NuxtLink class="text-link" to="/suppliers">View all suppliers ↗</NuxtLink></div>
    <div v-if="suppliers?.items?.length" class="card-grid"><NuxtLink v-for="s in suppliers.items" :key="s.id" class="supplier-card" :to="s.slug ? `/suppliers/${s.slug}` : '/suppliers'"><div class="product-content"><span class="tag">{{ s.category_label || s.category || 'UAV supplier' }}</span><h3>{{ s.name_en || s.name }}</h3><p>{{ [s.city,s.province,s.region].filter(Boolean).join(' · ') }}</p></div></NuxtLink></div>
  </section>
</template>
