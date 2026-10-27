<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import C500Media from './C500Media.vue'
import { reducedMotion, videoOpen } from '../composables/state'
import { format } from '../lib/i18n'

const props = defineProps({
  name: { type: String, required: true },
  label: { type: String, required: true },
  items: { type: Array, required: true },
  variant: { type: String, default: 'slides' },
  autoplay: { type: Boolean, default: false },
  overlayCaption: { type: Boolean, default: false },
  labels: {
    type: Object,
    default: () => ({
      position: '{label} position',
      item: 'Item {n}',
      prev: 'Previous item',
      next: 'Next item'
    })
  }
})

const active = ref(0)
const displayedActive = ref(0)
const elapsed = ref(0)
const visible = ref(false)
const focused = ref(false)

let lastTick = 0
let timer = 0
let observer = null

const stopCount = computed(() =>
  props.variant === 'cards' ? Math.max(1, props.items.length - 1) : props.items.length
)

const progress = computed(() =>
  props.autoplay && !reducedMotion.value ? elapsed.value / 5000 : 1
)

const trackStyle = computed(() => {
  const offset =
    props.variant === 'cards'
      ? Math.min(
          46.4 * active.value,
          Math.max(
            0,
            44 * props.items.length + 2.4 * (props.items.length - 1) - 100
          )
        )
      : 102.4 * active.value
  return { transform: `translate3d(-${offset}%, 0, 0)` }
})

const galleryClasses = computed(() => [
  'c500-gallery',
  `c500-gallery--${props.variant}`,
  { 'c500-gallery--caption': props.overlayCaption }
])

function select(index, userInitiated) {
  active.value = Math.max(0, Math.min(index, stopCount.value - 1))
  elapsed.value = 0
  if (userInitiated) {
    lastTick = performance.now()
    if (props.variant !== 'tabs') displayedActive.value = active.value
  }
}

function onPanelReady(index) {
  if (index === active.value) displayedActive.value = index
}

function onTabKeydown(event, index) {
  let next = null
  if (event.key === 'ArrowRight') next = (index + 1) % props.items.length
  else if (event.key === 'ArrowLeft') next = (index - 1 + props.items.length) % props.items.length
  else if (event.key === 'Home') next = 0
  else if (event.key === 'End') next = props.items.length - 1
  if (next === null) return
  event.preventDefault()
  select(next, true)
  const tab = document.getElementById(`c500-${props.name}-tab-${next}`)
  if (tab) tab.focus()
}

function onFocusIn() {
  focused.value = true
}

function onFocusOut(event) {
  if (!event.currentTarget.contains(event.relatedTarget)) focused.value = false
}

onMounted(() => {
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(
      (entries) => {
        visible.value = entries[0].isIntersecting
        lastTick = performance.now()
      },
      { threshold: 0.15 }
    )
    observer.observe(eventRoot())
  } else {
    const check = () => {
      const rect = eventRoot().getBoundingClientRect()
      visible.value = rect.bottom > 0 && rect.top < window.innerHeight
    }
    window.addEventListener('scroll', check, { passive: true })
    check()
  }

  if (props.autoplay) {
    lastTick = performance.now()
    timer = window.setInterval(() => {
      const now = performance.now()
      const delta = Math.min(now - lastTick, 200)
      lastTick = now
      const focusVisible =
        focused.value && document.activeElement?.matches?.(':focus-visible')
      if (
        !visible.value ||
        focusVisible ||
        videoOpen.value ||
        reducedMotion.value ||
        document.hidden ||
        (props.variant === 'tabs' && displayedActive.value !== active.value)
      ) {
        return
      }
      elapsed.value += delta
      if (elapsed.value >= 5000) {
        select((active.value + 1) % stopCount.value)
      }
    }, 100)
  }
})

function eventRoot() {
  return document.getElementById(`c500-${props.name}`)
}

onBeforeUnmount(() => {
  if (timer) window.clearInterval(timer)
  if (observer) observer.disconnect()
})
</script>

