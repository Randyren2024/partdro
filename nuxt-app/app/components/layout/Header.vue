<template>
  <header class="header" :class="{ 'header--scrolled': scrolled }">
    <div class="container header__inner">
      <NuxtLink :to="lp('/')" class="header__logo" aria-label="Partdro home" @click="closeMenu">
        <img src="/droneworld_logo.png" alt="Partdro" width="190" height="46">
      </NuxtLink>

      <nav class="header__nav" :class="{ 'header__nav--open': mobileOpen }" aria-label="Main navigation">
        <div class="header__nav-items">
          <NuxtLink :to="lp('/')" class="header__nav-item" @click="closeMenu">
            {{ t('nav.home') }}
          </NuxtLink>

          <div class="header__dropdown">
            <NuxtLink :to="lp('/products')" class="header__nav-item" @click="closeMenu">
              {{ t('nav.products') }}
            </NuxtLink>
            <div class="header__dropdown-menu">
              <NuxtLink :to="lp('/products')" class="header__dropdown-item" @click="closeMenu">
                {{ t('products.all') }}
              </NuxtLink>
              <NuxtLink
                v-for="cat in CATEGORIES"
                :key="cat"
                :to="{ path: lp('/products'), query: { category: cat } }"
                class="header__dropdown-item"
                @click="closeMenu"
              >
                {{ t(`products.category.${cat}`) }}
              </NuxtLink>
            </div>
          </div>

          <NuxtLink :to="lp('/cases')" class="header__nav-item" @click="closeMenu">{{ t('nav.cases') }}</NuxtLink>
          <NuxtLink :to="lp('/documents')" class="header__nav-item" @click="closeMenu">{{ t('nav.documents') }}</NuxtLink>
          <NuxtLink :to="lp('/news')" class="header__nav-item" @click="closeMenu">{{ t('nav.news') }}</NuxtLink>
          <NuxtLink :to="lp('/about')" class="header__nav-item" @click="closeMenu">{{ t('nav.about') }}</NuxtLink>
          <NuxtLink :to="lp('/contact')" class="header__nav-item" @click="closeMenu">{{ t('nav.contact') }}</NuxtLink>
        </div>
      </nav>

      <div class="header__actions">
        <ThemeToggle />
        <LangSwitcher />
        <NuxtLink :to="lp('/contact')" class="header__contact">
          {{ t('nav.contact') }}
          <RightOutlined />
        </NuxtLink>
        <button
          type="button"
          class="header__mobile-toggle"
          :aria-expanded="mobileOpen"
          aria-controls="partdro-mobile-navigation"
          :aria-label="mobileOpen ? 'Close navigation menu' : 'Open navigation menu'"
          @click="mobileOpen = !mobileOpen"
        >
          <MenuOutlined v-if="!mobileOpen" />
          <CloseOutlined v-else />
        </button>
      </div>
    </div>
    <div
      v-if="mobileOpen"
      id="partdro-mobile-navigation"
      class="header__mobile-panel"
    >
      <NuxtLink :to="lp('/')" @click="closeMenu">{{ t('nav.home') }}</NuxtLink>
      <NuxtLink :to="lp('/products')" @click="closeMenu">{{ t('products.all') }}</NuxtLink>
      <NuxtLink
        v-for="cat in CATEGORIES"
        :key="cat"
        :to="{ path: lp('/products'), query: { category: cat } }"
        class="header__mobile-subitem"
        @click="closeMenu"
      >
        {{ t(`products.category.${cat}`) }}
      </NuxtLink>
      <NuxtLink :to="lp('/cases')" @click="closeMenu">{{ t('nav.cases') }}</NuxtLink>
      <NuxtLink :to="lp('/documents')" @click="closeMenu">{{ t('nav.documents') }}</NuxtLink>
      <NuxtLink :to="lp('/news')" @click="closeMenu">{{ t('nav.news') }}</NuxtLink>
      <NuxtLink :to="lp('/about')" @click="closeMenu">{{ t('nav.about') }}</NuxtLink>
      <NuxtLink :to="lp('/contact')" @click="closeMenu">{{ t('nav.contact') }}</NuxtLink>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { MenuOutlined, CloseOutlined, RightOutlined } from '@ant-design/icons-vue'
import LangSwitcher from '../common/LangSwitcher.vue'
import ThemeToggle from '../common/ThemeToggle.vue'
import { useLocalePath } from '../../composables/useLocalePath'
import type { ProductCategory } from '../../types'

const CATEGORIES: ProductCategory[] = ['agricultural', 'cargo', 'cleaning', 'EVTOL']
const { t } = useI18n()
const route = useRoute()
const lp = useLocalePath()
const scrolled = ref(false)
const mobileOpen = ref(false)

function closeMenu() {
  mobileOpen.value = false
}

function handleScroll() {
  scrolled.value = window.scrollY > 24
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') closeMenu()
}

watch(() => route.fullPath, closeMenu)

