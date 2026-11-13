<template>
  <div class="news-page">
    <div class="page-header">
      <div class="container">
        <h1>{{ t('news.title') }}</h1>
        <p>{{ t('news.subtitle') }}</p>
      </div>
    </div>
    <div class="page-section">
      <div class="container">
        <div class="news__grid">
          <div class="news__card" v-for="post in posts" :key="post.slug">
            <div class="news__card-image">
              <img :src="post.image_url" :alt="post.title" />
            </div>
            <div class="news__card-body">
              <div class="news__meta">
                <span>{{ post.published_at?.slice(0, 10) }}</span>
                <a-tag color="blue">{{ post.category }}</a-tag>
              </div>
              <h3>{{ post.title }}</h3>
              <p>{{ post.summary }}</p>
              <router-link :to="articlePath(post)" class="news__link">
                {{ t('news.readMore') }} <RightOutlined />
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { RightOutlined } from '@ant-design/icons-vue'
import { usePosts } from '~/composables/useSupabase'
import { useLocalePath } from '~/composables/useLocalePath'
import { DEFAULT_LOCALE } from '~/i18n'
import type { Post } from '~/types'

const { t, locale } = useI18n()
const lp = useLocalePath()
const { data: posts } = usePosts()

/**
 * 文章链接：只有确实存在该语言翻译时才生成 /de|es|fr/news/...。
 * 96 篇英文文章里只有 5 篇有 es/de/fr 翻译；其余若生成本地化 URL，
 * 在生产 FC 上会是 404（无 SPA 回退），既丢流量也浪费抓取预算。
 * 历史已收录的未翻译本地化 URL 由 FC 301 回英语正文。
 */
const articlePath = (post: Post) =>
  locale.value === DEFAULT_LOCALE || post.availableLangs?.includes(locale.value)
    ? lp(`/news/${post.slug}`)
    : `/news/${post.slug}`
</script>

<style scoped>

.news__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(18px, 2.2vw, 28px);
}
.news__card {
  display: grid;
  grid-template-columns: minmax(180px, 38%) minmax(0, 1fr);
  overflow: hidden;
  min-width: 0;
  border: 1px solid var(--pd-line);
  border-radius: var(--pd-radius-lg);
  background: var(--pd-surface);
  box-shadow: var(--pd-shadow-sm);
  transition: transform .22s ease, border-color .22s ease, box-shadow .22s ease;
}
.news__card:hover {
  transform: translateY(-3px);
  border-color: color-mix(in srgb, var(--pd-primary) 40%, var(--pd-line));
  box-shadow: var(--pd-shadow);
}
.news__card-image { min-height: 100%; overflow: hidden; background: var(--pd-bg-soft); }
.news__card-image img { display:block; width:100%; height:100%; min-height:230px; object-fit:cover; transition:transform .45s ease; }
.news__card:hover .news__card-image img { transform:scale(1.035); }
.news__card-body { display:flex; min-width:0; flex-direction:column; align-items:flex-start; padding:clamp(18px,2vw,28px); }
.news__meta { display:flex; flex-wrap:wrap; align-items:center; gap:8px 12px; margin-bottom:14px; color:var(--pd-ink-muted); font-size:12px; }
.news__meta .ant-tag { margin:0; border:0; border-radius:999px; color:var(--pd-primary); background:color-mix(in srgb,var(--pd-primary) 10%,var(--pd-surface)); }
.news__card-body h3 { margin:0 0 10px; color:var(--pd-ink); font-family:var(--pd-font-display); font-size:clamp(19px,2vw,24px); font-weight:700; line-height:1.2; letter-spacing:-.02em; }
.news__card-body p { margin:0 0 18px; color:var(--pd-ink-soft); font-size:14px; line-height:1.7; }
.news__link { display:inline-flex; align-items:center; gap:7px; margin-top:auto; color:var(--pd-primary); font-size:14px; font-weight:700; }
.news__link:hover { color:var(--pd-primary-hover); gap:10px; }
@media(max-width:900px) { .news__grid { grid-template-columns:1fr; } }
@media(max-width:640px) {
 .news__card { grid-template-columns:1fr; }
 .news__card-image img { min-height:0; height:210px; }
 .news__card-body { padding:20px; }
}

</style>
