<template>
  <section class="lp-section lp-cta">
    <div class="lp-container">
      <div class="cta-box">
        <div>
          <div class="eyebrow" :data-edit-key="`${ns}.cta.eyebrow`">{{ tt('cta.eyebrow') }}</div>
          <h2 style="margin-top:16px" :data-edit-key="`${ns}.cta.title`">{{ tt('cta.title') }}</h2>
          <p :data-edit-key="`${ns}.cta.text`">{{ tt('cta.text') }}</p>
        </div>
        <div class="btns" style="margin-top:0;min-width:220px">
          <a class="btn primary" :href="mailtoHref" @click="trackEvent('generate_lead', { location: 'cta_box' })">info@partdro.com</a>
          <RouterLink class="btn secondary" to="/" :data-edit-key="`${ns}.cta.visit`">{{ tt('cta.visit') }}</RouterLink>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useLandingSection } from '../sectionContext'

const { ns, tt, mailtoHref, trackEvent } = useLandingSection()
</script>
