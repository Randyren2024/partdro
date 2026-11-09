<script setup>
import { computed } from 'vue'
import { logo, logoSize } from '../data/media'
import { LOCALES, LOCALE_LABELS, localePath } from '../lib/i18n'

const props = defineProps({
  content: { type: Object, required: true },
  locale: { type: String, required: true },
  search: { type: String, default: '' }
})

const languages = computed(() =>
  LOCALES.map((code) => ({
    code,
    label: LOCALE_LABELS[code],
    href: `${localePath(code, '/products/u15-multi-mission-drone')}${props.search}`
  }))
)
</script>

<template>
  <header class="product-nav site-header">
    <div class="product-nav__inner">
      <a :href="localePath(locale, '/')" class="site-header__brand" :aria-label="content.homeAria">
        <img :src="logo" :width="logoSize.width" :height="logoSize.height" alt="Partdro" decoding="async" />
        <span class="site-header__divider" aria-hidden="true"></span>
        <span class="product-nav__name">U15</span>
      </a>

      <div class="site-header__links">
        <nav :aria-label="content.aria" class="site-header__anchors">
          <a href="#u15-overview">{{ content.overview }}</a>
          <a href="#u15-autonomy">{{ content.autonomy }}</a>
          <a href="#u15-specs">{{ content.specs }}</a>
          <a href="#u15-quote">{{ content.quote }}</a>
        </nav>

        <details class="site-header__lang">
          <summary :aria-label="content.languageAria">
            <span>{{ content.language }}</span>
            <strong>{{ LOCALE_LABELS[locale] }}</strong>
          </summary>
          <div class="site-header__lang-menu">
            <a
              v-for="item in languages"
              :key="item.code"
              :href="item.href"
              :lang="item.code"
              :aria-current="item.code === locale ? 'page' : undefined"
            >
              {{ item.label }}
            </a>
          </div>
        </details>

        <a class="site-header__cta" href="#u15-quote">{{ content.requestQuote }}</a>
      </div>
    </div>
  </header>
</template>
