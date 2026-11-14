<script setup lang="ts">
import { theme as antdThemeTools, ConfigProvider } from 'ant-design-vue'

const colorMode = useColorMode()

// Keep the document language synchronized with the active /de, /es and /fr route.
// A hard-coded htmlAttrs.lang in nuxt.config overrides locale-aware SEO metadata.
const localeHead = useLocaleHead({ addDirAttribute: true, addSeoAttributes: false })
useHead(() => ({ htmlAttrs: localeHead.value.htmlAttrs }))

useHead({
  meta: [{
    name: 'theme-color',
    content: computed(() => colorMode.value === 'dark' ? '#101315' : '#f5f4f0'),
  }],
})

const antdTheme = computed(() => {
  const dark = colorMode.value === 'dark'
  const primary = dark ? '#ff6a1a' : '#e85d2a'

  return {
    algorithm: dark ? antdThemeTools.darkAlgorithm : antdThemeTools.defaultAlgorithm,
    token: {
      colorPrimary: primary,
      colorPrimaryHover: dark ? '#ff8b45' : '#c9481b',
      colorPrimaryActive: dark ? '#c84b0b' : '#aa3915',
      colorInfo: primary,
      colorSuccess: dark ? '#72d4a0' : '#237b58',
      colorWarning: dark ? '#ffad72' : '#b86a2b',
      colorError: dark ? '#ff8585' : '#c74747',
      colorBgLayout: dark ? '#060708' : '#f5f4f0',
      colorBgContainer: dark ? '#101418' : '#ffffff',
      colorBgElevated: dark ? '#14181d' : '#ffffff',
      colorFillAlter: dark ? 'rgba(255,255,255,.045)' : 'rgba(23,26,28,.035)',
      colorFillSecondary: dark ? 'rgba(255,255,255,.07)' : 'rgba(23,26,28,.05)',
      colorText: dark ? '#f4f5f6' : '#171a1c',
      colorTextHeading: dark ? '#f4f5f6' : '#14282d',
      colorTextSecondary: dark ? '#9ba3a9' : '#73797a',
      colorTextTertiary: dark ? 'rgba(243,242,239,.58)' : 'rgba(23,26,28,.52)',
      colorBorder: dark ? 'rgba(255,255,255,.18)' : 'rgba(23,26,28,.14)',
      colorBorderSecondary: dark ? 'rgba(255,255,255,.09)' : 'rgba(23,26,28,.09)',
      colorSplit: dark ? 'rgba(255,255,255,.10)' : 'rgba(23,26,28,.08)',
      colorLink: primary,
      colorLinkHover: dark ? '#ffb066' : '#c9481b',
      fontFamily: '"Barlow", system-ui, -apple-system, "Segoe UI", Arial, sans-serif',
      fontSize: 14,
      fontSizeSM: 12,
      fontSizeLG: 16,
      fontSizeHeading1: 44,
      fontSizeHeading2: 34,
      fontSizeHeading3: 27,
      fontWeightStrong: 700,
      lineHeight: 1.6,
      lineHeightHeading1: 1.04,
      lineHeightHeading2: 1.08,
      lineHeightHeading3: 1.12,
      borderRadius: 12,
      borderRadiusSM: 8,
      borderRadiusLG: 20,
      controlHeight: 44,
      controlHeightLG: 50,
      controlOutline: dark ? 'rgba(255,106,26,.24)' : 'rgba(232,93,42,.16)',
      controlOutlineWidth: 3,
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
