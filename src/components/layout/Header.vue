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
import { MenuOutlined, CloseOutlined } from "@ant-design/icons-vue";
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
  background: #fff;
  height: var(--header-height);
  display: flex;
  align-items: center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  transition: box-shadow 0.3s;
}
.header--scrolled {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
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
  height: 40px;
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
  gap: 4px;
}
.header__nav-item {
  padding: 8px 16px;
  font-size: 15px;
  font-weight: 500;
  color: var(--color-text);
  cursor: pointer;
  transition: color 0.2s;
  white-space: nowrap;
}
.header__nav-item:hover,
.header__nav-item.router-link-active {
  color: var(--color-primary);
}
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
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  padding: 8px 0;
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
  gap: 16px;
}
.header__mobile-toggle {
  display: none;
  font-size: 22px;
  cursor: pointer;
}

@media (max-width: 992px) {
  .header__nav {
    display: none;
    position: fixed;
    top: var(--header-height);
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
}
</style>
