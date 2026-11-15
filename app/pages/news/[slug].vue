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
        <p>
          <time v-if="post.published_at" :datetime="post.published_at">{{ formatDate(post.published_at) }}</time>
          <span v-if="post.category"> · {{ post.category }}</span>
        </p>
      </div>
    </div>
    <div class="page-section">
      <div class="container article-container">
        <img :src="post.image_url" :alt="post.title" class="article-hero-image" width="1200" height="630" />
        <div class="article-content">
          <p>{{ post.summary }}</p>
          <div v-html="post.content" />
        </div>
        <figure v-if="demoVideo" id="demo-video" class="article-demo-video" data-article-demo-video>
          <h2 class="article-demo-video__title">{{ demoVideo.title }}</h2>
          <video
            class="article-demo-video__player"
            controls
            playsinline
            preload="metadata"
            width="1280"
            height="720"
            :poster="demoVideo.poster"
            :aria-label="demoVideo.title"
          >
            <source :src="demoVideo.src" type="video/mp4" />
            <p>
              Your browser does not support HTML5 video.
              <a :href="demoVideo.src">Download the demo flight video</a>.
            </p>
          </video>
          <figcaption class="article-demo-video__caption">
            <span class="article-demo-video__desc">{{ demoVideo.caption }}</span>
            <router-link :to="lp(`/products/${demoVideo.productSlug}`)" class="article-demo-video__link">
              View full product specifications →
            </router-link>
          </figcaption>
        </figure>
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
  <div v-else class="page-section container" :data-prerender-article-error="!pending ? '' : undefined">
    <p v-if="pending" role="status">Loading article…</p>
    <template v-else>
      <p role="status">{{ error ? 'Unable to load this article. Please try again.' : 'Article not found.' }}</p>
      <a-button v-if="error" @click="refresh">Try again</a-button>
      <router-link to="/news">Back to News</router-link>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { LeftOutlined } from '@ant-design/icons-vue'
import { useRoute } from 'vue-router'
import { useContentApi } from '~/composables/useContentApi'
import { useLocalePath } from '~/composables/useLocalePath'
import { getArticleDemoVideo } from '~/data/articleMedia'
import { DEFAULT_LOCALE } from '~/i18n'
import type { Post, Product } from '~/types'

const runtimeConfig = useRuntimeConfig()
const SITE_URL = runtimeConfig.public.siteUrl || 'https://www.droneworld.tech'
const route = useRoute()
const slug = () => route.params.slug as string
const { t, locale } = useI18n()
const lp = useLocalePath()
const api = useContentApi()

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

/**
 * 关键改动：内容改在构建期由服务端抓取（useAsyncData），而不是浏览器里
 * 才去 Supabase 拉。这样 nuxt generate 落盘的静态 HTML 里就带完整正文、
 * h1 和内链，Google / GSC 不执行 JS 也能索引这篇文章。
 */
const {
  data: post,
  pending,
  error,
  refresh,
} = await useAsyncData(
  () => `news-article:${slug()}:${locale.value}`,
  () => api.fetchPost(slug(), locale.value as any),
  { watch: [locale] },
)

const { data: relatedPostsData } = await useAsyncData(
  () => `news-related:${post.value?.slug ?? slug()}:${locale.value}`,
  async () => {
    const p = post.value
    if (!p?.category) return []
    return api.fetchRelatedPosts(p.category, p.slug, locale.value as any, 4)
  },
  { default: () => [] as Post[], watch: [post, locale] },
)

const { data: relatedProductsData } = await useAsyncData(
  () => `news-products:${post.value?.category ?? 'none'}:${locale.value}`,
  async () => {
    const slugs = CATEGORY_PRODUCT_SLUGS[post.value?.category ?? ''] ?? []
    if (!slugs.length) return []
    return api.fetchProductsBySlugs(slugs, locale.value as any)
  },
  { default: () => [] as Product[], watch: [post, locale] },
)

