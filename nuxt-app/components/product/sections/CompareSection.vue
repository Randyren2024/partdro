<template>
  <section class="lp-section">
    <div class="lp-container">
      <div class="section-head">
        <div class="eyebrow" :data-edit-key="`${ns}.compare.eyebrow`">{{ tt('compare.eyebrow') }}</div>
        <h2 :data-edit-key="`${ns}.compare.title`">{{ tt('compare.title') }}</h2>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th></th>
              <th :data-edit-key="`${ns}.compare.colD15r`">{{ tt('compare.colD15r') }}</th>
              <th :data-edit-key="`${ns}.compare.colManual`">{{ tt('compare.colManual') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(r, i) in compareRows" :key="i">
              <td :data-edit-key="`${ns}.compare.rows.${i}.label`">{{ r.label }}</td>
              <td class="positive" :data-edit-key="`${ns}.compare.rows.${i}.d15r`">{{ r.d15r }}</td>
              <td :data-edit-key="`${ns}.compare.rows.${i}.manual`">{{ r.manual }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useLandingSection } from '../sectionContext'

const { ns, tt } = useLandingSection()
const compareRows = computed(() =>
  [0, 1, 2, 3, 4, 5].map((i) => ({
    label: tt(`compare.rows.${i}.label`),
    d15r: tt(`compare.rows.${i}.d15r`),
    manual: tt(`compare.rows.${i}.manual`),
  })),
)
</script>
