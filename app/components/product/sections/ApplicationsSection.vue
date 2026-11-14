<template>
  <section class="lp-section" id="applications">
    <div class="lp-container">
      <div class="section-head">
        <div class="eyebrow" :data-edit-key="`${ns}.applications.eyebrow`">{{ tt('applications.eyebrow') }}</div>
        <h2 :data-edit-key="`${ns}.applications.title`">{{ tt('applications.title') }}</h2>
        <p class="lead" style="margin-top:18px" :data-edit-key="`${ns}.applications.lead`">{{ tt('applications.lead') }}</p>
      </div>
      <div class="grid case-grid">
        <article
          v-for="(c, i) in caseItems"
          :key="i"
          class="case"
          @click="!editMode && openLightbox(c.img, c.title)"
        >
          <img :src="imgEdit(c.img, `${ns}.applications.cases.${i}.img`)" :alt="c.title" :data-edit-img="`${ns}.applications.cases.${i}.img`" />
          <div class="body"><span :data-edit-key="`${ns}.applications.badges.${c.badge}`">{{ tt(`applications.badges.${c.badge}`) }}</span><h3 :data-edit-key="`${ns}.applications.cases.${i}.title`">{{ c.title }}</h3></div>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useLandingSection } from '../sectionContext'

const { ns, tt, imgEdit, editMode, openLightbox, caseImages } = useLandingSection()
const caseItems = computed(() =>
  [0, 1, 2, 3, 4, 5].map((i) => ({
    img: caseImages.value[i],
    badge: tt(`applications.cases.${i}.badge`),
    title: tt(`applications.cases.${i}.title`),
  })),
)
</script>
