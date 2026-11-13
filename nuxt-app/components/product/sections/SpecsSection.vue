<template>
  <section class="lp-section" id="specs">
    <div class="lp-container">
      <div class="section-head">
        <div class="eyebrow" :data-edit-key="`${ns}.specs.eyebrow`">{{ tt('specs.eyebrow') }}</div>
        <h2 :data-edit-key="`${ns}.specs.title`">{{ tt('specs.title') }}</h2>
        <p class="lead" style="margin-top:18px" :data-edit-key="`${ns}.specs.lead`">{{ tt('specs.lead') }}</p>
      </div>
      <div class="specs">
        <div v-for="(s, i) in specItems" :key="i" class="spec">
          <span :data-edit-key="`${ns}.specs.items.${i}.label`">{{ s.label }}</span><strong :data-edit-key="`${ns}.specs.items.${i}.value`">{{ s.value }}</strong>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useLandingSection } from '../sectionContext'

const { ns, tt } = useLandingSection()
// 渲染 i18n 里实际存在的 spec 条目（到缺译即停），不同产品条数可以不同
const specItems = computed(() => {
  const items: { label: string; value: string }[] = []
  for (let i = 0; i < 40; i++) {
    const key = `specs.items.${i}.label`
    const label = tt(key)
    if (label === `${ns.value}.${key}`) break
    items.push({ label, value: tt(`specs.items.${i}.value`) })
  }
  return items
})
</script>
