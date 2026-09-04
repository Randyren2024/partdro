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
        <div class="product-grid">
          <div class="product-card" v-for="product in filteredProducts" :key="product.slug">
            <div class="product-card__image">
              <img :src="product.image_url" :alt="product.name" />
              <div class="product-card__category">{{ t(`products.category.${product.category}`) }}</div>
            </div>
            <div class="product-card__body">
              <h3>{{ product.name }}</h3>
              <p>{{ product.short_desc }}</p>
              <router-link :to="`/products/${product.slug}`" class="product-card__link">
                {{ t('products.viewDetails') }} <RightOutlined />
              </router-link>
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
import { RightOutlined } from '@ant-design/icons-vue'
import { useProducts } from '../composables/useSupabase'

const { t } = useI18n()
const { data: products } = useProducts()
const filteredProducts = computed(() => products.value ?? [])
</script>

<style scoped>
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
