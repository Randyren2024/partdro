<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { reducedMotion, videoOpen } from '../../composables/useC500State'

const props = withDefaults(
  defineProps<{
    image?: string
    video?: string
    alt?: string
    eager?: boolean
    prepare?: boolean
    suspended?: boolean
  }>(),
  {
    image: '',
    video: '',
    alt: '',
    eager: false,
    prepare: false,
    suspended: false
  }
)

const emit = defineEmits<{ ready: [] }>()

const player = ref<HTMLVideoElement | null>(null)
const source = ref<string>('')
const visible = ref<boolean>(false)
const hasFrame = ref<boolean>(false)
const failed = ref<boolean>(false)

const showFallback = computed(
  () => !props.video || reducedMotion.value || (failed.value && !hasFrame.value)
)

let observer: IntersectionObserver | null = null
let visibilityHandler: (() => void) | null = null

function onFrameReady(): void {
  hasFrame.value = true
  emit('ready')
}

function onError(): void {
  failed.value = true
  emit('ready')
}

function syncPlayback(): void {
  const el = player.value
  if (!el) return
  el.muted = true
  const shouldPlay =
    visible.value &&
    !props.suspended &&
    !videoOpen.value &&
    !reducedMotion.value &&
    !document.hidden &&
    !failed.value

  if (!source.value && !reducedMotion.value && !failed.value && (shouldPlay || props.prepare)) {
    source.value = props.video
    nextTick(syncPlayback)
    return
  }

  if (shouldPlay) {
    const attempt = el.play()
    if (attempt && typeof attempt.then === 'function') {
      attempt
        .then(() => {
          if (!visible.value || videoOpen.value || reducedMotion.value || document.hidden) {
            el.pause()
          }
        })
        .catch(() => {})
    }
  } else {
    el.pause()
  }
}

function observe(): void {
  if (!props.video) return
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(
      (entries) => {
        visible.value = entries[0].isIntersecting
        syncPlayback()
      },
      { threshold: 0 }
    )
    const target = player.value?.parentElement || player.value
    if (target) observer.observe(target)
  } else {
    const check = (): void => {
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
  if (props.video) {
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
      :src="image"
      :alt="alt"
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