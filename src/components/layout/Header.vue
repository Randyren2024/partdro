<template>
  <header class="header" :class="{ 'header--scrolled': scrolled }">
    <div class="container header__inner">
      <router-link to="/" class="header__logo">
        <img src="/droneworld_logo.png" alt="Partdro" />
      </router-link>

      <nav class="header__nav" :class="{ 'header__nav--open': mobileOpen }">
        <div class="header__nav-items">
          <router-link to="/" class="header__nav-item" @click="mobileOpen = false">
            {{ t("nav.home") }}
          </router-link>

          <div class="header__dropdown">
            <router-link to="/products" class="header__nav-item" @click="mobileOpen = false">
              {{ t("nav.products") }}
            </router-link>
            <div class="header__dropdown-menu">
              <router-link to="/products" class="header__dropdown-item" @click="mobileOpen = false">
                {{ t("products.all") }}
              </router-link>
              <router-link
                v-for="cat in CATEGORIES"
                :key="cat"
                :to="`/products?category=${cat}`"
                class="header__dropdown-item"
                @click="mobileOpen = false"
              >
                {{ t(`products.category.${cat}`) }}
              </router-link>
            </div>
          </div>

          <router-link to="/cases" class="header__nav-item" @click="mobileOpen = false">
            {{ t("nav.cases") }}
          </router-link>
          <router-link to="/documents" class="header__nav-item" @click="mobileOpen = false">
            {{ t("nav.documents") }}
          </router-link>
          <router-link to="/news" class="header__nav-item" @click="mobileOpen = false">
            {{ t("nav.news") }}
          </router-link>
          <router-link to="/about" class="header__nav-item" @click="mobileOpen = false">
            {{ t("nav.about") }}
          </router-link>
          <router-link to="/contact" class="header__nav-item" @click="mobileOpen = false">
            {{ t("nav.contact") }}
          </router-link>
        </div>
      </nav>

      <div class="header__actions">
        <LangSwitcher />
        <router-link to="/contact" class="header__contact">
          {{ t('nav.contact') }}
          <RightOutlined />
        </router-link>
        <div class="header__mobile-toggle" @click="mobileOpen = !mobileOpen">
          <MenuOutlined v-if="!mobileOpen" />
          <CloseOutlined v-else />
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useI18n } from "vue-i18n";
import { MenuOutlined, CloseOutlined, RightOutlined } from "@ant-design/icons-vue";
import LangSwitcher from "../common/LangSwitcher.vue";
import type { ProductCategory } from "../../types";

const CATEGORIES: ProductCategory[] = ["agricultural", "cargo", "cleaning"];

const { t } = useI18n();
const scrolled = ref(false);
const mobileOpen = ref(false);

const handleScroll = () => {
  scrolled.value = window.scrollY > 50;
};

onMounted(() => window.addEventListener("scroll", handleScroll));
onUnmounted(() => window.removeEventListener("scroll", handleScroll));
</script>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.92);
  height: 74px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid rgba(9, 45, 54, 0.08);
  backdrop-filter: blur(16px);
  transition: box-shadow 0.3s, background 0.3s;
}
.header--scrolled {
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 12px 32px rgba(9, 45, 54, 0.08);
}
.header__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}
.header__logo {
  display: flex;
  align-items: center;
  gap: 10px;
}
.header__logo img {
  height: 34px;
}
.header__brand {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-primary);
}
.header__nav {
  display: flex;
  align-items: center;
}
.header__nav-items {
  display: flex;
  align-items: center;
  gap: 2px;
}
.header__nav-item {
  padding: 9px 13px;
  font-size: 13px;
  font-weight: 650;
  color: var(--color-text);
  cursor: pointer;
  transition: color 0.2s;
  white-space: nowrap;
}
.header__nav-item:hover,
.header__nav-item.router-link-active {
  color: var(--color-primary);
}
.header__nav-item.router-link-active { background: rgba(20, 134, 153, 0.08); border-radius: 999px; }
.header__dropdown {
  position: relative;
}
.header__dropdown-menu {
  display: none;
  position: absolute;
  top: 100%;
  left: 0;
  min-width: 180px;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 16px 32px rgba(8, 43, 51, 0.14);
  padding: 8px;
  border: 1px solid rgba(9, 45, 54, 0.08);
}
.header__dropdown:hover .header__dropdown-menu {
  display: block;
}
.header__dropdown-item {
  display: block;
  padding: 9px 20px;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
  white-space: nowrap;
  transition: color 0.2s, background 0.2s;
}
.header__dropdown-item:hover,
.header__dropdown-item.router-link-active {
  color: var(--color-primary);
  background: rgba(0, 0, 0, 0.03);
}
.header__actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
.header__contact { display:inline-flex; align-items:center; gap:7px; padding:10px 15px; border-radius:999px; background:#12343a; color:#fff; font-size:13px; font-weight:700; transition:transform .2s, background .2s; }
.header__contact:hover { color:#fff; background:var(--color-primary); transform:translateY(-1px); }
.header__mobile-toggle {
  display: none;
  font-size: 22px;
  cursor: pointer;
}

@media (max-width: 992px) {
  .header__nav {
    display: none;
    position: fixed;
    top: 74px;
    left: 0;
    right: 0;
    bottom: 0;
    background: #fff;
    flex-direction: column;
    padding: 20px;
    z-index: 999;
    overflow-y: auto;
  }
  .header__nav--open {
    display: flex;
  }
  .header__nav-items {
    flex-direction: column;
    width: 100%;
    gap: 0;
  }
  .header__nav-item {
    width: 100%;
    padding: 14px 16px;
    border-bottom: 1px solid var(--color-border);
  }
  .header__dropdown-menu {
    display: block;
    position: static;
    box-shadow: none;
    border-radius: 0;
    padding: 0;
    min-width: 0;
  }
  .header__dropdown-item {
    padding: 12px 16px 12px 36px;
    border-bottom: 1px solid var(--color-border);
  }
  .header__mobile-toggle {
    display: block;
  }
  .header__contact { display:none; }
}
</style>
