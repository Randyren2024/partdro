<script setup lang="ts">
const search = ref('')
const { data, pending, error } = await useFetch<{items:any[],total:number}>('/api/suppliers', { query: computed(() => ({ q: search.value, limit: 200 })) })
const items = computed(() => data.value?.items || [])
useSeoMeta({ title: 'UAV Suppliers', description: 'Discover UAV manufacturers and specialist suppliers across the drone industry.' })
</script>
<template>
  <section class="page-intro"><div class="eyebrow">Manufacturer network</div><h1>Meet the makers behind the machines.</h1><p>Explore UAV manufacturers and specialist suppliers across the industry.</p></section>
  <section class="section"><div class="toolbar"><input v-model="search" class="field" placeholder="Search company or location…" aria-label="Search suppliers"></div><p style="color:#718079;margin-bottom:22px">{{ data?.total ?? 0 }} listed suppliers</p>
    <div v-if="pending" class="empty">Loading suppliers…</div><div v-else-if="error" class="empty">The supplier directory is temporarily unavailable.</div>
    <div v-else-if="items.length" class="card-grid"><NuxtLink v-for="s in items" :key="s.id" class="supplier-card" :to="s.slug ? `/suppliers/${s.slug}` : '/suppliers'"><div class="product-content"><span class="tag">{{ s.category_label || s.category || 'UAV supplier' }}</span><h3>{{ s.name_en || s.name }}</h3><p>{{ [s.city,s.province,s.region].filter(Boolean).join(' · ') }}</p><div class="card-meta"><span>{{ (s.product_models || []).length }} known models</span><span>Company ↗</span></div></div></NuxtLink></div>
    <div v-else class="empty">No suppliers match your search.</div>
  </section>
</template>
