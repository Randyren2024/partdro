<template>
  <main v-if="region" class="supplier-page">
    <section class="page-header">
      <div class="container">
        <p class="supplier-eyebrow">DRONEWORLD REGIONAL DIRECTORY</p>
        <h1>{{ region.titles[localeKey] }}</h1>
        <p>{{ region.descriptions[localeKey] }}</p>
        <div class="supplier-hero-stats">
          <strong>{{ regionSuppliers.length }}</strong>
          <span>{{ copy.count }}</span>
          <span class="supplier-stat-divider"></span>
          <span>{{ region.names[localeKey] }}</span>
        </div>
      </div>
    </section>
    <section class="page-section">
      <div class="container">
        <p class="supplier-region-intro">{{ copy.regionIntro }}</p>
        <div class="supplier-toolbar">
          <label class="supplier-search">
            <span class="sr-only">{{ copy.search }}</span>
            <input v-model="search" type="search" :placeholder="copy.search" autocomplete="off">
          </label>
          <label class="supplier-filter">
            <span>{{ copy.category }}</span>
            <select v-model="categoryFilter">
              <option value="">{{ copy.allCategories }}</option>
              <option v-for="category in categories" :key="category" :value="category">{{ categoryLabels[category] || category }}</option>
            </select>
          </label>
        </div>
        <div class="supplier-region-links">
          <NuxtLink :to="lp('/suppliers')">{{ copy.back }}</NuxtLink>
          <NuxtLink v-for="item in SUPPLIER_REGIONS" :key="item.slug" :to="lp('/suppliers/' + item.slug)">{{ item.names[localeKey] }}</NuxtLink>
        </div>
        <div class="supplier-results-heading">
          <p aria-live="polite"><strong>{{ filteredSuppliers.length }}</strong> {{ copy.count }}</p>
          <span>{{ copy.updated }}: {{ SUPPLIER_UPDATED }}</span>
        </div>
        <div v-if="filteredSuppliers.length" class="supplier-grid">
          <article v-for="supplier in filteredSuppliers" :key="supplier.id" class="supplier-card" :data-supplier-id="supplier.id">
            <div class="supplier-card__top">
              <span class="supplier-card__category">{{ categoryLabels[supplier.category] || supplier.category_label }}</span>
              <span class="supplier-card__status">{{ supplierProfilePath(supplier.id) ? copy.profileLinked : copy.listed }}</span>
            </div>
            <h2><NuxtLink v-if="supplierProfilePath(supplier.id)" :to="supplierProfilePath(supplier.id)">{{ supplier.name }}</NuxtLink><template v-else>{{ supplier.name }}</template></h2>
            <p class="supplier-card__location">{{ supplier.province }} · {{ supplier.city }}<span v-if="supplier.district && supplier.district !== '—'"> · {{ supplier.district }}</span></p>
            <p class="supplier-card__segment"><strong>{{ copy.capability }}:</strong> {{ supplier.segment }}</p>
            <p v-if="supplier.note" class="supplier-card__note">{{ supplier.note }}</p>
            <p v-if="supplier.product_models?.length" class="supplier-card__models">{{ supplier.product_models.join(' · ') }}</p>
          </article>
        </div>
        <div v-else class="supplier-empty" role="status">
          <h2>{{ copy.empty }}</h2>
          <button type="button" @click="clearFilters">{{ copy.clear }}</button>
        </div>
        <aside class="supplier-source-note">
          <strong>{{ copy.note }}:</strong> {{ copy.source }}
          <span>{{ copy.updated }}: {{ SUPPLIER_UPDATED }}. {{ copy.sourceDetail }}</span>
        </aside>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLocalePath } from '~/composables/useLocalePath'
