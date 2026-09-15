<template>
  <div class="site-footer">
    <!-- 品牌 CTA 收尾区（复刻 D15R 落地页深色收尾观感；D15R 自带 lp-cta，此处隐藏避免重复） -->
    <section v-if="showCta" class="footer-cta">
      <div class="container">
        <div class="cta-card">
          <div class="cta-card__copy">
            <div class="cta-eyebrow" :data-edit-key="'footer.cta.eyebrow'">{{ t('footer.cta.eyebrow') }}</div>
            <h2 class="cta-card__title" :data-edit-key="'footer.cta.title'">{{ t('footer.cta.title') }}</h2>
            <p class="cta-card__text" :data-edit-key="'footer.cta.text'">{{ t('footer.cta.text') }}</p>
          </div>
          <div class="cta-card__actions">
            <a class="cta-btn cta-btn--primary" :href="'mailto:' + mail" @click="trackEvent('generate_lead', { location: 'footer_cta' })">{{ mail }}</a>
            <router-link class="cta-btn cta-btn--ghost" to="/products" :data-edit-key="'footer.cta.visit'">{{ t('footer.cta.visit') }}</router-link>
          </div>
        </div>
      </div>
    </section>

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
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
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
const route = useRoute()
const currentYear = computed(() => new Date().getFullYear())
const mail = computed(() => t('footer.cta.mail'))
// D15R 落地页自带同款 lp-cta 收尾卡，全局 CTA 对其隐藏避免重复
const showCta = computed(() => route.path !== '/products/d15r')
</script>

<style scoped>
/* ===== 品牌 CTA 收尾区（观感对齐 D15R 落地页 lp-cta） ===== */
.footer-cta {
  position: relative;
  overflow: hidden;
  padding: 96px 0 88px;
  background-color: #070a0c;
  /* 细斜线纹理（对齐 D15R 落地页 .d15r-landing 网格） */
  background-image:
    linear-gradient(30deg, transparent 49%, rgba(255, 255, 255, 0.03) 50%, transparent 51%),
    linear-gradient(-30deg, transparent 49%, rgba(255, 255, 255, 0.02) 50%, transparent 51%);
  background-size: 180px 104px;
}
.footer-cta::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(circle at 80% 0%, rgba(57, 191, 212, 0.14), transparent 34%),
    radial-gradient(circle at 8% 60%, rgba(57, 191, 212, 0.06), transparent 30%);
}
.footer-cta .container {
  position: relative;
  z-index: 1;
}
.cta-card {
  border: 1px solid rgba(57, 191, 212, 0.3);
  background: radial-gradient(circle at 80% 20%, rgba(57, 191, 212, 0.13), transparent 30%), rgba(255, 255, 255, 0.025);
  border-radius: 32px;
  padding: 56px 58px;
  display: flex;
  justify-content: space-between;
  gap: 36px;
  align-items: center;
  flex-wrap: wrap;
}
.cta-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #39bfd4;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}
.cta-eyebrow::before {
  content: "";
  width: 26px;
  height: 2px;
  background: #39bfd4;
  display: block;
}
.cta-card__title {
  color: #fff;
  font-size: clamp(1.7rem, 3.2vw, 2.6rem);
  line-height: 1.15;
  letter-spacing: -0.02em;
  margin-top: 14px;
  font-weight: 700;
}
.cta-card__text {
  color: #a8b4b9;
  max-width: 640px;
  margin-top: 12px;
  font-size: 1.02rem;
  line-height: 1.7;
}
.cta-card__actions {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  min-width: 220px;
}
.cta-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border-radius: 999px;
  padding: 14px 22px;
  font-weight: 800;
  font-size: 0.95rem;
  transition: 0.25s ease;
  cursor: pointer;
}
.cta-btn--primary {
  background: #39bfd4;
  color: #001115;
  border: 1px solid #39bfd4;
}
.cta-btn--primary:hover {
  background: #74e6f4;
  transform: translateY(-2px);
}
.cta-btn--ghost {
  background: rgba(255, 255, 255, 0.03);
  color: #f4f7f8;
  border: 1px solid rgba(255, 255, 255, 0.12);
}
.cta-btn--ghost:hover {
  transform: translateY(-2px);
  border-color: rgba(255, 255, 255, 0.28);
}

/* ===== 原有页脚 ===== */
.footer {
  background-color: var(--color-dark);
  /* 页脚条同样织入细斜线纹理，与 D15R 页面落地纹理衔接一致 */
  background-image:
    linear-gradient(30deg, transparent 49%, rgba(255, 255, 255, 0.025) 50%, transparent 51%),
    linear-gradient(-30deg, transparent 49%, rgba(255, 255, 255, 0.016) 50%, transparent 51%);
  background-size: 180px 104px;
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
  .cta-card {
    flex-direction: column;
    align-items: flex-start;
    padding: 42px;
  }
  .cta-card__actions {
    width: 100%;
  }
}

@media (max-width: 576px) {
  .footer__grid {
    grid-template-columns: 1fr;
  }
  .footer-cta {
    padding: 60px 0 56px;
  }
  .cta-card {
    padding: 30px 26px;
    border-radius: 22px;
  }
  .cta-card__actions {
    flex-direction: column;
    width: 100%;
  }
  .cta-btn {
    width: 100%;
  }
}
</style>
