<template>
  <a-select
    :value="locale"
    size="small"
    style="width: 80px"
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

const { locale } = useI18n()

const changeLang = (val: string) => {
  locale.value = val
  localStorage.setItem('lang', val)
  document.documentElement.lang = val
}
</script>
