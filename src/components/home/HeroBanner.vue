<template>
  <section class="hero">
    <div class="hero__bg">
      <img
        src="https://images.unsplash.com/photo-1508615039623-a25605d2b022?w=1920&q=80"
        alt="Drone cleaning"
      />
      <div class="hero__overlay"></div>
    </div>
    <div class="container hero__content">
      <div class="hero__text">
        <h1>{{ t("hero.title") }}</h1>
        <p>{{ t("hero.subtitle") }}</p>
        <div class="hero__buttons">
          <a-button type="primary" size="large" @click="$router.push('/contact')">
            {{ t("hero.cta") }}
          </a-button>
          <a-button size="large" ghost @click="$router.push('/products')">
            {{ t("hero.ctaSecondary") }}
          </a-button>
        </div>
      </div>
      <div class="hero__product-wrapper">
        <img src="/d15r_hero.jpeg" alt="Partdro D15R Cleaning Drone" class="hero__product-img" />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

const { t } = useI18n();
</script>

<style scoped>
.hero {
  position: relative;
  min-height: 600px;
  display: flex;
  align-items: center;
  overflow: hidden;
}
.hero__bg {
  position: absolute;
  inset: 0;
}
.hero__bg img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.hero__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(20, 134, 153, 0.85) 0%, rgba(22, 22, 22, 0.7) 100%);
}
.hero__content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 60px;
  width: 100%;
  padding: 80px 20px;
}
.hero__text {
  flex: 1;
  max-width: 560px;
}
.hero__text h1 {
  font-size: 48px;
  font-weight: 700;
  color: #fff;
  line-height: 1.2;
  margin-bottom: 20px;
}
.hero__text p {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.85);
  margin-bottom: 36px;
  line-height: 1.7;
}
.hero__buttons {
  display: flex;
  gap: 16px;
}
.hero__buttons .ant-btn:not(.ant-btn-primary) {
  border-color: #fff;
  color: #fff;
}
.hero__buttons .ant-btn:not(.ant-btn-primary):hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: #fff;
  color: #fff;
}
.hero__product-wrapper {
  flex-shrink: 0;
  width: 480px;
  display: flex;
  justify-content: center;
}
.hero__product-img {
  max-width: 100%;
  height: auto;
  filter: drop-shadow(0 20px 40px rgba(0, 0, 0, 0.35));
}

@media (max-width: 992px) {
  .hero__content {
    flex-direction: column;
    text-align: center;
    padding: 60px 20px;
  }
  .hero__text h1 {
    font-size: 36px;
  }
  .hero__buttons {
    justify-content: center;
  }
  .hero__product-wrapper {
    width: 100%;
    max-width: 420px;
  }
}
</style>
