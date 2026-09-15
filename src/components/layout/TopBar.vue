<template>
  <div class="top-bar">
    <div class="container top-bar__inner">
      <div class="top-bar__left">
        <span class="top-bar__item">
          <PhoneOutlined />
          {{ t('topBar.phone') }}: +86 16788684420
        </span>
        <a class="top-bar__item" href="mailto:info@partdro.com" @click="trackEvent('generate_lead', { location: 'topbar' })">
          <MailOutlined />
          info@partdro.com
        </a>
      </div>
      <div class="top-bar__right">
        <a-button type="primary" size="small" ghost>
          {{ t('topBar.franchise') }}
          <RightOutlined />
        </a-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { PhoneOutlined, MailOutlined, RightOutlined } from '@ant-design/icons-vue'
import { trackEvent } from '../../composables/useTracking'

const { t } = useI18n()
</script>

<style scoped>
.top-bar {
  background: var(--color-primary);
  color: #fff;
  height: var(--topbar-height);
  display: flex;
  align-items: center;
  font-size: 13px;
}
.top-bar__inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}
.top-bar__left {
  display: flex;
  gap: 24px;
}
.top-bar__item {
  display: flex;
  align-items: center;
  gap: 6px;
}
</style>
