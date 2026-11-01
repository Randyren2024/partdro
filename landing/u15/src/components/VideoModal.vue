<script setup>
import { onBeforeUnmount, onMounted } from 'vue'
import { videoOpen } from '../composables/state'

const props = defineProps({
  src: { type: String, required: true },
  poster: { type: String, default: '' },
  labels: {
    type: Object,
    default: () => ({
      dialog: 'Product video',
      title: 'U15 product video',
      close: 'Close video'
    })
  }
})

const emit = defineEmits(['close'])

function onKeydown(event) {
  if (event.key === 'Escape' && videoOpen.value) emit('close')
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Transition name="video-dialog">
    <div
      v-if="videoOpen"
      class="u15-video-modal"
      role="dialog"
      aria-modal="true"
      :aria-label="labels.dialog"
      aria-controls="u15-video-dialog"
      @click.self="emit('close')"
    >
      <div id="u15-video-dialog" class="u15-video-modal__container">
        <video
          :src="props.src"
          :poster="props.poster"
          :aria-label="labels.title"
          controls
          autoplay
          playsinline
        ></video>
        <button type="button" :aria-label="labels.close" @click="emit('close')">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M5 5l14 14M19 5L5 19" />
          </svg>
        </button>
      </div>
    </div>
  </Transition>
</template>
