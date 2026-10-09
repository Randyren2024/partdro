<template>
  <div class="d15r-landing" :class="`theme-${theme}`">
    <button
      class="theme-toggle"
      type="button"
      :aria-label="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
      @click="toggleTheme"
    >
      <span class="theme-toggle__icon" aria-hidden="true">{{ theme === 'dark' ? '☀' : '☾' }}</span>
      <span>{{ theme === 'dark' ? 'Light' : 'Dark' }}</span>
    </button>

    <SectionPanel v-if="editMode" v-model="sectionLayout" />

    <main id="top">
      <template v-for="item in sectionLayout" :key="item.id">
        <component
          :is="SECTION_COMPONENTS[item.id]"
          v-if="item.visible && SECTION_COMPONENTS[item.id]"
        />
      </template>
    </main>

    <!-- Lightbox -->
    <div class="lightbox" :class="{ open: !!lightboxSrc }" @click.self="closeLightbox">
      <div class="lightbox-inner">
        <button class="close" aria-label="Close" @click="closeLightbox">×</button>
        <img v-if="lightboxSrc" :src="lightboxSrc" :alt="lightboxAlt" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, provide, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import {
  imgOverridesByLang,
  videoOverridesByLang,
  registerProductNamespace,
  getSectionLayout,
  setSectionLayout,
} from '../composables/useLandingContent'
import { trackEvent } from '../composables/useTracking'
import { parseVideoUrl } from '../composables/useVideo'
import { landingSectionKey } from '../components/product/sectionContext'
import { SECTION_COMPONENTS } from '../components/product/sectionRegistry'
import SectionPanel from '../components/product/SectionPanel.vue'
import type { SectionLayoutItem } from '../components/product/sectionIds'
import '../components/product/landing.css'

const auth = useAuthStore()
const route = useRoute()
const { t, locale } = useI18n()

// ====== 主题（深色 / 浅色） ======
type Theme = 'dark' | 'light'
const THEME_KEY = 'lp-theme'
const theme = ref<Theme>((localStorage.getItem(THEME_KEY) as Theme) || 'light')
function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
  localStorage.setItem(THEME_KEY, theme.value)
}

// 编辑模式下禁用 lightbox（点击用于编辑而非放大）
const editMode = computed(() => auth.isLoggedIn)

// ====== 按路由 slug 参数化：i18n namespace + 图片目录 ======
const ns = computed(() => (route.params.slug as string) || 'd15r')
const tt = (p: string) => t(`${ns.value}.${p}`)

watch(ns, (v) => registerProductNamespace(v), { immediate: true })

const IMG_BASE = computed(() => (ns.value === 'd15r' ? '/d15r/images/' : `/images/${ns.value}/`))
const img = (name: string) => IMG_BASE.value + name

const PLACEHOLDER = '/images/placeholder.svg'
const D15R_IMAGE_SETS = {
  nozzles: ['page005_img001.png', 'page005_img002.png', 'page005_img003.png', 'page005_img004.png'],
  cases: ['page010_img002.png', 'page011_img002.png', 'page012_img002.png', 'page013_img002.png', 'page009_img001.png', 'page011_img001.png'],
  scenarios: ['page014_img002.png', 'page014_img001.png', 'page014_img004.png', 'page014_img003.png'],
}
const PLACEHOLDER_SETS = {
  nozzles: Array(4).fill(PLACEHOLDER) as string[],
  cases: Array(6).fill(PLACEHOLDER) as string[],
  scenarios: Array(4).fill(PLACEHOLDER) as string[],
}
const images = computed(() => (ns.value === 'd15r' ? D15R_IMAGE_SETS : PLACEHOLDER_SETS))
const nozzleImages = computed(() => images.value.nozzles)
const caseImages = computed(() => images.value.cases)
const scenarioImages = computed(() => images.value.scenarios)