const relatedPosts = computed<Post[]>(() => relatedPostsData.value ?? [])
const relatedProducts = computed<Product[]>(() => relatedProductsData.value ?? [])

// 预渲染等待标记：现在数据是 SSR 抓的，落盘时一定已就绪
const productsReady = computed(() => 'true')
const articlesReady = computed(() => 'true')

const demoVideo = computed(() => (post.value ? getArticleDemoVideo(post.value.slug) : null))

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })

// 与 NewsView 一致：没有当前语言翻译的文章链回英语正文，避免落到会被 301 的本地化 URL
const newsPath = (p: Post) =>
  locale.value === DEFAULT_LOCALE || p.availableLangs?.includes(locale.value as any)
    ? lp(`/news/${p.slug}`)
    : `/news/${p.slug}`

// 绝对 URL：图片多存为 /images/... 相对路径，og/JSON-LD 需要完整 URL
const absUrl = (u?: string | null) =>
  u ? (u.startsWith('http') ? u : `${SITE_URL}${u.startsWith('/') ? '' : '/'}${u}`) : undefined

/**
 * 没有该语言翻译时，正文回退为英语；canonical 必须指向英语原文，
 * 否则 /de/news/<slug> 会声明一个内容并不存在的本地化版本（重复内容）。
 */
const canonicalPath = computed(() => {
  const p = post.value
  if (!p) return `${SITE_URL}/news`
  const hasTranslation = locale.value === DEFAULT_LOCALE || p.availableLangs?.includes(locale.value as any)
  return hasTranslation ? `${SITE_URL}${route.path}` : `${SITE_URL}/news/${p.slug}`
})

/** 只对真实有翻译的语言输出 hreflang，避免指向 301 的本地化 URL */
const alternates = computed(() => {
  const p = post.value
  if (!p) return []
  const prefix = (lang: string) => (lang === DEFAULT_LOCALE ? '' : `/${lang}`)
  const langs = (p.availableLangs ?? [DEFAULT_LOCALE]) as string[]
  return langs.map((lang) => ({
    rel: 'alternate',
    hreflang: lang,
    href: `${SITE_URL}${prefix(lang)}/news/${p.slug}`,
  }))
})

const metaDescription = computed(() => {
  const p = post.value
  if (!p) return 'Partdro drone industry news and product updates.'
  if (p.summary) return p.summary
  return p.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 155)
})

/** 当前语言是否有该文章的真实翻译（没有则正文回退英语） */
const contentLang = computed(() => {
  const p = post.value
  if (!p) return DEFAULT_LOCALE
  return locale.value === DEFAULT_LOCALE || p.availableLangs?.includes(locale.value as any)
    ? (locale.value as string)
    : DEFAULT_LOCALE
})

const seoTitle = computed(() => post.value?.title ?? 'News')
const canonicalUrl = computed(() => canonicalPath.value)
const heroImage = computed(() => absUrl(post.value?.image_url))

useHead(() => ({
  title: seoTitle.value === 'News' ? seoTitle.value : `${seoTitle.value} | Partdro`,
  titleTemplate: '%s',
  // 没有本地化翻译时正文是英语，<html lang> 也跟着回退，避免语言标记与内容不符
  htmlAttrs: { lang: contentLang.value },
  link: [
    { rel: 'canonical', href: canonicalUrl.value },
    ...alternates.value,
    { rel: 'alternate', hreflang: 'x-default', href: `${SITE_URL}/news/${post.value?.slug ?? ''}` },
  ],
  meta: [
    { name: 'description', content: metaDescription.value },
    // 文章不存在时（脏 URL / 已下架）不让 Google 收录空壳
    { name: 'robots', content: post.value ? 'index, follow, max-image-preview:large' : 'noindex, follow' },
    { property: 'og:type', content: 'article' },
    { property: 'og:site_name', content: 'Partdro' },
    { property: 'og:title', content: seoTitle.value },
    { property: 'og:description', content: metaDescription.value },
    { property: 'og:url', content: canonicalUrl.value },
    { property: 'og:locale', content: contentLang.value },
    ...(heroImage.value ? [{ property: 'og:image', content: heroImage.value }] : []),
    { name: 'twitter:card', content: heroImage.value ? 'summary_large_image' : 'summary' },
    { name: 'twitter:title', content: seoTitle.value },
    { name: 'twitter:description', content: metaDescription.value },
    ...(heroImage.value ? [{ name: 'twitter:image', content: heroImage.value }] : []),
    ...(post.value?.published_at ? [{ property: 'article:published_time', content: post.value.published_at }] : []),
    ...(post.value?.category ? [{ property: 'article:section', content: post.value.category }] : []),
  ],
  script: buildJsonLd(),
}))

