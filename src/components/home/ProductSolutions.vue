<template>
  <section class="solutions section">
    <div class="container">
      <h2 class="section-title">{{ t('products.title') }}</h2>
      <p class="section-subtitle">{{ t('products.subtitle') }}</p>

      <div class="solutions__grid">
        <div class="solutions__card" v-for="product in products" :key="product.slug">
          <div class="solutions__card-image">
            <img :src="product.image_url" :alt="product.name" />
            <div class="solutions__card-category">{{ categoryLabel(product.category) }}</div>
          </div>
          <div class="solutions__card-body">
            <h3>{{ product.name }}</h3>
            <p>{{ product.short_desc }}</p>
            <router-link :to="`/products/${product.slug}`" class="solutions__card-link">
              {{ t('products.viewDetails') }}
              <RightOutlined />
            </router-link>
          </div>
        </div>
      </div>

      <div class="solutions__cta">
        <a-button type="primary" size="large" @click="$router.push('/products')">
          {{ t('products.viewAll') }}
        </a-button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { RightOutlined } from '@ant-design/icons-vue'
import { useProducts } from '../../composables/useSupabase'

const { t } = useI18n()
const { data: products } = useProducts()

const categoryLabel = (cat: string) => t(`products.category.${cat}`)
</script>

<style scoped>
.solutions__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 30px;
}
.solutions__card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s, box-shadow 0.3s;
}
.solutions__card:hover {
  transform: translateY(-6px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}
.solutions__card-image {
  position: relative;
  height: 220px;
  overflow: hidden;
}
.solutions__card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s;
}
.solutions__card:hover .solutions__card-image img {
  transform: scale(1.05);
}
.solutions__card-category {
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
.solutions__card-body {
  padding: 24px;
}
.solutions__card-body h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 10px;
  color: var(--color-dark);
}
.solutions__card-body p {
  font-size: 14px;
  color: var(--color-text-light);
  margin-bottom: 16px;
  line-height: 1.7;
}
.solutions__card-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--color-primary);
  font-weight: 500;
  font-size: 14px;
  transition: gap 0.2s;
}
.solutions__card-link:hover {
  gap: 10px;
}
.solutions__cta {
  text-align: center;
  margin-top: 48px;
}

@media (max-width: 992px) {
  .solutions__grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 576px) {
  .solutions__grid {
    grid-template-columns: 1fr;
  }
}
</style>
