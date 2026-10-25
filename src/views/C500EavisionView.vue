<script setup lang="ts">
import { computed, onMounted, ref, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import ProductNav from '../components/c500eavision/ProductNav.vue'
import ScrollIndicator from '../components/c500eavision/ScrollIndicator.vue'
import C500Media from '../components/c500eavision/C500Media.vue'
import MediaStory from '../components/c500eavision/MediaStory.vue'
import GallerySection from '../components/c500eavision/GallerySection.vue'
import DecisionSection from '../components/c500eavision/DecisionSection.vue'
import VideoModal from '../components/c500eavision/VideoModal.vue'
import InquiryForm from '../components/common/InquiryForm.vue'
import { motionReady, reducedMotion, videoOpen } from '../composables/useC500State'
import { videoOverridesByLang } from '../composables/useLandingContent'
import {
  abilities,
  applications,
  galleries,
  heroImage,
  heroVideo,
  notes,
  packages,
  performanceStory,
  specifications,
  stories,
  technologyImage
} from '../data/c500eavision'
import { buildBreadcrumbLd, buildProductLd, injectJsonLd } from '../seo/structuredData'
import '../components/c500eavision/c500.css'

const { t, te, locale } = useI18n()

// intro 视频来源：CMS 覆盖（InlineEditor data-edit-video 编辑保存到 landing_content __videos）优先，
// 回退到 data 文件的 OSS 默认值。覆盖存在但无法解析时也回退。
const introVideo = computed(() => {
  const override = videoOverridesByLang[locale.value as string]?.['c500eavision.hero.video']
  return override && override.trim() ? override.trim() : heroVideo
})

const heroReady = ref(false)
const main = ref<HTMLElement | null>(null)

reducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
motionReady.value = !reducedMotion.value

const [energyStory, perceptionStory, decisionStory, clusterStory, functionsStory] = stories

function openVideo(): void {
  videoOpen.value = true
  document.body.style.overflow = 'hidden'
}

function closeVideo(): void {
  videoOpen.value = false
  document.body.style.overflow = ''
}

// abilities 的 alt：有专门 alt 文案时用之，否则回退到 title
function abilityAlt(index: number): string {
  const key = `c500eavision.abilities.${index}.alt`
  return te(key) ? t(key) : t(`c500eavision.abilities.${index}.title`)
}

function abilityDetail(index: number): string {
  return t(`c500eavision.abilities.${index}.detail`)
}

// 规格值：数据层为语言中性数值时直接用，描述性取值回退到 i18n
function specValue(index: number, value: string): string {
  return value || t(`c500eavision.specifications.${index}.value`)
}

// SEO：按当前语言更新 title / description / og 标签
const SITE_URL = 'https://www.droneworld.tech'
watchEffect(() => {
  document.title = t('c500eavision.meta.title')
  const desc = t('c500eavision.meta.description')
  const prefix = locale.value === 'en' ? '' : `/${locale.value}`
  const url = `${SITE_URL}${prefix}/products/c500-partdro-eavision`
  const setMeta = (selector: string, content: string) =>
    document.querySelector(selector)?.setAttribute('content', content)
  setMeta('meta[name="description"]', desc)
  setMeta('meta[property="og:title"]', document.title)
  setMeta('meta[property="og:description"]', desc)
  setMeta('meta[property="og:url"]', url)
  setMeta('meta[name="twitter:title"]', document.title)
  setMeta('meta[name="twitter:description"]', desc)

  // 结构化数据：Product + BreadcrumbList（内联 ld+json 会被预渲染固化进静态 HTML）
  const name = 'C500 Heavy-Lift Flying Robot'
  injectJsonLd('ld-product', buildProductLd({
    name,
    description: desc,
    images: [heroImage],
    url,
    sku: 'C500',
    category: 'Drone',
  }))
  injectJsonLd('ld-breadcrumb', buildBreadcrumbLd([
    { name: 'Home', url: `${SITE_URL}${prefix || '/'}` },
    { name: 'Products', url: `${SITE_URL}${prefix}/products` },
    { name, url },
  ]))
})

onMounted(() => {
  requestAnimationFrame(() => {
    heroReady.value = true
  })

  const targets = main.value?.querySelectorAll('.reveal')
  if (!targets?.length) return

  if (!('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('is-visible'))
    return
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        }
      })
    },
    { threshold: 0.08 }
  )
  targets.forEach((el) => observer.observe(el))
})
</script>

