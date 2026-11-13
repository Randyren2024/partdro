<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import SiteHeader from './components/SiteHeader.vue'
import SiteFooter from './components/SiteFooter.vue'
import ScrollIndicator from './components/ScrollIndicator.vue'
import VideoModal from './components/VideoModal.vue'
import { motionReady, reducedMotion, videoOpen } from './composables/state'
import { demoVideo, media } from './data/media'
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

const envelopeImages = [media.poster, media.tail, media.hero, media.airframe]
const envelopeItems = content.envelope.items.map((item, index) => ({
  ...item,
  ...envelopeImages[index]
}))

const applications = content.applications.items

const maxMinutes = Math.max(...content.endurance.points.map((point) => point.minutes))

const whatsappHref = `https://wa.me/${WHATSAPP_E164}?text=${encodeURIComponent(
  content.whatsapp.message
)}`
const fallbackMailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
  'VF50P quote request'
)}`

const quoteForm = reactive({
  name: '',
  email: '',
  phone: '',
  company: '',
  region: '',
  interest: '',
  message: '',
  website: ''
})

const submitting = ref(false)
const submitted = ref(false)
const quoteError = ref(false)
const formEl = ref(null)
const successPanel = ref(null)

const selectedInterest = computed(
  () => content.quote.options.find((item) => item.key === quoteForm.interest) || null
)
const selectedInterestLabel = computed(() => selectedInterest.value?.label || '')

function openVideo() {
  videoOpen.value = true
  document.body.style.overflow = 'hidden'
}

function closeVideo() {
  videoOpen.value = false
  document.body.style.overflow = ''
}

function focusFirstEmptyQuoteField() {
  nextTick(() => {
    const preferred = ['name', 'email', 'region']
      .map((name) => formEl.value?.querySelector(`[name="${name}"]`))
      .find((field) => field && !field.value)
    if (preferred) {
      window.setTimeout(() => preferred.focus({ preventScroll: true }), 0)
    }
  })
}

function requestQuote() {
  focusFirstEmptyQuoteField()
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
      selectedInterestLabel.value
    )
    submitted.value = true
    if (!inquiryResult.spam) trackEvent('contact_form_submission', { form_type: 'contact' })
    nextTick(() => successPanel.value?.focus())
  } catch (error) {
    quoteError.value = true
    // Never log form values: they contain the lead's personal data.
    console.warn('[vf50p] inquiry submit failed', error?.message || 'unknown_error')
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

  const covered = new Set()
  const coveredRegions = [
    document.querySelector('#vf50p-quote'),
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
  <a class="skip-link" href="#vf50p-detail">{{ content.nav.skip }}</a>

  <SiteHeader :content="content.nav" :locale="locale" :search="search" />

  <main
    id="vf50p-detail"
    ref="main"
    tabindex="-1"
    class="vf50p"
    :class="{ 'motion-ready': motionReady }"
  >
    <ScrollIndicator controls="vf50p-detail" :label="content.accessibility.scroll" />

    <!-- 1 · Hero -->
    <section id="vf50p-top" class="hero" :class="{ 'hero--ready': heroReady }">
      <img
        class="hero__media"
        :src="media.hero.image"
        :width="media.hero.width"
        :height="media.hero.height"
        :alt="content.hero.imageAlt"
        fetchpriority="high"
        decoding="async"
      />
      <div class="hero__shade"></div>
      <div class="hero__inner">
        <div class="hero__copy">
          <p class="hero__eyebrow">{{ content.hero.eyebrow }}</p>
          <h1>
            <span class="hero__line hero__line--model">{{ content.hero.titleLines[0] }}</span>
            <span class="hero__line">{{ content.hero.titleLines[1] }}</span>
          </h1>
          <p class="hero__summary">{{ content.hero.summary }}</p>
          <div class="hero__actions">
            <a class="hero__cta" href="#vf50p-quote">{{ content.hero.primary }}</a>
            <button
              type="button"
              aria-haspopup="dialog"
              aria-controls="vf50p-video-dialog"
              class="ghost-button"
              @click="openVideo"
            >
              <span class="ghost-button__play" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                  <path d="M8 5.5v13l11-6.5-11-6.5z" />
                </svg>
              </span>
              {{ content.hero.secondary }}
            </button>
          </div>
        </div>

        <dl class="hero__stats">
          <div v-for="stat in content.hero.stats" :key="stat.label" class="hero__stat">
            <dt>{{ stat.label }}</dt>
            <dd>{{ stat.value }}<span>{{ stat.unit }}</span></dd>
          </div>
        </dl>
      </div>
    </section>

    <!-- 2 · Overview -->
    <section id="vf50p-overview" class="section section--overview">
      <div class="section-inner">
        <div class="split">
          <div class="split__copy reveal">
            <p class="eyebrow">{{ content.overview.eyebrow }}</p>
            <h2>{{ content.overview.heading }}</h2>
            <p v-for="line in content.overview.paragraphs" :key="line" class="lede">{{ line }}</p>
          </div>
          <figure class="split__figure reveal">
            <img
              :src="media.airframe.image"
              :width="media.airframe.width"
              :height="media.airframe.height"
              :alt="content.overview.imageAlt"
              loading="lazy"
              decoding="async"
            />
          </figure>
        </div>

        <dl class="metric-grid">
          <div v-for="metric in content.overview.metrics" :key="metric.label" class="metric reveal">
            <dd>{{ metric.value }}<span>{{ metric.unit }}</span></dd>
            <dt>{{ metric.label }}</dt>
          </div>
        </dl>
      </div>
    </section>

    <!-- 3 · Architecture -->
    <section id="vf50p-architecture" class="section section--pod">
      <div class="section-inner stack">
        <figure class="stack__figure reveal">
          <img
            :src="media.tail.image"
            :width="media.tail.width"
            :height="media.tail.height"
            :alt="content.architecture.imageAlt"
            loading="lazy"
            decoding="async"
          />
        </figure>
        <div class="stack__copy reveal">
          <p class="eyebrow">{{ content.architecture.eyebrow }}</p>
          <h2>{{ content.architecture.heading }}</h2>
          <p class="lede">{{ content.architecture.lead }}</p>
          <ul class="sensor-list">
            <li v-for="item in content.architecture.items" :key="item.name">
              <p class="sensor-list__head">
                <span>{{ item.name }}</span>
                <strong>{{ item.value }}</strong>
              </p>
              <p class="sensor-list__detail">{{ item.detail }}</p>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- 4 · Endurance -->
    <section id="vf50p-endurance" class="section section--endurance">
      <div class="section-inner">
        <div class="section__head reveal">
          <p class="eyebrow">{{ content.endurance.eyebrow }}</p>
          <h2>{{ content.endurance.heading }}</h2>
          <p class="lede">{{ content.endurance.lead }}</p>
        </div>

        <div class="endurance">
          <div class="chart reveal" role="img" :aria-label="content.accessibility.chart">
            <div class="chart__plot chart__plot--two">
              <div
                v-for="point in content.endurance.points"
                :key="point.load"
                class="chart__col"
              >
                <span class="chart__value">{{ point.label }}</span>
                <span
                  class="chart__bar"
                  :style="{ height: `${Math.round((point.minutes / maxMinutes) * 100)}%` }"
                ></span>
                <span class="chart__load">{{ point.load }}</span>
              </div>
            </div>
            <p class="chart__title">{{ content.endurance.chartTitle }}</p>
            <p class="chart__note">{{ content.endurance.note }}</p>
          </div>

          <figure class="tether reveal">
            <img
              :src="media.engine.image"
              :width="media.engine.width"
              :height="media.engine.height"
              :alt="content.endurance.power.title"
              loading="lazy"
              decoding="async"
            />
            <figcaption>
              <h3>{{ content.endurance.power.title }}</h3>
              <p>{{ content.endurance.power.desc }}</p>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>

    <!-- 5 · Flight envelope -->
    <section class="section section--safety">
      <div class="section-inner">
        <div class="section__head reveal">
          <p class="eyebrow">{{ content.envelope.eyebrow }}</p>
          <h2>{{ content.envelope.heading }}</h2>
          <p class="lede">{{ content.envelope.lead }}</p>
        </div>

        <div class="card-grid card-grid--safety">
          <article
            v-for="(item, index) in envelopeItems"
            :key="item.title"
            class="media-card reveal"
          >
            <img
              :src="item.image"
              :width="item.width"
              :height="item.height"
              :alt="item.title"
              loading="lazy"
              decoding="async"
            />
            <div class="media-card__body">
              <span class="media-card__index">0{{ index + 1 }}</span>
              <h3>{{ item.title }}</h3>
              <p>{{ item.desc }}</p>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- 6 · Applications -->
    <section id="vf50p-applications" class="section section--applications">
      <div class="section-inner">
        <div class="section__head reveal">
          <p class="eyebrow">{{ content.applications.eyebrow }}</p>
          <h2>{{ content.applications.heading }}</h2>
          <p class="lede">{{ content.applications.intro }}</p>
        </div>

        <div class="app-grid">
          <article v-for="(item, index) in applications" :key="item.title" class="app-card app-card--icon reveal">
            <div class="app-card__body">
              <span class="app-card__index">0{{ index + 1 }}</span>
              <h3>{{ item.title }}</h3>
              <p>{{ item.desc }}</p>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- 7 · Video -->
    <section class="section section--video">
      <div class="section-inner">
        <div class="video-band reveal">
          <img
            :src="media.poster.image"
            :width="media.poster.width"
            :height="media.poster.height"
            :alt="content.video.posterAlt"
            decoding="async"
          />
          <div class="video-band__shade"></div>
          <div class="video-band__copy">
            <p class="eyebrow">{{ content.video.eyebrow }}</p>
            <h2>{{ content.video.heading }}</h2>
            <p class="lede">{{ content.video.lead }}</p>
            <button
              type="button"
              class="play-button"
              aria-haspopup="dialog"
              aria-controls="vf50p-video-dialog"
              @click="openVideo"
            >
              <span class="play-button__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M8 5.5v13l11-6.5-11-6.5z" />
                </svg>
              </span>
              {{ content.video.play }}
            </button>
            <p class="video-band__caption">{{ content.video.caption }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 8 · Specifications -->
    <section id="vf50p-specs" class="section section--specs">
      <div class="section-inner">
        <div class="section__head reveal">
          <p class="eyebrow">{{ content.specs.eyebrow }}</p>
          <h2><span class="accent">{{ content.specs.titlePrefix }}</span> {{ content.specs.title }}</h2>
        </div>
        <table class="spec-table reveal" :aria-label="content.accessibility.specs">
          <tbody>
            <tr v-for="row in content.specs.items" :key="row.label">
              <th scope="row">{{ row.label }}</th>
              <td>{{ row.value }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- 9 · FAQ -->
    <section id="vf50p-faq" class="section section--faq">
      <div class="section-inner">
        <div class="section__head reveal">
          <p class="eyebrow">{{ content.faq.eyebrow }}</p>
          <h2>{{ content.faq.heading }}</h2>
        </div>
        <div class="faq__list">
          <details v-for="item in content.faq.items" :key="item.q" class="faq__item reveal">
            <summary>{{ item.q }}</summary>
            <div class="faq__answer">
              <p>{{ item.a }}</p>
            </div>
          </details>
        </div>
      </div>
    </section>

    <!-- 10 · Quote -->
    <section id="vf50p-quote" class="quote">
      <div class="quote__inner section-inner">
        <div class="quote__copy reveal">
          <p class="eyebrow">{{ content.quote.eyebrow }}</p>
          <h2>{{ content.quote.title }}</h2>
          <p class="quote__lead">{{ content.quote.lead }}</p>
          <ul class="quote__points">
            <li v-for="point in content.quote.points" :key="point">{{ point }}</li>
          </ul>
        </div>

        <div class="quote__form-wrap reveal">
          <div v-if="submitted" ref="successPanel" class="quote__success" role="status" tabindex="-1">
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
                {{ content.quote.form.interest }}
                <select v-model="quoteForm.interest" name="interest">
                  <option value="">{{ content.quote.form.interestPlaceholder }}</option>
                  <option v-for="item in content.quote.options" :key="item.key" :value="item.key">
                    {{ item.label }}
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

    <section :aria-label="content.notes.aria" class="notes">
      <div class="notes__inner">
        <p v-for="line in content.notes.intro" :key="line">{{ line }}</p>
        <div v-for="(note, index) in content.notes.items" :id="`vf50p-note-${index + 1}`" :key="note.text" class="notes__item">
          <p>{{ note.text }}</p>
        </div>
      </div>
    </section>
  </main>

  <SiteFooter
    :content="content.footer"
    :whatsapp-aria="content.whatsapp.aria"
    locale="en"
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
    :src="demoVideo"
    :poster="media.poster.image"
    :labels="{
      dialog: content.video.dialogTitle,
      title: `${content.meta.productName} — ${content.video.dialogTitle}`,
      close: content.video.close
    }"
    @close="closeVideo"
  />
</template>
