<template>
  <main v-if="supplier && profile" class="supplier-detail">
    <section class="page-header">
      <div class="container">
        <NuxtLink class="back-link" :to="lp('/suppliers')">{{ copy.back }}</NuxtLink>
        <p class="supplier-eyebrow">DRONEWORLD COMPANY PROFILE</p>
        <h1>{{ supplier.name }}</h1>
        <p class="supplier-brand">{{ profile.displayName[localeKey] }}</p>
        <p class="supplier-location">{{ supplier.province }} · {{ supplier.city }} · {{ supplier.district }}</p>
        <p class="supplier-address">{{ profile.address }} · {{ copy.founded }} {{ profile.foundedYear }}</p>
        <p class="supplier-intro">{{ profile.description[localeKey] }}</p>
        <div class="supplier-actions">
          <a :href="profile.website" target="_blank" rel="noopener noreferrer">{{ copy.website }} ↗</a>
          <span>{{ copy.verified }}: {{ profile.verifiedAt }}</span>
        </div>
      </div>
    </section>

    <section class="page-section">
      <div class="container">
        <div class="section-heading">
          <p class="supplier-eyebrow">{{ copy.catalogue }}</p>
          <h2>{{ copy.familiesTitle }}</h2>
        </div>
        <div class="family-grid">
          <article v-for="family in profile.families" :key="family.id" class="family-card">
            <h3>{{ family.title[localeKey] }}</h3>
            <p>{{ family.summary[localeKey] }}</p>
            <div class="model-list">
              <template v-for="model in family.items" :key="model">
                <NuxtLink v-if="findLinkedProduct(model)" :to="lp('/products/' + findLinkedProduct(model)!.slug)" class="model-pill model-pill--linked">{{ model }} ↗</NuxtLink>
                <span v-else class="model-pill">{{ model }}</span>
              </template>
            </div>
          </article>
        </div>

        <div class="section-heading linked-heading">
          <p class="supplier-eyebrow">{{ copy.existingProducts }}</p>
          <h2>{{ copy.linkedTitle }}</h2>
          <p>{{ copy.linkedIntro }}</p>
        </div>
        <div class="linked-products">
          <article v-for="product in profile.linkedProducts" :key="product.slug" class="linked-product">
            <div class="linked-product__meta">{{ product.model }}</div>
            <h3>{{ product.names[localeKey] }}</h3>
            <NuxtLink :to="lp('/products/' + product.slug)">{{ copy.viewProduct }} →</NuxtLink>
            <a :href="product.sourceUrl" target="_blank" rel="noopener noreferrer">{{ product.sourceType === 'official_product' ? copy.officialSource : copy.catalogueSource }} ↗</a>
          </article>
        </div>

        <section class="source-panel">
          <h2>{{ copy.sourcesTitle }}</h2>
          <ul>
            <li v-for="source in profile.sources" :key="source.url">
              <a :href="source.url" target="_blank" rel="noopener noreferrer">{{ source.label }} ↗</a>
              <span>{{ source.type === 'official_product' ? copy.productSource : copy.companySource }}</span>
            </li>
          </ul>
          <p>{{ copy.disclaimer }}</p>
        </section>
      </div>
    </section>
  </main>
  <main v-else class="supplier-detail"><div class="container"><h1>Company not found</h1></div></main>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLocalePath } from '~/composables/useLocalePath'
import { SUPPLIERS } from '~/data/supplier-directory'
import { getSupplierProfile } from '~/data/supplier-profiles'
import { DEFAULT_LOCALE } from '~/i18n'

const route = useRoute()
const { locale } = useI18n()
const lp = useLocalePath()
const profile = getSupplierProfile(String(route.params.slug))
const supplier = profile ? SUPPLIERS.find((item) => item.id === profile.supplierId) : undefined
if (!supplier || !profile) throw createError({ statusCode: 404, statusMessage: 'Supplier not found' })

function findLinkedProduct(model: string) {
  return profile.linkedProducts.find((product) => product.model === model || (product.model === 'C15' && model.startsWith('C15')))
}

