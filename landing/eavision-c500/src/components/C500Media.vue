<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { reducedMotion, videoOpen } from '../composables/state'

const props = defineProps({
  image: { type: String, default: '' },
  video: { type: String, default: '' },
  alt: { type: String, default: '' },
  width: { type: Number, default: undefined },
  height: { type: Number, default: undefined },
  eager: { type: Boolean, default: false },
  prepare: { type: Boolean, default: false },
  suspended: { type: Boolean, default: false }
})

const emit = defineEmits(['ready'])

const player = ref(null)
const source = ref('')
const visible = ref(false)
const hasFrame = ref(false)
const failed = ref(false)

const saveData =
  typeof navigator !== 'undefined' && navigator.connection?.saveData === true

const showFallback = computed(
  () => !props.video || saveData || reducedMotion.value || (failed.value && !hasFrame.value)
)

let observer = null
let visibilityHandler = null

function onFrameReady() {
  hasFrame.value = true
  emit('ready')
}

function onError() {
  failed.value = true
  emit('ready')
}

function syncPlayback() {
  const el = player.value
  if (!el) return
  el.muted = true
  const shouldPlay =
    visible.value &&
    !props.suspended &&
    !videoOpen.value &&
    !reducedMotion.value &&
    !saveData &&
    !document.hidden &&
    !failed.value

  if (
    !source.value &&
    !reducedMotion.value &&
    !saveData &&
    !failed.value &&
    (shouldPlay || props.prepare)
  ) {
    source.value = props.video
    nextTick(syncPlayback)
    return
  }

  if (shouldPlay) {
    const attempt = el.play()
    if (attempt && typeof attempt.then === 'function') {
      attempt
        .then(() => {
          if (
            !visible.value ||
            videoOpen.value ||
            reducedMotion.value ||
            saveData ||
            document.hidden
          ) {
            el.pause()
          }
        })
        .catch(() => {})
    }
  } else {
    el.pause()
  }
}

function observe() {
  if (!props.video) return
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(
      (entries) => {
        visible.value = entries[0].isIntersecting
        syncPlayback()
      },
      { threshold: 0 }
    )
    observer.observe(player.value?.parentElement || player.value)
  } else {
    const check = () => {
      const rect = player.value?.parentElement?.getBoundingClientRect()
      if (!rect) return
      visible.value =
        rect.bottom > 0 &&
        rect.top < window.innerHeight &&
        rect.right > 0 &&
        rect.left < window.innerWidth
      syncPlayback()
    }
    visibilityHandler = check
    window.addEventListener('scroll', check, { passive: true })
    window.addEventListener('resize', check)
    check()
  }
}

onMounted(() => {
  if (props.video && !saveData) {
    nextTick(() => {
      observe()
      syncPlayback()
    })
    document.addEventListener('visibilitychange', syncPlayback)
  }
})

watch(() => videoOpen.value, syncPlayback)
watch(() => reducedMotion.value, syncPlayback)
watch(() => props.suspended, syncPlayback)

onBeforeUnmount(() => {
  if (observer) observer.disconnect()
  if (visibilityHandler) {
    window.removeEventListener('scroll', visibilityHandler)
    window.removeEventListener('resize', visibilityHandler)
  }
  document.removeEventListener('visibilitychange', syncPlayback)
  const el = player.value
  if (el) {
    el.pause()
    el.removeAttribute('src')
    el.load()
  }
})
</script>

<template>
  <div class="c500-media" :class="{ 'has-frame': hasFrame, 'show-fallback': showFallback }">
    <img
      v-if="image && showFallback"
      ref="fallback"
      :src="image"
      :alt="alt"
      :width="width"
      :height="height"
      :loading="eager ? 'eager' : 'lazy'"
      :fetchpriority="eager ? 'high' : 'auto'"
      decoding="async"
      draggable="false"
      @load="emit('ready')"
      @error="emit('ready')"
    />
    <video
      v-if="video"
      ref="player"
      :src="source || null"
      :poster="image || null"
      muted
      loop
      playsinline
      :preload="prepare ? 'auto' : 'none'"
      aria-hidden="true"
      @loadeddata="onFrameReady"
      @playing="onFrameReady"
      @error="onError"
    ></video>
  </div>
</template>