const altBase = computed(() => (ns.value === 'd15r' ? 'D15R' : 'Partdro product'))
const alt = (desc: string) => `${altBase.value} ${desc}`
const mailtoHref = computed(() => {
  const subject = ns.value === 'd15r' ? 'D15R Cleaning Drone Inquiry' : `${ns.value} drone inquiry`
  return `mailto:info@droneworld.tech?subject=${encodeURIComponent(subject)}`
})

const currentImgOverrides = computed(() => imgOverridesByLang[locale.value as string] ?? {})

function imgEdit(name: string, key?: string): string {
  if (key && currentImgOverrides.value[key]) {
    const v = currentImgOverrides.value[key]
    if (v.startsWith('http') || v.startsWith('/')) return v
    return img(v)
  }
  return img(name)
}

// SEO: 按产品命名空间更新 title / description / og 标签
// 依赖 t() 的返回值作为 watch 源：landing_content 异步合并后标题会随之更新
const SITE_URL = 'https://www.droneworld.tech'
// 产品名：slug → 标题文案（型号段 y160/sl80/yp800/d15r 全大写）
const productLabel = computed(() =>
  ns.value
    .split('-')
    .map((w) => (/^[a-z]+\d+[a-z]*$/.test(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' '),
)

watch([ns, locale, () => t(`${ns.value}.hero.title1`), () => t(`${ns.value}.hero.lead`)], () => {
  const titleKey = `${ns.value}.hero.title1`
  const title1 = t(titleKey)
  if (title1 === titleKey) return
  const name = productLabel.value
  document.title = `${name} - ${title1} | Partdro`
  const lead = t(`${ns.value}.hero.lead`)
  const desc = `${name} - ${lead}`
  const trimmed = desc.length > 160 ? `${desc.slice(0, 157)}...` : desc
  const heroImg = SITE_URL + imgEdit('page001_img001.png', `${ns.value}.hero.mainImg`)
  const url = `${SITE_URL}${route.path}`
  const setMeta = (selector: string, content: string) =>
    document.querySelector(selector)?.setAttribute('content', content)
  setMeta('meta[name="description"]', trimmed)
  setMeta('meta[property="og:title"]', document.title)
  setMeta('meta[property="og:description"]', trimmed)
  setMeta('meta[property="og:url"]', url)
  setMeta('meta[property="og:image"]', heroImg)
  setMeta('meta[name="twitter:title"]', document.title)
  setMeta('meta[name="twitter:description"]', trimmed)
  setMeta('meta[name="twitter:image"]', heroImg)
}, { immediate: true })

// ====== 视频模块 ======
const currentVideoOverrides = computed(() => videoOverridesByLang[locale.value as string] ?? {})
const videoUrl = computed(() => {
  const k = `${ns.value}.video.url`
  const override = currentVideoOverrides.value[k]
  if (override) return override
  const def = t(k)
  return def === k ? '' : (def as string)
})
const videoPoster = computed(() => currentImgOverrides.value[`${ns.value}.video.poster`] || undefined)
const parsedVideo = computed(() => parseVideoUrl(videoUrl.value))
const videoResolved = computed(() => !!parsedVideo.value)

const lightboxSrc = ref('')
const lightboxAlt = ref('')

function openLightbox(name: string, altText?: string) {
  lightboxSrc.value = img(name)
  lightboxAlt.value = altText || `${altBase.value} application image`
}

function closeLightbox() {
  lightboxSrc.value = ''
}

// ====== 区块布局（Elementor 式排序 / 显隐） ======
const sectionLayout = computed({
  get: () => getSectionLayout(ns.value),
  set: (items: SectionLayoutItem[]) => setSectionLayout(ns.value, items),
})

// ====== 向子区块提供共享上下文 ======
provide(landingSectionKey, {
  ns,
  tt,
  imgEdit,
  alt,
  editMode,
  mailtoHref,
  trackEvent,
  openLightbox,
  nozzleImages,
  caseImages,
  scenarioImages,
  videoResolved,
  parsedVideo,
  videoPoster,
})
</script>
