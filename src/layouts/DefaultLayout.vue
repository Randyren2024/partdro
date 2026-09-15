<template>
  <div class="default-layout">
    <TopBar />
    <Header />
    <main>
      <router-view />
    </main>
    <Footer />
  </div>
</template>

<script setup lang="ts">
import TopBar from '../components/layout/TopBar.vue'
import Header from '../components/layout/Header.vue'
import Footer from '../components/layout/Footer.vue'
</script>

<style scoped>
.default-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
main {
  flex: 1;
}
</style>
