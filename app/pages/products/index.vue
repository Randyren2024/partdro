<script setup lang="ts">
const route = useRoute()
const search = ref(typeof route.query.q === 'string' ? route.query.q : '')
const category = ref(typeof route.query.category === 'string' ? route.query.category : '')
const page = ref(1)
const { data, pending, error } = await useFetch<{items:any[],total:number,page:number,pageSize:number}>('/api/products', {
  query: computed(() => ({ q: search.value, category: category.value, page: page.value, limit: 24 }))
})
watch([search, category], () => { page.value = 1 })
const products = computed(() => data.value?.items ?? [])
const totalPages = computed(() => Math.max(1, Math.ceil((data.value?.total ?? 0) / 24)))
useSeoMeta({ title: 'UAV Products', description: 'Browse published professional UAVs, cargo drones and industrial aircraft.' })
</script>
<template>
  <section class="page-intro"><div class="eyebrow">Product directory</div><h1>UAVs, selected for the real world.</h1><p>Explore published aircraft and industrial drone systems from specialist manufacturers.</p></section>
  <section class="section">
    <div class="toolbar"><input v-model="search" class="field" placeholder="Search model, brand or product…" aria-label="Search products"><select v-model="category" class="field" aria-label="Filter by category"><option value="">All categories</option><option value="agricultural">Agriculture</option><option value="cargo">Cargo & delivery</option><option value="industrial">Industrial</option><option value="cleaning">Cleaning</option><option value="mapping">Mapping</option></select></div>
    <div class="section-head"><p>{{ data?.total ?? 0 }} published products</p></div>
    <div v-if="pending" class="empty">Loading catalogue…</div><div v-else-if="error" class="empty">The catalogue is temporarily unavailable. Please try again.</div>
    <div v-else-if="products.length" class="card-grid"><NuxtLink v-for="item in products" :key="item.id" class="product-card" :to="`/products/${item.slug}`"><div class="product-art"><img v-if="Array.isArray(item.media) && item.media[0]?.url" :src="item.media[0].url" :alt="item.name_en || item.name" loading="lazy"><span v-else>UAV</span></div><div class="product-content"><span class="tag">{{ item.category || 'UAV' }}</span><h3>{{ item.name_en || item.name }}</h3><p>{{ item.summary || item.model || 'Professional unmanned aircraft system' }}</p><div class="card-meta"><span>{{ item.brand || item.product_type || 'UAV' }}</span><span>Details ↗</span></div></div></NuxtLink></div>
    <div v-else class="empty">No published products match this search.</div>
    <div v-if="totalPages > 1" class="pagination"><button class="page-button" :disabled="page <= 1" @click="page--">← Previous</button><span>Page {{ page }} of {{ totalPages }}</span><button class="page-button" :disabled="page >= totalPages" @click="page++">Next →</button></div>
  </section>
</template>
