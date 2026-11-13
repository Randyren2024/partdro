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
      <div class="container" style="max-width: 800px">
        <img :src="post.image_url" :alt="post.title" style="width: 100%; border-radius: 12px; margin-bottom: 32px" />
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
        <a-button type="link" @click="$router.back()">
          <LeftOutlined /> Back to News
        </a-button>
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
import { SITE_URL } from '../router'
import { usePost, useProducts, useRelatedPosts } from '../composables/useSupabase'
import { useLocalePath } from '../composables/useLocalePath'
import { DEFAULT_LOCALE } from '../i18n'
import type { Post, Product } from '../types'

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


// @ts-ignore - Nuxt macro
definePrerenderRoutes(async () => {
  const PRESET_NEWS = [
    'drone-cleaning-industry-trends-2026', 'c500-first-flight-tests',
  ]
  const LOCALES = ['', '/de', '/es', '/fr'] as const
  const config = useRuntimeConfig()
  let slugs: string[] = []

  if (config.public.supabaseUrl && config.public.supabaseAnonKey) {
    try {
      const res = await fetch(
        `${config.public.supabaseUrl}/rest/v1/posts?select=slug&published=eq.true&order=published_at.desc`,
        { headers: { apikey: config.public.supabaseAnonKey, Authorization: `Bearer ${config.public.supabaseAnonKey}` } },
      )
      if (res.ok) {
        const rows: { slug: string | null }[] = await res.json()
        slugs = rows.map((r) => r.slug || '').filter(Boolean)
      }
    } catch (e) {
      console.warn('[prerender] news slug fetch failed, using fallback:', (e as Error).message)
    }
  }

  if (!slugs.length) slugs = PRESET_NEWS

  // 新闻翻译可能不全——先全量生成，Cloudflare Pages 上不 404 就不会报错
  const routes: string[] = []
  for (const l of LOCALES) {
    for (const slug of slugs) {
      routes.push(`${l}/news/${slug}`)
    }
  }
  console.log(`[prerender] news: ${slugs.length} slugs × ${LOCALES.length} locales = ${routes.length} routes`)
  return routes
})
</script>
