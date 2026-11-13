<template>
  <div v-if="copy" class="solution-page">
    <header class="solution-hero">
      <div class="container solution-hero__inner">
        <div class="solution-hero__copy">
          <p class="solution-hero__eyebrow">{{ copy.eyebrow }}</p>
          <h1>{{ copy.title }}</h1>
          <p class="solution-hero__lead">{{ copy.lead }}</p>
          <div class="solution-hero__actions">
            <router-link :to="lp('/contact')" class="solution-btn solution-btn--primary">
              {{ copy.cta.button }}
            </router-link>
            <a href="#products" class="solution-btn solution-btn--ghost">{{ ui.products }}</a>
          </div>
        </div>
        <div class="solution-hero__media">
          <img :src="copy.heroImage" :alt="copy.title" fetchpriority="high" />
        </div>
      </div>
    </header>

    <section class="solution-section">
      <div class="container">
        <ul class="solution-outcomes">
          <li v-for="item in copy.outcomes" :key="item.label">
            <strong>{{ item.value }}</strong>
            <span>{{ item.label }}</span>
            <p>{{ item.desc }}</p>
          </li>
        </ul>
      </div>
    </section>

    <section id="products" class="solution-section solution-section--muted">
      <div class="container">
        <h2 class="solution-title">{{ ui.products }}</h2>
        <div class="solution-products">
          <router-link
            v-for="product in solutionProducts"
            :key="product.slug"
            :to="lp(`/products/${product.slug}`)"
            class="solution-product"
          >
            <img :src="product.image_url" :alt="product.name" loading="lazy" />
            <div class="solution-product__body">
              <h3>{{ product.name }}</h3>
              <p>{{ product.short_desc }}</p>
              <span>{{ ui.viewProduct }} →</span>
            </div>
          </router-link>
        </div>
      </div>
    </section>

    <section class="solution-section">
      <div class="container">
        <h2 class="solution-title">{{ ui.applications }}</h2>
        <div class="solution-apps">
          <div v-for="item in copy.applications" :key="item.title" class="solution-app">
            <h3>{{ item.title }}</h3>
            <p>{{ item.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="solution-section solution-section--muted">
      <div class="container solution-faq">
        <h2 class="solution-title">{{ ui.faq }}</h2>
        <details v-for="item in copy.faq" :key="item.q" class="solution-faq__item">
          <summary>{{ item.q }}</summary>
          <p>{{ item.a }}</p>
        </details>
      </div>
    </section>

    <section class="solution-section solution-cta">
      <div class="container">
        <h2>{{ copy.cta.title }}</h2>
        <p>{{ copy.cta.body }}</p>
        <router-link :to="lp('/contact')" class="solution-btn solution-btn--primary">
          {{ copy.cta.button }}
        </router-link>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useProducts } from '../composables/useSupabase'
import { useLocalePath } from '../composables/useLocalePath'
import { SITE_URL } from '../router'
import { buildBreadcrumbLd, injectJsonLd } from '../seo/structuredData'
import { SOLUTIONS, SOLUTION_UI, type SolutionSlug } from '../data/solutions'
import { DEFAULT_LOCALE, isLocale } from '../i18n'
import type { Lang, Product } from '../types'

const route = useRoute()
const { locale } = useI18n()
const lp = useLocalePath()

const slug = computed(() => route.params.solution as SolutionSlug)
const lang = computed<Lang>(() => (isLocale(locale.value) ? locale.value : DEFAULT_LOCALE))
const copy = computed(() => SOLUTIONS[slug.value]?.[lang.value] ?? SOLUTIONS[slug.value]?.en)
const ui = computed(() => SOLUTION_UI[lang.value] ?? SOLUTION_UI.en)

const { data: products } = useProducts()

const solutionProducts = computed<Product[]>(() => {
  const slugs = copy.value?.productSlugs ?? []
  return slugs
    .map((s) => (products.value ?? []).find((p) => p.slug === s))
    .filter((p): p is Product => Boolean(p))
})

const SITE = SITE_URL

function setMeta(attr: string, key: string, value: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', value)
}

function absolute(path: string) {
  return path.startsWith('http') ? path : `${SITE}${path.startsWith('/') ? '' : '/'}${path}`
}

// 标题 / 描述 / OG / 结构化数据随语言与产品数据更新；预渲染会把这些写进静态 HTML。
watch(
  [copy, solutionProducts, lang],
  ([c, list, l]) => {
    if (!c) return
    const prefix = l === DEFAULT_LOCALE ? '' : `/${l}`
    const url = `${SITE}${prefix}/solutions/${slug.value}`
    document.title = c.metaTitle
    setMeta('name', 'description', c.metaDescription)
    setMeta('property', 'og:title', c.metaTitle)
    setMeta('property', 'og:description', c.metaDescription)
    setMeta('property', 'og:url', url)
    setMeta('property', 'og:image', absolute(c.heroImage))
    setMeta('name', 'twitter:title', c.metaTitle)
    setMeta('name', 'twitter:description', c.metaDescription)
    setMeta('name', 'twitter:image', absolute(c.heroImage))

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = url

    injectJsonLd(
      'ld-breadcrumb',
      buildBreadcrumbLd([
        { name: SOLUTION_UI[l].home, url: `${SITE}${prefix || '/'}` },
        { name: SOLUTION_UI[l].productsCrumb, url: `${SITE}${prefix}/products` },
        { name: c.eyebrow, url },
      ]),
    )

    injectJsonLd('ld-faq', {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: c.faq.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    })

    if (list.length) {
      injectJsonLd('ld-solution-products', {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: c.metaTitle,
        itemListElement: list.map((p, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: p.name,
          url: `${SITE}${prefix}/products/${p.slug}`,
        })),
      })
    }
  },
  { immediate: true },
)
</script>

