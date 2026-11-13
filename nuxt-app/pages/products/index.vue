<template>
  <div class="products-page">
    <div class="page-header">
      <div class="container">
        <h1>{{ t('products.title') }}</h1>
        <p>{{ t('products.subtitle') }}</p>
      </div>
    </div>

    <div class="page-section">
      <div class="container">
        <div class="catalog-toolbar">
          <div class="catalog-search">
            <a-input-search
              v-model:value="searchQuery"
              :placeholder="t('products.searchPlaceholder')"
              enter-button
              allow-clear
              size="large"
              @search="applySearch"
            />
          </div>
          <p class="catalog-count" aria-live="polite">{{ resultCount }} {{ t('products.results') }}</p>
        </div>

        <div class="product-filter" role="group" :aria-label="t('products.all')">
          <button
            class="product-filter__tab"
            :class="{ 'product-filter__tab--active': !activeCategory }"
            :aria-pressed="!activeCategory"
            @click="setCategory(null)"
          >
            {{ t('products.all') }}
          </button>
          <button
            v-for="cat in CATEGORIES"
            :key="cat"
            class="product-filter__tab"
            :class="{ 'product-filter__tab--active': activeCategory === cat }"
            :aria-pressed="activeCategory === cat"
            @click="setCategory(cat)"
          >
            {{ t(`products.category.${cat}`) }}
          </button>
        </div>

        <nav class="product-solutions" :aria-label="ui.browseSolutions">
          <span>{{ ui.browseSolutions }}</span>
          <router-link
            v-for="item in solutionLinks"
            :key="item.slug"
            :to="lp(`/solutions/${item.slug}`)"
          >
            {{ item.eyebrow }}
          </router-link>
        </nav>

        <div v-if="filteredProducts.length || showU15" class="product-grid">
          <div class="product-card" v-for="product in filteredProducts" :key="product.slug">
            <div class="product-card__image">
              <img :src="product.image_url" :alt="product.name" loading="lazy" />
              <div class="product-card__category">{{ t(`products.category.${product.category}`) }}</div>
            </div>
            <div class="product-card__body">
              <h3>{{ product.name }}</h3>
              <p>{{ product.short_desc }}</p>
              <a v-if="product.slug === VF50P_SLUG" :href="lp(VF50P_LANDING_PATH)" class="product-card__link">
                {{ t('products.viewDetails') }} <RightOutlined />
              </a>
              <a v-else-if="product.slug === C500_SLUG" :href="lp(C500_LANDING_PATH)" class="product-card__link">
                {{ t('products.viewDetails') }} <RightOutlined />
              </a>
              <router-link v-else :to="lp('/products/' + product.slug)" class="product-card__link">
                {{ t('products.viewDetails') }} <RightOutlined />
              </router-link>
            </div>
          </div>

          <div v-if="showU15" class="product-card">
            <div class="product-card__image">
              <img :src="U15_IMAGE" :alt="t('products.u15.name')" loading="lazy" />
              <div class="product-card__category">{{ t('products.u15.category') }}</div>
            </div>
            <div class="product-card__body">
              <h3>{{ t('products.u15.name') }}</h3>
              <p>{{ t('products.u15.desc') }}</p>
              <a :href="lp(U15_LANDING_PATH)" class="product-card__link">
                {{ t('products.viewDetails') }} <RightOutlined />
              </a>
            </div>
          </div>
        </div>

        <div v-else class="catalog-empty">
          <div class="catalog-empty__mark">⌕</div>
          <h2>{{ t('products.noResults') }}</h2>
          <p>{{ t('products.noResultsHint') }}</p>
          <a-button @click="clearFilters">{{ t('products.clearFilters') }}</a-button>
          <a-button type="primary" @click="$router.push(lp('/contact'))">{{ t('nav.contact') }}</a-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { RightOutlined } from '@ant-design/icons-vue'
import { useProducts } from '~/composables/useSupabase'
import { useLocalePath } from '~/composables/useLocalePath'
import { SOLUTIONS, SOLUTION_SLUGS, SOLUTION_UI } from '~/data/solutions'
import { DEFAULT_LOCALE, isLocale } from '~/i18n'
import type { ProductCategory, Lang } from '~/types'

