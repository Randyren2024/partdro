<script setup lang="ts">
const route = useRoute()
const { data: product, error } = await useFetch<any>(() => `/api/products/${route.params.slug}`)
if (error.value) throw createError({ statusCode: 404, statusMessage: 'Product not found' })
const specs = computed(() => Object.entries(product.value?.specifications || {}).filter(([,v]) => v !== null && v !== ''))
const media = computed<any[]>(() => Array.isArray(product.value?.media) ? product.value.media : [])
const imageUrl = (item:any) => typeof item === 'string' ? item : item?.url || item?.image_url || item?.src || ''
useSeoMeta({ title: () => product.value?.name_en || product.value?.name || 'Product', description: () => product.value?.summary || product.value?.description || 'UAV product details' })
</script>
<template>
  <section class="page-intro"><div class="eyebrow">Product details</div><h1>{{ product?.name_en || product?.name }}</h1><p>{{ product?.summary || product?.description }}</p></section>
  <section class="section"><div class="detail-layout">
    <div><div class="product-art" style="height:360px;border-radius:18px;font-size:80px"><img v-if="media.length && imageUrl(media[0])" :src="imageUrl(media[0])" :alt="product?.name_en || product?.name"><span v-else>UAV</span></div>
      <div v-if="media.length > 1" class="card-grid" style="grid-template-columns:repeat(3,1fr);margin-top:12px"><div v-for="(item,i) in media.slice(1,4)" :key="i" class="product-art" style="height:110px"><img v-if="imageUrl(item)" :src="imageUrl(item)" :alt="item?.alt || product?.name"></div></div>
      <div class="detail-panel" style="margin-top:18px"><h2>Overview</h2><p style="color:#718079;line-height:1.8;white-space:pre-line">{{ product?.description || product?.summary || 'Product information is being prepared.' }}</p><h3>Applications</h3><p>{{ (product?.applications || []).join(' · ') || 'Contact us for application details.' }}</p><h3>Features</h3><ul><li v-for="(feature,i) in product?.features || []" :key="i">{{ typeof feature === 'string' ? feature : feature?.name || feature?.title || JSON.stringify(feature) }}</li></ul><NuxtLink class="button-primary" to="/contact">Enquire about this product</NuxtLink></div>
    </div>
    <aside class="detail-panel"><span class="tag">{{ product?.category || 'UAV' }}</span><h2>Technical specifications</h2><div class="spec-grid"><div v-for="[key,value] in specs" :key="key" class="spec"><small>{{ key.replaceAll('_',' ') }}</small><strong>{{ typeof value === 'object' ? JSON.stringify(value) : value }}</strong></div></div>
      <div v-if="product?.supplier" style="margin-top:28px;padding-top:20px;border-top:1px solid #edf0ed"><small style="color:#7b8981">MANUFACTURER</small><h3>{{ product.supplier.name_en || product.supplier.name }}</h3><p>{{ [product.supplier.city,product.supplier.province].filter(Boolean).join(', ') }}</p><NuxtLink v-if="product.supplier.slug" class="text-link" :to="`/suppliers/${product.supplier.slug}`">View supplier ↗</NuxtLink></div>
    </aside>
  </div></section>
</template>
