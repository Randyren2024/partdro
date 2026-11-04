<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps({
  controls: { type: String, required: true },
  label: { type: String, default: 'Page scrollbar' }
})

const viewportHeight = ref(0)
const totalHeight = ref(0)
const position = ref(0)
const pointerNear = ref(false)
const dragging = ref(false)
const hovered = ref(false)

const maxScroll = computed(() => Math.max(0, totalHeight.value - viewportHeight.value))
const thumbHeight = computed(() =>
  Math.min(
    viewportHeight.value,
    Math.max(
      28,
      (viewportHeight.value * viewportHeight.value) / Math.max(1, totalHeight.value)
    )
  )
)
const travel = computed(() => Math.max(1, viewportHeight.value - thumbHeight.value))
const thumbTop = computed(() =>
  maxScroll.value ? Math.max(0, Math.min(1, position.value / maxScroll.value)) * travel.value : 0
)
const scrollPercent = computed(() =>
  maxScroll.value ? Math.round((position.value / maxScroll.value) * 100) : 0
)
const shown = computed(
  () => maxScroll.value > 0 && (dragging.value || hovered.value || pointerNear.value)
)

let positionFrame = 0

function queuePosition() {
  if (positionFrame) return
  positionFrame = requestAnimationFrame(() => {
    positionFrame = 0
    viewportHeight.value = window.innerHeight
    totalHeight.value = document.documentElement.scrollHeight
    position.value = window.scrollY
  })
}

function onPointerMove(event) {
  pointerNear.value = event.clientX >= window.innerWidth - 60
  if (!pointerNear.value && !dragging.value) hovered.value = false
}

function onPointerDown(event) {
  if (!shown.value) return
  dragging.value = true
  hovered.value = true
  const strip = event.currentTarget
  strip.setPointerCapture?.(event.pointerId)
  moveTo(event.clientY)
}

function moveTo(clientY) {
  const ratio = maxScroll.value
    ? Math.max(0, Math.min(1, (clientY - thumbHeight.value / 2) / travel.value))
    : 0
  position.value = ratio * maxScroll.value
  window.scrollTo({ top: position.value, behavior: 'auto' })
}

function onPointerUp() {
  if (!dragging.value) return
  dragging.value = false
  queuePosition()
}

function onWheel() {
  queuePosition()
}

onMounted(() => {
  queuePosition()
  window.addEventListener('wheel', onWheel, { passive: true })
  window.addEventListener('pointermove', onPointerMove, { passive: true })
  window.addEventListener('scroll', queuePosition, { passive: true })
  window.addEventListener('resize', queuePosition)
})

onBeforeUnmount(() => {
  if (positionFrame) cancelAnimationFrame(positionFrame)
  window.removeEventListener('wheel', onWheel)
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('scroll', queuePosition)
  window.removeEventListener('resize', queuePosition)
})
</script>

<template>
  <div
    class="product-scroll-indicator"
    :class="{ 'product-scroll-indicator--visible': shown }"
    role="scrollbar"
    :aria-label="label"
    aria-orientation="vertical"
    :aria-controls="controls"
    :aria-hidden="!shown"
    aria-valuemin="0"
    aria-valuemax="100"
    :aria-valuenow="scrollPercent"
    tabindex="-1"
    @pointerenter="hovered = true"
    @pointerleave="hovered = false"
    @pointerdown="onPointerDown"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
  >
    <div
      class="product-scroll-indicator__thumb"
      :style="{ height: thumbHeight + 'px', transform: `translateY(${thumbTop}px)` }"
    ></div>
  </div>
</template>
