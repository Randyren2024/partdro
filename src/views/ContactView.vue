<template>
  <div class="contact-page">
    <div class="page-header">
      <div class="container">
        <h1 :data-edit-key="'contact.title'">{{ t('contact.title') }}</h1>
        <p :data-edit-key="'contact.subtitle'">{{ t('contact.subtitle') }}</p>
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
              <h3 :data-edit-key="'contact.info.heading'">{{ t('contact.info.heading') }}</h3>
              <div class="contact-info__item">
                <PhoneOutlined />
                <div>
                  <p><strong :data-edit-key="'contact.info.phoneLabel'">{{ t('contact.info.phoneLabel') }}</strong></p>
                  <p :data-edit-key="'contact.info.phoneValue'">{{ t('contact.info.phoneValue') }}</p>
                </div>
              </div>
              <div class="contact-info__item">
                <MailOutlined />
                <div>
                  <p><strong :data-edit-key="'contact.info.emailLabel'">{{ t('contact.info.emailLabel') }}</strong></p>
                  <p><a href="mailto:info@droneworld.tech" :data-edit-key="'contact.info.emailValue'" @click="trackEvent('generate_lead', { location: 'contact_info' })">{{ t('contact.info.emailValue') }}</a></p>
                </div>
              </div>
              <div class="contact-info__item">
                <EnvironmentOutlined />
                <div>
                  <p><strong :data-edit-key="'contact.info.addressLabel'">{{ t('contact.info.addressLabel') }}</strong></p>
                  <p :data-edit-key="'contact.info.addressValue'">{{ t('contact.info.addressValue') }}</p>
                </div>
              </div>
              <div class="contact-info__item">
                <ClockCircleOutlined />
                <div>
                  <p><strong :data-edit-key="'contact.info.hoursLabel'">{{ t('contact.info.hoursLabel') }}</strong></p>
                  <p :data-edit-key="'contact.info.hoursValue'">{{ t('contact.info.hoursValue') }}</p>
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
