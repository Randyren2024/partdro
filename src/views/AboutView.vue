<template>
  <div class="about">
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-image-container">
        <img
          :src="imgEdit('/images/c500-delivery-drone/hero.png', 'about.hero.img')"
          alt="Partdro - About Us"
          class="hero-img"
          data-edit-img="about.hero.img"
          @error="(e) => handleImageError(e, '/images/placeholder.svg')"
        />
        <div class="hero-overlay">
          <h1 class="hero-title" :data-edit-key="'about.hero.title'">{{ t('about.hero.title') }}</h1>
          <p class="hero-subtitle" :data-edit-key="'about.hero.subtitle'">{{ t('about.hero.subtitle') }}</p>
        </div>
      </div>
    </section>

    <!-- Company Introduction -->
    <section class="intro-section">
      <div class="section-container">
        <div class="section-header">
          <h2 class="section-title" :data-edit-key="'about.intro.title'">{{ t('about.intro.title') }}</h2>
          <p class="section-subtitle" :data-edit-key="'about.intro.subtitle'">{{ t('about.intro.subtitle') }}</p>
        </div>
        <div class="intro-content">
          <div class="intro-text">
            <p class="intro-paragraph" :data-edit-key="'about.intro.p1'">{{ t('about.intro.p1') }}</p>
            <p class="intro-paragraph" :data-edit-key="'about.intro.p2'">{{ t('about.intro.p2') }}</p>
          </div>
          <div class="intro-image">
            <img
              :src="imgEdit('/images/y160-delivery-drone/hero.png', 'about.intro.img')"
              alt="Partdro drone technology"
              data-edit-img="about.intro.img"
              @error="(e) => handleImageError(e, '/images/placeholder.svg')"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- Company Journey Timeline -->
    <section class="timeline-section">
      <div class="section-container">
        <div class="section-header">
          <h2 class="section-title" :data-edit-key="'about.journey.title'">{{ t('about.journey.title') }}</h2>
          <p class="section-subtitle" :data-edit-key="'about.journey.subtitle'">{{ t('about.journey.subtitle') }}</p>
        </div>
        <div class="timeline">
          <div
            v-for="(item, index) in journeyItems"
            :key="index"
            class="timeline-item"
          >
            <div class="timeline-logo">
              <FlagOutlined class="timeline-logo-icon" />
            </div>
            <div class="timeline-year" :data-edit-key="`about.journey.items.${index}.year`">{{ item.year }}</div>
            <div class="timeline-content">
              <h3 class="timeline-title" :data-edit-key="`about.journey.items.${index}.title`">{{ item.title }}</h3>
              <p class="timeline-description" :data-edit-key="`about.journey.items.${index}.desc`">{{ item.desc }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Leadership Team -->
    <section class="team-section">
      <div class="section-container">
        <div class="section-header">
          <h2 class="section-title" :data-edit-key="'about.team.title'">{{ t('about.team.title') }}</h2>
          <p class="section-subtitle" :data-edit-key="'about.team.subtitle'">{{ t('about.team.subtitle') }}</p>
        </div>
        <div class="team-grid">
          <div v-for="(m, index) in teamMembers" :key="index" class="team-card">
            <div class="team-image">
              <img v-if="m.img" :src="m.img" :alt="m.name" class="team-photo" />
              <UserOutlined v-else class="team-avatar" />
            </div>
            <div class="team-info">
              <h3 class="team-name" :data-edit-key="`about.team.members.${index}.name`">{{ m.name }}</h3>
              <p class="team-position" :data-edit-key="`about.team.members.${index}.position`">{{ m.position }}</p>
              <div class="team-bio">
                <p :data-edit-key="`about.team.members.${index}.bio1`">{{ m.bio1 }}</p>
                <p :data-edit-key="`about.team.members.${index}.bio2`">{{ m.bio2 }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Company Values -->
    <section class="values-section">
      <div class="section-container">
        <div class="section-header">
          <h2 class="section-title" :data-edit-key="'about.values.title'">{{ t('about.values.title') }}</h2>
          <p class="section-subtitle" :data-edit-key="'about.values.subtitle'">{{ t('about.values.subtitle') }}</p>
        </div>
        <div class="values-grid">
          <div class="value-card" v-for="(value, index) in valueItems" :key="index">
            <div class="value-icon" :class="`value-${index + 1}`">
              <component :is="value.icon" />
            </div>
            <h3 class="value-title" :data-edit-key="`about.values.items.${index}.title`">{{ value.title }}</h3>
            <p class="value-description" :data-edit-key="`about.values.items.${index}.desc`">{{ value.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Statistics -->
    <section class="stats-section">
      <div class="section-container">
        <div class="section-header">
          <h2 class="section-title" :data-edit-key="'about.stats.title'">{{ t('about.stats.title') }}</h2>
          <p class="section-subtitle" :data-edit-key="'about.stats.subtitle'">{{ t('about.stats.subtitle') }}</p>
        </div>
        <div class="stats-grid">
          <div class="stat-card" v-for="(stat, index) in statItems" :key="index">
            <div class="stat-icon" :class="`stat-${index + 1}`">
              <component :is="stat.icon" />
            </div>
            <h3 class="stat-title" :data-edit-key="`about.stats.items.${index}.title`">{{ stat.title }}</h3>
            <p class="stat-description" :data-edit-key="`about.stats.items.${index}.desc`">{{ stat.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Contact CTA -->
    <section class="contact-section">
      <div class="section-container">
        <div class="contact-content">
          <h2 class="contact-title" :data-edit-key="'about.cta.title'">{{ t('about.cta.title') }}</h2>
          <p class="contact-description" :data-edit-key="'about.cta.description'">
            {{ t('about.cta.description') }}
          </p>
          <div class="contact-actions">
            <a-button type="primary" size="large" class="contact-btn" @click="router.push(lp('/contact'))">
              <span :data-edit-key="'about.cta.contactBtn'">{{ t('about.cta.contactBtn') }}</span>
            </a-button>
            <a-button size="large" class="secondary-btn" @click="openWhatsApp">
              <span :data-edit-key="'about.cta.demoBtn'">{{ t('about.cta.demoBtn') }}</span>
            </a-button>
          </div>
          <div class="contact-info">
            <p class="contact-detail" :data-edit-key="'about.cta.email'">{{ t('about.cta.email') }}</p>
            <p class="contact-detail" :data-edit-key="'about.cta.phone'">{{ t('about.cta.phone') }}</p>
            <p class="contact-detail" :data-edit-key="'about.cta.location'">{{ t('about.cta.location') }}</p>
          </div>
        </div>
      </div>
    </section>

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import {
  FlagOutlined,
  UserOutlined,
  TrophyOutlined,
  TeamOutlined,
  GlobalOutlined,
  CustomerServiceOutlined,
  FieldTimeOutlined,
  AppstoreOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons-vue'
import { trackEvent } from '../composables/useTracking'
import { imgOverridesByLang } from '../composables/useLandingContent'
import { useLocalePath } from '../composables/useLocalePath'

const { t, locale } = useI18n()
const router = useRouter()
const lp = useLocalePath()

// 通用图片覆盖：key 命中则用覆盖值（完整 URL / / 路径 / 纯文件名）
function imgEdit(defaultSrc: string, key: string): string {
  const overrides = imgOverridesByLang[locale.value as string] || {}
  const v = overrides[key]
  if (!v) return defaultSrc
  if (v.startsWith('http') || v.startsWith('/')) return v
  // about 命名空间的图片在 /images/，不在 /d15r/images/
  return `/images/${v}`
}

const handleImageError = (e: Event, fallback: string) => {
  const img = e.target as HTMLImageElement
  if (img.dataset.fallbackUsed) return
  img.dataset.fallbackUsed = 'true'
  img.src = fallback
}

const openWhatsApp = () => {
  trackEvent('generate_lead', { method: 'request_demo_about' })
  const message = 'Hello! I would like to learn more about Partdro drone solutions.'
  window.open(`https://wa.me/8616788684420?text=${encodeURIComponent(message)}`, '_blank')
}

const journeyItems = computed(() =>
  [0, 1, 2, 3].map((i) => ({
    year: t(`about.journey.items.${i}.year`),
    title: t(`about.journey.items.${i}.title`),
    desc: t(`about.journey.items.${i}.desc`),
  })),
)

// 团队成员：0 = Mr. Gan（无照片用图标），1 = Randy Ren（照片可被 CMS 覆盖）
const teamMembers = computed(() =>
  [0, 1].map((i) => ({
    name: t(`about.team.members.${i}.name`),
    position: t(`about.team.members.${i}.position`),
    bio1: t(`about.team.members.${i}.bio1`),
    bio2: t(`about.team.members.${i}.bio2`),
    img: imgEdit(
      i === 0 ? '/images/mr-gan.webp' : '/images/randy-at-dji.webp',
      `about.team.members.${i}.img`,
    ),
  })),
)

// 价值观图标（Ant Design 图标组件）
const valueIcons = [TrophyOutlined, TeamOutlined, GlobalOutlined, CustomerServiceOutlined]

const valueItems = computed(() =>
  valueIcons.map((icon, i) => ({
    icon,
    title: t(`about.values.items.${i}.title`),
    desc: t(`about.values.items.${i}.desc`),
  })),
)

// 业绩数据图标（Ant Design 图标组件）
const statIcons = [FieldTimeOutlined, AppstoreOutlined, GlobalOutlined, SafetyCertificateOutlined]

const statItems = computed(() =>
  statIcons.map((icon, i) => ({
    icon,
    title: t(`about.stats.items.${i}.title`),
    desc: t(`about.stats.items.${i}.desc`),
  })),
)
</script>

<style scoped>
.about {
  font-family: 'Barlow', 'Barlow', 'Barlow', sans-serif;
  overflow: clip;
  contain: layout style;
}

/* Hero Section */
.hero-section {
  position: relative;
  height: 500px;
  margin-bottom: 60px;
}

.hero-image-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.hero-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.8));
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  text-align: center;
  padding: 0 20px;
}

.hero-title {
  font-size: clamp(32px, 4vw, 48px);
  font-weight: 700;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  margin-bottom: 20px;
  line-height: 1.2;
  max-width: 900px;
}

.hero-subtitle {
  font-size: clamp(18px, 2vw, 24px);
  opacity: 0.9;
  max-width: 700px;
}

/* Section Common Styles */
.section-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.section-header {
  text-align: center;
  margin-bottom: 50px;
}

.section-title {
  font-family: 'Poppins', 'Barlow', sans-serif;
  font-size: clamp(30px, 3.2vw, 40px);
  font-weight: 800;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  margin-bottom: 16px;
  letter-spacing: -0.01em;
}

.section-subtitle {
  font-size: clamp(16px, 1.5vw, 18px);
  color: #666;
}

/* Introduction Section */
.intro-section {
  padding: 80px 0;
  background: #f8f9fa;
}

.intro-content {
  display: flex;
  align-items: center;
  gap: 60px;
  flex-wrap: wrap;
}

.intro-text {
  flex: 1;
  min-width: 300px;
}

.intro-paragraph {
  font-size: 18px;
  line-height: 1.6;
  color: #444;
  margin-bottom: 20px;
}

.intro-image {
  flex: 1;
  min-width: 300px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.intro-image img {
  width: 100%;
  height: 400px;
  object-fit: cover;
}

/* Timeline Section */
.timeline-section {
  padding: 80px 0;
  background: white;
}

.timeline {
  position: relative;
  max-width: 800px;
  margin: 0 auto;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 40px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #1888c8;
}

.timeline-item {
  position: relative;
  margin-bottom: 40px;
  padding-left: 100px;
}

.timeline-logo {
  position: absolute;
  left: 0;
  top: 0;
  width: 80px;
  height: 80px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  z-index: 1;
  padding-bottom: 20px;
}

.timeline-logo-icon {
  font-size: 32px;
  color: var(--color-primary);
}

.timeline-year {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 80px;
  height: 20px;
  background: linear-gradient(to top, #e6f7ff, #d9f7be);
  color: #0a4f7a;
  border-radius: 0 0 40px 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 11px;
  text-align: center;
  z-index: 2;
  box-shadow: 0 -1px 3px rgba(0, 0, 0, 0.1);
  border-top: 1px solid #b7eb8f;
}

.timeline-content {
  background: white;
  padding: 25px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border-left: 4px solid #1888c8;
}

.timeline-title {
  font-size: 20px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 10px;
}

.timeline-description {
  font-size: 16px;
  line-height: 1.6;
  color: #666;
}

/* Team Section */
.team-section {
  padding: 80px 0;
  background: #f8f9fa;
}

.team-grid {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 30px;
}

.team-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;
}

.team-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.team-image {
  height: 400px;
  overflow: hidden;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.team-avatar {
  font-size: 120px;
  color: #c9d4dd;
}

.team-info {
  padding: 40px;
}

.team-name {
  font-size: 28px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 8px;
}

.team-position {
  font-size: 18px;
  color: #1888c8;
  font-weight: 600;
  margin-bottom: 20px;
}

.team-bio {
  font-size: 16px;
  line-height: 1.6;
  color: #666;
}

.team-bio p {
  margin-bottom: 15px;
}

/* Values Section */
.values-section {
  padding: 80px 0;
  background: white;
}

.values-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 30px;
  max-width: 1200px;
  margin: 0 auto;
}

.value-card {
  text-align: center;
  padding: 40px 20px;
  border-radius: 12px;
  background: #f8f9fa;
  transition: transform 0.3s ease;
}

.value-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
}

.value-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(24, 136, 200, 0.08);
}

.value-icon .anticon {
  font-size: 40px;
  color: var(--color-primary);
}

.value-1 { background: linear-gradient(135deg, rgba(24, 136, 200, 0.08), rgba(26, 157, 228, 0.12)); }
.value-2 { background: linear-gradient(135deg, rgba(24, 136, 200, 0.08), rgba(26, 157, 228, 0.12)); }
.value-3 { background: linear-gradient(135deg, rgba(24, 136, 200, 0.08), rgba(26, 157, 228, 0.12)); }
.value-4 { background: linear-gradient(135deg, rgba(24, 136, 200, 0.08), rgba(26, 157, 228, 0.12)); }

.value-title {
  font-family: 'Poppins', 'Barlow', sans-serif;
  font-size: 20px;
  font-weight: 700;
  color: #1d1d1f;
  margin-bottom: 12px;
}

.value-description {
  font-size: 16px;
  line-height: 1.5;
  color: #666;
}

/* Statistics Section */
.stats-section {
  padding: 80px 0;
  background: #f8f9fa;
}

/* .section-header, .section-title, .section-subtitle already defined above */

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 30px 20px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.stat-icon {
  margin-bottom: 16px;
}

.stat-icon .anticon {
  font-size: 48px;
  color: var(--color-primary);
}

.stat-title {
  font-family: 'Poppins', 'Barlow', sans-serif;
  font-size: 20px;
  font-weight: 700;
  color: #1d1d1f;
  margin-bottom: 12px;
}

.stat-description {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
}

/* 响应式调整 */
@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
    max-width: 400px;
  }

  .stat-card {
    padding: 24px 16px;
  }

  .hero-section {
    height: 400px;
  }

  .hero-title {
    font-size: 28px;
  }

  .hero-subtitle {
    font-size: 16px;
  }

  .intro-content {
    flex-direction: column;
  }

  .timeline::before {
    left: 25px;
  }

  .timeline-item {
    padding-left: 70px;
  }

  .timeline-logo {
    width: 50px;
    height: 50px;
    padding-bottom: 12px;
  }

  .timeline-logo-icon {
    font-size: 20px;
  }

  .timeline-year {
    width: 50px;
    height: 12px;
    font-size: 9px;
    border-radius: 0 0 25px 25px;
    background: linear-gradient(to top, #e6f7ff, #d9f7be);
    color: #0a4f7a;
    border-top: 1px solid #b7eb8f;
  }

  .team-image {
    height: 200px;
  }

  .contact-actions {
    flex-direction: column;
    align-items: center;
  }

  .contact-btn,
  .secondary-btn {
    width: 100%;
    max-width: 300px;
  }

  .contact-section {
    padding: 60px 20px;
  }

  .contact-content {
    padding: 40px 24px;
    border-radius: 16px;
  }
}

@media (max-width: 480px) {
  .hero-section {
    height: 300px;
  }

  .hero-title {
    font-size: 24px;
  }

  .section-title {
    font-size: 24px;
  }

  .values-grid {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: 1fr;
    gap: 30px;
  }

  .contact-section {
    padding: 40px 16px;
  }

  .contact-content {
    padding: 32px 20px;
    border-radius: 12px;
  }

  .contact-title {
    font-size: 28px;
  }

  .contact-description {
    font-size: 16px;
  }
}
</style>
