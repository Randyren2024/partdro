<template>
  <section class="inquiry-form">
    <a-card :bordered="false" class="inquiry-form__card">
      <h3>{{ t('contact.title') }}</h3>
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
    </a-card>
  </section>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { supabase } from '../../supabase/client'

const { t } = useI18n()
const loading = ref(false)
const success = ref(false)

const form = reactive({
  name: '',
  email: '',
  phone: '',
  type: 'contact' as 'contact' | 'booking' | 'franchise',
  message: '',
})

const handleSubmit = async () => {
  loading.value = true
  try {
    await supabase.from('inquiries').insert({
      name: form.name,
      email: form.email,
      phone: form.phone,
      type: form.type,
      message: form.message,
    })
    success.value = true
    Object.assign(form, { name: '', email: '', phone: '', type: 'contact', message: '' })
  } catch {
    // handle error silently
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
