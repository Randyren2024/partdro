<template>
  <section class="inquiry-form">
    <a-card :bordered="false" class="inquiry-form__card">
      <h3 :data-edit-key="'contact.formTitle'">{{ t('contact.formTitle') }}</h3>
      <a-form :model="form" layout="vertical" @finish="handleSubmit" :validate-trigger="['blur', 'change']">
        <a-form-item name="name" :rules="[{ required: true, whitespace: true }]">
          <a-input v-model:value="form.name" :placeholder="t('contact.name')" :aria-label="t('contact.name')" autocomplete="name" />
        </a-form-item>
        <a-form-item name="email" :rules="[{ required: true, type: 'email' }]">
          <a-input v-model:value="form.email" type="email" :placeholder="t('contact.email')" :aria-label="t('contact.email')" autocomplete="email" />
        </a-form-item>
        <a-form-item name="phone">
          <a-input v-model:value="form.phone" type="tel" :placeholder="t('contact.phone')" :aria-label="t('contact.phone')" autocomplete="tel" />
        </a-form-item>
        <a-form-item name="type">
          <a-select v-model:value="form.type" :placeholder="t('contact.type')" :aria-label="t('contact.type')">
            <a-select-option value="contact">{{ t('contact.typeContact') }}</a-select-option>
            <a-select-option value="booking">{{ t('contact.typeBooking') }}</a-select-option>
            <a-select-option value="franchise">{{ t('contact.typeFranchise') }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item name="message" :rules="[{ required: true, whitespace: true }]">
          <a-textarea v-model:value="form.message" :placeholder="t('contact.message')" :aria-label="t('contact.message')" :rows="4" />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" html-type="submit" block size="large" :loading="loading" :disabled="loading">
            {{ t('contact.submit') }}
          </a-button>
        </a-form-item>
      </a-form>
      <a-alert v-if="success" role="status" aria-live="polite" type="success" :message="t('contact.success')" show-icon style="margin-top: 12px" />
      <a-alert v-if="errorMsg" role="alert" type="error" :message="errorMsg" show-icon style="margin-top: 12px" />
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
const productSlug = computed<string | null>(() => {
  const slug = route.params.slug
  return typeof slug === 'string' && slug ? slug : null
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
.inquiry-form__card :deep(.ant-input),
.inquiry-form__card :deep(.ant-input-affix-wrapper),
.inquiry-form__card :deep(.ant-select-selector) {
  min-height: 46px;
}
.inquiry-form__card :deep(textarea.ant-input) {
  min-height: 112px;
}
.inquiry-form__card :deep(.ant-btn) {
  min-height: 48px;
  font-weight: 700;
}
.inquiry-form__card h3 {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 20px;
  text-align: center;
  color: var(--color-dark);
}
</style>
