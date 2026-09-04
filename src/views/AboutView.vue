<template>
  <div class="about-page">
    <div class="page-header">
      <div class="container">
        <h1>{{ t('about.title') }}</h1>
        <p>{{ t('about.subtitle') }}</p>
      </div>
    </div>

    <div class="page-section">
      <div class="container">
        <a-row :gutter="60" align="middle">
          <a-col :span="12">
            <img src="https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=800&q=80" alt="About" style="width: 100%; border-radius: 12px" />
          </a-col>
          <a-col :span="12">
            <h2 style="font-size: 32px; margin-bottom: 20px">Leading Drone Cleaning Innovation</h2>
            <p style="font-size: 16px; line-height: 1.9; margin-bottom: 16px; color: var(--color-text-light)">
              Partdro is a professional high-altitude cleaning drone manufacturer, focused on D15R window cleaning solutions with RTK precision positioning and 20MPa high-pressure nozzles.
            </p>
            <p style="font-size: 16px; line-height: 1.9; margin-bottom: 16px; color: var(--color-text-light)">
              Our mission is to make building maintenance safer, more efficient, and more sustainable through innovative drone technology. We hold 10+ patents and continuously invest in R&D to stay at the forefront of the industry.
            </p>
            <a-button type="primary" size="large" @click="$router.push('/contact')">
              {{ t('contact.title') }}
            </a-button>
          </a-col>
        </a-row>
      </div>
    </div>

    <div class="page-section page-section--gray">
      <CompanyStats />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import CompanyStats from '../components/home/CompanyStats.vue'

const { t } = useI18n()
</script>
