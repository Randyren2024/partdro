<template>
  <section class="solutions section">
    <div class="container">
      <h2 class="section-title">{{ t('products.title') }}</h2>
      <p class="section-subtitle">{{ t('products.subtitle') }}</p>

      <div class="solutions__grid">
        <div class="solutions__card" v-for="product in products" :key="product.slug">
          <div class="solutions__card-image">
            <img :src="product.image_url" :alt="product.name" loading="lazy" decoding="async" width="640" height="420" />
            <div class="solutions__card-category">{{ categoryLabel(product.category) }}</div>
          </div>
          <div class="solutions__card-body">
            <h3>{{ product.name }}</h3>
            <p>{{ product.short_desc }}</p>
            <router-link :to="lp('/products/' + product.slug)" class="solutions__card-link">
              {{ t('products.viewDetails') }}
              <RightOutlined />
            </router-link>
          </div>
        </div>
      </div>

      <div class="solutions__applications">
        <span>{{ ui.browseSolutions }}</span>
        <router-link
          v-for="item in solutionLinks"
          :key="item.slug"
          :to="lp(`/solutions/${item.slug}`)"
        >
          {{ item.eyebrow }}
        </router-link>
      </div>

      <div class="solutions__cta">
        <a-button type="primary" size="large" @click="$router.push(lp('/products'))">
          {{ t('products.viewAll') }}
        </a-button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { RightOutlined } from '@ant-design/icons-vue'
import { useProducts } from '../../composables/useSupabase'
import { useLocalePath } from '../../composables/useLocalePath'
import { SOLUTIONS, SOLUTION_SLUGS, SOLUTION_UI } from '../../data/solutions'
import { DEFAULT_LOCALE, isLocale } from '../../i18n'
import type { Lang } from '../../types'

const { t, locale } = useI18n()
const lp = useLocalePath()
const { data: products } = useProducts()

const lang = computed<Lang>(() => (isLocale(locale.value) ? locale.value : DEFAULT_LOCALE))
const ui = computed(() => SOLUTION_UI[lang.value])
const solutionLinks = computed(() =>
  SOLUTION_SLUGS.map((slug) => ({ slug, eyebrow: SOLUTIONS[slug][lang.value].eyebrow })),
)

const categoryLabel = (cat: string) => t(`products.category.${cat}`)
</script>

<style scoped>
.solutions__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(16px, 2vw, 26px);
}
.solutions__card {
  overflow: hidden;
  border: 1px solid var(--pd-line);
  border-radius: var(--pd-radius-lg);
  background: var(--pd-surface);
  box-shadow: var(--pd-shadow-sm);
  transition: transform .24s ease, box-shadow .24s ease, border-color .24s ease;
}
.solutions__card:hover {
  transform: translateY(-5px);
  border-color: color-mix(in srgb, var(--pd-primary) 42%, var(--pd-line));
  box-shadow: var(--pd-shadow);
}
.solutions__card-image {
  position: relative;
  height: clamp(210px, 22vw, 260px);
  overflow: hidden;
  background: var(--pd-bg-soft);
}
.solutions__card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform .5s ease;
}
.solutions__card:hover .solutions__card-image img {
  transform: scale(1.045);
}
.solutions__card-category {
  position: absolute;
  top: 14px;
  left: 14px;
  padding: 6px 11px;
  border: 1px solid color-mix(in srgb, var(--pd-primary) 42%, rgba(255,255,255,.22));
  border-radius: 999px;
  color: #fff;
  background: rgba(8, 10, 12, .88);
  font-size: 10px;
  font-weight: 750;
  letter-spacing: .09em;
  text-transform: uppercase;
  backdrop-filter: blur(8px);
}
.solutions__card-body {
  display: flex;
  min-height: 205px;
  flex-direction: column;
  align-items: flex-start;
  padding: 22px 23px 24px;
}
.solutions__card-body h3 {
  margin-bottom: 10px;
  color: var(--pd-ink);
  font-size: 21px;
  font-weight: 760;
  letter-spacing: -.025em;
  line-height: 1.2;
}
.solutions__card-body p {
  margin-bottom: 18px;
  color: var(--pd-ink-soft);
  font-size: 14px;
  line-height: 1.7;
}
.solutions__card-link {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-top: auto;
  color: var(--pd-primary);
  font-weight: 750;
  font-size: 14px;
  transition: gap .18s ease;
}
.solutions__card-link:hover {
  gap: 11px;
}
.solutions__applications {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 10px 20px;
  margin-top: 34px;
  color: var(--pd-ink-muted);
  font-size: 14px;
}
.solutions__applications a {
  color: var(--pd-primary);
  font-weight: 650;
  text-decoration: none;
  border-bottom: 1px dashed color-mix(in srgb, var(--pd-primary) 45%, transparent);
}
.solutions__applications a:hover {
  border-bottom-style: solid;
}
.solutions__cta {
  margin-top: 42px;
  text-align: center;
}
.solutions__cta :deep(.ant-btn) {
  height: 48px;
  padding: 0 24px;
  font-weight: 700;
}
@media (max-width: 992px) {
  .solutions__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 576px) {
  .solutions__grid { grid-template-columns: 1fr; }
}
</style>