<style scoped>
.solution-hero {
  padding: 72px 0 56px;
  background: linear-gradient(135deg, #f4f9fb 0%, #eaf3f7 100%);
}
.solution-hero__inner {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
  gap: 48px;
  align-items: center;
}
.solution-hero__eyebrow {
  margin: 0 0 14px;
  color: var(--color-primary);
  font-weight: 600;
  font-size: 14px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.solution-hero h1 {
  margin: 0 0 18px;
  font-size: clamp(30px, 4vw, 48px);
  line-height: 1.15;
  color: var(--color-text);
}
.solution-hero__lead {
  margin: 0 0 28px;
  font-size: 17px;
  line-height: 1.75;
  color: var(--color-text-light);
  max-width: 640px;
}
.solution-hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
}
.solution-hero__media img {
  width: 100%;
  border-radius: 20px;
  box-shadow: 0 20px 50px rgba(11, 59, 66, 0.16);
  display: block;
}
.solution-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 13px 26px;
  border-radius: 999px;
  font-weight: 600;
  font-size: 15px;
  text-decoration: none;
  transition: transform 0.2s, box-shadow 0.2s;
}
.solution-btn:hover { transform: translateY(-2px); }
.solution-btn--primary {
  background: var(--color-primary);
  color: #fff;
  box-shadow: 0 10px 24px rgba(24, 136, 200, 0.28);
}
.solution-btn--ghost {
  border: 1px solid rgba(11, 59, 66, 0.2);
  color: var(--color-text);
  background: #fff;
}
.solution-section {
  padding: 64px 0;
}
.solution-section--muted {
  background: #f7fafb;
}
.solution-title {
  margin: 0 0 28px;
  font-size: clamp(24px, 3vw, 34px);
  color: var(--color-text);
}
.solution-outcomes {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 20px;
  list-style: none;
  margin: 0;
  padding: 0;
}
.solution-outcomes li {
  background: #fff;
  border: 1px solid rgba(11, 59, 66, 0.08);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 10px 24px rgba(11, 59, 66, 0.05);
}
.solution-outcomes strong {
  display: block;
  font-size: 26px;
  color: var(--color-primary);
  line-height: 1.2;
}
.solution-outcomes span {
  display: block;
  margin: 8px 0 10px;
  font-weight: 600;
  color: var(--color-text);
}
.solution-outcomes p {
  margin: 0;
  color: var(--color-text-light);
  line-height: 1.65;
  font-size: 14px;
}
.solution-products {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}
.solution-product {
  display: flex;
  gap: 20px;
  background: #fff;
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid rgba(11, 59, 66, 0.08);
  box-shadow: 0 12px 30px rgba(11, 59, 66, 0.06);
  text-decoration: none;
  color: inherit;
  transition: transform 0.25s, box-shadow 0.25s;
}
.solution-product:hover {
  transform: translateY(-4px);
  box-shadow: 0 18px 36px rgba(11, 59, 66, 0.12);
}
.solution-product img {
  width: 42%;
  min-height: 190px;
  object-fit: cover;
  background: #eef4f6;
}
.solution-product__body {
  padding: 22px 22px 22px 0;
}
.solution-product__body h3 {
  margin: 0 0 8px;
  font-size: 19px;
}
.solution-product__body p {
  margin: 0 0 14px;
  color: var(--color-text-light);
  line-height: 1.65;
  font-size: 14px;
}
.solution-product__body span {
  color: var(--color-primary);
  font-weight: 600;
  font-size: 14px;
}
.solution-apps {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 20px;
}
.solution-app {
  padding: 22px;
  border-left: 3px solid var(--color-primary);
  background: #fff;
}
.solution-app h3 {
  margin: 0 0 8px;
  font-size: 17px;
}
.solution-app p {
  margin: 0;
  color: var(--color-text-light);
  line-height: 1.65;
  font-size: 14px;
}
.solution-faq {
  max-width: 880px;
}
.solution-faq__item {
  background: #fff;
  border: 1px solid rgba(11, 59, 66, 0.1);
  border-radius: 12px;
  padding: 18px 22px;
  margin-bottom: 12px;
}
.solution-faq__item summary {
  cursor: pointer;
  font-weight: 600;
  color: var(--color-text);
}
.solution-faq__item p {
  margin: 12px 0 0;
  color: var(--color-text-light);
  line-height: 1.75;
}
.solution-cta {
  text-align: center;
  background: linear-gradient(135deg, #0b3b42 0%, #145a64 100%);
  color: #fff;
}
.solution-cta h2 {
  margin: 0 0 12px;
  font-size: clamp(24px, 3vw, 34px);
}
.solution-cta p {
  margin: 0 auto 24px;
  max-width: 680px;
  line-height: 1.75;
  color: rgba(255, 255, 255, 0.82);
}

@media (max-width: 980px) {
  .solution-hero__inner { grid-template-columns: 1fr; }
  .solution-hero__media { order: -1; }
  .solution-outcomes,
  .solution-apps { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .solution-products { grid-template-columns: 1fr; }
}

@media (max-width: 640px) {
  .solution-outcomes,
  .solution-apps { grid-template-columns: 1fr; }
  .solution-product { flex-direction: column; }
  .solution-product img { width: 100%; min-height: 180px; }
  .solution-product__body { padding: 0 22px 22px; }
}
</style>
