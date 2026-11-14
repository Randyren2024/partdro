<template>
  <div
    class="news-detail"
    data-prerender-article
    :data-related-products-ready="productsReady"
    :data-related-articles-ready="articlesReady"
    v-if="post"
  >
    <div class="page-header">
      <div class="container">
        <h1>{{ post.title }}</h1>
        <p>{{ post.published_at?.slice(0, 10) }} · {{ post.category }}</p>
      </div>
    </div>
    <div class="page-section">
      <div class="container article-container">
        <img :src="post.image_url" :alt="post.title" class="article-hero-image" />
        <div class="article-content">
          <p>{{ post.summary }}</p>
          <div v-html="post.content" />
        </div>
        <section v-if="relatedPosts.length" class="related-articles" data-related-articles>
          <h2 class="related-articles__title">{{ t('news.relatedArticles') }}</h2>
          <ul class="related-articles__list">
            <li v-for="p in relatedPosts" :key="p.slug">
              <router-link :to="newsPath(p)" class="related-articles__link">{{ p.title }}</router-link>
              <span class="related-articles__date">{{ p.published_at?.slice(0, 10) }}</span>
            </li>
          </ul>
        </section>
        <section v-if="relatedProducts.length" class="related-products" data-related-products>
          <h2 class="related-products__title">{{ t('news.relatedProducts') }}</h2>
          <div class="related-products__grid">
            <router-link
              v-for="p in relatedProducts"
              :key="p.slug"
              :to="lp(`/products/${p.slug}`)"
              class="related-products__card"
            >
              <img v-if="p.image_url" :src="p.image_url" :alt="p.name" class="related-products__img" />
              <span class="related-products__name">{{ p.name }}</span>
              <span class="related-products__desc">{{ p.short_desc }}</span>
            </router-link>
          </div>
        </section>
        <router-link :to="lp('/news')" class="article-back-link">
          <LeftOutlined /> {{ t('news.backToNews') }}
        </router-link>
      </div>
    </div>
  </div>
  <div v-else class="page-section container" :data-prerender-article-error="!loading ? '' : undefined">
    <p v-if="loading" role="status">Loading article…</p>
    <template v-else>
      <p role="status">{{ error ? 'Unable to load this article. Please try again.' : 'Article not found.' }}</p>
      <a-button v-if="error" @click="reload">Try again</a-button>
      <router-link to="/news">Back to News</router-link>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { LeftOutlined } from '@ant-design/icons-vue'
import { useRoute } from 'vue-router'
import { usePost, useProducts, useRelatedPosts } from '~/composables/useSupabase'
import { useLocalePath } from '~/composables/useLocalePath'
import { DEFAULT_LOCALE } from '~/i18n'
import type { Post, Product } from '~/types'

const runtimeConfig = useRuntimeConfig()
const SITE_URL = runtimeConfig.public.siteUrl || 'https://www.droneworld.tech'
const route = useRoute()
const slug = () => route.params.slug as string
const { t, locale } = useI18n()
const lp = useLocalePath()
const { data: post, loading, error, reload } = usePost(slug)

/**
 * 文章 category → 相关产品 slug 映射。
 * 高商业意图查询（crop protection drone / fertilizer application drone /
 * high-rise drone cleaning 等）当前落在 /news 博客页，而非产品落地页；
 * 在文章末尾给出「相关产品」区块，把权重与点击引到可转化的产品页。
 * category 取值来自线上 posts 表：Agriculture / Logistics / Cleaning Drone /
 * Cleaning / Cargo Drone / Company News / Industry News。
 */
const CATEGORY_PRODUCT_SLUGS: Record<string, string[]> = {
  Agriculture: ['fp800-agricultural-drone'],
  Logistics: ['y160-delivery-drone', 'c500-delivery-drone'],
  'Cargo Drone': ['c500-delivery-drone', 'y160-delivery-drone'],
  'Cleaning Drone': ['d15r', 'c15'],
  Cleaning: ['d15r', 'c15'],
}

const { data: products, loading: productsLoading } = useProducts()

