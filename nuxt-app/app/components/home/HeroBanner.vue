<template>
  <section class="hero">
    <div class="hero__bg">
      <img
        :src="imgEdit('https://images.unsplash.com/photo-1508615039623-a25605d2b022?w=1920&q=80', 'hero.bgImg')"
        alt="Drone cleaning"
        data-edit-img="hero.bgImg"
      />
      <div class="hero__overlay"></div>
    </div>
    <div class="container hero__content">
      <div class="hero__text">
        <div class="hero__eyebrow"><span></span> INDUSTRIAL DRONE SYSTEMS</div>
        <h1 :data-edit-key="'hero.title'">{{ t("hero.title") }}</h1>
        <p :data-edit-key="'hero.subtitle'">{{ t("hero.subtitle") }}</p>
        <div class="hero__buttons">
          <a-button type="primary" size="large" @click="$router.push('/contact')">
            <span :data-edit-key="'hero.cta'">{{ t("hero.cta") }}</span>
          </a-button>
          <a-button size="large" ghost @click="$router.push('/products')">
            <span :data-edit-key="'hero.ctaSecondary'">{{ t("hero.ctaSecondary") }}</span>
          </a-button>
        </div>
        <div class="hero__proof"><span>RTK PRECISION</span><span>GLOBAL DELIVERY</span><span>24/7 SUPPORT</span></div>
      </div>
      <div class="hero__product-wrapper">
        <img :src="imgEdit('/d15r_hero.jpeg', 'hero.productImg')" alt="Partdro D15R Cleaning Drone" class="hero__product-img" data-edit-img="hero.productImg" />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { imgOverridesByLang } from "../../composables/useLandingContent";

const { t, locale } = useI18n();

// 通用图片覆盖：key 命中则用覆盖值（完整 URL / / 路径 / 纯文件名）
function imgEdit(defaultSrc: string, key: string): string {
  const overrides = imgOverridesByLang[locale.value as string] || {};
  const v = overrides[key];
  if (!v) return defaultSrc;
  if (v.startsWith("http") || v.startsWith("/")) return v;
  return `/d15r/images/${v}`;
}
</script>

<style scoped>
.hero {
  position: relative;
  min-height: min(760px, 100vh);
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
  background: linear-gradient(90deg, rgba(12, 14, 15, .94) 0%, rgba(20, 23, 24, .82) 46%, rgba(20, 23, 24, .28) 100%);
}
.hero__bg::after { content:""; position:absolute; inset:0; background:radial-gradient(circle at 77% 45%, rgba(232, 93, 42, .22), transparent 28%); mix-blend-mode:screen; }
.hero::after { content:""; position:absolute; right:5%; top:17%; width:34vw; height:34vw; border:1px solid rgba(255, 154, 112, .18); border-radius:50%; pointer-events:none; }
.hero__content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 44px;
  width: 100%;
  padding: 96px 20px 88px;
}
.hero__text {
  flex: 1;
  max-width: 630px;
}
.hero__eyebrow { display:flex; align-items:center; gap:10px; color:#ffb08f; font-size:11px; font-weight:800; letter-spacing:.18em; margin-bottom:20px; }
.hero__eyebrow span { width:36px; height:2px; background:#e85d2a; }
.hero__text h1 {
  font-size: clamp(3rem, 5vw, 5.2rem);
  font-weight: 760;
  color: #fff;
  line-height: 1.2;
  margin-bottom: 22px;
  letter-spacing: -.055em;
}
.hero__text p {
  font-size: 19px;
  color: rgba(255, 255, 255, 0.85);
  margin-bottom: 36px;
  line-height: 1.7;
}
.hero__buttons {
  display: flex;
  gap: 16px;
}
.hero__buttons :deep(.ant-btn) { height:48px; padding:0 23px; border-radius:999px; font-weight:700; box-shadow:none; }
.hero__buttons :deep(.ant-btn-primary) { background:#e85d2a !important; border-color:#6dd2d0 !important; color:#ffffff !important; }
.hero__proof { display:flex; gap:18px; flex-wrap:wrap; margin-top:35px; color:rgba(255,255,255,.72); font-size:10px; font-weight:750; letter-spacing:.13em; }
.hero__proof span { display:flex; align-items:center; gap:7px; }
.hero__proof span::before { content:""; width:5px; height:5px; border-radius:50%; background:var(--pd-primary); }
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
  width: min(39vw, 540px);
  display: flex;
  justify-content: center;
}
.hero__product-img {
  max-width: 100%;
  height: auto;
  filter: drop-shadow(0 28px 55px rgba(0, 0, 0, 0.48));
  animation: float 6s ease-in-out infinite;
}
@keyframes float { 50% { transform:translateY(-11px); } }

@media (max-width: 992px) {
  .hero__content {
    flex-direction: column;
    text-align: center;
    padding: 60px 20px;
  }
  .hero::after { width:65vw; height:65vw; right:-20%; }
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
@media (max-width:576px) { .hero__proof { justify-content:center; gap:11px; } .hero__proof span { font-size:9px; } }
</style>
