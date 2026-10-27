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
        <div class="product-filter">
          <button
            class="product-filter__tab"
            :class="{ 'product-filter__tab--active': !activeCategory }"
            @click="setCategory(null)"
          >
            {{ t('products.all') }}
          </button>
          <button
            v-for="cat in CATEGORIES"
            :key="cat"
            class="product-filter__tab"
            :class="{ 'product-filter__tab--active': activeCategory === cat }"
            @click="setCategory(cat)"
          >
            {{ t(`products.category.${cat}`) }}
          </button>
        </div>
        <div class="product-grid">
          <div class="product-card" v-for="product in filteredProducts" :key="product.slug">
            <div class="product-card__image">
              <img :src="product.image_url" :alt="product.name" />
              <div class="product-card__category">{{ t(`products.category.${product.category}`) }}</div>
            </div>
            <div class="product-card__body">
              <h3>{{ product.name }}</h3>
              <p>{{ product.short_desc }}</p>
              <router-link
                v-if="product.slug !== C500_SLUG"
                :to="lp('/products/' + product.slug)"
                class="product-card__link"
              >
                {{ t('products.viewDetails') }} <RightOutlined />
              </router-link>
              <a v-else :href="lp(C500_LANDING_PATH)" class="product-card__link">
                {{ t('products.viewDetails') }} <RightOutlined />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { RightOutlined } from '@ant-design/icons-vue'
import { useProducts } from '../composables/useSupabase'
import { useLocalePath } from '../composables/useLocalePath'
import type { ProductCategory } from '../types'

const CATEGORIES: ProductCategory[] = ['agricultural', 'cargo', 'cleaning']

// C500 使用独立静态落地页；必须整页跳转，否则 SPA 会渲染成本地开发回退页。
const C500_SLUG = 'c500-delivery-drone'
const C500_LANDING_PATH = '/products/c500-partdro-eavision'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const lp = useLocalePath()
const { data: products } = useProducts()

const activeCategory = computed<ProductCategory | null>(() =>
  CATEGORIES.includes(route.query.category as ProductCategory)
    ? (route.query.category as ProductCategory)
    : null
)

const filteredProducts = computed(() =>
  (products.value ?? []).filter(p => !activeCategory.value || p.category === activeCategory.value)
)

const setCategory = (cat: ProductCategory | null) => {
  router.replace({ query: { ...route.query, category: cat ?? undefined } })
}
</script>

<style scoped>
.product-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 32px;
}
.product-filter__tab {
  padding: 8px 20px;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: #fff;
  color: var(--color-text);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
.product-filter__tab:hover {
  color: var(--color-primary);
  border-color: var(--color-primary);
}
.product-filter__tab--active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
}
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 30px;
}
.product-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s, box-shadow 0.3s;
}
.product-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}
.product-card__image {
  position: relative;
  height: 220px;
  overflow: hidden;
}
.product-card__image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.product-card__category {
  position: absolute;
  top: 12px;
  left: 12px;
  background: var(--color-primary);
  color: #fff;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}
.product-card__body {
  padding: 24px;
}
.product-card__body h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 10px;
}
.product-card__body p {
  font-size: 14px;
  color: var(--color-text-light);
  margin-bottom: 16px;
  line-height: 1.7;
}
.product-card__link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--color-primary);
  font-weight: 500;
}
</style>
