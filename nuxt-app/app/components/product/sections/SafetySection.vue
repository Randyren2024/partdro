<template>
  <section class="lp-section safety" id="safety">
    <div class="lp-container">
      <div class="section-head">
        <div class="eyebrow" :data-edit-key="`${ns}.safety.eyebrow`">{{ tt('safety.eyebrow') }}</div>
        <h2 :data-edit-key="`${ns}.safety.title`">{{ tt('safety.title') }}</h2>
        <p class="lead" style="margin-top:18px" :data-edit-key="`${ns}.safety.lead`">{{ tt('safety.lead') }}</p>
      </div>
      <div class="grid safety-grid">
        <article v-for="(c, i) in safetyCards" :key="i" class="safety-card">
          <img :src="imgEdit(safetyImgs[i], `${ns}.safety.cards.${i}.img`)" :alt="alt(c.title)" :data-edit-img="`${ns}.safety.cards.${i}.img`" />
          <strong :data-edit-key="`${ns}.safety.cards.${i}.title`">{{ c.title }}</strong>
          <p :data-edit-key="`${ns}.safety.cards.${i}.desc`">{{ c.desc }}</p>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useLandingSection } from '../sectionContext'

const { ns, tt, imgEdit, alt } = useLandingSection()

const safetyImgs = ['safety-cleaning-facade.jpg', 'safety-rtk.jpg', 'safety-radar.jpg']

const safetyCards = computed(() =>
  [0, 1, 2].map((i) => ({
    title: tt(`safety.cards.${i}.title`),
    desc: tt(`safety.cards.${i}.desc`),
  })),
)
</script>

<style scoped>
.safety-card img {
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  border-radius: 10px;
  margin-bottom: 14px;
  background: #f5f5f5;
}
.safety-card strong {
  display: block;
  margin-bottom: 6px;
}
</style>
