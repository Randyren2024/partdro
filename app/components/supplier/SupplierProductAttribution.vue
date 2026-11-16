<template>
  <aside v-if="profile" class="supplier-attribution">
    <span>{{ label }}</span>
    <NuxtLink :to="lp('/suppliers/company/' + profile.slug)">
      {{ profile.displayName[localeKey] }}
      <span aria-hidden="true">→</span>
    </NuxtLink>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLocalePath } from '~/composables/useLocalePath'
import { getSupplierProfileByProductSlug } from '~/data/supplier-profiles'

const props = defineProps<{ productSlug: string }>()
const { locale } = useI18n()
const lp = useLocalePath()
const localeKey = computed(() => (['de', 'es', 'fr'].includes(locale.value) ? locale.value : 'en') as 'en' | 'de' | 'es' | 'fr')
const profile = computed(() => getSupplierProfileByProductSlug(props.productSlug))
const labels: Record<string, string> = {
  en: 'Company catalogue',
  de: 'Unternehmenskatalog',
  es: 'Catálogo de la empresa',
  fr: 'Catalogue de l’entreprise',
}
const label = computed(() => labels[localeKey.value])
</script>

<style scoped>
.supplier-attribution {
  display:flex;
  flex-wrap:wrap;
  align-items:center;
  justify-content:space-between;
  gap:10px 18px;
  max-width:1180px;
  margin:28px auto 42px;
  padding:16px 20px;
  border:1px solid var(--pd-line, rgba(255,255,255,.14));
  border-radius:14px;
  color:var(--pd-ink-muted, #aab2b8);
  background:var(--pd-surface, #171c20);
  font-size:13px;
}
.supplier-attribution a { color:var(--pd-primary, #ff8a4c); font-weight:700; text-decoration:none; }
.supplier-attribution a:hover { text-decoration:underline; }
</style>
