import { ref } from 'vue'

// C500 备用落地页的共享状态（源 state.js 的 TS 化版本）
export const reducedMotion = ref(false)
export const motionReady = ref(false)
export const videoOpen = ref(false)