<template>
  <div id="c500-detail" ref="main" class="c500" :class="{ 'motion-ready': motionReady }">
    <ScrollIndicator controls="c500-detail" />
    <ProductNav />

    <section id="c500-top" class="hero" :class="{ 'hero--ready': heroReady }">
      <C500Media
        class="hero__media"
        :image="heroImage"
        :alt="t('c500eavision.hero.title')"
        eager
      />
      <div class="hero__shade"></div>
      <div class="hero__inner">
        <div class="hero__copy">
          <p class="hero__eyebrow gradient-text">{{ t('c500eavision.hero.eyebrow') }}</p>
          <h1>{{ t('c500eavision.hero.title') }}</h1>
          <p class="hero__summary">{{ t('c500eavision.hero.summary') }}</p>
          <button
            type="button"
            aria-haspopup="dialog"
            aria-controls="c500-video-dialog"
            class="outline-button"
            data-edit-video="c500eavision.hero.video"
            @click="openVideo"
          >
            {{ t('c500eavision.hero.watchVideo') }}
            <svg viewBox="64 64 896 896" width="1em" height="1em" fill="currentColor" aria-hidden="true">
              <path
                d="M869 487.8L491.2 159.9c-2.9-2.5-6.6-3.9-10.5-3.9h-88.5c-7.4 0-10.8 9.2-5.2 14l350.2 304H152c-4.4 0-8 3.6-8 8v60c0 4.4 3.6 8 8 8h585.1L386.9 854c-5.6 4.9-2.2 14 5.2 14h91.5c1.9 0 3.8-.7 5.2-2L869 536.2a32.07 32.07 0 0 0 0-48.4z"
              />
            </svg>
          </button>
        </div>
      </div>
    </section>

    <section id="c500-overview" class="overview section-inner">
      <p class="overview__description reveal">
        <template v-for="i in 3" :key="i">
          {{ t(`c500eavision.overview.paragraphs.${i - 1}`) }}<br v-if="i < 3" />
        </template>
      </p>
      <img
        :src="technologyImage"
        :alt="t('c500eavision.overview.technologyAlt')"
        width="1199"
        height="279"
        loading="lazy"
        class="overview__technology reveal"
      />
      <div class="ability-grid">
        <article
          v-for="(ability, index) in abilities"
          :key="ability.key"
          class="ability reveal"
          :class="`ability--${ability.key}`"
        >
          <C500Media :image="ability.image" :video="ability.video" :alt="abilityAlt(index)" />
          <div class="ability__copy">
            <h3>{{ t(`c500eavision.abilities.${index}.title`) }}</h3>
            <p v-if="te(`c500eavision.abilities.${index}.detail`)">{{ abilityDetail(index) }}</p>
          </div>
        </article>
      </div>
    </section>

    <MediaStory :story="performanceStory" />
    <GallerySection v-bind="galleries.power" />

    <MediaStory :story="energyStory" />
    <GallerySection v-bind="galleries.energy" />

    <MediaStory :story="perceptionStory" />
    <GallerySection v-bind="galleries.perception" />

    <MediaStory :story="decisionStory" />
    <DecisionSection />

    <MediaStory :story="clusterStory" />
    <GallerySection v-bind="galleries.cluster" />

    <MediaStory :story="functionsStory" />
    <GallerySection v-bind="galleries.functions" />

    <section class="applications section-inner">
      <h2 class="gradient-text reveal">{{ t('c500eavision.applications.heading') }}</h2>
      <div class="applications__grid">
        <article
          v-for="(item, index) in applications"
          :key="index"
          class="application reveal"
        >
          <C500Media :image="item.image" :alt="t(`c500eavision.applications.${index}.title`)" />
          <h3>{{ t(`c500eavision.applications.${index}.title`) }}</h3>
        </article>
      </div>
    </section>

    <section class="packages section-inner">
      <h2 class="gradient-text reveal">{{ t('c500eavision.packages.heading') }}</h2>
      <div class="packages__grid">
        <div v-for="(item, index) in packages" :key="index" class="package reveal">
          <img
            :src="item.image"
            :alt="t(`c500eavision.packages.${index}.description`)"
            width="588"
            height="512"
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>
    </section>

    <section id="c500-specs" aria-labelledby="c500-specs-title" class="specifications">
      <div class="specifications__content">
        <div class="specifications__inner">
          <h2 id="c500-specs-title" class="specifications__title">
            {{ t('c500eavision.specifications.title') }}
          </h2>
          <table aria-labelledby="c500-specs-title" class="specifications__table">
            <tbody>
              <tr v-for="(row, index) in specifications" :key="index">
                <th scope="row">{{ t(`c500eavision.specifications.${index}.label`) }}</th>
                <td>{{ specValue(index, row.value) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <section :aria-label="t('c500eavision.notes.aria')" class="notes">
      <div class="notes__inner">
        <p v-for="i in 4" :key="`intro-${i}`">{{ t(`c500eavision.noteIntro.${i - 1}`) }}</p>
        <div
          v-for="(note, index) in notes"
          :id="`c500-note-${index + 1}`"
          :key="index"
          class="notes__item"
        >
          <p>{{ t(`c500eavision.notes.${index}.text`) }}</p>
          <p v-for="(_, j) in note.extra" :key="`extra-${j}`">
            {{ t(`c500eavision.notes.${index}.extra.${j}`) }}
          </p>
        </div>
      </div>
    </section>

    <!-- 询盘表单：与产品页 CTA 一致，提交成功会 push 'contact_form_submission' 供 Ads 转化回传 -->
    <section id="quote" class="c500-quote">
      <InquiryForm />
    </section>

    <VideoModal :src="introVideo" @close="closeVideo" />
  </div>
</template>