const CATEGORIES: ProductCategory[] = ['agricultural', 'cargo', 'cleaning', 'EVTOL']
const C500_SLUG = 'c500-delivery-drone'
const C500_LANDING_PATH = '/products/c500-partdro-eavision'
const U15_LANDING_PATH = '/products/u15-multi-mission-drone'
const U15_IMAGE = `${U15_LANDING_PATH}/images/hero.webp`
const U15_VISIBLE_IN: ProductCategory[] = ['cargo']
const VF50P_SLUG = 'vf50p-long-endurance-vtol-uav'
const VF50P_LANDING_PATH = '/products/vf50p-long-endurance-vtol-uav'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const lp = useLocalePath()
const { data: products } = useProducts()
const searchQuery = ref(typeof route.query.q === 'string' ? route.query.q : '')

const lang = computed<Lang>(() => (isLocale(locale.value) ? locale.value : DEFAULT_LOCALE))
const ui = computed(() => SOLUTION_UI[lang.value])
const solutionLinks = computed(() =>
  SOLUTION_SLUGS.map((slug) => ({ slug, eyebrow: SOLUTIONS[slug][lang.value].eyebrow })),
)

const activeCategory = computed<ProductCategory | null>(() =>
  CATEGORIES.includes(route.query.category as ProductCategory)
    ? (route.query.category as ProductCategory)
    : null,
)

watch(() => route.query.q, (value) => {
  searchQuery.value = typeof value === 'string' ? value : ''
})

const normalizedQuery = computed(() => searchQuery.value.trim().toLocaleLowerCase())

function matchesQuery(values: Array<string | undefined | null>) {
  if (!normalizedQuery.value) return true
  return values.some((value) => (value ?? '').toLocaleLowerCase().includes(normalizedQuery.value))
}

const filteredProducts = computed(() =>
  (products.value ?? []).filter((product) => {
    if (activeCategory.value && product.category !== activeCategory.value) return false
    const specText = Object.entries(product.specs ?? {})
      .flatMap(([key, value]) => [key, String(value)])
    return matchesQuery([
      product.name,
      product.slug,
      product.short_desc,
      product.description,
      product.category,
      ...specText,
    ])
  }),
)

const showU15 = computed(() => {
  const categoryMatches = !activeCategory.value || U15_VISIBLE_IN.includes(activeCategory.value)
  return categoryMatches && matchesQuery([
    t('products.u15.name'),
    t('products.u15.category'),
    t('products.u15.desc'),
    'U15 15kg payload 75 minutes endurance delivery inspection water sampling',
  ])
})

const resultCount = computed(() => filteredProducts.value.length + (showU15.value ? 1 : 0))

function applySearch() {
  const query = searchQuery.value.trim()
  router.replace({ query: { ...route.query, q: query || undefined } })
}

function setCategory(category: ProductCategory | null) {
  router.replace({ query: { ...route.query, category: category ?? undefined } })
}

function clearFilters() {
  searchQuery.value = ''
  router.replace({ query: { ...route.query, q: undefined, category: undefined } })
}
</script>

