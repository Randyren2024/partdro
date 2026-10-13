<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <nav :aria-label="t('c500eavision.nav.aria')" class="product-nav">
    <div class="product-nav__inner">
      <a href="#c500-top" class="product-nav__name">C-500</a>
      <div class="product-nav__links">
        <a href="#c500-top">{{ t('c500eavision.nav.intro') }}</a>
        <a href="#c500-specs">{{ t('c500eavision.nav.specs') }}</a>
      </div>
    </div>
  </nav>
</template>