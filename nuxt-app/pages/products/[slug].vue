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
import { computed, onMounted, provide, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import { buildBreadcrumbLd, buildProductLd, injectJsonLd } from '~/utils/structuredData'
import { productSeo } from '~/utils/productMeta'
import {
  imgOverridesByLang,
  videoOverridesByLang,
  registerProductNamespace,
  getSectionLayout,
  setSectionLayout,
} from '~/composables/useLandingContent'
import { trackEvent } from '~/composables/useTracking'
import { parseVideoUrl } from '~/composables/useVideo'
import { landingSectionKey } from '~/components/product/sectionContext'
import { SECTION_COMPONENTS } from '~/components/product/sectionRegistry'
import SectionPanel from '~/components/product/SectionPanel.vue'
import type { SectionLayoutItem } from '~/components/product/sectionIds'
import '~/components/product/landing.css'

const auth = useAuthStore()
const route = useRoute()
const { t, locale } = useI18n()

// ====== 主题（深色 / 浅色） ======
type Theme = 'dark' | 'light'
const THEME_KEY = 'lp-theme'
const theme = ref<Theme>('light')
onMounted(() => {
  const saved = localStorage.getItem(THEME_KEY)
  if (saved === 'dark' || saved === 'light') theme.value = saved
})
watch(theme, (value) => {
  if (import.meta.client) localStorage.setItem(THEME_KEY, value)
})
function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
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

// 图片 alt：各产品共用同一套区块组件，但清理机的文案（cleaning boom / facade）
// 不能套到 C500 运载机或 FP800 农业机上。这里按产品给每类图片配描述，
// 未覆盖的产品回退到中性文案；传入的不是已知 key 时（如安全卡片标题）原样使用。
const PRODUCT_ALT_NAME: Record<string, string> = {
  d15r: 'D15R cleaning drone',
  c15: 'C15 cleaning drone',
  d50r: 'D50R solar panel cleaning drone',
  'c500-delivery-drone': 'C500 heavy-lift cargo drone',
  'sl80-delivery-drone': 'SL80 cargo drone',
  'y160-delivery-drone': 'Y160 cargo drone',
  'yp800-delivery-drone': 'YP800 cargo drone',
  'fp800-agricultural-drone': 'FP800 agricultural drone',
}
const GENERIC_ALT: Record<string, string> = {
  hero: 'in operation',
  designed: 'side view',
  intelligence: 'route planning control interface',
  kit: 'standard package contents',
  multiangle: 'in operation',
  spray1: 'modular payload',
  spray2: 'payload configuration',
}
const PRODUCT_ALT: Record<string, Record<string, string>> = {
  d15r: {
    hero: 'multi-functional, tethered',
    designed: 'side view with extended cleaning boom',
    multiangle: 'cleaning a building facade at height',
    spray1: 'modular side view',
    spray2: 'dual swinging spray boom configuration',
  },
  c15: {
    hero: 'with 120 m high-pressure hose',
    designed: 'side view',
    multiangle: 'cleaning a glass facade at height',
  },
  d50r: {
    hero: 'on a photovoltaic array',
    designed: 'side view',
    multiangle: 'cleaning solar panels',
  },
  'c500-delivery-drone': {
    hero: 'with 240 kg payload',
    designed: 'side view',
    multiangle: 'in logistics operation',
  },
  'sl80-delivery-drone': {
    hero: 'with 80 kg payload and long endurance',
    designed: 'side view',
    multiangle: 'in remote resupply operation',
  },
  'y160-delivery-drone': {
    hero: 'with 165 kg lifting capacity',
    designed: 'side view',
    multiangle: 'lifting a payload',
  },
  'yp800-delivery-drone': {
    hero: 'low-altitude transport configuration',
    designed: 'side view',
    multiangle: 'in transport operation',
  },
  'fp800-agricultural-drone': {
    hero: 'spraying and seeding',
    designed: 'side view',
    multiangle: 'spraying a field',
    spray1: 'spray tank configuration',
    spray2: 'spreader configuration',
  },
}
const altBase = computed(() => PRODUCT_ALT_NAME[ns.value] ?? 'Partdro product')
const alt = (key: string) => {
  const text = PRODUCT_ALT[ns.value]?.[key] ?? GENERIC_ALT[key] ?? key
  return `${altBase.value} ${text}`
}
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
  if (!import.meta.client) return
  const name = productLabel.value
  const lead = t(`${ns.value}.hero.lead`)
  // 标题/描述走搜索意图映射（英语手写商业关键词；其他语言沿用本地化文案并规范化）
  const seo = productSeo(ns.value, locale.value, `${name} - ${title1}`, `${name} - ${lead}`)
  document.title = seo.title
  const trimmed = seo.description
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

  // 结构化数据：Product + BreadcrumbList（内联 ld+json 会被预渲染固化进静态 HTML）
  const segs = route.path.split('/').filter(Boolean)
  const prefix = ['es', 'de', 'fr'].includes(segs[0]) ? `/${segs[0]}` : ''
  injectJsonLd('ld-product', buildProductLd({
    // schema 的 name 用完整产品名（型号 + 用途），比裸型号更利于实体识别
    name: seo.title.replace(/\s*\|\s*Partdro$/u, ''),
    description: trimmed,
    images: [heroImg],
    url,
    sku: name.split(' ')[0],
    category: 'Drone',
  }))
  injectJsonLd('ld-breadcrumb', buildBreadcrumbLd([
    { name: 'Home', url: `${SITE_URL}${prefix || '/'}` },
    { name: 'Products', url: `${SITE_URL}${prefix}/products` },
    { name, url },
  ]))
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
// 附加视频（url2/url3）：CMS __videos 优先，i18n 兜底；标题取 video.title2/title3
const extraVideos = computed(() => {
  const out: { parsed: { type: string; url: string }; title: string }[] = []
  for (const i of [2, 3]) {
    const key = `${ns.value}.video.url${i}`
    const override = currentVideoOverrides.value[key]
    const def = t(key)
    const raw = override || (def === key ? '' : (def as string))
    const parsed = parseVideoUrl(raw)
    if (parsed) out.push({ parsed: { type: parsed.type, url: parsed.url }, title: tt(`video.title${i}`) })
  }
  return out
})

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
  extraVideos,
})


