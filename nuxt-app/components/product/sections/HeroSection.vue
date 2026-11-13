<template>
  <section class="hero">
    <div class="lp-container hero-wrap">
      <div class="hero-copy">
        <div class="eyebrow hero-kicker" :data-edit-key="`${ns}.hero.kicker`">{{ tt('hero.kicker') }}</div>
        <h1 :data-edit-key="`${ns}.hero.title1`">{{ tt('hero.title1') }}<span :data-edit-key="`${ns}.hero.title2`">{{ tt('hero.title2') }}</span></h1>
        <p class="lead" :data-edit-key="`${ns}.hero.lead`">{{ tt('hero.lead') }}</p>
        <div class="btns">
          <a class="btn primary" href="#specs" :data-edit-key="`${ns}.hero.ctaPrimary`">{{ tt('hero.ctaPrimary') }}</a>
          <a class="btn secondary" :href="mailtoHref" :data-edit-key="`${ns}.hero.ctaSecondary`" @click="trackEvent('email_click', { location: 'hero' })">{{ tt('hero.ctaSecondary') }}</a>
        </div>
        <div class="hero-stat-row">
          <div v-for="(s, i) in heroStats" :key="i" class="mini-stat" :data-edit-key="`${ns}.hero.stats.${i}`">{{ s }}</div>
        </div>
      </div>
      <div class="hero-media">
        <div class="hero-card"><img :src="imgEdit('page001_img001.png', `${ns}.hero.mainImg`)" :alt="alt('hero')" :data-edit-img="`${ns}.hero.mainImg`" /></div>
        <div class="hero-badge"><strong :data-edit-key="`${ns}.hero.badgeTitle`">{{ tt('hero.badgeTitle') }}</strong><span class="muted" :data-edit-key="`${ns}.hero.badgeText`">{{ tt('hero.badgeText') }}</span></div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useLandingSection } from '../sectionContext'

const { ns, tt, imgEdit, alt, mailtoHref, trackEvent } = useLandingSection()
const heroStats = computed(() => [0, 1, 2].map((i) => tt(`hero.stats.${i}`)))
</script>