<style scoped>
.catalog-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 24px;
}
.catalog-search {
  width: min(100%, 520px);
}
.catalog-search :deep(.ant-input-group .ant-input),
.catalog-search :deep(.ant-input-search-button) {
  min-height: 46px;
}
.catalog-search :deep(.ant-input-search-button) {
  border-radius: 0 999px 999px 0 !important;
}
.catalog-search :deep(.ant-input-affix-wrapper) {
  border-radius: 999px 0 0 999px;
}
.catalog-count {
  color: var(--pd-ink-muted);
  font-size: 13px;
  white-space: nowrap;
}
.product-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
  margin-bottom: 30px;
}
.product-filter__tab {
  padding: 8px 18px;
  border: 1px solid var(--pd-line);
  border-radius: 999px;
  background: var(--pd-surface);
  color: var(--pd-ink-soft);
  font-size: 13px;
  font-weight: 650;
  cursor: pointer;
  transition: color .18s ease, border-color .18s ease, background .18s ease, transform .18s ease;
}
.product-filter__tab:hover {
  color: var(--pd-primary);
  border-color: var(--pd-primary);
  transform: translateY(-1px);
}
.product-filter__tab--active,
.product-filter__tab--active:hover {
  color: var(--pd-on-primary);
  background: var(--pd-primary);
  border-color: var(--pd-primary);
}
.product-solutions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 18px;
  margin: -8px 0 26px;
  color: var(--pd-ink-muted);
  font-size: 13px;
}
.product-solutions a {
  color: var(--pd-primary);
  font-weight: 650;
  border-bottom: 1px dashed color-mix(in srgb, var(--pd-primary) 45%, transparent);
}
.product-solutions a:hover {
  border-bottom-style: solid;
}
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 310px), 1fr));
  gap: clamp(16px, 2vw, 26px);
}
.product-card {
  overflow: hidden;
  border: 1px solid var(--pd-line);
  border-radius: var(--pd-radius-lg);
  background: var(--pd-surface);
  box-shadow: var(--pd-shadow-sm);
  transition: transform .24s ease, box-shadow .24s ease, border-color .24s ease;
}
.product-card:hover {
  transform: translateY(-5px);
  border-color: color-mix(in srgb, var(--pd-primary) 42%, var(--pd-line));
  box-shadow: var(--pd-shadow);
}
.product-card__image {
  position: relative;
  height: clamp(210px, 22vw, 260px);
  overflow: hidden;
  background: var(--pd-bg-soft);
}
.product-card__image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform .5s ease;
}
.product-card:hover .product-card__image img {
  transform: scale(1.045);
}
.product-card__category {
  position: absolute;
  top: 14px;
  left: 14px;
  padding: 6px 11px;
  border: 1px solid rgba(255,255,255,.22);
  border-radius: 999px;
  color: #fff;
  background: rgba(8, 35, 40, .82);
  font-size: 10px;
  font-weight: 750;
  letter-spacing: .09em;
  text-transform: uppercase;
  backdrop-filter: blur(8px);
}
.product-card__body {
  display: flex;
  min-height: 210px;
  flex-direction: column;
  align-items: flex-start;
  padding: 22px 23px 24px;
}
.product-card__body h3 {
  margin-bottom: 9px;
  color: var(--pd-ink);
  font-size: 21px;
  font-weight: 760;
  letter-spacing: -.025em;
  line-height: 1.2;
}
.product-card__body p {
  margin-bottom: 18px;
  color: var(--pd-ink-soft);
  font-size: 14px;
  line-height: 1.7;
}
.product-card__link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: auto;
  color: var(--pd-primary);
  font-size: 14px;
  font-weight: 750;
  transition: gap .18s ease;
}
.product-card__link:hover {
  gap: 12px;
}
.catalog-empty {
  display: flex;
  min-height: 300px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 44px 20px;
  border: 1px dashed var(--pd-line-strong);
  border-radius: var(--pd-radius-lg);
  background: var(--pd-surface);
  text-align: center;
}
.catalog-empty__mark {
  display: grid;
  width: 54px;
  height: 54px;
  place-items: center;
  margin-bottom: 16px;
  border-radius: 50%;
  color: var(--pd-primary);
  background: var(--pd-bg-soft);
  font-size: 32px;
}
.catalog-empty h2 {
  margin-bottom: 8px;
  color: var(--pd-ink);
  font-size: 24px;
}
.catalog-empty p {
  margin-bottom: 20px;
  color: var(--pd-ink-soft);
}
.catalog-empty :deep(.ant-btn) {
  margin: 4px;
}
@media (max-width: 640px) {
  .catalog-toolbar {
    align-items: stretch;
    flex-direction: column;
    gap: 10px;
  }
  .catalog-search { width: 100%; }
  .catalog-count { text-align: right; }
  .product-grid { grid-template-columns: 1fr; }
}
</style>