import {
  SUPPLIERS, SUPPLIER_UPDATED, SUPPLIER_REGIONS, SUPPLIER_UI,
  SUPPLIER_CATEGORY_LABELS, SUPPLIER_CATEGORIES,
} from '~/data/supplier-directory'
import { SUPPLIER_PROFILES } from '~/data/supplier-profiles'
import type { SupplierRecord } from '~/data/supplier-directory'
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '~/i18n'

const route = useRoute()
const { locale } = useI18n()
const lp = useLocalePath()
const region = SUPPLIER_REGIONS.find((item) => item.slug === String(route.params.region))
if (!region) throw createError({ statusCode: 404, statusMessage: 'Supplier region not found' })

const localeKey = computed(() => (['de', 'es', 'fr'].includes(locale.value) ? locale.value : 'en') as 'en' | 'de' | 'es' | 'fr')
const copy = computed(() => SUPPLIER_UI[localeKey.value])
const categoryLabels = computed(() => SUPPLIER_CATEGORY_LABELS[localeKey.value])
const categories = Object.keys(SUPPLIER_CATEGORIES)
const regionSuppliers = computed(() => SUPPLIERS.filter((supplier) => supplier.region === region.key))
const search = ref('')
const categoryFilter = ref('')

const filteredSuppliers = computed(() => {
  const query = search.value.trim().toLocaleLowerCase()
  return regionSuppliers.value.filter((supplier: SupplierRecord) => {
    if (categoryFilter.value && supplier.category !== categoryFilter.value) return false
    if (!query) return true
    const profile = SUPPLIER_PROFILES.find((item) => item.supplierId === supplier.id)
    const searchable = [
      supplier.name, supplier.name_en, supplier.region, supplier.province, supplier.city,
      supplier.district, supplier.segment, supplier.category_label, supplier.note,
      ...(supplier.product_models || []),
      ...(profile?.catalogueModels || []),
    ].filter(Boolean).join(' ').toLocaleLowerCase()
    return searchable.includes(query)
  })
})

function supplierProfilePath(id: string) {
  const profile = SUPPLIER_PROFILES.find((item) => item.supplierId === id)
  return profile ? lp('/suppliers/company/' + profile.slug) : ''
}

function clearFilters() {
  search.value = ''
  categoryFilter.value = ''
}

const siteUrl = useRuntimeConfig().public.siteUrl || 'https://www.droneworld.tech'
const path = '/suppliers/' + region.slug
const canonical = computed(() => siteUrl + lp(path))
const alternates = SUPPORTED_LOCALES.map((language) => ({
  rel: 'alternate',
  hreflang: language,
  href: siteUrl + (language === DEFAULT_LOCALE ? path : '/' + language + path),
}))

useHead(() => ({
  title: region.titles[localeKey.value] + ' | Droneworld.tech',
  titleTemplate: '%s',
  htmlAttrs: { lang: locale.value },
  link: [
    { rel: 'canonical', href: canonical.value },
    ...alternates,
    { rel: 'alternate', hreflang: 'x-default', href: siteUrl + path },
  ],
  meta: [
    { name: 'description', content: region.descriptions[localeKey.value] },
    { name: 'robots', content: 'index, follow, max-image-preview:large' },
    { property: 'og:type', content: 'website' },
    { property: 'og:title', content: region.titles[localeKey.value] },
    { property: 'og:description', content: region.descriptions[localeKey.value] },
    { property: 'og:url', content: canonical.value },
  ],
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: region.names[localeKey.value] + ' UAV Companies',
      description: region.descriptions[localeKey.value],
      url: canonical.value,
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: regionSuppliers.value.length,
        itemListElement: regionSuppliers.value.map((supplier, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: { '@type': 'Organization', name: supplier.name },
        })),
      },
    }),
  }],
}))
</script>

