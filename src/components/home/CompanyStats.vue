<template>
  <section class="stats section">
    <div class="container">
      <div class="stats__grid">
        <div class="stats__item" v-for="item in statsData" :key="item.key">
          <div class="stats__icon">
            <component :is="item.icon" />
          </div>
          <div class="stats__number">{{ item.value }}+</div>
          <div class="stats__label" :data-edit-key="`stats.${item.key}`">{{ t(`stats.${item.key}`) }}</div>
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
  background: #10363c;
  position:relative;
  overflow:hidden;
}
.stats::before { content:""; position:absolute; width:620px; height:620px; border:1px solid rgba(119,220,215,.14); border-radius:50%; left:-360px; top:-440px; }
.stats__grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0;
  position:relative;
}
.stats__item {
  text-align: center;
  padding: 12px 28px;
  border-right:1px solid rgba(255,255,255,.14);
}
.stats__item:last-child { border-right:0; }
.stats__icon {
  font-size: 40px;
  color: #76d8d5;
  margin-bottom: 12px;
}
.stats__number {
  font-size: clamp(2.5rem,4vw,3.6rem);
  font-weight: 750;
  color: #fff;
  margin-bottom: 8px;
}
.stats__label {
  font-size: 16px;
  color: rgba(255,255,255,.62);
  font-size:13px;
  letter-spacing:.04em;
}

@media (max-width: 768px) {
  .stats__grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .stats__item:nth-child(2) { border-right:0; }
  .stats__item:nth-child(-n+2) { border-bottom:1px solid rgba(255,255,255,.14); padding-bottom:28px; }
  .stats__item:nth-child(n+3) { padding-top:28px; }
}
</style>
