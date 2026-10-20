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
          <a class="btn primary" :href="mailtoHref" @click="trackEvent('generate_lead', { location: 'cta_box' })">info@droneworld.tech</a>
          <RouterLink class="btn secondary" to="/" :data-edit-key="`${ns}.cta.visit`">{{ tt('cta.visit') }}</RouterLink>
        </div>
      </div>

      <!-- 产品页询盘表单：落地页直接承接高意向采购者。
           提交成功会 push 'contact_form_submission' → GTM 的 Google Ads 转化标签据此回传转化。 -->
      <div class="cta-form" id="quote">
        <InquiryForm />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useLandingSection } from '../sectionContext'
import InquiryForm from '../../common/InquiryForm.vue'

const { ns, tt, mailtoHref, trackEvent } = useLandingSection()
</script>
