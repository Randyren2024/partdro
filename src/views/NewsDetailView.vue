<template>
  <div class="news-detail" v-if="post">
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
</template>

<script setup lang="ts">
import { LeftOutlined } from '@ant-design/icons-vue'
import { useRoute } from 'vue-router'
import { usePost } from '../composables/useSupabase'

const route = useRoute()
const slug = () => route.params.slug as string
const { data: post } = usePost(slug)
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