// @ts-ignore - Nuxt macro
definePrerenderRoutes(async () => {
  const PRESET_SLUGS = [
    'd15r', 'c500-delivery-drone', 'y160-delivery-drone',
    's200-agricultural-drone', 's300-agricultural-drone', 'x160-delivery-drone',
    'x160-lite-delivery-drone', 'd15r-pro', 'd15r-max',
  ]
  const LOCALES = ['', '/de', '/es', '/fr'] as const
  const config = useRuntimeConfig()
  let slugs: string[] = []

  if (config.public.supabaseUrl && config.public.supabaseAnonKey) {
    try {
      const res = await fetch(
        `${config.public.supabaseUrl}/rest/v1/products?select=slug&order=created_at.desc`,
        { headers: { apikey: config.public.supabaseAnonKey, Authorization: `Bearer ${config.public.supabaseAnonKey}` } },
      )
      if (res.ok) {
        const rows: { slug: string | null }[] = await res.json()
        slugs = rows.map((r) => r.slug || '').filter(Boolean)
      }
    } catch (e) {
      console.warn('[prerender] products slug fetch failed, using fallback:', (e as Error).message)
    }
  }

  if (!slugs.length) slugs = PRESET_SLUGS

  const routes: string[] = []
  for (const l of LOCALES) {
    for (const slug of slugs) {
      routes.push(`${l}/products/${slug}`)
    }
  }
  console.log(`[prerender] products: ${slugs.length} slugs × ${LOCALES.length} locales = ${routes.length} routes`)
  return routes
})
</script>
