<script setup>
import { onBeforeUnmount, onMounted } from 'vue'
import { videoOpen } from '../composables/state'

const props = defineProps({
  src: { type: String, required: true },
  labels: {
    type: Object,
    default: () => ({
      dialog: 'Product video',
      title: 'C500 product video',
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
      class="c500-video-modal"
      role="dialog"
      aria-modal="true"
      :aria-label="labels.dialog"
      aria-controls="c500-video-dialog"
      @click.self="emit('close')"
    >
      <div id="c500-video-dialog" class="c500-video-modal__container">
        <iframe
          :src="props.src"
          :title="labels.title"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerpolicy="strict-origin-when-cross-origin"
          allowfullscreen
        ></iframe>
        <button type="button" :aria-label="labels.close" @click="emit('close')">
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
