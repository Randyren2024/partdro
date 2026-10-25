<template>
  <section class="lp-section" style="padding-top:30px">
    <div class="lp-container">
      <div class="section-head">
        <div class="eyebrow" :data-edit-key="`${ns}.spray.eyebrow`">{{ tt('spray.eyebrow') }}</div>
        <h2 :data-edit-key="`${ns}.spray.title`">{{ tt('spray.title') }}</h2>
        <p class="lead" style="margin-top:18px" :data-edit-key="`${ns}.spray.lead`">{{ tt('spray.lead') }}</p>
      </div>
      <div class="grid nozzle-grid">
        <article v-for="(n, i) in nozzles" :key="i" class="nozzle-card">
          <img :src="imgEdit(nozzleImages[i], `${ns}.spray.nozzles.${i}.img`)" :alt="n.angle" :data-edit-img="`${ns}.spray.nozzles.${i}.img`" />
          <div class="body"><div class="angle" :data-edit-key="`${ns}.spray.nozzles.${i}.angle`">{{ n.angle }}</div><p :data-edit-key="`${ns}.spray.nozzles.${i}.desc`">{{ n.desc }}</p></div>
        </article>
      </div>
      <div class="dual">
        <div class="media-card"><img :src="imgEdit('page006_img003.png', `${ns}.spray.dualImg1`)" :alt="alt('spray1')" :data-edit-img="`${ns}.spray.dualImg1`" /></div>
        <div class="media-card"><img :src="imgEdit('page006_img004.png', `${ns}.spray.dualImg2`)" :alt="alt('spray2')" :data-edit-img="`${ns}.spray.dualImg2`" /></div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useLandingSection } from '../sectionContext'

const { ns, tt, imgEdit, alt, nozzleImages } = useLandingSection()
const nozzles = computed(() =>
  [0, 1, 2, 3].map((i) => ({
    angle: tt(`spray.nozzles.${i}.angle`),
    desc: tt(`spray.nozzles.${i}.desc`),
  })),
)
</script>
