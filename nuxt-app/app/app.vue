<script setup lang="ts">
import { theme as antdThemeTools, ConfigProvider } from 'ant-design-vue'

const scheme = useColorMode()

const antdTheme = computed(() => {
  const dark = scheme.value === 'dark'
  return {
    algorithm: dark ? antdThemeTools.darkAlgorithm : antdThemeTools.defaultAlgorithm,
    token: {
      colorPrimary: '#1e3d1e',
      fontFamily: 'system-ui, -apple-system, "Segoe UI", Arial, sans-serif',
      borderRadius: 8,
    },
  }
})
</script>

<template>
  <ConfigProvider :theme="antdTheme">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </ConfigProvider>
</template>
