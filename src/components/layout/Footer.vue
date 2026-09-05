<template>
  <footer class="footer">
    <div class="container">
      <div class="footer__grid">
        <div class="footer__col">
          <div class="footer__logo">
            <img src="/partdro_logo_white.png" alt="Partdro" />
          </div>
          <p class="footer__desc">
            Professional D15R high-altitude cleaning drone solutions. RTK precision, 20MPa power.
          </p>
          <div class="footer__social">
            <a href="#" aria-label="Facebook"><FacebookOutlined /></a>
            <a href="#" aria-label="Instagram"><InstagramOutlined /></a>
            <a href="#" aria-label="YouTube"><YoutubeOutlined /></a>
            <a href="#" aria-label="LinkedIn"><LinkedinOutlined /></a>
          </div>
        </div>

        <div class="footer__col">
          <h4>{{ t('footer.products') }}</h4>
          <ul>
            <li><router-link to="/products">{{ t('nav.products') }}</router-link></li>
            <li><router-link to="/cases">{{ t('nav.cases') }}</router-link></li>
          </ul>
        </div>

        <div class="footer__col">
          <h4>{{ t('footer.support') }}</h4>
          <ul>
            <li><router-link to="/documents">{{ t('nav.documents') }}</router-link></li>
            <li><router-link to="/contact">{{ t('nav.contact') }}</router-link></li>
          </ul>
        </div>

        <div class="footer__col">
          <h4>{{ t('footer.company') }}</h4>
          <ul>
            <li><router-link to="/about">{{ t('nav.about') }}</router-link></li>
            <li><router-link to="/news">{{ t('nav.news') }}</router-link></li>
          </ul>
        </div>

        <div class="footer__col">
          <h4>{{ t('contact.title') }}</h4>
          <ul class="footer__contact-list">
            <li><PhoneOutlined /> +86 16788684420</li>
            <li><a href="mailto:info@partdro.com" @click="trackEvent('generate_lead', { location: 'footer' })"><MailOutlined /> info@partdro.com</a></li>
            <li><EnvironmentOutlined /> Shenzhen, China</li>
          </ul>
        </div>
      </div>

      <div class="footer__bottom">
        <p>&copy; {{ currentYear }} Partdro. {{ t('footer.copyright') }}</p>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  FacebookOutlined,
  InstagramOutlined,
  YoutubeOutlined,
  LinkedinOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons-vue'
import { trackEvent } from '../../composables/useTracking'

const { t } = useI18n()
const currentYear = computed(() => new Date().getFullYear())
</script>

<style scoped>
.footer {
  background: var(--color-dark);
  color: rgba(255, 255, 255, 0.8);
  padding: 60px 0 0;
}
.footer__grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr 1fr 1.2fr;
  gap: 40px;
  padding-bottom: 40px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
.footer__logo {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}
.footer__logo img {
  height: 36px;
}
.footer__logo span {
  font-size: 20px;
  font-weight: 700;
  color: #fff;
}
.footer__desc {
  font-size: 14px;
  line-height: 1.8;
  margin-bottom: 20px;
  opacity: 0.7;
}
.footer__social {
  display: flex;
  gap: 12px;
}
.footer__social a {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: #fff;
  transition: background 0.3s;
}
.footer__social a:hover {
  background: var(--color-primary);
}
.footer__col h4 {
  color: #fff;
  font-size: 16px;
  margin-bottom: 20px;
  font-weight: 600;
}
.footer__col ul {
  list-style: none;
  padding: 0;
}
.footer__col li {
  margin-bottom: 10px;
}
.footer__col a {
  font-size: 14px;
  opacity: 0.7;
  transition: opacity 0.2s;
}
.footer__col a:hover {
  opacity: 1;
  color: var(--color-primary-light);
}
.footer__contact-list li {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}
.footer__bottom {
  padding: 20px 0;
  text-align: center;
  font-size: 13px;
  opacity: 0.5;
}

@media (max-width: 992px) {
  .footer__grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 576px) {
  .footer__grid {
    grid-template-columns: 1fr;
  }
}
</style>
