<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import SiteHeader from './components/SiteHeader.vue'
import SiteFooter from './components/SiteFooter.vue'
import ScrollIndicator from './components/ScrollIndicator.vue'
import C500Media from './components/C500Media.vue'
import MediaStory from './components/MediaStory.vue'
import GallerySection from './components/GallerySection.vue'
import DecisionSection from './components/DecisionSection.vue'
import VideoModal from './components/VideoModal.vue'
import { motionReady, reducedMotion, videoOpen } from './composables/state'
import { heroVideo, media } from './data/media'
import { contentFor, localeFromPath } from './lib/i18n'
import { CONTACT_EMAIL, WHATSAPP_E164 } from './lib/contact'
import { submitInquiry } from './lib/inquiry'
import { trackEvent } from './lib/tracking'

const locale = localeFromPath()
const content = contentFor(locale)
const search = window.location.search

reducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
motionReady.value = !reducedMotion.value

const heroReady = ref(false)
const main = ref(null)
const fabHidden = ref(false)

const abilities = content.abilities.map((item, index) => ({
  ...media.abilities[index],
  ...item
}))

const stories = Object.fromEntries(
  Object.keys(media.stories).map((key) => [
    key,
    { ...media.stories[key], title: content.stories[key].title }
  ])
)

const galleries = Object.fromEntries(
  Object.keys(media.galleries).map((key) => {
    const copy = content.galleries[key]
    return [
      key,
      {
        ...media.galleries[key],
        label: copy.label,
        items: media.galleries[key].items.map((item, index) => ({
          ...item,
          ...(copy.items[index] || {})
        }))
      }
    ]
  })
)

const decisions = content.decisions.map((item, index) => ({
  ...media.decisions[index],
  ...item
}))

const applications = content.applications.items.map((item, index) => ({
  ...media.applications[index],
  ...item
}))

const packages = content.packages.items.map((item, index) => ({
  ...media.packages[index],
  ...item
}))

