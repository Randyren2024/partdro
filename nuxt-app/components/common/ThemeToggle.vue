<script setup lang="ts">
import { computed } from 'vue'
import { MoonOutlined, SunOutlined } from '@ant-design/icons-vue'

const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')
const label = computed(() => isDark.value ? 'Switch to light theme' : 'Switch to dark theme')

function toggleTheme() {
  colorMode.preference = isDark.value ? 'light' : 'dark'
}
</script>

<template>
  <button
    type="button"
    class="theme-toggle"
    :aria-label="label"
    :aria-pressed="isDark"
    :title="label"
    @click="toggleTheme"
  >
    <SunOutlined v-if="isDark" />
    <MoonOutlined v-else />
  </button>
</template>

<style scoped>
.theme-toggle {
  display: inline-flex;
  width: 38px;
  height: 38px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--pd-line);
  border-radius: 999px;
  color: var(--pd-ink-soft);
  background: var(--pd-surface);
  cursor: pointer;
  transition: color .18s ease, border-color .18s ease, transform .18s ease, background .18s ease;
}
.theme-toggle:hover {
  color: var(--pd-primary);
  border-color: var(--pd-primary);
  transform: translateY(-1px);
}
</style>