<template>
  <section
    :id="`c500-${name}`"
    :aria-label="label"
    :class="galleryClasses"
    :data-index="active"
    @focusin="onFocusIn"
    @focusout="onFocusOut"
  >
    <div
      class="gallery-window"
      :id="variant === 'tabs' ? `c500-${name}-panel` : undefined"
      :role="variant === 'tabs' ? 'tabpanel' : undefined"
      :aria-labelledby="
        variant === 'tabs' ? `c500-${name}-tab-${active}` : undefined
      "
      :aria-busy="variant === 'tabs' && displayedActive !== active ? 'true' : undefined"
    >
      <div v-if="variant === 'tabs'" class="gallery-panels">
        <div
          v-for="(item, index) in items"
          v-show="index === displayedActive"
          :key="item.title"
          class="gallery-panel"
          :aria-hidden="index !== displayedActive"
        >
          <C500Media
            :image="item.image"
            :video="item.video"
            :width="item.width"
            :height="item.height"
            :prepare="visible && index === active"
            :eager="visible && index === active"
            :suspended="videoOpen || !visible || index !== displayedActive"
            :alt="item.title"
            @ready="onPanelReady(index)"
          />
          <div class="gallery-panel__detail">
            <p v-if="item.detailParts">
              <span v-for="(part, partIndex) in item.detailParts" :key="partIndex">
                {{ part.text
                }}<sup v-if="part.note"
                  ><a :href="`#c500-note-${part.note}`">[{{ part.note }}]</a></sup
                >
              </span>
            </p>
            <p v-else>
              {{ item.detail }}<sup v-for="note in item.notes || []" :key="note"
                ><a :href="`#c500-note-${note}`">[{{ note }}]</a></sup
              >
            </p>
            <p v-if="item.detailNote" class="gallery-panel__note">{{ item.detailNote }}</p>
          </div>
        </div>
      </div>

      <div v-else class="gallery-track" :style="trackStyle">
        <article
          v-for="(item, index) in items"
          :key="item.title"
          class="gallery-slide"
          :class="{ 'is-active': index === active }"
          :aria-hidden="
            variant === 'cards'
              ? index < active || index > active + 1
              : index !== active
          "
        >
          <div class="gallery-slide__media">
            <C500Media
              :image="item.image"
              :video="item.video"
              :width="item.width"
              :height="item.height"
              :suspended="videoOpen"
              :alt="item.title"
            />
          </div>
          <div v-if="variant === 'cards' || overlayCaption" class="gallery-slide__copy">
            <h3 v-if="item.titleParts">
              <span v-for="(part, partIndex) in item.titleParts" :key="partIndex">
                {{ part.text
                }}<sup v-if="part.note"
                  ><a :href="`#c500-note-${part.note}`">[{{ part.note }}]</a></sup
                >
              </span>
            </h3>
            <h3 v-else>
              {{ item.title }}<sup v-for="note in item.notes || []" :key="note"
                ><a :href="`#c500-note-${note}`">[{{ note }}]</a></sup
              >
            </h3>
            <p v-if="item.detailParts">
              <span v-for="(part, partIndex) in item.detailParts" :key="partIndex">
                {{ part.text
                }}<sup v-if="part.note"
                  ><a :href="`#c500-note-${part.note}`">[{{ part.note }}]</a></sup
                >
              </span>
            </p>
            <p v-else-if="item.detail">{{ item.detail }}</p>
          </div>
        </article>
      </div>
    </div>

    <div v-if="variant === 'tabs'" class="gallery-tabs" role="tablist" :aria-label="label">
      <button
        v-for="(item, index) in items"
        :id="`c500-${name}-tab-${index}`"
        :key="item.title"
        type="button"
        role="tab"
        :class="{ 'is-active': index === active }"
        :aria-selected="index === active"
        :aria-controls="`c500-${name}-panel`"
        :tabindex="index === active ? 0 : -1"
        @click="select(index, true)"
        @keydown="onTabKeydown($event, index)"
      >
        {{ item.title }}
      </button>
    </div>

    <div v-else class="gallery-controls">
      <div class="gallery-progress" :aria-label="format(labels.position, { label })">
        <button
          v-for="n in stopCount"
          :key="n"
          type="button"
          :class="{ 'is-active': active === n - 1 }"
          :aria-label="format(labels.item, { n })"
          :aria-current="active === n - 1 ? 'true' : undefined"
          @click="select(n - 1, true)"
        >
          <span
            :style="{ transform: `scaleX(${active === n - 1 ? progress : 0})` }"
          ></span>
        </button>
      </div>
      <div class="gallery-arrows">
        <button
          type="button"
          :title="labels.prev"
          :aria-label="labels.prev"
          :disabled="active === 0"
          @click="select(active - 1, true)"
        >
          <svg viewBox="64 64 896 896" width="1em" height="1em" fill="currentColor" aria-hidden="true">
            <path
              d="M724 218.3V141c0-6.7-7.7-10.4-12.9-6.3L260.3 486.8a31.86 31.86 0 0 0 0 50.3l450.8 352.1c5.3 4.1 12.9.4 12.9-6.3v-77.3c0-4.9-2.3-9.6-6.1-12.6l-360-281 360-281.1c3.8-3 6.1-7.7 6.1-12.6z"
            />
          </svg>
        </button>
        <button
          type="button"
          :title="labels.next"
          :aria-label="labels.next"
          :disabled="active === stopCount - 1"
          @click="select(active + 1, true)"
        >
          <svg viewBox="64 64 896 896" width="1em" height="1em" fill="currentColor" aria-hidden="true">
            <path
              d="M765.7 486.8L314.9 134.7A7.97 7.97 0 0 0 302 141v77.3c0 4.9 2.3 9.6 6.1 12.6l360 281.1-360 281.1c-3.9 3-6.1 7.7-6.1 12.6V883c0 6.7 7.7 10.4 12.9 6.3l450.8-352.1a31.96 31.96 0 0 0 0-50.4z"
            />
          </svg>
        </button>
      </div>
    </div>

    <div v-if="variant === 'slides' && !overlayCaption" class="gallery-caption">
      <h3>{{ items[active].title }}</h3>
      <p v-if="items[active].detailParts">
        <span v-for="(part, partIndex) in items[active].detailParts" :key="partIndex">
          {{ part.text
          }}<sup v-if="part.note"
            ><a :href="`#c500-note-${part.note}`">[{{ part.note }}]</a></sup
          >
        </span>
      </p>
      <p v-else>
        {{ items[active].detail }}<sup v-for="note in items[active].notes || []" :key="note"
          ><a :href="`#c500-note-${note}`">[{{ note }}]</a></sup
        >
      </p>
    </div>
  </section>
</template>
