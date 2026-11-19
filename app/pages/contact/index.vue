<script setup lang="ts">
import { attributionFields } from '~/composables/useAttribution'
import { trackEvent } from '~/composables/useTracking'
const route = useRoute()
const form = reactive({ name:'', email:'', phone:'', company:'', country:'', type:'contact', message:'', website:'' })
const loading = ref(false)
const success = ref(false)
const errorMessage = ref('')
async function submit() {
  if (loading.value) return
  loading.value = true; success.value = false; errorMessage.value = ''
  try {
    const productSlug = typeof route.query.product === 'string' ? route.query.product : null
    const result = await $fetch<{ok:boolean,spam?:boolean}>('/api/inquiry', { method:'POST', body:{...form,...attributionFields(route.path, productSlug)} })
    if (!result.ok) throw new Error('Unable to submit inquiry')
    success.value = true
    if (!result.spam) trackEvent('contact_form_submission', { form_type: form.type, product_slug: productSlug })
    Object.assign(form,{name:'',email:'',phone:'',company:'',country:'',type:'contact',message:'',website:''})
  } catch (error:any) { errorMessage.value = error?.data?.statusMessage || 'We could not receive your message. Please try again.' }
  finally { loading.value = false }
}
useSeoMeta({ title:'Contact Drone World', description:'Contact Drone World about professional UAV products, manufacturers and sourcing.' })
</script>
<template>
  <section class="page-intro"><div class="eyebrow">Talk to our team</div><h1>Tell us what you need.</h1><p>Share your application, payload, endurance or operating requirements. We will help you identify suitable UAV solutions.</p></section>
  <section class="section"><div class="contact-grid">
    <form class="form-panel" @submit.prevent="submit">
      <h2>Send an inquiry</h2>
      <p v-if="route.query.product" class="tag">Product: {{ route.query.product }}</p>
      <div class="form-field"><label for="name">Name *</label><input id="name" v-model="form.name" required minlength="2" maxlength="120" autocomplete="name"></div>
      <div class="form-field"><label for="email">Email *</label><input id="email" v-model="form.email" type="email" required maxlength="254" autocomplete="email"></div>
      <div class="form-field"><label for="phone">Phone</label><input id="phone" v-model="form.phone" type="tel" maxlength="40" autocomplete="tel"></div>
      <div class="form-field"><label for="company">Company</label><input id="company" v-model="form.company" maxlength="160" autocomplete="organization"></div>
      <div class="form-field"><label for="country">Country</label><input id="country" v-model="form.country" maxlength="120" autocomplete="country-name"></div>
      <div class="form-field"><label for="type">Inquiry type</label><select id="type" v-model="form.type"><option value="contact">General inquiry</option><option value="booking">Product inquiry</option><option value="franchise">Partnership</option></select></div>
      <div class="form-field"><label for="message">Requirements / message *</label><textarea id="message" v-model="form.message" required minlength="5" maxlength="5000"></textarea></div>
      <div class="honeypot" aria-hidden="true"><label for="website">Website</label><input id="website" v-model="form.website" tabindex="-1" autocomplete="off"></div>
      <button class="form-submit" type="submit" :disabled="loading">{{ loading ? 'Sending…' : 'Send inquiry' }}</button>
      <p v-if="success" class="form-status" role="status">Thank you. Your inquiry has been received.</p><p v-if="errorMessage" class="form-status form-error" role="alert">{{ errorMessage }}</p>
    </form>
    <aside class="info-panel"><h2>Drone World</h2><p>Professional UAV sourcing and supplier connections.</p><p><strong>Email</strong><br><a href="mailto:info@droneworld.tech">info@droneworld.tech</a></p><p><strong>Browse first</strong><br><NuxtLink to="/products">Product catalogue</NuxtLink><br><NuxtLink to="/suppliers">Supplier directory</NuxtLink></p></aside>
  </div></section>
</template>
