<script setup lang="ts">
import { theme as antdThemeTools, ConfigProvider } from 'ant-design-vue'

const colorMode = useColorMode()

const antdTheme = computed(() => {
  const dark = colorMode.value === 'dark'
  const primary = dark ? '#64c9c5' : '#087f8c'

  return {
    algorithm: dark ? antdThemeTools.darkAlgorithm : antdThemeTools.defaultAlgorithm,
    token: {
      colorPrimary: primary,
      colorPrimaryHover: dark ? '#83ded8' : '#056b76',
      colorPrimaryActive: dark ? '#43aaa7' : '#064a54',
      colorInfo: primary,
      colorSuccess: dark ? '#72d4a0' : '#237b58',
      colorWarning: dark ? '#ffad72' : '#b86a2b',
      colorError: dark ? '#ff8585' : '#c74747',
      colorBgLayout: dark ? '#101719' : '#f5f7f6',
      colorBgContainer: dark ? '#1a2529' : '#ffffff',
      colorBgElevated: dark ? '#202d31' : '#ffffff',
      colorFillAlter: dark ? 'rgba(255,255,255,.045)' : 'rgba(20,40,45,.035)',
      colorFillSecondary: dark ? 'rgba(255,255,255,.07)' : 'rgba(20,40,45,.05)',
      colorText: dark ? '#eef4f2' : '#14282d',
      colorTextHeading: dark ? '#eef4f2' : '#14282d',
      colorTextSecondary: dark ? '#afbfbe' : '#5f7479',
      colorTextTertiary: dark ? 'rgba(238,244,242,.58)' : 'rgba(20,40,45,.52)',
      colorBorder: dark ? 'rgba(235,247,244,.16)' : 'rgba(20,40,45,.14)',
      colorBorderSecondary: dark ? 'rgba(235,247,244,.10)' : 'rgba(20,40,45,.09)',
      colorSplit: dark ? 'rgba(235,247,244,.10)' : 'rgba(20,40,45,.08)',
      colorLink: primary,
      colorLinkHover: dark ? '#83ded8' : '#056b76',
      fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Arial, sans-serif',
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
      controlOutline: dark ? 'rgba(100,201,197,.2)' : 'rgba(8,127,140,.16)',
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
