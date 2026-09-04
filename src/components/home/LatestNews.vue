<template>
  <section class="news section">
    <div class="container">
      <h2 class="section-title">{{ t('news.title') }}</h2>
      <p class="section-subtitle">{{ t('news.subtitle') }}</p>

      <div class="news__grid">
        <div class="news__card" v-for="post in posts" :key="post.slug">
          <div class="news__card-image">
            <img :src="post.image_url" :alt="post.title" />
          </div>
          <div class="news__card-body">
            <div class="news__card-meta">
              <span>{{ post.published_at?.slice(0, 10) }}</span>
              <span>{{ post.category }}</span>
            </div>
            <h3>{{ post.title }}</h3>
            <p>{{ post.summary }}</p>
            <router-link :to="`/news/${post.slug}`" class="news__card-link">
              {{ t('news.readMore') }}
              <RightOutlined />
            </router-link>
          </div>
        </div>
      </div>

      <div class="news__cta">
        <a-button type="primary" size="large" @click="$router.push('/news')">
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

const { t } = useI18n()
const { data: posts } = usePosts({ limit: 3 })
</script>

<style scoped>
.news__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 30px;
}
.news__card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s, box-shadow 0.3s;
}
.news__card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}
.news__card-image {
  height: 200px;
  overflow: hidden;
}
.news__card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s;
}
.news__card:hover .news__card-image img {
  transform: scale(1.05);
}
.news__card-body {
  padding: 24px;
}
.news__card-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--color-text-light);
  margin-bottom: 10px;
}
.news__card-body h3 {
  font-size: 17px;
  font-weight: 600;
  margin-bottom: 10px;
  color: var(--color-dark);
  line-height: 1.5;
}
.news__card-body p {
  font-size: 14px;
  color: var(--color-text-light);
  margin-bottom: 16px;
  line-height: 1.7;
}
.news__card-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--color-primary);
  font-weight: 500;
  font-size: 14px;
  transition: gap 0.2s;
}
.news__card-link:hover {
  gap: 10px;
}
.news__cta {
  text-align: center;
  margin-top: 48px;
}

@media (max-width: 992px) {
  .news__grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 576px) {
  .news__grid {
    grid-template-columns: 1fr;
  }
}
</style>
