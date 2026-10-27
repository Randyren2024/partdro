<script setup>
import { computed } from 'vue'
import { logo, logoSize } from '../data/media'
import { CONTACT_EMAIL, CONTACT_PHONE, LANDING_PATH, WHATSAPP_E164 } from '../lib/contact'
import { LOCALES, LOCALE_LABELS, localePath } from '../lib/i18n'

const props = defineProps({
  content: { type: Object, required: true },
  whatsappAria: { type: String, default: 'WhatsApp' },
  locale: { type: String, required: true },
  search: { type: String, default: '' }
})

const year = new Date().getFullYear()

const languages = computed(() =>
  LOCALES.map((code) => ({
    code,
    label: LOCALE_LABELS[code],
    href: `${localePath(code, LANDING_PATH)}${props.search}`
  }))
)

const whatsappHref = `https://wa.me/${WHATSAPP_E164}`
</script>

<template>
  <footer class="site-footer">
    <div class="site-footer__inner">
      <div class="site-footer__brand">
        <img
          :src="logo"
          :width="logoSize.width"
          :height="logoSize.height"
          alt="Partdro"
          loading="lazy"
          decoding="async"
        />
        <p>{{ content.description }}</p>
      </div>

      <div class="site-footer__col">
        <h2>{{ content.contactHeading }}</h2>
        <a :href="`mailto:${CONTACT_EMAIL}`">{{ content.emailLabel }}: {{ CONTACT_EMAIL }}</a>
        <a :href="whatsappHref" rel="noopener" target="_blank" :aria-label="whatsappAria">
          {{ content.phoneLabel }}: {{ CONTACT_PHONE }}
        </a>
      </div>

      <div class="site-footer__col">
        <h2>{{ content.exploreHeading }}</h2>
        <a :href="localePath(locale, '/products')">{{ content.products }}</a>
        <a :href="localePath(locale, '/about')">{{ content.about }}</a>
        <a :href="localePath(locale, '/contact')">{{ content.contact }}</a>
      </div>

      <div class="site-footer__col">
        <h2>{{ content.languageHeading }}</h2>
        <div class="site-footer__languages">
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
      </div>
    </div>

    <div class="site-footer__legal">
      <p>{{ content.legal }}</p>
      <p>© {{ year }} {{ content.copyright }}</p>
    </div>
  </footer>
</template>
