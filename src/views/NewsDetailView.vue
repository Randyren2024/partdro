<template>
  <div class="news-detail" data-prerender-article v-if="post">
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
import { watch } from 'vue'
import { LeftOutlined } from '@ant-design/icons-vue'
import { useRoute } from 'vue-router'
import { SITE_URL } from '../router'
import { usePost } from '../composables/useSupabase'

const route = useRoute()
const slug = () => route.params.slug as string
const { data: post, loading, error, reload } = usePost(slug)

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

  document.title = title
  setMeta('name', 'description', desc)
  setMeta('property', 'og:title', title)
  setMeta('property', 'og:description', desc)
  setMeta('property', 'og:type', 'article')
  setMeta('property', 'og:url', url)
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
.article-content {
  font-size: 16px;
  line-height: 1.9;
  color: var(--color-text);
}
.article-content h2 {
  font-size: 24px;
  font-weight: 700;
  margin: 32px 0 16px;
  color: var(--color-dark);
}
.article-content p {
  margin-bottom: 20px;
}
.article-content ul {
  padding-left: 24px;
  margin-bottom: 20px;
}
.article-content li {
  margin-bottom: 8px;
}
</style>
