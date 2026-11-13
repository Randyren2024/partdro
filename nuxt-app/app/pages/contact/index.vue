<template>
  <div class="contact-page">
    <div class="page-header">
      <div class="container">
        <h1 :data-edit-key="'contact.title'">{{ t('contact.title') }}</h1>
        <p :data-edit-key="'contact.subtitle'">{{ t('contact.subtitle') }}</p>
      </div>
    </div>
    <section class="page-section contact-section">
      <div class="container">
        <a-row :gutter="[32, 32]" align="top">
          <a-col :xs="24" :lg="14">
            <div class="contact-form-panel">
              <InquiryForm />
            </div>
          </a-col>
          <a-col :xs="24" :lg="10">
            <aside class="contact-info">
              <h2 :data-edit-key="'contact.info.heading'">{{ t('contact.info.heading') }}</h2>
              <div class="contact-info__item">
                <PhoneOutlined />
                <div>
                  <p><strong :data-edit-key="'contact.info.phoneLabel'">{{ t('contact.info.phoneLabel') }}</strong></p>
                  <p><a href="tel:+8616788684420" :data-edit-key="'contact.info.phoneValue'" @click="trackEvent('phone_click', { location: 'contact_info' })">{{ t('contact.info.phoneValue') }}</a></p>
                </div>
              </div>
              <div class="contact-info__item">
                <MailOutlined />
                <div>
                  <p><strong :data-edit-key="'contact.info.emailLabel'">{{ t('contact.info.emailLabel') }}</strong></p>
                  <p><a href="mailto:info@droneworld.tech" :data-edit-key="'contact.info.emailValue'" @click="trackEvent('email_click', { location: 'contact_info' })">{{ t('contact.info.emailValue') }}</a></p>
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
            </aside>
          </a-col>
        </a-row>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { PhoneOutlined, MailOutlined, EnvironmentOutlined, ClockCircleOutlined } from '@ant-design/icons-vue'
import InquiryForm from '~/components/common/InquiryForm.vue'
import { trackEvent } from '~/composables/useTracking'

const { t } = useI18n()
</script>

<style scoped>
.contact-section { padding-top: clamp(48px, 6vw, 76px); }
.contact-form-panel {
  min-width: 0;
  padding: clamp(20px, 3vw, 34px);
  border: 1px solid var(--pd-line);
  border-radius: var(--pd-radius-lg);
  background: var(--pd-surface);
  box-shadow: var(--pd-shadow-sm);
}
.contact-form-panel :deep(.inquiry-form__card) {
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}
.contact-info {
  height: 100%;
  padding: clamp(24px, 3vw, 34px);
  border: 1px solid var(--pd-line);
  border-radius: var(--pd-radius-lg);
  background: var(--pd-surface);
  box-shadow: var(--pd-shadow-sm);
}
.contact-info h2 {
  margin: 0 0 28px;
  color: var(--pd-ink);
  font-size: 26px;
  font-weight: 750;
}
.contact-info__item {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  margin-bottom: 24px;
}
.contact-info__item:last-child { margin-bottom: 0; }
.contact-info__item > .anticon {
  flex: 0 0 auto;
  margin-top: 3px;
  color: var(--pd-primary);
  font-size: 20px;
}
.contact-info__item > div { min-width: 0; }
.contact-info__item p {
  margin: 0;
  overflow-wrap: anywhere;
  line-height: 1.6;
}
.contact-info__item p:first-child {
  margin-bottom: 3px;
  color: var(--pd-ink-muted);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: .06em;
  text-transform: uppercase;
}
.contact-info__item p:last-child {
  color: var(--pd-ink);
  font-size: 15px;
}
.contact-info__item a { color: var(--pd-primary); font-weight: 650; }
.contact-info__item a:hover { text-decoration: underline; }
@media (max-width: 991px) {
  .contact-form-panel { padding: 22px; }
}
@media (max-width: 575px) {
  .contact-form-panel, .contact-info { padding: 20px; }
}
</style>
