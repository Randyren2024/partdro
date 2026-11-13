<template>
  <section class="lp-section">
    <div class="lp-container split">
      <div>
        <div class="eyebrow" :data-edit-key="`${ns}.multiangle.eyebrow`">{{ tt('multiangle.eyebrow') }}</div>
        <h2 style="margin-top:18px" :data-edit-key="`${ns}.multiangle.title`">{{ tt('multiangle.title') }}</h2>
        <p class="lead" style="margin-top:18px" :data-edit-key="`${ns}.multiangle.lead`">{{ tt('multiangle.lead') }}</p>
        <div class="list">
          <div v-for="(item, i) in multiItems" :key="i" class="list-item">
            <div class="num">{{ ['↗', '↔', '＋'][i] }}</div>
            <div><strong :data-edit-key="`${ns}.multiangle.items.${i}.title`">{{ item.title }}</strong><p :data-edit-key="`${ns}.multiangle.items.${i}.desc`">{{ item.desc }}</p></div>
          </div>
        </div>
      </div>
      <div class="media-card"><img :src="imgEdit('page007_img001.png', `${ns}.multiangle.img`)" :alt="alt('multiangle')" :data-edit-img="`${ns}.multiangle.img`" /></div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useLandingSection } from '../sectionContext'

const { ns, tt, imgEdit, alt } = useLandingSection()
const multiItems = computed(() =>
  [0, 1, 2, 3].map((i) => ({
    title: tt(`multiangle.items.${i}.title`),
    desc: tt(`multiangle.items.${i}.desc`),
  })),
)
</script>
