<template>
  <section class="lp-section" style="padding-top:10px">
    <div class="lp-container">
      <div class="grid scenario-grid">
        <article v-for="(s, i) in scenarioItems" :key="i" class="scenario">
          <img :src="imgEdit(s.img, `${ns}.scenarios.${i}.img`)" :alt="s.title" :data-edit-img="`${ns}.scenarios.${i}.img`" />
          <div class="scenario-body"><h3 :data-edit-key="`${ns}.scenarios.${i}.title`">{{ s.title }}</h3><p :data-edit-key="`${ns}.scenarios.${i}.desc`">{{ s.desc }}</p></div>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useLandingSection } from '../sectionContext'

const { ns, tt, imgEdit, scenarioImages } = useLandingSection()
const scenarioItems = computed(() =>
  [0, 1, 2, 3].map((i) => ({
    img: scenarioImages.value[i],
    title: tt(`scenarios.${i}.title`),
    desc: tt(`scenarios.${i}.desc`),
  })),
)
</script>
