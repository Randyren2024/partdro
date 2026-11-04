<script setup>
import { logo, logoSize } from '../data/media'
import { CONTACT_EMAIL, CONTACT_PHONE, WHATSAPP_E164 } from '../lib/contact'
import { localePath } from '../lib/i18n'

const props = defineProps({
  content: { type: Object, required: true },
  whatsappAria: { type: String, default: 'WhatsApp' },
  locale: { type: String, required: true }
})

const year = new Date().getFullYear()
const whatsappHref = `https://wa.me/${WHATSAPP_E164}`
</script>

<template>
  <footer class="site-footer">
    <div class="site-footer__inner">
      <div class="site-footer__brand">
        <img :src="logo" :width="logoSize.width" :height="logoSize.height" alt="Partdro" loading="lazy" decoding="async" />
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
        <a :href="localePath(locale, '/solutions/heavy-lift-logistics')">{{ content.solutions }}</a>
        <a :href="localePath(locale, '/products/c500-delivery-drone')">{{ content.c500Product }}</a>
        <a :href="localePath(locale, '/about')">{{ content.about }}</a>
        <a :href="localePath(locale, '/contact')">{{ content.contact }}</a>
      </div>
    </div>

    <div class="site-footer__legal">
      <p>{{ content.legal }}</p>
      <p>© {{ year }} {{ content.copyright }}</p>
    </div>
  </footer>
</template>
