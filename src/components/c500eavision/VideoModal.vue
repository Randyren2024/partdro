<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { videoOpen } from '../../composables/useC500State'
import { parseVideoUrl } from '../../composables/useVideo'

const props = defineProps<{
  src: string
}>()

const emit = defineEmits<{ close: [] }>()

const { t } = useI18n()
const player = ref<HTMLVideoElement | null>(null)

// 支持 MP4 直链 + YouTube / Bilibili 链接（CMS 覆盖后用户可能填任一形式）
const parsed = computed(() => parseVideoUrl(props.src))
const embedSrc = computed(() => {
  const p = parsed.value
  if (!p || p.type === 'file') return ''
  // YouTube embed 追加自动播放参数；Bilibili 已带 autoplay=0
  return p.type === 'youtube' ? `${p.url}?autoplay=1&rel=0` : p.url
})

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && videoOpen.value) emit('close')
}

watch(
  () => videoOpen.value,
  (open) => {
    if (open) {
      const el = player.value
      if (el) {
        el.currentTime = 0
        const attempt = el.play()
        if (attempt && typeof attempt.catch === 'function') attempt.catch(() => {})
      }
    } else if (player.value) {
      player.value.pause()
    }
  }
)

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Transition name="video-dialog">
    <div
      v-if="videoOpen"
      class="c500-video-modal"
      role="dialog"
      aria-modal="true"
      :aria-label="t('c500eavision.hero.videoDialog')"
      aria-controls="c500-video-dialog"
      @click.self="emit('close')"
    >
      <div id="c500-video-dialog" class="c500-video-modal__container">
        <iframe
          v-if="embedSrc"
          :src="embedSrc"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowfullscreen
        ></iframe>
        <video v-else ref="player" :src="props.src" controls autoplay playsinline loop></video>
        <button type="button" :aria-label="t('c500eavision.hero.closeVideo')" @click="emit('close')">
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <path d="M5 5l14 14M19 5L5 19" />
          </svg>
        </button>
      </div>
    </div>
  </Transition>
</template>