<template>
  <div class="contact-page">
    <div class="page-header">
      <div class="container">
        <h1>{{ t('contact.title') }}</h1>
        <p>{{ t('contact.subtitle') }}</p>
      </div>
    </div>
    <div class="page-section">
      <div class="container">
        <a-row :gutter="60">
          <a-col :span="14">
            <InquiryForm />
          </a-col>
          <a-col :span="10">
            <div class="contact-info">
              <h3>Contact Information</h3>
              <div class="contact-info__item">
                <PhoneOutlined />
                <div>
                  <p><strong>Phone</strong></p>
                  <p>+86 16788684420</p>
                </div>
              </div>
              <div class="contact-info__item">
                <MailOutlined />
                <div>
                  <p><strong>Email</strong></p>
                  <p><a href="mailto:info@partdro.com" @click="trackEvent('generate_lead', { location: 'contact_info' })">info@partdro.com</a></p>
                </div>
              </div>
              <div class="contact-info__item">
                <EnvironmentOutlined />
                <div>
                  <p><strong>Address</strong></p>
                  <p>Shenzhen, Guangdong, China</p>
                </div>
              </div>
              <div class="contact-info__item">
                <ClockCircleOutlined />
                <div>
                  <p><strong>Business Hours</strong></p>
                  <p>Mon - Fri: 9:00 AM - 6:00 PM</p>
                </div>
              </div>
            </div>
          </a-col>
        </a-row>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { PhoneOutlined, MailOutlined, EnvironmentOutlined, ClockCircleOutlined } from '@ant-design/icons-vue'
import InquiryForm from '../components/common/InquiryForm.vue'
import { trackEvent } from '../composables/useTracking'

const { t } = useI18n()
</script>

<style scoped>
.contact-info h3 {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 32px;
}
.contact-info__item {
  display: flex;
  gap: 16px;
  margin-bottom: 28px;
}
.contact-info__item > .anticon {
  font-size: 24px;
  color: var(--color-primary);
  margin-top: 4px;
}
.contact-info__item p {
  margin: 0;
  line-height: 1.6;
}
.contact-info__item p:first-child {
  font-size: 14px;
  color: var(--color-text-light);
}
.contact-info__item p:last-child {
  font-size: 16px;
}
</style>