onMounted(() => {
  handleScroll()
  window.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 1000;
  min-height: var(--header-height);
  display: flex;
  align-items: center;
  color: var(--pd-ink);
  background: color-mix(in srgb, var(--pd-bg) 90%, transparent);
  border-bottom: 1px solid var(--pd-line);
  -webkit-backdrop-filter: blur(16px);
  backdrop-filter: blur(16px);
  transition: box-shadow .22s ease, background .22s ease;
}
.header--scrolled {
  background: color-mix(in srgb, var(--pd-surface) 94%, transparent);
  box-shadow: 0 10px 32px rgba(8, 35, 40, .08);
}
.dark .header--scrolled {
  box-shadow: 0 10px 32px rgba(0, 0, 0, .24);
}
.header__inner {
  min-height: var(--header-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: clamp(12px, 2vw, 28px);
}
.header__logo {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
}
.header__logo img {
  width: auto;
  height: 42px;
  max-width: 190px;
  object-fit: contain;
}
.header__nav {
  display: flex;
  align-items: center;
  margin-left: auto;
}
.header__nav-items {
  display: flex;
  align-items: center;
  gap: clamp(2px, .4vw, 8px);
}
.header__nav-item {
  display: inline-flex;
  align-items: center;
  min-height: 40px;
  padding: 8px 11px;
  border-radius: 999px;
  color: var(--pd-ink-soft);
  font-size: 13px;
  font-weight: 620;
  white-space: nowrap;
  transition: color .18s ease, background .18s ease;
}
.header__nav-item:hover,
.header__nav-item.router-link-active {
  color: var(--pd-primary);
  background: color-mix(in srgb, var(--pd-primary) 9%, transparent);
}
.header__dropdown {
  position: relative;
}
.header__dropdown-menu {
  position: absolute;
  top: calc(100% + 10px);
  left: 0;
  display: grid;
  gap: 3px;
  min-width: 228px;
  padding: 10px;
  border: 1px solid var(--pd-line);
  border-radius: 16px;
  background: var(--pd-surface-elevated);
  box-shadow: var(--pd-shadow);
  opacity: 0;
  visibility: hidden;
  transform: translateY(6px);
  transition: opacity .16s ease, transform .16s ease, visibility .16s ease;
}
.header__dropdown:hover .header__dropdown-menu,
.header__dropdown:focus-within .header__dropdown-menu {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}
.header__dropdown-item {
  padding: 9px 12px;
  border-radius: 9px;
  color: var(--pd-ink-soft);
  font-size: 13px;
  transition: color .16s ease, background .16s ease;
}
.header__dropdown-item:hover,
.header__dropdown-item.router-link-active {
  color: var(--pd-primary);
  background: var(--pd-bg-soft);
}
.header__actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 0 0 auto;
}
.header__contact {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  padding: 0 17px;
  border-radius: 999px;
  color: var(--pd-on-primary);
  background: var(--pd-primary);
  font-size: 13px;
  font-weight: 700;
  transition: transform .18s ease, background .18s ease;
}
.header__contact:hover {
  color: var(--pd-on-primary);
  background: var(--pd-primary-hover);
  transform: translateY(-1px);
}
.header__mobile-toggle {
  display: none;
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--pd-line);
  border-radius: 999px;
  color: var(--pd-ink);
  background: var(--pd-surface);
  font-size: 18px;
  cursor: pointer;
}
.header__mobile-panel {
  position: absolute;
  top: calc(100% + 1px);
  left: 0;
  right: 0;
  display: grid;
  gap: 2px;
  max-height: calc(100dvh - var(--header-height));
  overflow-y: auto;
  padding: 14px 24px 22px;
  border-bottom: 1px solid var(--pd-line);
  background: var(--pd-bg);
  box-shadow: var(--pd-shadow);
}
.header__mobile-panel a {
  padding: 11px 4px;
  border-bottom: 1px solid var(--pd-line);
  color: var(--pd-ink);
  font-size: 15px;
  font-weight: 620;
}
.header__mobile-panel .header__mobile-subitem {
  padding-left: 22px;
  color: var(--pd-ink-soft);
  font-size: 14px;
  font-weight: 500;
}
@media (max-width: 1120px) {
  .header__nav { display: none; }
  .header__mobile-toggle { display: inline-flex; }
  .header__contact { display: none; }
}
@media (max-width: 480px) {
  .header__inner { width: calc(100% - 28px); }
  .header__logo img { height: 36px; max-width: 150px; }
  .header__actions { gap: 7px; }
  .header__mobile-panel { padding-inline: 18px; }
}

/* Shared header proportions and interaction language from auto_parts. */
.header__inner { gap: clamp(12px, 1.6vw, 24px); }
.header__logo img { height: 32px; max-width: 176px; }
.header__nav-items { gap: clamp(12px, 1.5vw, 24px); }
.header__nav-item {
  min-height: 36px;
  padding: 4px 0;
  border-radius: 0;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: .01em;
  background: transparent !important;
}
.header__nav-item:hover,
.header__nav-item.router-link-active {
  color: var(--pd-ink);
}
.header__contact {
  min-height: 38px;
  padding-inline: 18px;
  font-size: 13px;
  letter-spacing: .01em;
}
.header__dropdown-menu {
  top: calc(100% + 14px);
  min-width: 248px;
  border-radius: 14px;
  padding: 12px;
}
.header__dropdown-item { padding: 9px 12px; }
@media (max-width: 480px) {
  .header__logo img { height: 30px; max-width: 142px; }
}
</style>
