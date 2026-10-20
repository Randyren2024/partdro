<template>
  <section class="inquiry-form">
    <a-card :bordered="false" class="inquiry-form__card">
      <h3 :data-edit-key="'contact.formTitle'">{{ t('contact.formTitle') }}</h3>
      <a-form :model="form" layout="vertical" @finish="handleSubmit">
        <a-form-item name="name" :rules="[{ required: true }]">
          <a-input v-model:value="form.name" :placeholder="t('contact.name')" />
        </a-form-item>
        <a-form-item name="email" :rules="[{ required: true, type: 'email' }]">
          <a-input v-model:value="form.email" :placeholder="t('contact.email')" />
        </a-form-item>
        <a-form-item name="phone">
          <a-input v-model:value="form.phone" :placeholder="t('contact.phone')" />
        </a-form-item>
        <a-form-item name="type">
          <a-select v-model:value="form.type" :placeholder="t('contact.type')">
            <a-select-option value="contact">{{ t('contact.typeContact') }}</a-select-option>
            <a-select-option value="booking">{{ t('contact.typeBooking') }}</a-select-option>
            <a-select-option value="franchise">{{ t('contact.typeFranchise') }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item name="message" :rules="[{ required: true }]">
          <a-textarea v-model:value="form.message" :placeholder="t('contact.message')" :rows="3" />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" html-type="submit" block :loading="loading">
            {{ t('contact.submit') }}
          </a-button>
        </a-form-item>
      </a-form>
      <a-alert v-if="success" type="success" :message="t('contact.success')" show-icon style="margin-top: 12px" />
      <a-alert v-if="errorMsg" type="error" :message="errorMsg" show-icon style="margin-top: 12px" />
    </a-card>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { supabase } from '../../supabase/client'
import { trackEvent } from '../../composables/useTracking'
import { attributionFields } from '../../composables/useAttribution'

const { t } = useI18n()
const route = useRoute()
const loading = ref(false)
const success = ref(false)
const errorMsg = ref('')

// 当前页面属于哪个产品（非产品页为 null）。
// /products/c500-partdro-eavision 是独立路由，params.slug 为空，需单独兜底。
const productSlug = computed<string | null>(() => {
  const slug = route.params.slug
  if (typeof slug === 'string' && slug) return slug
  if (route.name === 'c500-eavision') return 'c500-partdro-eavision'
  return null
})

const form = reactive({
  name: '',
  email: '',
  phone: '',
  type: 'contact' as 'contact' | 'booking' | 'franchise',
  message: '',
})

const handleSubmit = async () => {
  loading.value = true
  success.value = false
  errorMsg.value = ''
  try {
    const { error } = await supabase.from('inquiries').insert({
      name: form.name,
      email: form.email,
      phone: form.phone,
      type: form.type,
      message: form.message,
      ...attributionFields(route.path, productSlug.value),
    })
    if (error) {
      console.error('[contact form] insert failed:', error.code, error.message)
      errorMsg.value = t('contact.error')
      return
    }
    trackEvent('contact_form_submission', { form_type: form.type })
    success.value = true
    Object.assign(form, { name: '', email: '', phone: '', type: 'contact', message: '' })
  } catch (e) {
    console.error('[contact form] unexpected error:', e)
    errorMsg.value = t('contact.error')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.inquiry-form__card {
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
}
.inquiry-form__card h3 {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 20px;
  text-align: center;
  color: var(--color-dark);
}
</style>