// 供预渲染等待：产品请求结束后才落盘，否则静态 HTML 里会缺「相关产品」内链
const productsReady = computed(() => (productsLoading.value ? undefined : 'true'))

/**
 * 同分类其他文章。96 篇文章正文目前没有任何内链，Google 只能靠分类页发现文章；
 * 这里给每篇补齐 4 条同主题链接，形成可抓取的文章簇（肥料/植保、清洗、物流）。
 */
const { data: relatedPosts, loading: relatedLoading } = useRelatedPosts(
  () => post.value?.category,
  () => post.value?.slug,
)
const articlesReady = computed(() => (relatedLoading.value ? undefined : 'true'))

// 与 NewsView 一致：没有当前语言翻译的文章链回英语正文，避免落到会被 301 的本地化 URL
const newsPath = (p: Post) =>
  locale.value === DEFAULT_LOCALE || p.availableLangs?.includes(locale.value)
    ? lp(`/news/${p.slug}`)
    : `/news/${p.slug}`

const relatedProducts = computed<Product[]>(() => {
  const slugs = CATEGORY_PRODUCT_SLUGS[post.value?.category ?? ''] ?? []
  if (!slugs.length) return []
  return slugs
    .map((s) => (products.value ?? []).find((p) => p.slug === s))
    .filter((p): p is Product => Boolean(p))
})

// 绝对 URL：图片多存为 /images/... 相对路径，og/JSON-LD 需要完整 URL
const absUrl = (u?: string | null) =>
  u ? (u.startsWith('http') ? u : `${SITE_URL}${u.startsWith('/') ? '' : '/'}${u}`) : undefined

/** 覆盖式写入 meta（不存在则创建，og:image / twitter:card 等基础 HTML 里没有） */
function setMeta(attr: string, key: string, value: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', value)
}

/** 注入 JSON-LD（Article + VideoObject）。预渲染会把最终 DOM 落盘，
 *  因此这里运行时注入的脚本会固化进静态 HTML，爬虫无需执行 JS 即可读取。
 *  先移除本组件之前注入的脚本，避免语言切换/多篇文章间残留。 */
function injectJsonLd(doc: Record<string, unknown>) {
  document.querySelectorAll('script[data-seo-jsonld]').forEach((el) => el.remove())
  const script = document.createElement('script')
  script.type = 'application/ld+json'
  script.setAttribute('data-seo-jsonld', 'true')
  script.textContent = JSON.stringify(doc)
  document.head.appendChild(script)
}

// 数据到达后更新页面 title / description / og 标签 / 结构化数据
watch(post, (p) => {
  if (!p) return
  if (!import.meta.client) return
  const title = `${p.title} | Partdro`
  const desc = p.summary || ''
  const url = `${SITE_URL}${route.path}`
  const image = absUrl(p.image_url)

  // 没有该语言翻译时，正文回退为英语；canonical 必须指向英语原文，
  // 否则 /de/news/<slug> 会声明一个内容并不存在的本地化版本（重复内容）。
  const hasTranslation =
    locale.value === DEFAULT_LOCALE || p.availableLangs?.includes(locale.value)
  const canonicalUrl = hasTranslation ? url : `${SITE_URL}/news/${p.slug}`
  let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!canonical) {
    canonical = document.createElement('link')
    canonical.rel = 'canonical'
    document.head.appendChild(canonical)
  }
  canonical.href = canonicalUrl

  document.title = title
  setMeta('name', 'description', desc)
  setMeta('property', 'og:title', title)
  setMeta('property', 'og:description', desc)
  setMeta('property', 'og:type', 'article')
  setMeta('property', 'og:url', canonicalUrl)
  if (image) {
    setMeta('property', 'og:image', image)
    setMeta('name', 'twitter:card', 'summary_large_image')
    setMeta('name', 'twitter:image', image)
  }
  setMeta('name', 'twitter:title', title)
  setMeta('name', 'twitter:description', desc)

  // Article schema：新闻文章的基础富结果
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: p.title.length > 110 ? `${p.title.slice(0, 107)}...` : p.title,
    description: desc,
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    ...(image ? { image: [image] } : {}),
    ...(p.published_at ? { datePublished: p.published_at, dateModified: p.published_at } : {}),
    author: { '@type': 'Organization', name: 'Partdro', url: SITE_URL },
    publisher: {
      '@type': 'Organization',
      name: 'Partdro',
      url: SITE_URL,
    },
  }

  // VideoObject schema：正文内嵌 YouTube 视频时提供，争取 Google 视频富结果
  const videoId = p.content?.match(/youtube\.com\/embed\/([\w-]+)/)?.[1]
  if (videoId) {
    schema.video = {
      '@type': 'VideoObject',
      name: p.title,
      description: desc,
      ...(image ? { thumbnailUrl: [image] } : {}),
      ...(p.published_at ? { uploadDate: p.published_at } : {}),
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
      contentUrl: `https://www.youtube.com/watch?v=${videoId}`,
      publisher: { '@type': 'Organization', name: 'Partdro', url: SITE_URL },
    }
  }
  injectJsonLd(schema)
})