const whatsappHref = `https://wa.me/${WHATSAPP_E164}?text=${encodeURIComponent(
  content.whatsapp.message
)}`
const fallbackMailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
  'C500 quote request'
)}`

const quoteForm = reactive({
  name: '',
  email: '',
  phone: '',
  company: '',
  region: '',
  package: '',
  message: '',
  website: ''
})

const submitting = ref(false)
const submitted = ref(false)
const quoteError = ref(false)
const formEl = ref(null)
const successPanel = ref(null)

const selectedPackage = computed(
  () => packages.find((item) => item.key === quoteForm.package) || null
)
const selectedPackageLabel = computed(() =>
  selectedPackage.value
    ? `${selectedPackage.value.name} (${selectedPackage.value.variant})`
    : ''
)

function openVideo() {
  videoOpen.value = true
  document.body.style.overflow = 'hidden'
}

function closeVideo() {
  videoOpen.value = false
  document.body.style.overflow = ''
}

function requestQuote(item) {
  quoteForm.package = item.key
  nextTick(() => {
    const preferred = ['name', 'email', 'region']
      .map((name) => formEl.value?.querySelector(`[name="${name}"]`))
      .find((field) => field && !field.value)
    // Focus after the anchor's default fragment navigation; otherwise the browser
    // resets focus to <body> and keyboard users lose the preselected package.
    if (preferred) {
      window.setTimeout(() => preferred.focus({ preventScroll: true }), 0)
    }
  })
}

function onWhatsappClick() {
  trackEvent('whatsapp_chat_initiated', {
    channel: 'whatsapp',
    phone: WHATSAPP_E164
  })
}

async function submitQuote() {
  if (submitting.value || submitted.value) return

  submitting.value = true
  quoteError.value = false

  try {
    const inquiryResult = await submitInquiry(
      {
        name: quoteForm.name,
        email: quoteForm.email,
        phone: quoteForm.phone,
        company: quoteForm.company,
        region: quoteForm.region,
        message: quoteForm.message
      },
      selectedPackageLabel.value
    )
    submitted.value = true
    if (!inquiryResult.spam) trackEvent('contact_form_submission', { form_type: 'contact' })
    nextTick(() => successPanel.value?.focus())
  } catch (error) {
    quoteError.value = true
    // Never log form values: they contain the lead's personal data.
    console.warn('[c500] inquiry submit failed', error?.message || 'unknown_error')
  } finally {
    submitting.value = false
  }
}

let revealObserver = null
let fabObserver = null

onMounted(() => {
  requestAnimationFrame(() => {
    heroReady.value = true
  })

  const targets = main.value?.querySelectorAll('.reveal')
  if (targets?.length) {
    if (!('IntersectionObserver' in window)) {
      targets.forEach((el) => el.classList.add('is-visible'))
    } else {
      revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible')
              revealObserver.unobserve(entry.target)
            }
          })
        },
        { threshold: 0.08 }
      )
      targets.forEach((el) => revealObserver.observe(el))
    }
  }

  // The floating WhatsApp button must not cover the quote form's submit button
  // or the footer's language links on narrow screens.
  const covered = new Set()
  const coveredRegions = [
    document.querySelector('#c500-quote'),
    document.querySelector('footer.site-footer')
  ].filter(Boolean)
  if ('IntersectionObserver' in window && coveredRegions.length) {
    fabObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) covered.add(entry.target)
          else covered.delete(entry.target)
        })
        fabHidden.value = covered.size > 0
      },
      { threshold: 0.05 }
    )
    coveredRegions.forEach((el) => fabObserver.observe(el))
  }
})

onBeforeUnmount(() => {
  revealObserver?.disconnect()
  fabObserver?.disconnect()
  document.body.style.overflow = ''
})
</script>

<template>
  <a class="skip-link" href="#c500-detail">{{ content.nav.skip }}</a>

  <SiteHeader :content="content.nav" :locale="locale" :search="search" />

  <main
    id="c500-detail"
    ref="main"
    tabindex="-1"
    class="c500"
    :class="{ 'motion-ready': motionReady }"
  >
    <ScrollIndicator controls="c500-detail" :label="content.accessibility.scroll" />

    <section id="c500-top" class="hero" :class="{ 'hero--ready': heroReady }">
      <C500Media
        class="hero__media"
        :image="media.hero.image"
        :width="media.hero.width"
        :height="media.hero.height"
        :alt="content.hero.imageAlt"
        eager
      />
      <div class="hero__shade"></div>
      <div class="hero__inner">
        <div class="hero__copy">
          <p class="hero__eyebrow gradient-text">{{ content.hero.eyebrow }}</p>
          <h1>{{ content.hero.title }}</h1>
          <p class="hero__summary">{{ content.hero.summary }}</p>
          <div class="hero__actions">
            <a class="hero__cta" href="#c500-quote">{{ content.hero.requestQuote }}</a>
            <button
              type="button"
              aria-haspopup="dialog"
              aria-controls="c500-video-dialog"
              class="outline-button"
              @click="openVideo"
            >
              {{ content.hero.watchVideo }}
              <svg
                viewBox="64 64 896 896"
                width="1em"
                height="1em"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  d="M869 487.8L491.2 159.9c-2.9-2.5-6.6-3.9-10.5-3.9h-88.5c-7.4 0-10.8 9.2-5.2 14l350.2 304H152c-4.4 0-8 3.6-8 8v60c0 4.4 3.6 8 8 8h585.1L386.9 854c-5.6 4.9-2.2 14 5.2 14h91.5c1.9 0 3.8-.7 5.2-2L869 536.2a32.07 32.07 0 0 0 0-48.4z"
                />
              </svg>
            </button>
          </div>
          <p class="hero__trust">{{ content.hero.trust }}</p>
        </div>
      </div>
    </section>

    <section id="c500-overview" class="overview section-inner">
      <p class="overview__description reveal">
        <template v-for="(line, index) in content.overview.paragraphs" :key="line">
          {{ line }}<br v-if="index < content.overview.paragraphs.length - 1" />
        </template>
      </p>
      <img
        :src="media.technology.image"
        :width="media.technology.width"
        :height="media.technology.height"
        :alt="content.overview.technologyAlt"
        loading="lazy"
        decoding="async"
        class="overview__technology reveal"
      />
      <div class="ability-grid">
        <article
          v-for="ability in abilities"
          :key="ability.key"
          class="ability reveal"
          :class="`ability--${ability.key}`"
        >
          <C500Media
            :image="ability.image"
            :video="ability.video"
            :width="ability.width"
            :height="ability.height"
            :alt="ability.alt || ability.title"
          />
          <div class="ability__copy">
            <h3>{{ ability.title }}</h3>
            <p v-if="ability.detail">{{ ability.detail }}</p>
          </div>
        </article>
      </div>
    </section>

    <MediaStory :story="stories.performance" :metrics="content.powerMetrics" />
    <GallerySection
      v-bind="galleries.power"
      :labels="content.accessibility.gallery"
    />

    <MediaStory :story="stories.energy" />
    <GallerySection
      v-bind="galleries.energy"
      :labels="content.accessibility.gallery"
    />

    <MediaStory :story="stories.perception" />
    <GallerySection
      v-bind="galleries.perception"
      :labels="content.accessibility.gallery"
    />

    <MediaStory :story="stories.decision" />
    <DecisionSection
      :items="decisions"
      :aria-label="content.accessibility.decision"
      :expand-label="content.accessibility.decisionExpand"
      :collapse-label="content.accessibility.decisionCollapse"
    />

    <MediaStory :story="stories.cluster" />
    <GallerySection
      v-bind="galleries.cluster"
      :labels="content.accessibility.gallery"
    />

    <MediaStory :story="stories.functions" />
    <GallerySection
      v-bind="galleries.functions"
      :labels="content.accessibility.gallery"
    />

    <section class="applications section-inner">
      <h2 class="gradient-text reveal">{{ content.applications.heading }}</h2>
      <div class="applications__grid">
        <article
          v-for="item in applications"
          :key="item.title"
          class="application reveal"
        >
          <C500Media
            :image="item.image"
            :width="item.width"
            :height="item.height"
            :alt="item.title"
          />
          <h3>{{ item.title }}</h3>
        </article>
      </div>
    </section>

    <section
      id="c500-packages"
      aria-labelledby="c500-packages-title"
      class="packages section-inner"
    >
      <h2 id="c500-packages-title" class="gradient-text reveal">
        {{ content.packages.heading }}
      </h2>
      <p class="packages__intro reveal">{{ content.packages.intro }}</p>
      <div class="packages__grid">
        <article v-for="item in packages" :key="item.key" class="package reveal">
          <img
            :src="item.image"
            :width="item.width"
            :height="item.height"
            :alt="`${item.name} (${item.variant}): ${item.summary}`"
            loading="lazy"
            decoding="async"
          />
          <div class="package__body">
            <h3>{{ item.name }}</h3>
            <p class="package__variant">{{ item.variant }}</p>
            <p class="package__summary">{{ item.summary }}</p>
          </div>
          <div class="package__footer">
            <span class="package__note">{{ content.packages.note }}</span>
            <a
              class="package__cta"
              href="#c500-quote"
              :data-package="item.key"
              @click="requestQuote(item)"
            >
              {{ content.packages.cta }}
            </a>
          </div>
        </article>
      </div>
    </section>

    <section id="c500-quote" aria-labelledby="c500-quote-title" class="quote">
      <div class="quote__inner section-inner">
        <div class="quote__copy reveal">
          <p class="quote__eyebrow gradient-text">{{ content.quote.eyebrow }}</p>
          <h2 id="c500-quote-title" class="gradient-text">{{ content.quote.title }}</h2>
          <p class="quote__lead">{{ content.quote.lead }}</p>
          <ul class="quote__points">
            <li v-for="point in content.quote.points" :key="point">{{ point }}</li>
          </ul>
        </div>

        <div class="quote__form-wrap reveal">
          <div
            v-if="submitted"
            ref="successPanel"
            class="quote__success"
            role="status"
            tabindex="-1"
          >
            <p>{{ content.quote.form.success }}</p>
            <a :href="fallbackMailto">{{ CONTACT_EMAIL }}</a>
          </div>

          <form
            v-else
            ref="formEl"
            class="quote__form"
            :aria-busy="submitting"
            @submit.prevent="submitQuote"
          >
            <div class="quote__row">
              <label>
                {{ content.quote.form.name }}
                <input
                  v-model.trim="quoteForm.name"
                  type="text"
                  name="name"
                  autocomplete="name"
                  maxlength="120"
                  required
                />
              </label>
              <label>
                {{ content.quote.form.email }}
                <input
                  v-model.trim="quoteForm.email"
                  type="email"
                  name="email"
                  autocomplete="email"
                  maxlength="254"
                  required
                />
              </label>
            </div>

            <div class="quote__row">
              <label>
                {{ content.quote.form.phone }}
                <input
                  v-model.trim="quoteForm.phone"
                  type="tel"
                  name="phone"
                  autocomplete="tel"
                  maxlength="40"
                />
              </label>
              <label>
                {{ content.quote.form.company }}
                <input
                  v-model.trim="quoteForm.company"
                  type="text"
                  name="company"
                  autocomplete="organization"
                  maxlength="160"
                />
              </label>
            </div>

            <div class="quote__row">
              <label>
                {{ content.quote.form.region }}
                <input
                  v-model.trim="quoteForm.region"
                  type="text"
                  name="region"
                  autocomplete="country-name"
                  maxlength="120"
                  required
                />
              </label>
              <label>
                {{ content.quote.form.package }}
                <select v-model="quoteForm.package" name="package">
                  <option value="">{{ content.quote.form.packagePlaceholder }}</option>
                  <option v-for="item in packages" :key="item.key" :value="item.key">
                    {{ item.name }} ({{ item.variant }})
                  </option>
                </select>
              </label>
            </div>

            <label>
              {{ content.quote.form.message }}
              <textarea
                v-model.trim="quoteForm.message"
                name="message"
                rows="4"
                maxlength="2000"
                :placeholder="content.quote.form.messagePlaceholder"
              ></textarea>
            </label>

            <label class="quote__hp" aria-hidden="true">
              {{ content.quote.form.honeypot }}
              <input
                v-model="quoteForm.website"
                type="text"
                name="website"
                tabindex="-1"
                autocomplete="off"
              />
            </label>

            <p class="quote__privacy">{{ content.quote.form.privacy }}</p>

            <button type="submit" class="quote__submit" :disabled="submitting">
              {{ submitting ? content.quote.form.submitting : content.quote.form.submit }}
            </button>

            <p v-if="quoteError" class="quote__status quote__status--error" role="alert">
              {{ content.quote.form.error }}
              <a :href="fallbackMailto">{{ content.quote.form.fallbackLink }}</a>
            </p>

            <noscript>
              <p class="quote__noscript">
                {{ content.quote.form.noscript }}
                <a :href="fallbackMailto">{{ CONTACT_EMAIL }}</a>
              </p>
            </noscript>
          </form>
        </div>
      </div>
    </section>

    <section id="c500-specs" aria-labelledby="c500-specs-title" class="specifications">
      <div class="specifications__content">
        <div class="specifications__inner">
          <h2 id="c500-specs-title" class="specifications__title">
            <strong>{{ content.specifications.titlePrefix }}</strong>
            {{ content.specifications.title }}
          </h2>
          <table aria-labelledby="c500-specs-title" class="specifications__table">
            <tbody>
              <tr v-for="row in content.specifications.items" :key="row.label">
                <th scope="row">{{ row.label }}</th>
                <td>{{ row.value }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <section :aria-label="content.notes.aria" class="notes">
      <div class="notes__inner">
        <p v-for="line in content.notes.intro" :key="line">{{ line }}</p>
        <div
          v-for="(note, index) in content.notes.items"
          :id="`c500-note-${index + 1}`"
          :key="note.text"
          class="notes__item"
        >
          <p>{{ note.text }}</p>
          <p v-for="extra in note.extra || []" :key="extra">{{ extra }}</p>
        </div>
      </div>
    </section>
  </main>

  <SiteFooter
    :content="content.footer"
    :whatsapp-aria="content.whatsapp.aria"
    :locale="locale"
    :search="search"
  />

  <a
    class="whatsapp-fab"
    :class="{ 'whatsapp-fab--hidden': fabHidden }"
    :href="whatsappHref"
    target="_blank"
    rel="noopener"
    :aria-label="content.whatsapp.aria"
    @click="onWhatsappClick"
  >
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
      <path
        d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.97L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm0 18.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.26 8.26 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 4.54 0 8.24 3.7 8.24 8.24 0 4.55-3.7 8.24-8.24 8.24zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.17.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.06-.39-2.02-1.25-.75-.67-1.25-1.49-1.4-1.74-.14-.25-.02-.39.11-.51.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.25 1.05.4 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.16-.48-.28z"
      />
    </svg>
    <span class="whatsapp-fab__label">WhatsApp</span>
  </a>

  <VideoModal
    :src="heroVideo"
    :labels="{
      dialog: content.hero.videoDialog,
      title: `${content.meta.productName} — ${content.hero.videoDialog}`,
      close: content.hero.closeVideo
    }"
    @close="closeVideo"
  />
</template>
