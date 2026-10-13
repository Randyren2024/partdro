<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import C500Media from './C500Media.vue'
import { reducedMotion, videoOpen } from '../../composables/useC500State'
import type { GalleryItem } from '../../data/c500eavision'

const props = withDefaults(
  defineProps<{
    name: string
    items: GalleryItem[]
    variant?: 'slides' | 'tabs' | 'cards'
    autoplay?: boolean
    overlayCaption?: boolean
  }>(),
  {
    variant: 'slides',
    autoplay: false,
    overlayCaption: false
  }
)

const { t } = useI18n()

const label = computed(() => t(`c500eavision.galleries.${props.name}.label`))

function itemTitle(index: number): string {
  return t(`c500eavision.galleries.${props.name}.items.${index}.title`)
}
function itemDetail(index: number): string {
  return t(`c500eavision.galleries.${props.name}.items.${index}.detail`)
}
function partText(index: number, kind: 'detailParts' | 'titleParts', partIndex: number): string {
  return t(`c500eavision.galleries.${props.name}.items.${index}.${kind}.${partIndex}.text`)
}
function itemDetailNote(index: number): string {
  return t(`c500eavision.galleries.${props.name}.items.${index}.detailNote`)
}

const active = ref<number>(0)
const displayedActive = ref<number>(0)
const elapsed = ref<number>(0)
const visible = ref<boolean>(false)
const focused = ref<boolean>(false)

let lastTick = 0
let timer = 0
let observer: IntersectionObserver | null = null

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

function select(index: number, userInitiated?: boolean): void {
  active.value = Math.max(0, Math.min(index, stopCount.value - 1))
  elapsed.value = 0
  if (userInitiated) {
    lastTick = performance.now()
    if (props.variant !== 'tabs') displayedActive.value = active.value
  }
}

function onPanelReady(index: number): void {
  if (index === active.value) displayedActive.value = index
}

function onTabKeydown(event: KeyboardEvent, index: number): void {
  let next: number | null = null
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

function onFocusIn(): void {
  focused.value = true
}

function onFocusOut(event: FocusEvent): void {
  if (!event.currentTarget || !(event.currentTarget as HTMLElement).contains(event.relatedTarget as Node)) {
    focused.value = false
  }
}

function eventRoot(): HTMLElement | null {
  return document.getElementById(`c500-${props.name}`)
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
    const root = eventRoot()
    if (root) observer.observe(root)
  } else {
    const check = (): void => {
      const root = eventRoot()
      if (!root) return
      const rect = root.getBoundingClientRect()
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
          :key="index"
          class="gallery-panel"
          :aria-hidden="index !== displayedActive"
        >
          <C500Media
            :image="item.image"
            :video="item.video"
            :prepare="visible && index === active"
            :eager="visible && index === active"
            :suspended="videoOpen || !visible || index !== displayedActive"
            :alt="itemTitle(index)"
            @ready="onPanelReady(index)"
          />
          <div class="gallery-panel__detail">
            <p v-if="item.detailParts">
              <span v-for="(part, partIndex) in item.detailParts" :key="partIndex">
                {{ partText(index, 'detailParts', partIndex)
                }}<sup v-if="part.note"
                  ><a :href="`#c500-note-${part.note}`">[{{ part.note }}]</a></sup
                >
              </span>
            </p>
            <p v-else>
              {{ itemDetail(index) }}<sup v-for="note in item.notes || []" :key="note"
                ><a :href="`#c500-note-${note}`">[{{ note }}]</a></sup
              >
            </p>
            <p v-if="item.detailNote" class="gallery-panel__note">{{ itemDetailNote(index) }}</p>
          </div>
        </div>
      </div>

      <div v-else class="gallery-track" :style="trackStyle">
        <article
          v-for="(item, index) in items"
          :key="index"
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
              :suspended="videoOpen"
              :alt="itemTitle(index)"
            />
          </div>
          <div v-if="variant === 'cards' || overlayCaption" class="gallery-slide__copy">
            <h3 v-if="item.titleParts">
              <span v-for="(part, partIndex) in item.titleParts" :key="partIndex">
                {{ partText(index, 'titleParts', partIndex)
                }}<sup v-if="part.note"
                  ><a :href="`#c500-note-${part.note}`">[{{ part.note }}]</a></sup
                >
              </span>
            </h3>
            <h3 v-else>
              {{ itemTitle(index) }}<sup v-for="note in item.notes || []" :key="note"
                ><a :href="`#c500-note-${note}`">[{{ note }}]</a></sup
              >
            </h3>
            <p v-if="item.detailParts">
              <span v-for="(part, partIndex) in item.detailParts" :key="partIndex">
                {{ partText(index, 'detailParts', partIndex)
                }}<sup v-if="part.note"
                  ><a :href="`#c500-note-${part.note}`">[{{ part.note }}]</a></sup
                >
              </span>
            </p>
            <p v-else-if="item.detail">{{ itemDetail(index) }}</p>
          </div>
        </article>
      </div>
    </div>

    <div v-if="variant === 'tabs'" class="gallery-tabs" role="tablist" :aria-label="label">
      <button
        v-for="(item, index) in items"
        :id="`c500-${name}-tab-${index}`"
        :key="index"
        type="button"
        role="tab"
        :class="{ 'is-active': index === active }"
        :aria-selected="index === active"
        :aria-controls="`c500-${name}-panel`"
        :tabindex="index === active ? 0 : -1"
        @click="select(index, true)"
        @keydown="onTabKeydown($event, index)"
      >
        {{ itemTitle(index) }}
      </button>
    </div>

    <div v-else class="gallery-controls">
      <div
        class="gallery-progress"
        :aria-label="t('c500eavision.gallery.aria.position', { label })"
      >
        <button
          v-for="n in stopCount"
          :key="n"
          type="button"
          :class="{ 'is-active': active === n - 1 }"
          :aria-label="t('c500eavision.gallery.aria.item', { n })"
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
          :title="t('c500eavision.gallery.aria.prev')"
          :aria-label="t('c500eavision.gallery.aria.prev')"
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
          :title="t('c500eavision.gallery.aria.next')"
          :aria-label="t('c500eavision.gallery.aria.next')"
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
      <h3>{{ itemTitle(active) }}</h3>
      <p v-if="items[active].detailParts">
        <span v-for="(part, partIndex) in items[active].detailParts" :key="partIndex">
          {{ partText(active, 'detailParts', partIndex)
          }}<sup v-if="part.note"
            ><a :href="`#c500-note-${part.note}`">[{{ part.note }}]</a></sup
          >
        </span>
      </p>
      <p v-else>
        {{ itemDetail(active) }}<sup v-for="note in items[active].notes || []" :key="note"
          ><a :href="`#c500-note-${note}`">[{{ note }}]</a></sup
        >
      </p>
    </div>
  </section>
</template>