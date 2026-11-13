<template>
  <a-select
    :value="locale"
    aria-label="Select language"
    class="language-select"
    size="small"
    style="width: 76px"
    @change="changeLang"
  >
    <a-select-option value="en">EN</a-select-option>
    <a-select-option value="es">ES</a-select-option>
    <a-select-option value="de">DE</a-select-option>
    <a-select-option value="fr">FR</a-select-option>
  </a-select>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { DEFAULT_LOCALE, isLocale } from '../../i18n'
import { stripLocalePrefix, withLocalePrefix } from '../../composables/useLocalePath'

const { locale } = useI18n()
const route = useRoute()
const router = useRouter()

// 切换语言 = 跳到该语言的可抓取 URL（英语回根路径），而不是只改 localStorage，
// 这样每种语言都有独立 URL，便于收录与分享。
const changeLang = (val: string) => {
  const next = isLocale(val) ? val : DEFAULT_LOCALE
  const target = withLocalePrefix(stripLocalePrefix(route.path), next)
  locale.value = next
  localStorage.setItem('lang', next)
  document.documentElement.lang = next
  router.push({ path: target, query: route.query })
}
</script>