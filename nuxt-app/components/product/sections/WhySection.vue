<template>
  <section class="lp-section" id="performance">
    <div class="lp-container">
      <div class="section-head">
        <div class="eyebrow" :data-edit-key="`${ns}.why.eyebrow`">{{ tt('why.eyebrow') }}</div>
        <h2 :data-edit-key="`${ns}.why.title`">{{ tt('why.title') }}</h2>
        <p class="lead" style="margin-top:18px" :data-edit-key="`${ns}.why.lead`">{{ tt('why.lead') }}</p>
      </div>
      <div class="grid lp-feature-grid">
        <article v-for="(c, i) in whyCards" :key="i" class="feature-card">
          <div class="feature-icon">{{ String(i + 1).padStart(2, '0') }}</div>
          <h3 :data-edit-key="`${ns}.why.cards.${i}.title`">{{ c.title }}</h3>
          <p :data-edit-key="`${ns}.why.cards.${i}.desc`">{{ c.desc }}</p>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useLandingSection } from '../sectionContext'

const { ns, tt } = useLandingSection()
const whyCards = computed(() =>
  [0, 1, 2, 3, 4, 5].map((i) => ({
    title: tt(`why.cards.${i}.title`),
    desc: tt(`why.cards.${i}.desc`),
  })),
)
</script>
