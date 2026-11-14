<template>
  <section class="lp-section" id="kit">
    <div class="lp-container">
      <div class="kit-head">
        <div class="eyebrow" :data-edit-key="`${ns}.kit.eyebrow`">{{ tt('kit.eyebrow') }}</div>
        <h2 :data-edit-key="`${ns}.kit.title`">{{ tt('kit.title') }}</h2>
        <p class="lead" :data-edit-key="`${ns}.kit.lead`">{{ tt('kit.lead') }}</p>
      </div>
      <figure class="kit-figure">
        <img
          :src="imgEdit('kit-standard-list.png', `${ns}.kit.img`)"
          :alt="alt('kit')"
          :data-edit-img="`${ns}.kit.img`"
        />
      </figure>
      <ul class="kit-list">
        <li v-for="(item, i) in kitItems" :key="i" :data-edit-key="`${ns}.kit.items.${i}`">{{ item }}</li>
      </ul>
      <div class="kit-optional">
        <strong :data-edit-key="`${ns}.kit.optionalTitle`">{{ tt('kit.optionalTitle') }}</strong>
        <p :data-edit-key="`${ns}.kit.optionalDesc`">{{ tt('kit.optionalDesc') }}</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useLandingSection } from '../sectionContext'

const { ns, tt, imgEdit, alt } = useLandingSection()
const kitItems = computed(() => [0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => tt(`kit.items.${i}`)))
</script>

<style scoped>
.kit-head {
  text-align: center;
  max-width: 720px;
  margin: 0 auto 28px;
}
.kit-head h2 {
  margin-top: 14px;
}
.kit-head .lead {
  margin-top: 14px;
}
.kit-figure {
  margin: 0;
}
.kit-figure img {
  width: 100%;
  display: block;
  border-radius: 14px;
  border: 1px solid rgba(125, 125, 125, 0.25);
}
.kit-list {
  list-style: none;
  margin: 24px 0 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 10px;
}
.kit-list li {
  padding: 12px 16px;
  border: 1px solid rgba(125, 125, 125, 0.25);
  border-radius: 10px;
  background: rgba(125, 125, 125, 0.06);
}
.kit-optional {
  margin-top: 18px;
  padding: 14px 18px;
  border: 1px dashed rgba(214, 72, 43, 0.5);
  border-radius: 10px;
}
.kit-optional strong {
  color: #d6482b;
}
.kit-optional p {
  margin-top: 6px;
  opacity: 0.85;
}
</style>