<style scoped>
.supplier-eyebrow { margin:0 0 18px; color:#ff8a4c; font-size:11px; font-weight:750; letter-spacing:.2em; }
.supplier-hero-stats { display:flex; align-items:center; flex-wrap:wrap; gap:10px 14px; margin-top:28px; color:rgba(255,255,255,.7); font-size:12px; }
.supplier-hero-stats strong { color:#fff; font-size:34px; line-height:1; }
.supplier-stat-divider { width:1px; height:16px; background:rgba(255,255,255,.24); }
.supplier-region-intro { max-width:820px; margin:0 0 24px; color:var(--pd-ink-soft); font-size:15px; line-height:1.8; }
.supplier-toolbar { display:grid; grid-template-columns:minmax(220px,1.5fr) minmax(170px,.8fr); gap:14px; margin-bottom:24px; }
.supplier-search input,.supplier-filter select { width:100%; min-height:48px; padding:0 15px; border:1px solid var(--pd-line-strong); border-radius:12px; color:var(--pd-ink); background:var(--pd-surface); font:inherit; }
.supplier-filter { display:grid; gap:6px; color:var(--pd-ink-muted); font-size:12px; font-weight:650; }
.supplier-region-links { display:flex; flex-wrap:wrap; align-items:center; gap:10px 18px; padding:16px 0 22px; border-bottom:1px solid var(--pd-line); color:var(--pd-ink-muted); font-size:13px; }
.supplier-region-links a { color:var(--pd-primary); font-weight:650; text-decoration:none; }
.supplier-results-heading { display:flex; justify-content:space-between; align-items:center; gap:12px; margin:22px 0 16px; color:var(--pd-ink-muted); font-size:13px; }
.supplier-results-heading p { margin:0; }
.supplier-results-heading strong { color:var(--pd-ink); font-size:22px; }
.supplier-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(min(100%,310px),1fr)); gap:16px; }
.supplier-card { min-width:0; padding:21px; border:1px solid var(--pd-line); border-radius:var(--pd-radius-lg); background:var(--pd-surface); box-shadow:var(--pd-shadow-sm); }
.supplier-card__top { display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:8px; margin-bottom:16px; }
.supplier-card__category { padding:5px 9px; border-radius:999px; color:var(--pd-primary); background:color-mix(in srgb,var(--pd-primary) 10%,var(--pd-surface)); font-size:11px; font-weight:750; }
.supplier-card__status { color:var(--pd-ink-muted); font-size:10px; }
.supplier-card h2 :deep(a) { color:inherit; text-decoration:none; }
.supplier-card h2 :deep(a:hover) { color:var(--pd-primary); }
.supplier-card h2 { margin:0 0 9px; color:var(--pd-ink); font-size:18px; line-height:1.4; }
.supplier-card__location { margin:0 0 12px; color:var(--pd-ink-muted); font-size:12px; }
.supplier-card__segment { margin:0; color:var(--pd-ink-soft); font-size:13px; line-height:1.7; }
.supplier-card__segment strong { color:var(--pd-ink); }
.supplier-card__note,.supplier-card__models { margin:10px 0 0; color:var(--pd-ink-muted); font-size:12px; line-height:1.6; }
.supplier-empty { padding:50px 20px; border:1px dashed var(--pd-line-strong); border-radius:var(--pd-radius-lg); text-align:center; color:var(--pd-ink-muted); }
.supplier-empty button { margin-top:12px; padding:10px 18px; border:1px solid var(--pd-line-strong); border-radius:999px; color:var(--pd-ink); background:var(--pd-surface); cursor:pointer; }
.supplier-source-note { display:grid; gap:8px; margin-top:28px; padding:18px 20px; border:1px solid var(--pd-line); border-radius:12px; color:var(--pd-ink-muted); background:var(--pd-bg-soft); font-size:12px; line-height:1.7; }
.supplier-source-note strong { color:var(--pd-ink); }
.sr-only { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }
@media(max-width:760px) { .supplier-toolbar { grid-template-columns:1fr; } .supplier-results-heading { align-items:flex-start; flex-direction:column; } .supplier-card { padding:18px; } }
</style>
