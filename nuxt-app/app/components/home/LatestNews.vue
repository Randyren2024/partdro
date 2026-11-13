<template>
  <section class="news section">
    <div class="container">
      <h2 class="section-title">{{ t('news.title') }}</h2>
      <p class="section-subtitle">{{ t('news.subtitle') }}</p>

      <div class="news__grid">
        <div class="news__card" v-for="post in posts" :key="post.slug">
          <div class="news__card-image">
            <img
              :src="post.image_url"
              :alt="post.title"
              loading="lazy"
              decoding="async"
              width="640"
              height="420"
            />
          </div>
          <div class="news__card-body">
            <div class="news__card-meta">
              <span>{{ post.published_at?.slice(0, 10) }}</span>
              <span>{{ post.category }}</span>
            </div>
            <h3>{{ post.title }}</h3>
            <p>{{ post.summary }}</p>
            <router-link :to="lp('/news/' + post.slug)" class="news__card-link">
              {{ t('news.readMore') }}
              <RightOutlined />
            </router-link>
          </div>
        </div>
      </div>

      <div class="news__cta">
        <a-button type="primary" size="large" @click="$router.push(lp('/news'))">
          {{ t('news.viewAll') }}
        </a-button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { RightOutlined } from '@ant-design/icons-vue'
import { usePosts } from '../../composables/useSupabase'
import { useLocalePath } from '../../composables/useLocalePath'

const { t } = useI18n()
const lp = useLocalePath()
const { data: posts } = usePosts({ limit: 3 })
</script>

<style scoped>
.news {
  background: var(--pd-bg-soft);
}
.news__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(16px, 2vw, 26px);
}
.news__card {
  display: flex;
  overflow: hidden;
  flex-direction: column;
  border: 1px solid var(--pd-line);
  border-radius: var(--pd-radius-lg);
  background: var(--pd-surface);
  box-shadow: var(--pd-shadow-sm);
  transition: transform .24s ease, box-shadow .24s ease, border-color .24s ease;
}
.news__card:hover {
  transform: translateY(-5px);
  border-color: color-mix(in srgb, var(--pd-primary) 42%, var(--pd-line));
  box-shadow: var(--pd-shadow);
}
.news__card-image {
  height: clamp(190px, 20vw, 230px);
  overflow: hidden;
  background: var(--pd-bg-soft);
}
.news__card-image img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform .5s ease;
}
.news__card:hover .news__card-image img {
  transform: scale(1.045);
}
.news__card-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: flex-start;
  padding: 22px 23px 24px;
}
.news__card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 16px;
  margin-bottom: 12px;
  color: var(--pd-primary);
  font-size: 10px;
  font-weight: 750;
  letter-spacing: .1em;
  text-transform: uppercase;
}
.news__card-body h3 {
  margin-bottom: 10px;
  color: var(--pd-ink);
  font-size: 20px;
  font-weight: 760;
  line-height: 1.3;
}
.news__card-body p {
  margin-bottom: 18px;
  color: var(--pd-ink-soft);
  font-size: 14px;
  line-height: 1.7;
}
.news__card-link {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-top: auto;
  color: var(--pd-primary);
  font-weight: 750;
  font-size: 14px;
  transition: gap .18s ease;
}
.news__card-link:hover {
  gap: 11px;
}
.news__cta {
  margin-top: 42px;
  text-align: center;
}
.news__cta :deep(.ant-btn) {
  height: 48px;
  padding: 0 24px;
  font-weight: 700;
}
@media (max-width: 992px) {
  .news__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 576px) {
  .news__grid { grid-template-columns: 1fr; }
}
</style>
