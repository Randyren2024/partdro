<template>
  <header class="header" :class="{ 'header--scrolled': scrolled }">
    <div class="container header__inner">
      <NuxtLink :to="lp('/')" class="header__logo" aria-label="Partdro home" @click="closeMenu">
        <img src="/partdro_logo_white.png" alt="Partdro" width="164" height="32">
        <span class="header__brand-divider" aria-hidden="true"></span>
        <span class="header__brand-label">DRONE WORLD</span>
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
const { t } = useI18n({ useScope: 'global' })
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
/* Global navigation follows the U15 landing-page header: restrained, dark,
   translucent, fixed above the hero, with a compact white conversion CTA. */
.header {
  position: fixed;
  inset: 0 0 auto;
  z-index: 1000;
  width: 100%;
  min-height: 74px;
  display: flex;
  align-items: center;
  color: #f4f5f6;
  background: linear-gradient(180deg, rgba(6, 7, 8, .94), rgba(6, 7, 8, .72));
  border-bottom: 1px solid rgba(255, 255, 255, .07);
  -webkit-backdrop-filter: blur(14px);
  backdrop-filter: blur(14px);
  transition: background .2s ease, border-color .2s ease;
}
.header--scrolled {
  background: rgba(6, 7, 8, .94);
  border-bottom-color: rgba(255, 255, 255, .11);
}
.header__inner {
  width: min(1200px, calc(100% - 48px));
  min-height: 74px;
  margin-inline: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}
.header__logo {
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  gap: 14px;
  min-width: 0;
  color: #fff;
  text-decoration: none;
}
.header__logo img {
  display: block;
  width: auto;
  height: 24px;
  max-width: 164px;
  object-fit: contain;
}
.header__brand-divider {
  width: 1px;
  height: 22px;
  flex: none;
  background: #4a4a4a;
}
.header__brand-label {
  color: #b4b4b5;
  font-size: 10px;
  font-weight: 650;
  letter-spacing: .15em;
  white-space: nowrap;
}
.header__nav {
  display: flex;
  align-items: center;
  margin-left: auto;
}
.header__nav-items {
  display: flex;
  align-items: center;
  gap: clamp(12px, 1.45vw, 24px);
}
.header__nav-item {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0;
  color: #d6d6d7;
  background: transparent;
  border-radius: 0;
  font-size: 13px;
  font-weight: 550;
  letter-spacing: .01em;
  white-space: nowrap;
  text-decoration: none;
  transition: color .18s ease;
}
.header__nav-item:hover,
.header__nav-item.router-link-active {
  color: #fff;
  background: transparent;
}
.header__dropdown { position: relative; }
.header__dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  left: -14px;
  display: grid;
  gap: 3px;
  min-width: 224px;
  padding: 8px;
  border: 1px solid #3a3a3a;
  border-radius: 10px;
  background: #1c1c1e;
  box-shadow: 0 14px 34px rgba(0, 0, 0, .45);
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
  border-radius: 6px;
  color: #d6d6d7;
  font-size: 13px;
  text-decoration: none;
}
.header__dropdown-item:hover,
.header__dropdown-item.router-link-active {
  color: #fff;
  background: #2c2c2e;
}
.header__actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 0 0 auto;
}
.header__actions :deep(.language-select .ant-select-selector) {
  min-height: 32px !important;
  padding-inline: 10px !important;
  border: 1px solid #4a4a4a !important;
  border-radius: 999px !important;
  color: #d6d6d7 !important;
  background: rgba(255,255,255,.025) !important;
  box-shadow: none !important;
}
.header__actions :deep(.language-select .ant-select-selection-item) {
  color: #d6d6d7 !important;
  font-size: 11px;
}
.header__actions :deep(.ant-select-arrow) { color: #b4b4b5; }
.header__actions :deep(.theme-toggle) {
  width: 32px;
  height: 32px;
  border-color: #4a4a4a;
  color: #d6d6d7;
  background: rgba(255,255,255,.025);
}
.header__actions :deep(.theme-toggle:hover) {
  border-color: #8a8a8a;
  color: #fff;
}
.header__contact {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 36px;
  padding: 0 17px;
  border: 0;
  border-radius: 999px;
  color: #080808;
  background: #fff;
  font-size: 13px;
  font-weight: 650;
  white-space: nowrap;
  text-decoration: none;
  transition: opacity .2s ease, transform .2s ease;
}
.header__contact:hover {
  color: #080808;
  background: #fff;
  opacity: .86;
  transform: translateY(-1px);
}
.header__mobile-toggle {
  display: none;
  width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
  border: 1px solid #4a4a4a;
  border-radius: 50%;
  color: #fff;
  background: rgba(255,255,255,.04);
  font-size: 17px;
  cursor: pointer;
}
.header__mobile-panel {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  display: grid;
  gap: 0;
  max-height: calc(100dvh - 74px);
  overflow-y: auto;
  padding: 12px max(24px, calc((100vw - 1200px) / 2)) 20px;
  border-bottom: 1px solid #333;
  background: rgba(12, 13, 15, .98);
  box-shadow: 0 18px 34px rgba(0,0,0,.4);
}
.header__mobile-panel a {
  padding: 12px 2px;
  border-bottom: 1px solid rgba(255,255,255,.09);
  color: #d6d6d7;
  font-size: 14px;
  text-decoration: none;
}
.header__mobile-panel a:hover { color: #fff; }
.header__mobile-panel .header__mobile-subitem {
  padding-left: 20px;
  color: #aeb4b8;
  font-size: 13px;
}
@media (max-width: 1180px) {
  .header__nav { display: none; }
  .header__mobile-toggle { display: inline-flex; }
}
@media (max-width: 640px) {
  .header, .header__inner { min-height: 64px; }
  .header__inner { width: calc(100% - 32px); gap: 12px; }
  .header__logo { gap: 9px; }
  .header__logo img { height: 21px; max-width: 132px; }
  .header__brand-divider { height: 18px; }
  .header__brand-label { font-size: 8px; letter-spacing: .1em; }
  .header__actions { gap: 6px; }
  .header__actions :deep(.theme-toggle) { width: 30px; height: 30px; }
  .header__contact { display: none; }
  .header__mobile-panel { max-height: calc(100dvh - 64px); padding-inline: 18px; }
}
@media (prefers-reduced-motion: reduce) {
  .header, .header__nav-item, .header__contact { transition: none; }
}
</style>