const localeKey = computed(() => (['de', 'es', 'fr'].includes(locale.value) ? locale.value : 'en') as 'en' | 'de' | 'es' | 'fr')
const copy = computed(() => ({
  back: ({ en: '← All suppliers', de: '← Alle Anbieter', es: '← Todos los proveedores', fr: '← Tous les fournisseurs' })[localeKey.value],
  website: ({ en: 'Official website', de: 'Offizielle Website', es: 'Sitio web oficial', fr: 'Site officiel' })[localeKey.value],
  founded: ({ en: 'Founded', de: 'Gegründet', es: 'Fundada en', fr: 'Fondée en' })[localeKey.value],
  verified: ({ en: 'Sources checked', de: 'Quellen geprüft', es: 'Fuentes verificadas', fr: 'Sources vérifiées' })[localeKey.value],
  catalogue: ({ en: 'OFFICIAL PRODUCT RANGE', de: 'OFFIZIELLES PRODUKTPORTFOLIO', es: 'GAMA OFICIAL DE PRODUCTOS', fr: 'GAMME DE PRODUITS OFFICIELLE' })[localeKey.value],
  familiesTitle: ({ en: 'Product families', de: 'Produktfamilien', es: 'Familias de productos', fr: 'Familles de produits' })[localeKey.value],
  existingProducts: ({ en: 'ALREADY IN THE PARTDRO CATALOGUE', de: 'BEREITS IM PARTDRO-KATALOG', es: 'YA EN EL CATÁLOGO DE PARTDRO', fr: 'DÉJÀ DANS LE CATALOGUE PARTDRO' })[localeKey.value],
  linkedTitle: ({ en: 'Products with existing detail pages', de: 'Produkte mit vorhandenen Detailseiten', es: 'Productos con páginas de detalle existentes', fr: 'Produits avec pages détaillées existantes' })[localeKey.value],
  linkedIntro: ({ en: 'These entries connect the company catalogue to existing Partdro product records. No duplicate product records or new product URLs are created.', de: 'Diese Einträge verbinden den Unternehmenskatalog mit bestehenden Partdro-Produktdatensätzen. Es werden keine doppelten Produktdatensätze oder neuen Produkt-URLs erstellt.', es: 'Estas entradas conectan el catálogo de la empresa con registros de productos existentes de Partdro. No se crean registros duplicados ni nuevas URL de productos.', fr: 'Ces entrées relient le catalogue de l’entreprise aux fiches produits Partdro existantes. Aucun doublon ni nouvelle URL produit n’est créé.' })[localeKey.value],
  viewProduct: ({ en: 'View product', de: 'Produkt ansehen', es: 'Ver producto', fr: 'Voir le produit' })[localeKey.value],
  officialSource: ({ en: 'Official product page', de: 'Offizielle Produktseite', es: 'Página oficial del producto', fr: 'Page produit officielle' })[localeKey.value],
  catalogueSource: ({ en: 'Official catalogue', de: 'Offizieller Katalog', es: 'Catálogo oficial', fr: 'Catalogue officiel' })[localeKey.value],
  sourcesTitle: ({ en: 'Sources and verification', de: 'Quellen und Überprüfung', es: 'Fuentes y verificación', fr: 'Sources et vérification' })[localeKey.value],
  productSource: ({ en: 'Official product page', de: 'Offizielle Produktseite', es: 'Página oficial del producto', fr: 'Page produit officielle' })[localeKey.value],
  companySource: ({ en: 'Official company source', de: 'Offizielle Unternehmensquelle', es: 'Fuente oficial de la empresa', fr: 'Source officielle de l’entreprise' })[localeKey.value],
  disclaimer: ({ en: 'Product names and ranges are transcribed from the company’s official catalogue. Technical specifications are shown on individual product pages and should be checked against the latest manufacturer documentation before procurement. Directory listing does not imply a commercial partnership or endorsement.', de: 'Produktnamen und Sortimente stammen aus dem offiziellen Unternehmenskatalog. Technische Daten auf den einzelnen Produktseiten sollten vor einer Beschaffung anhand der neuesten Herstellerunterlagen geprüft werden. Der Verzeichniseintrag bedeutet keine Geschäfts- oder Partnerschaft.', es: 'Los nombres y gamas de productos se transcriben del catálogo oficial de la empresa. Antes de comprar, compruebe las especificaciones de cada producto con la documentación más reciente del fabricante. La inclusión en el directorio no implica una asociación comercial ni respaldo.', fr: 'Les noms et gammes de produits sont repris du catalogue officiel de l’entreprise. Avant tout achat, vérifiez les caractéristiques des fiches produits avec la documentation fabricant la plus récente. La présence dans l’annuaire ne signifie ni partenariat commercial ni recommandation.' })[localeKey.value],
}))

const siteUrl = useRuntimeConfig().public.siteUrl || 'https://www.droneworld.tech'
const path = '/suppliers/company/' + profile.slug
const canonical = computed(() => siteUrl + lp(path))
const localePaths = ['en', 'de', 'es', 'fr']
const alternates = localePaths.map((language) => ({
  rel: 'alternate',
  hreflang: language,
  href: siteUrl + (language === DEFAULT_LOCALE ? path : '/' + language + path),
}))

