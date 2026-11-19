<script setup lang="ts">
const route = useRoute()
const { data: supplier, error } = await useFetch<any>(() => `/api/suppliers/${route.params.slug}`)
if (error.value) throw createError({ statusCode: 404, statusMessage: 'Supplier not found' })
useSeoMeta({ title: () => supplier.value?.name_en || supplier.value?.name || 'Supplier', description: () => `UAV supplier profile for ${supplier.value?.name_en || supplier.value?.name || 'manufacturer'}` })
</script>
<template>
  <section class="page-intro"><div class="eyebrow">Supplier profile</div><h1>{{ supplier?.name_en || supplier?.name }}</h1><p>Manufacturer and supplier information from the Drone World catalogue.</p></section>
  <section class="section"><div class="detail-layout"><div class="detail-panel"><h2>Company information</h2><p><strong>Location:</strong> {{ [supplier?.city,supplier?.province,supplier?.region].filter(Boolean).join(', ') }}</p><p><strong>Category:</strong> {{ supplier?.category_label || supplier?.category }}</p><p v-if="supplier?.address"><strong>Address:</strong> {{ supplier.address }}</p><p v-if="supplier?.founded_year"><strong>Founded:</strong> {{ supplier.founded_year }}</p><p v-if="supplier?.website"><strong>Website:</strong> <a :href="supplier.website" target="_blank" rel="noopener noreferrer">{{ supplier.website }}</a></p><p><strong>Known models:</strong> {{ (supplier?.product_models || []).join(', ') || 'Not listed' }}</p></div>
    <div><h2>Published products</h2><div v-if="supplier?.products?.length" class="card-grid" style="grid-template-columns:1fr"><NuxtLink v-for="p in supplier.products" :key="p.id" class="product-card" :to="`/products/${p.slug}`"><div class="product-content"><span class="tag">{{ p.category }}</span><h3>{{ p.name_en || p.name }}</h3><p>{{ p.summary || p.model }}</p></div></NuxtLink></div><div v-else class="empty">No published products are currently linked to this supplier.</div></div>
  </div></section>
</template>
