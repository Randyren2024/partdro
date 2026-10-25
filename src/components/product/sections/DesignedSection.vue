<template>
  <section class="lp-section" style="padding-top:20px">
    <div class="lp-container split">
      <div class="media-card"><img :src="imgEdit('page003_img002.png', `${ns}.designed.img`)" :alt="alt('designed')" :data-edit-img="`${ns}.designed.img`" /></div>
      <div>
        <div class="eyebrow" :data-edit-key="`${ns}.designed.eyebrow`">{{ tt('designed.eyebrow') }}</div>
        <h2 style="margin-top:18px" :data-edit-key="`${ns}.designed.title`">{{ tt('designed.title') }}</h2>
        <p class="lead" style="margin-top:18px" :data-edit-key="`${ns}.designed.lead`">{{ tt('designed.lead') }}</p>
        <div class="list">
          <div v-for="(item, i) in designedItems" :key="i" class="list-item">
            <div class="num">{{ ['A', 'B', 'C'][i] }}</div>
            <div><strong :data-edit-key="`${ns}.designed.items.${i}.title`">{{ item.title }}</strong><p :data-edit-key="`${ns}.designed.items.${i}.desc`">{{ item.desc }}</p></div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useLandingSection } from '../sectionContext'

const { ns, tt, imgEdit, alt } = useLandingSection()
const designedItems = computed(() =>
  [0, 1, 2].map((i) => ({
    title: tt(`designed.items.${i}.title`),
    desc: tt(`designed.items.${i}.desc`),
  })),
)
</script>