useHead(() => ({
  title: profile.displayName[localeKey.value] + ' | UAV Company Profile | Droneworld.tech',
  titleTemplate: '%s',
  htmlAttrs: { lang: locale.value },
  link: [
    { rel: 'canonical', href: canonical.value },
    ...alternates,
    { rel: 'alternate', hreflang: 'x-default', href: siteUrl + path },
  ],
  meta: [
    { name: 'description', content: profile.description[localeKey.value] },
    { name: 'robots', content: 'index, follow, max-image-preview:large' },
    { property: 'og:type', content: 'profile' },
    { property: 'og:title', content: profile.displayName[localeKey.value] + ' | UAV Company Profile' },
    { property: 'og:description', content: profile.description[localeKey.value] },
    { property: 'og:url', content: canonical.value },
  ],
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: profile.displayName[localeKey.value],
      alternateName: supplier.name,
      foundingDate: String(profile.foundedYear),
      url: profile.website,
      address: {
        '@type': 'PostalAddress',
        streetAddress: profile.address,
        addressLocality: supplier.city,
        addressRegion: supplier.province,
        addressCountry: 'CN',
      },
      sameAs: [profile.website],
      subjectOf: profile.sources.map((source) => source.url),
    }),
  }],
}))
</script>

<style scoped>
.back-link { display:inline-flex; margin-bottom:22px; color:rgba(255,255,255,.72); font-size:13px; text-decoration:none; }
.supplier-eyebrow { margin:0 0 14px; color:#ff8a4c; font-size:11px; font-weight:750; letter-spacing:.2em; }
.supplier-brand { margin:8px 0 0; color:var(--pd-primary); font-size:14px; font-weight:700; }
.supplier-location { margin:12px 0 4px; color:rgba(255,255,255,.65); font-size:13px; }
.supplier-address { margin:0; color:rgba(255,255,255,.58); font-size:12px; }
.supplier-intro { max-width:850px; color:rgba(255,255,255,.82); font-size:17px; line-height:1.8; }
.supplier-actions { display:flex; flex-wrap:wrap; gap:16px 24px; align-items:center; margin-top:24px; color:rgba(255,255,255,.62); font-size:12px; }
.supplier-actions a { color:#ff9a62; font-weight:700; }
.section-heading { margin:0 0 24px; }
.section-heading h2 { margin:0; color:var(--pd-ink); font-size:clamp(26px,3vw,38px); }
.section-heading > p:last-child { max-width:800px; color:var(--pd-ink-muted); line-height:1.7; }
.family-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr)); gap:18px; }
.family-card,.linked-product { padding:24px; border:1px solid var(--pd-line); border-radius:var(--pd-radius-lg); background:var(--pd-surface); box-shadow:var(--pd-shadow-sm); }
.family-card h3,.linked-product h3 { margin:0 0 12px; color:var(--pd-ink); font-size:19px; }
.family-card p { min-height:88px; color:var(--pd-ink-soft); font-size:14px; line-height:1.75; }
.model-list { display:flex; flex-wrap:wrap; gap:8px; }
.model-pill { display:inline-flex; align-items:center; padding:6px 10px; border:1px solid var(--pd-line); border-radius:999px; color:var(--pd-ink-muted); font-size:12px; text-decoration:none; }
.model-pill--linked { border-color:color-mix(in srgb,var(--pd-primary) 40%,var(--pd-line)); color:var(--pd-primary); font-weight:700; }
.model-pill--linked:hover { background:color-mix(in srgb,var(--pd-primary) 9%,var(--pd-surface)); }
.linked-heading { margin-top:64px; }
.linked-products { display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,250px),1fr)); gap:16px; }
.linked-product { display:flex; flex-direction:column; align-items:flex-start; min-height:190px; }
.linked-product__meta { margin-bottom:12px; color:var(--pd-primary); font-size:12px; font-weight:800; }
.linked-product h3 { margin-bottom:20px; }
.linked-product a { margin-top:auto; color:var(--pd-primary); font-size:13px; font-weight:700; text-decoration:none; }
.linked-product a + a { margin-top:12px; color:var(--pd-ink-muted); font-weight:600; }
.source-panel { margin-top:56px; padding:26px; border:1px solid var(--pd-line); border-radius:var(--pd-radius-lg); background:var(--pd-bg-soft); }
.source-panel h2 { color:var(--pd-ink); font-size:22px; }
.source-panel ul { display:grid; gap:12px; padding-left:20px; }
.source-panel li { color:var(--pd-ink-soft); }
.source-panel li a { color:var(--pd-primary); font-weight:650; }
.source-panel li span { display:block; margin-top:3px; color:var(--pd-ink-muted); font-size:12px; }
.source-panel > p { margin:20px 0 0; color:var(--pd-ink-muted); font-size:12px; line-height:1.8; }
@media(max-width:640px) { .family-card,.linked-product,.source-panel { padding:19px; } .family-card p { min-height:0; } }
</style>
