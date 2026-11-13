<template>
  <div class="cases-page">
    <div class="page-header">
      <div class="container">
        <h1>{{ t('cases.title') }}</h1>
        <p>{{ t('cases.subtitle') }}</p>
      </div>
    </div>
    <div class="page-section">
      <div class="container">
        <div class="cases__grid">
          <div class="cases__card" v-for="c in cases" :key="c.slug">
            <div class="cases__card-image">
              <img :src="c.image_url" :alt="c.title" />
            </div>
            <div class="cases__card-body">
              <h3>{{ c.title }}</h3>
              <p><EnvironmentOutlined /> {{ c.location }}</p>
              <p class="cases__desc">{{ c.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { EnvironmentOutlined } from '@ant-design/icons-vue'
import { useCases } from '~/composables/useSupabase'

const { t } = useI18n()
const { data: cases } = useCases()
</script>

<style scoped>
.cases__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 30px;
}
.cases__card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s;
}
.cases__card:hover {
  transform: translateY(-4px);
}
.cases__card-image {
  height: 220px;
  overflow: hidden;
}
.cases__card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.cases__card-body {
  padding: 24px;
}
.cases__card-body h3 {
  font-size: 17px;
  font-weight: 600;
  margin-bottom: 8px;
}
.cases__card-body p {
  font-size: 13px;
  color: var(--color-text-light);
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}
.cases__desc {
  font-size: 14px !important;
  line-height: 1.7;
}

@media (max-width: 992px) {
  .cases__grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 576px) {
  .cases__grid { grid-template-columns: 1fr; }
}
</style>
