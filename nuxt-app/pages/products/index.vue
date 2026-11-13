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
        <div class="product-grid">
          <div class="product-card" v-for="product in filteredProducts" :key="product.slug">
            <div class="product-card__image">
              <img :src="product.image_url" :alt="product.name" />
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
          <!-- U15 不在 products 表：独立静态落地页，卡片写死并整页跳转。
               All 视图恒显示；分类视图仅在 U15 能合理承担该类目任务时显示。 -->
          <div
            v-if="!activeCategory || U15_VISIBLE_IN.includes(activeCategory)"
            class="product-card"
          >
            <div class="product-card__image">
              <img :src="U15_IMAGE" :alt="t('products.u15.name')" />
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
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { RightOutlined } from '@ant-design/icons-vue'
import { useProducts } from '~/composables/useSupabase'
import { useLocalePath } from '~/composables/useLocalePath'
import { SOLUTIONS, SOLUTION_SLUGS, SOLUTION_UI } from '~/data/solutions'
import { DEFAULT_LOCALE, isLocale } from '~/i18n'
import type { ProductCategory, Lang } from '~/types'

const CATEGORIES: ProductCategory[] = ['agricultural', 'cargo', 'cleaning', 'EVTOL']

// C500 使用独立静态落地页；必须整页跳转，否则 SPA 会按 /products/:slug 渲染产品详情。
const C500_SLUG = 'c500-delivery-drone'
const C500_LANDING_PATH = '/products/c500-partdro-eavision'

// U15 同样是独立静态落地页（landing/u15），也不在 products 表：
// 卡片静态渲染，链接必须是整页跳转（<a href>），否则 SPA 会按 /products/:slug 渲染。
// 它能承担 delivery（15 kg payload）和 inspection / water sampling，所以在 cargo 类目里也显示。
const U15_LANDING_PATH = '/products/u15-multi-mission-drone'
const U15_IMAGE = `${U15_LANDING_PATH}/images/hero.webp`
const U15_VISIBLE_IN: ProductCategory[] = ['cargo']

// VF50P 详情是 landing/vf50p 的独立静态页（四语种），不在 SPA 详情路由中：
// 卡片数据来自 Supabase products 表；CTA 必须整页跳转，并跟随当前语言前缀。
const VF50P_SLUG = 'vf50p-long-endurance-vtol-uav'
const VF50P_LANDING_PATH = '/products/vf50p-long-endurance-vtol-uav'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const lp = useLocalePath()
const { data: products } = useProducts()

const lang = computed<Lang>(() => (isLocale(locale.value) ? locale.value : DEFAULT_LOCALE))
const ui = computed(() => SOLUTION_UI[lang.value])
const solutionLinks = computed(() =>
  SOLUTION_SLUGS.map((slug) => ({ slug, eyebrow: SOLUTIONS[slug][lang.value].eyebrow })),
)

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
.product-filter__tab--active,
.product-filter__tab--active:hover {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
}
.product-solutions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 18px;
  margin: -14px 0 28px;
  font-size: 14px;
}
.product-solutions > span {
  color: var(--color-text-light);
}
.product-solutions a {
  color: var(--color-primary);
  font-weight: 600;
  text-decoration: none;
  border-bottom: 1px dashed rgba(24, 136, 200, 0.4);
}
.product-solutions a:hover {
  border-bottom-style: solid;
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