/** Article + Breadcrumb + （可选）VideoObject，全部在构建期写进静态 HTML */
function buildJsonLd() {
  const p = post.value
  if (!p) return []
  const url = canonicalUrl.value
  const image = heroImage.value
  const desc = metaDescription.value

  const article: Record<string, unknown> = {
    '@type': 'Article',
    '@id': `${url}#article`,
    headline: p.title.length > 110 ? `${p.title.slice(0, 107)}...` : p.title,
    description: desc,
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    ...(image ? { image: [image] } : {}),
    ...(p.published_at ? { datePublished: p.published_at, dateModified: p.published_at } : {}),
    ...(p.category ? { articleSection: p.category } : {}),
    author: { '@type': 'Organization', name: 'Partdro', url: SITE_URL },
    publisher: {
      '@type': 'Organization',
      name: 'Partdro',
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/droneworld_logo.svg` },
    },
  }

  const breadcrumb = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'News', item: `${SITE_URL}/news` },
      { '@type': 'ListItem', position: 3, name: p.title, item: url },
    ],
  }

  const graph: Record<string, unknown>[] = [article, breadcrumb]

  // 正文内嵌 YouTube 时保留原有逻辑，争取视频富结果
  const videoId = p.content?.match(/youtube\.com\/embed\/([\w-]+)/)?.[1]
  if (videoId) {
    graph.push({
      '@type': 'VideoObject',
      name: p.title,
      description: desc,
      ...(image ? { thumbnailUrl: [image] } : {}),
      ...(p.published_at ? { uploadDate: p.published_at } : {}),
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
      contentUrl: `https://www.youtube.com/watch?v=${videoId}`,
      publisher: { '@type': 'Organization', name: 'Partdro', url: SITE_URL },
    })
  }

  // 仓库里为该文章挂的同源 MP4 演示视频（无需第三方播放器，Google 可直抓）
  const v = demoVideo.value
  if (v) {
    graph.push({
      '@type': 'VideoObject',
      '@id': `${url}#demo-video`,
      name: v.title,
      description: v.caption,
      thumbnailUrl: [absUrl(v.poster)].filter(Boolean),
      uploadDate: v.uploadDate,
      duration: v.duration,
      contentUrl: absUrl(v.src),
      publisher: { '@type': 'Organization', name: 'Partdro', url: SITE_URL },
    })
  }

  return [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }),
    },
  ]
}
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
.article-demo-video { margin:clamp(36px,5vw,52px) 0 0; padding-top:26px; border-top:1px solid var(--pd-line); }
.article-demo-video__title { margin:0 0 16px; color:var(--pd-ink); font-family:var(--pd-font-display); font-size:clamp(20px,2.4vw,26px); line-height:1.3; }
.article-demo-video__player { display:block; width:100%; height:auto; aspect-ratio:16/9; background:#000; border-radius:var(--pd-radius-lg); box-shadow:var(--pd-shadow-sm); }
.article-demo-video__caption { display:flex; flex-direction:column; gap:8px; margin-top:14px; color:var(--pd-ink-soft); font-size:14px; line-height:1.7; }
.article-demo-video__link { color:var(--pd-primary); font-weight:700; }
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
