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
.news { background:linear-gradient(180deg, #f1f6f6 0%, #fbfdfd 100%); }
.news__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 22px;
}
.news__card {
  background: #fff;
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid rgba(11, 59, 66, .1);
  box-shadow: 0 10px 26px rgba(11, 59, 66, 0.05);
  transition: transform 0.3s, box-shadow 0.3s;
}
.news__card:hover {
  transform: translateY(-6px);
  box-shadow: 0 22px 42px rgba(11, 59, 66, 0.12);
}
.news__card-image {
  height: 218px;
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
  padding: 23px 25px 26px;
}
.news__card-meta {
  display: flex;
  gap: 16px;
  font-size: 10px;
  color: var(--color-primary);
  font-weight:750;
  letter-spacing:.1em;
  text-transform:uppercase;
  margin-bottom: 10px;
}
.news__card-body h3 {
  font-size: 20px;
  font-weight: 720;
  margin-bottom: 10px;
  color: #183940;
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
  font-weight: 750;
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
.news__cta :deep(.ant-btn) { height:48px; padding:0 24px; border-radius:999px; font-weight:700; }

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