</script>


<style scoped>
.article-container { max-width:860px; }
.article-hero-image { display:block; width:100%; max-height:520px; object-fit:cover; border:1px solid var(--pd-line); border-radius:var(--pd-radius-lg); margin-bottom:clamp(26px,4vw,42px); box-shadow:var(--pd-shadow-sm); }
.article-content { color:var(--pd-ink); font-size:16px; line-height:1.85; overflow-wrap:anywhere; }
.article-content :deep(> p:first-child) { color:var(--pd-ink-soft); font-size:18px; line-height:1.75; }
.article-content :deep(h2), .article-content :deep(h3) { margin:2em 0 .7em; color:var(--pd-ink); font-family:var(--pd-font-display); line-height:1.2; }
.article-content :deep(p), .article-content :deep(ul), .article-content :deep(ol) { margin:0 0 1.2em; }
.article-content :deep(a) { color:var(--pd-primary); text-decoration:underline; text-underline-offset:3px; }
.article-content :deep(img), .article-content :deep(video), .article-content :deep(iframe) { max-width:100%; border-radius:12px; }
.article-content :deep(blockquote) { margin:1.5em 0; padding:16px 20px; border-left:3px solid var(--pd-primary); background:var(--pd-bg-soft); color:var(--pd-ink-soft); }
.related-articles, .related-products { margin-top:clamp(42px,6vw,64px); padding-top:30px; border-top:1px solid var(--pd-line); }
.related-articles__title, .related-products__title { margin:0 0 20px; color:var(--pd-ink); font-family:var(--pd-font-display); font-size:26px; }
.related-articles__list { display:grid; gap:0; margin:0; padding:0; list-style:none; }
.related-articles__list li { display:flex; justify-content:space-between; gap:18px; padding:14px 0; border-bottom:1px solid var(--pd-line); }
.related-articles__link { color:var(--pd-ink); font-weight:650; }
.related-articles__link:hover { color:var(--pd-primary); }
.related-articles__date { flex:0 0 auto; color:var(--pd-ink-muted); font-size:12px; }
.related-products__grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px; }
.related-products__card { display:grid; grid-template-columns:96px minmax(0,1fr); gap:4px 14px; padding:12px; border:1px solid var(--pd-line); border-radius:var(--pd-radius); background:var(--pd-surface); transition:border-color .2s,transform .2s; }
.related-products__card:hover { transform:translateY(-2px); border-color:var(--pd-primary); }
.related-products__img { grid-row:span 2; width:96px; height:82px; object-fit:cover; border-radius:10px; background:var(--pd-bg-soft); }
.related-products__name { align-self:end; color:var(--pd-ink); font-weight:700; }
.related-products__desc { color:var(--pd-ink-soft); font-size:12px; line-height:1.5; }
.article-back-link { display:inline-flex; align-items:center; gap:8px; margin-top:34px; color:var(--pd-primary); font-weight:700; }
@media(max-width:640px) {
 .article-container { width:min(var(--pd-container),calc(100% - 32px)); }
 .related-products__grid { grid-template-columns:1fr; }
 .related-articles__list li { flex-direction:column; gap:4px; }
 .article-content { font-size:15px; }
}
</style>

