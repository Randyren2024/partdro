<template>
  <section class="inquiry-form">
    <a-card :bordered="false" class="inquiry-form__card">
      <h3 :data-edit-key="'contact.formTitle'">{{ t('contact.formTitle') }}</h3>
      <a-form :model="form" layout="vertical" @finish="handleSubmit" :validate-trigger="['blur', 'change']">
        <a-form-item name="name" :rules="[{ required: true, whitespace: true, message: t('contact.validation.nameRequired') }, { min: 2, message: t('contact.validation.nameMin') }]">
          <a-input v-model:value="form.name" :placeholder="t('contact.name')" :aria-label="t('contact.name')" autocomplete="name" />
        </a-form-item>
        <a-form-item name="email" :rules="[{ required: true, message: t('contact.validation.emailRequired') }, { type: 'email', message: t('contact.validation.emailInvalid') }]">
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
        <a-form-item name="message" :rules="[{ required: true, whitespace: true, message: t('contact.validation.messageRequired') }, { min: 5, message: t('contact.validation.messageMin') }]">
          <a-textarea v-model:value="form.message" :placeholder="t('contact.message')" :aria-label="t('contact.message')" :rows="4" />
        </a-form-item>
        <div class="inquiry-form__honeypot" aria-hidden="true">
          <label for="inquiry-website">Website</label>
          <input id="inquiry-website" v-model="form.website" name="website" type="text" tabindex="-1" autocomplete="off">
        </div>
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
import { trackEvent } from '../../composables/useTracking'
import { attributionFields } from '../../composables/useAttribution'

const { t } = useI18n({ useScope: 'global' })
const route = useRoute()
const loading = ref(false)
const success = ref(false)
const errorMsg = ref('')

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
  website: '',
})

const handleSubmit = async () => {
  if (loading.value) return
  loading.value = true
  success.value = false
  errorMsg.value = ''
  try {
    const result = await $fetch<{ ok: boolean; spam?: boolean }>('/api/inquiry', {
      method: 'POST',
      body: {
        name: form.name,
        email: form.email,
        phone: form.phone,
        type: form.type,
        message: form.message,
        website: form.website,
        ...attributionFields(route.path, productSlug.value),
      },
    })

    if (!result.ok) {
      errorMsg.value = t('contact.error')
      return
    }

    if (!result.spam) {
      trackEvent('contact_form_submission', { form_type: form.type })
    }
    success.value = true
    Object.assign(form, { name: '', email: '', phone: '', type: 'contact', message: '', website: '' })
  } catch (e) {
    console.error('[contact form] server submission failed:', e)
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
.inquiry-form__honeypot {
  position: absolute;
  left: -10000px;
  width: 1px;
  height: 1px;
  overflow: hidden;
}
@media (max-width: 640px) {
  .inquiry-form__card { padding: 4px; }
  .inquiry-form__card :deep(.ant-form-item) { margin-bottom: 16px; }
  .inquiry-form__card :deep(.ant-input),
  .inquiry-form__card :deep(.ant-input-affix-wrapper),
  .inquiry-form__card :deep(.ant-select-selector),
  .inquiry-form__card :deep(textarea.ant-input) { font-size: 16px !important; }
  .inquiry-form__card :deep(.ant-btn) { min-height: 50px; }
}
</style>
