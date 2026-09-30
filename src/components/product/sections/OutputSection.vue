<template>
  <section class="lp-section">
    <div class="lp-container metric-grid grid">
      <div class="metric-card">
        <div class="eyebrow" :data-edit-key="`${ns}.output.eyebrow`">{{ tt('output.eyebrow') }}</div>
        <div class="big-number" :data-edit-key="`${ns}.output.bigNumber`">{{ bigNumber }}</div>
        <h3 :data-edit-key="`${ns}.output.unitTitle`">{{ tt('output.unitTitle') }}</h3>
        <p class="metric-note" style="margin-top:14px" :data-edit-key="`${ns}.output.note`">{{ tt('output.note') }}</p>
      </div>
      <div class="metric-card metric-side">
        <div v-for="(r, i) in outputRows" :key="i" class="data-row">
          <span :data-edit-key="`${ns}.output.rows.${i}.label`">{{ r.label }}</span><strong :data-edit-key="`${ns}.output.rows.${i}.value`">{{ r.value }}</strong>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useLandingSection } from '../sectionContext'

const { ns, tt } = useLandingSection()
// 大数字可编辑（output.bigNumber）；旧数据无此键时回退 '1,000'（d15r 等存量页不变）
const bigNumber = computed(() => {
  const v = tt('output.bigNumber')
  return v === `${ns.value}.output.bigNumber` ? '1,000' : v
})
const outputRows = computed(() =>
  [0, 1, 2, 3, 4].map((i) => ({
    label: tt(`output.rows.${i}.label`),
    value: tt(`output.rows.${i}.value`),
  })),
)
</script>
