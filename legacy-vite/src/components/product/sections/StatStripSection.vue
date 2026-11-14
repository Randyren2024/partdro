<template>
  <div class="stat-strip">
    <div class="lp-container stats">
      <div v-for="(s, i) in stripStats" :key="i" class="stat">
        <strong :data-edit-key="`${ns}.strip.${i}.value`">{{ s.value }}</strong><span :data-edit-key="`${ns}.strip.${i}.label`">{{ s.label }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useLandingSection } from '../sectionContext'

const { ns, tt } = useLandingSection()
const stripStats = computed(() =>
  [0, 1, 2, 3, 4].map((i) => ({
    value: tt(`strip.${i}.value`),
    label: tt(`strip.${i}.label`),
  })),
)
</script>
