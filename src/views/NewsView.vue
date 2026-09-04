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
              <router-link :to="`/news/${post.slug}`" class="news__link">
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
import { usePosts } from '../composables/useSupabase'

const { t } = useI18n()
const { data: posts } = usePosts()
</script>

<style scoped>
.news__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 30px;
}
.news__card {
  display: flex;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s;
}
.news__card:hover {
  transform: translateY(-4px);
}
.news__card-image {
  width: 280px;
  flex-shrink: 0;
  overflow: hidden;
}
.news__card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.news__card-body {
  padding: 24px;
  flex: 1;
}
.news__meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: var(--color-text-light);
  margin-bottom: 12px;
}
.news__card-body h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 10px;
  line-height: 1.5;
}
.news__card-body p {
  font-size: 14px;
  color: var(--color-text-light);
  margin-bottom: 16px;
  line-height: 1.7;
}
.news__link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--color-primary);
  font-weight: 500;
}

@media (max-width: 768px) {
  .news__grid { grid-template-columns: 1fr; }
  .news__card { flex-direction: column; }
  .news__card-image { width: 100%; height: 200px; }
}
</style>
