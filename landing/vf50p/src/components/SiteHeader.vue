<script setup>
import { logo, logoSize } from '../data/media'
import { localePath } from '../lib/i18n'

const props = defineProps({
  content: { type: Object, required: true },
  locale: { type: String, required: true }
})
</script>

<template>
  <header class="product-nav site-header">
    <div class="product-nav__inner">
      <a :href="localePath(locale, '/')" class="site-header__brand" :aria-label="content.homeAria">
        <img :src="logo" :width="logoSize.width" :height="logoSize.height" alt="Partdro" decoding="async" />
        <span class="site-header__divider" aria-hidden="true"></span>
        <span class="product-nav__name">VF50P</span>
      </a>

      <div class="site-header__links">
        <nav :aria-label="content.aria" class="site-header__anchors">
          <a href="#vf50p-overview">{{ content.overview }}</a>
          <a href="#vf50p-architecture">{{ content.architecture }}</a>
          <a href="#vf50p-endurance">{{ content.endurance }}</a>
          <a href="#vf50p-specs">{{ content.specs }}</a>
          <a href="#vf50p-quote">{{ content.quote }}</a>
        </nav>
        <a class="site-header__cta" href="#vf50p-quote">{{ content.requestQuote }}</a>
      </div>
    </div>
  </header>
</template>
