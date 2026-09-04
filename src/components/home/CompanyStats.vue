<template>
  <section class="stats section">
    <div class="container">
      <div class="stats__grid">
        <div class="stats__item" v-for="item in statsData" :key="item.key">
          <div class="stats__icon">
            <component :is="item.icon" />
          </div>
          <div class="stats__number">{{ item.value }}+</div>
          <div class="stats__label">{{ t(`stats.${item.key}`) }}</div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import {
  GlobalOutlined,
  ExperimentOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
} from '@ant-design/icons-vue'

const { t } = useI18n()

const statsData = [
  { key: 'countries', value: 80, icon: GlobalOutlined },
  { key: 'years', value: 12, icon: ExperimentOutlined },
  { key: 'patents', value: 10, icon: SafetyCertificateOutlined },
  { key: 'team', value: 100, icon: TeamOutlined },
]
</script>

<style scoped>
.stats {
  background: var(--color-bg-gray);
}
.stats__grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 40px;
}
.stats__item {
  text-align: center;
  padding: 30px 20px;
}
.stats__icon {
  font-size: 40px;
  color: var(--color-primary);
  margin-bottom: 16px;
}
.stats__number {
  font-size: 48px;
  font-weight: 700;
  color: var(--color-dark);
  margin-bottom: 8px;
}
.stats__label {
  font-size: 16px;
  color: var(--color-text-light);
}

@media (max-width: 768px) {
  .stats__grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
