<template>
  <section class="lp-section" id="intelligence">
    <div class="lp-container route-grid grid">
      <div class="route-image"><img :src="imgEdit('page004_img002.png', `${ns}.intelligence.img`)" :alt="alt('intelligence')" :data-edit-img="`${ns}.intelligence.img`" /></div>
      <div class="route-copy">
        <div class="eyebrow" :data-edit-key="`${ns}.intelligence.eyebrow`">{{ tt('intelligence.eyebrow') }}</div>
        <h2 style="margin-top:18px" :data-edit-key="`${ns}.intelligence.title`">{{ tt('intelligence.title') }}</h2>
        <p class="lead" style="margin-top:18px" :data-edit-key="`${ns}.intelligence.lead`">{{ tt('intelligence.lead') }}</p>
        <div class="list">
          <div v-for="(item, i) in intelItems" :key="i" class="list-item">
            <div class="num">{{ String(i + 1).padStart(2, '0') }}</div>
            <div><strong :data-edit-key="`${ns}.intelligence.items.${i}.title`">{{ item.title }}</strong><p :data-edit-key="`${ns}.intelligence.items.${i}.desc`">{{ item.desc }}</p></div>
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
const intelItems = computed(() =>
  [0, 1, 2, 3].map((i) => ({
    title: tt(`intelligence.items.${i}.title`),
    desc: tt(`intelligence.items.${i}.desc`),
  })),
)
</script>
