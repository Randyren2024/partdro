<template>
  <div class="d15r-landing">
    <main id="top">
      <!-- Hero -->
      <section class="hero">
        <div class="lp-container hero-wrap">
          <div class="hero-copy">
            <div class="eyebrow hero-kicker" :data-edit-key="'d15r.hero.kicker'">{{ t('d15r.hero.kicker') }}</div>
            <h1 :data-edit-key="'d15r.hero.title1'">{{ t('d15r.hero.title1') }}<span :data-edit-key="'d15r.hero.title2'">{{ t('d15r.hero.title2') }}</span></h1>
            <p class="lead" :data-edit-key="'d15r.hero.lead'">{{ t('d15r.hero.lead') }}</p>
            <div class="btns">
              <a class="btn primary" href="#specs" :data-edit-key="'d15r.hero.ctaPrimary'">{{ t('d15r.hero.ctaPrimary') }}</a>
              <a class="btn secondary" href="mailto:info@partdro.com?subject=D15R%20Cleaning%20Drone%20Inquiry" :data-edit-key="'d15r.hero.ctaSecondary'" @click="trackEvent('generate_lead', { location: 'hero' })">{{ t('d15r.hero.ctaSecondary') }}</a>
            </div>
            <div class="hero-stat-row">
              <div v-for="(s, i) in heroStats" :key="i" class="mini-stat" :data-edit-key="`d15r.hero.stats.${i}`">{{ s }}</div>
            </div>
          </div>
          <div class="hero-media">
            <div class="hero-card"><img :src="imgEdit('page001_img001.png', 'd15r.hero.mainImg')" alt="Partdro D15R multi-functional cleaning drone" data-edit-img="d15r.hero.mainImg" /></div>
            <div class="hero-badge"><strong :data-edit-key="'d15r.hero.badgeTitle'">{{ t('d15r.hero.badgeTitle') }}</strong><span class="muted" :data-edit-key="'d15r.hero.badgeText'">{{ t('d15r.hero.badgeText') }}</span></div>
          </div>
        </div>
      </section>

      <!-- Stat strip -->
      <div class="stat-strip">
        <div class="lp-container stats">
          <div v-for="(s, i) in stripStats" :key="i" class="stat">
            <strong :data-edit-key="`d15r.strip.${i}.value`">{{ s.value }}</strong><span :data-edit-key="`d15r.strip.${i}.label`">{{ s.label }}</span>
          </div>
        </div>
      </div>

      <!-- Performance -->
      <section class="lp-section" id="performance">
        <div class="lp-container">
          <div class="section-head">
            <div class="eyebrow" :data-edit-key="'d15r.why.eyebrow'">{{ t('d15r.why.eyebrow') }}</div>
            <h2 :data-edit-key="'d15r.why.title'">{{ t('d15r.why.title') }}</h2>
            <p class="lead" style="margin-top:18px" :data-edit-key="'d15r.why.lead'">{{ t('d15r.why.lead') }}</p>
          </div>
          <div class="grid lp-feature-grid">
            <article v-for="(c, i) in whyCards" :key="i" class="feature-card">
              <div class="feature-icon">{{ String(i + 1).padStart(2, '0') }}</div>
              <h3 :data-edit-key="`d15r.why.cards.${i}.title`">{{ c.title }}</h3>
              <p :data-edit-key="`d15r.why.cards.${i}.desc`">{{ c.desc }}</p>
            </article>
          </div>
        </div>
      </section>

      <!-- Designed around the task -->
      <section class="lp-section" style="padding-top:20px">
        <div class="lp-container split">
          <div class="media-card"><img :src="imgEdit('page003_img002.png', 'd15r.designed.img')" alt="D15R side view with extended cleaning boom" data-edit-img="d15r.designed.img" /></div>
          <div>
            <div class="eyebrow" :data-edit-key="'d15r.designed.eyebrow'">{{ t('d15r.designed.eyebrow') }}</div>
            <h2 style="margin-top:18px" :data-edit-key="'d15r.designed.title'">{{ t('d15r.designed.title') }}</h2>
            <p class="lead" style="margin-top:18px" :data-edit-key="'d15r.designed.lead'">{{ t('d15r.designed.lead') }}</p>
            <div class="list">
              <div v-for="(item, i) in designedItems" :key="i" class="list-item">
                <div class="num">{{ ['A', 'B', 'C'][i] }}</div>
                <div><strong :data-edit-key="`d15r.designed.items.${i}.title`">{{ item.title }}</strong><p :data-edit-key="`d15r.designed.items.${i}.desc`">{{ item.desc }}</p></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Cleaning output -->
      <section class="lp-section">
        <div class="lp-container metric-grid grid">
          <div class="metric-card">
            <div class="eyebrow" :data-edit-key="'d15r.output.eyebrow'">{{ t('d15r.output.eyebrow') }}</div>
            <div class="big-number">1,000</div>
            <h3 :data-edit-key="'d15r.output.unitTitle'">{{ t('d15r.output.unitTitle') }}</h3>
            <p class="metric-note" style="margin-top:14px" :data-edit-key="'d15r.output.note'">{{ t('d15r.output.note') }}</p>
          </div>
          <div class="metric-card metric-side">
            <div v-for="(r, i) in outputRows" :key="i" class="data-row">
              <span :data-edit-key="`d15r.output.rows.${i}.label`">{{ r.label }}</span><strong :data-edit-key="`d15r.output.rows.${i}.value`">{{ r.value }}</strong>
            </div>
          </div>
        </div>
      </section>

      <!-- Spray patterns -->
      <section class="lp-section" style="padding-top:30px">
        <div class="lp-container">
          <div class="section-head">
            <div class="eyebrow" :data-edit-key="'d15r.spray.eyebrow'">{{ t('d15r.spray.eyebrow') }}</div>
            <h2 :data-edit-key="'d15r.spray.title'">{{ t('d15r.spray.title') }}</h2>
            <p class="lead" style="margin-top:18px" :data-edit-key="'d15r.spray.lead'">{{ t('d15r.spray.lead') }}</p>
          </div>
          <div class="grid nozzle-grid">
            <article v-for="(n, i) in nozzles" :key="i" class="nozzle-card">
              <img :src="imgEdit(nozzleImages[i], `d15r.spray.nozzles.${i}.img`)" :alt="n.angle" :data-edit-img="`d15r.spray.nozzles.${i}.img`" />
              <div class="body"><div class="angle" :data-edit-key="`d15r.spray.nozzles.${i}.angle`">{{ n.angle }}</div><p :data-edit-key="`d15r.spray.nozzles.${i}.desc`">{{ n.desc }}</p></div>
            </article>
          </div>
          <div class="dual">
            <div class="media-card"><img :src="imgEdit('page006_img003.png', 'd15r.spray.dualImg1')" alt="D15R modular side view" data-edit-img="d15r.spray.dualImg1" /></div>
            <div class="media-card"><img :src="imgEdit('page006_img004.png', 'd15r.spray.dualImg2')" alt="D15R dual swinging spray boom configuration" data-edit-img="d15r.spray.dualImg2" /></div>
          </div>
        </div>
      </section>

      <!-- Intelligence -->
      <section class="lp-section" id="intelligence">
        <div class="lp-container route-grid grid">
          <div class="route-image"><img :src="imgEdit('page004_img002.png', 'd15r.intelligence.img')" alt="D15R route planning control interface" data-edit-img="d15r.intelligence.img" /></div>
          <div class="route-copy">
            <div class="eyebrow" :data-edit-key="'d15r.intelligence.eyebrow'">{{ t('d15r.intelligence.eyebrow') }}</div>
            <h2 style="margin-top:18px" :data-edit-key="'d15r.intelligence.title'">{{ t('d15r.intelligence.title') }}</h2>
            <p class="lead" style="margin-top:18px" :data-edit-key="'d15r.intelligence.lead'">{{ t('d15r.intelligence.lead') }}</p>
            <div class="list">
              <div v-for="(item, i) in intelItems" :key="i" class="list-item">
                <div class="num">{{ String(i + 1).padStart(2, '0') }}</div>
                <div><strong :data-edit-key="`d15r.intelligence.items.${i}.title`">{{ item.title }}</strong><p :data-edit-key="`d15r.intelligence.items.${i}.desc`">{{ item.desc }}</p></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Safety -->
      <section class="lp-section safety" id="safety">
        <div class="lp-container">
          <div class="section-head">
            <div class="eyebrow" :data-edit-key="'d15r.safety.eyebrow'">{{ t('d15r.safety.eyebrow') }}</div>
            <h2 :data-edit-key="'d15r.safety.title'">{{ t('d15r.safety.title') }}</h2>
            <p class="lead" style="margin-top:18px" :data-edit-key="'d15r.safety.lead'">{{ t('d15r.safety.lead') }}</p>
          </div>
          <div class="grid safety-grid">
            <article v-for="(c, i) in safetyCards" :key="i" class="safety-card">
              <strong :data-edit-key="`d15r.safety.cards.${i}.title`">{{ c.title }}</strong><p :data-edit-key="`d15r.safety.cards.${i}.desc`">{{ c.desc }}</p>
            </article>
          </div>
        </div>
      </section>

      <!-- Multi-angle -->
      <section class="lp-section">
        <div class="lp-container split">
          <div>
            <div class="eyebrow" :data-edit-key="'d15r.multiangle.eyebrow'">{{ t('d15r.multiangle.eyebrow') }}</div>
            <h2 style="margin-top:18px" :data-edit-key="'d15r.multiangle.title'">{{ t('d15r.multiangle.title') }}</h2>
            <p class="lead" style="margin-top:18px" :data-edit-key="'d15r.multiangle.lead'">{{ t('d15r.multiangle.lead') }}</p>
            <div class="list">
              <div v-for="(item, i) in multiItems" :key="i" class="list-item">
                <div class="num">{{ ['↗', '↔', '＋'][i] }}</div>
                <div><strong :data-edit-key="`d15r.multiangle.items.${i}.title`">{{ item.title }}</strong><p :data-edit-key="`d15r.multiangle.items.${i}.desc`">{{ item.desc }}</p></div>
              </div>
            </div>
          </div>
          <div class="media-card"><img :src="imgEdit('page007_img001.png', 'd15r.multiangle.img')" alt="D15R cleaning a building facade at height" data-edit-img="d15r.multiangle.img" /></div>
        </div>
      </section>

      <!-- Comparison -->
      <section class="lp-section">
        <div class="lp-container">
          <div class="section-head">
            <div class="eyebrow" :data-edit-key="'d15r.compare.eyebrow'">{{ t('d15r.compare.eyebrow') }}</div>
            <h2 :data-edit-key="'d15r.compare.title'">{{ t('d15r.compare.title') }}</h2>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th></th>
                  <th :data-edit-key="'d15r.compare.colD15r'">{{ t('d15r.compare.colD15r') }}</th>
                  <th :data-edit-key="'d15r.compare.colManual'">{{ t('d15r.compare.colManual') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(r, i) in compareRows" :key="i">
                  <td :data-edit-key="`d15r.compare.rows.${i}.label`">{{ r.label }}</td>
                  <td class="positive" :data-edit-key="`d15r.compare.rows.${i}.d15r`">{{ r.d15r }}</td>
                  <td :data-edit-key="`d15r.compare.rows.${i}.manual`">{{ r.manual }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- Applications -->
      <section class="lp-section" id="applications">
        <div class="lp-container">
          <div class="section-head">
            <div class="eyebrow" :data-edit-key="'d15r.applications.eyebrow'">{{ t('d15r.applications.eyebrow') }}</div>
            <h2 :data-edit-key="'d15r.applications.title'">{{ t('d15r.applications.title') }}</h2>
            <p class="lead" style="margin-top:18px" :data-edit-key="'d15r.applications.lead'">{{ t('d15r.applications.lead') }}</p>
          </div>
          <div class="grid case-grid">
            <article
              v-for="(c, i) in caseItems"
              :key="i"
              class="case"
              @click="!editMode && openLightbox(c.img, c.title)"
            >
              <img :src="imgEdit(c.img, `d15r.applications.cases.${i}.img`)" :alt="c.title" :data-edit-img="`d15r.applications.cases.${i}.img`" />
              <div class="body"><span :data-edit-key="`d15r.applications.badges.${c.badge}`">{{ t(`d15r.applications.badges.${c.badge}`) }}</span><h3 :data-edit-key="`d15r.applications.cases.${i}.title`">{{ c.title }}</h3></div>
            </article>
          </div>
        </div>
      </section>

      <!-- Scenarios -->
      <section class="lp-section" style="padding-top:10px">
        <div class="lp-container">
          <div class="grid scenario-grid">
            <article v-for="(s, i) in scenarioItems" :key="i" class="scenario">
              <img :src="imgEdit(s.img, `d15r.scenarios.${i}.img`)" :alt="s.title" :data-edit-img="`d15r.scenarios.${i}.img`" />
              <div class="scenario-body"><h3 :data-edit-key="`d15r.scenarios.${i}.title`">{{ s.title }}</h3><p :data-edit-key="`d15r.scenarios.${i}.desc`">{{ s.desc }}</p></div>
            </article>
          </div>
        </div>
      </section>

      <!-- Specs -->
      <section class="lp-section" id="specs">
        <div class="lp-container">
          <div class="section-head">
            <div class="eyebrow" :data-edit-key="'d15r.specs.eyebrow'">{{ t('d15r.specs.eyebrow') }}</div>
            <h2 :data-edit-key="'d15r.specs.title'">{{ t('d15r.specs.title') }}</h2>
            <p class="lead" style="margin-top:18px" :data-edit-key="'d15r.specs.lead'">{{ t('d15r.specs.lead') }}</p>
          </div>
          <div class="specs">
            <div v-for="(s, i) in specItems" :key="i" class="spec">
              <span :data-edit-key="`d15r.specs.items.${i}.label`">{{ s.label }}</span><strong :data-edit-key="`d15r.specs.items.${i}.value`">{{ s.value }}</strong>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA -->
      <section class="lp-section lp-cta">
        <div class="lp-container">
          <div class="cta-box">
            <div>
              <div class="eyebrow" :data-edit-key="'d15r.cta.eyebrow'">{{ t('d15r.cta.eyebrow') }}</div>
              <h2 style="margin-top:16px" :data-edit-key="'d15r.cta.title'">{{ t('d15r.cta.title') }}</h2>
              <p :data-edit-key="'d15r.cta.text'">{{ t('d15r.cta.text') }}</p>
            </div>
            <div class="btns" style="margin-top:0;min-width:220px">
              <a class="btn primary" href="mailto:info@partdro.com?subject=D15R%20Cleaning%20Drone%20Inquiry" @click="trackEvent('generate_lead', { location: 'cta_box' })">info@partdro.com</a>
              <RouterLink class="btn secondary" to="/" :data-edit-key="'d15r.cta.visit'">{{ t('d15r.cta.visit') }}</RouterLink>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- Lightbox -->
    <div class="lightbox" :class="{ open: !!lightboxSrc }" @click.self="closeLightbox">
      <div class="lightbox-inner">
        <button class="close" aria-label="Close" @click="closeLightbox">×</button>
        <img v-if="lightboxSrc" :src="lightboxSrc" :alt="lightboxAlt" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'
import { imgOverridesByLang } from '../composables/useLandingContent'
import { trackEvent } from '../composables/useTracking'

const auth = useAuthStore()
const { t, locale } = useI18n()

// 编辑模式下禁用 lightbox（点击用于编辑而非放大）
const editMode = computed(() => auth.isLoggedIn)

const IMG_BASE = '/d15r/images/'
const img = (name: string) => IMG_BASE + name

const nozzleImages = ['page005_img001.png', 'page005_img002.png', 'page005_img003.png', 'page005_img004.png']
const caseImages = ['page010_img002.png', 'page011_img002.png', 'page012_img002.png', 'page013_img002.png', 'page009_img001.png', 'page011_img001.png']
const scenarioImages = ['page014_img002.png', 'page014_img001.png', 'page014_img004.png', 'page014_img003.png']

// ====== 图片覆盖（全局 useInlineEdit 通过 imgOverridesByLang 管理） ======
const currentImgOverrides = computed(() => imgOverridesByLang[locale.value as string] ?? {})

// 应用图片覆盖：支持完整 URL、/ 开头路径、或纯文件名
function imgEdit(name: string, key?: string): string {
  if (key && currentImgOverrides.value[key]) {
    const v = currentImgOverrides.value[key]
    if (v.startsWith('http') || v.startsWith('/')) return v
    return img(v)
  }
  return img(name)
}


const heroStats = computed(() => [0, 1, 2].map((i) => t(`d15r.hero.stats.${i}`)))

const stripStats = computed(() =>
  [0, 1, 2, 3, 4].map((i) => ({
    value: t(`d15r.strip.${i}.value`),
    label: t(`d15r.strip.${i}.label`),
  })),
)

const whyCards = computed(() =>
  [0, 1, 2, 3, 4, 5].map((i) => ({
    title: t(`d15r.why.cards.${i}.title`),
    desc: t(`d15r.why.cards.${i}.desc`),
  })),
)

const designedItems = computed(() =>
  [0, 1, 2].map((i) => ({
    title: t(`d15r.designed.items.${i}.title`),
    desc: t(`d15r.designed.items.${i}.desc`),
  })),
)

const outputRows = computed(() =>
  [0, 1, 2, 3, 4].map((i) => ({
    label: t(`d15r.output.rows.${i}.label`),
    value: t(`d15r.output.rows.${i}.value`),
  })),
)

const nozzles = computed(() =>
  [0, 1, 2, 3].map((i) => ({
    angle: t(`d15r.spray.nozzles.${i}.angle`),
    desc: t(`d15r.spray.nozzles.${i}.desc`),
  })),
)

const intelItems = computed(() =>
  [0, 1, 2, 3].map((i) => ({
    title: t(`d15r.intelligence.items.${i}.title`),
    desc: t(`d15r.intelligence.items.${i}.desc`),
  })),
)

const safetyCards = computed(() =>
  [0, 1, 2].map((i) => ({
    title: t(`d15r.safety.cards.${i}.title`),
    desc: t(`d15r.safety.cards.${i}.desc`),
  })),
)

const multiItems = computed(() =>
  [0, 1, 2, 3].map((i) => ({
    title: t(`d15r.multiangle.items.${i}.title`),
    desc: t(`d15r.multiangle.items.${i}.desc`),
  })),
)

const compareRows = computed(() =>
  [0, 1, 2, 3, 4, 5].map((i) => ({
    label: t(`d15r.compare.rows.${i}.label`),
    d15r: t(`d15r.compare.rows.${i}.d15r`),
    manual: t(`d15r.compare.rows.${i}.manual`),
  })),
)

const caseItems = computed(() =>
  [0, 1, 2, 3, 4, 5].map((i) => ({
    img: caseImages[i],
    badge: t(`d15r.applications.cases.${i}.badge`),
    title: t(`d15r.applications.cases.${i}.title`),
  })),
)

const scenarioItems = computed(() =>
  [0, 1, 2, 3].map((i) => ({
    img: scenarioImages[i],
    title: t(`d15r.scenarios.${i}.title`),
    desc: t(`d15r.scenarios.${i}.desc`),
  })),
)

const specItems = computed(() =>
  Array.from({ length: 19 }, (_, i) => ({
    label: t(`d15r.specs.items.${i}.label`),
    value: t(`d15r.specs.items.${i}.value`),
  })),
)

const lightboxSrc = ref('')
const lightboxAlt = ref('')

function openLightbox(name: string, alt?: string) {
  lightboxSrc.value = img(name)
  lightboxAlt.value = alt || 'D15R application image'
}

function closeLightbox() {
  lightboxSrc.value = ''
}
</script>

<style scoped>
/* Root / theme (vars scoped to avoid clashing with global styles) */
.d15r-landing{
  --bg:#070a0c;
  --bg-soft:#0d1215;
  --card:#10171b;
  --line:rgba(255,255,255,.12);
  --text:#f4f7f8;
  --muted:#a8b4b9;
  --accent:#39bfd4;
  --accent-2:#74e6f4;
  --max:1200px;
  --radius:22px;
  --shadow:0 22px 70px rgba(0,0,0,.45);
  font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
  background:var(--bg);
  color:var(--text);
  line-height:1.6;
  overflow-x:hidden;
  position:relative;
}
.d15r-landing::before,
.d15r-landing::after{
  content:"";position:fixed;inset:0;pointer-events:none;z-index:0;
}
.d15r-landing::before{
  opacity:.5;
  background-image:
    linear-gradient(30deg,transparent 49%,rgba(255,255,255,.025) 50%,transparent 51%),
    linear-gradient(-30deg,transparent 49%,rgba(255,255,255,.018) 50%,transparent 51%);
  background-size:180px 104px;
}
.d15r-landing::after{
  background:
    radial-gradient(circle at 80% 0%,rgba(57,191,212,.12),transparent 34%),
    radial-gradient(circle at 10% 55%,rgba(57,191,212,.06),transparent 30%);
}
.d15r-landing > *{position:relative;z-index:1}

a{color:inherit;text-decoration:none}
img{display:block;max-width:100%}
*{box-sizing:border-box;margin:0;padding:0}

.lp-container{width:min(var(--max),calc(100% - 40px));margin:auto}
.eyebrow{display:inline-flex;align-items:center;gap:10px;color:var(--accent);font-size:.78rem;font-weight:800;letter-spacing:.18em;text-transform:uppercase}
.eyebrow::before{content:"";width:26px;height:2px;background:var(--accent);display:block}
.lp-section{padding:110px 0}
.section-head{max-width:850px;margin-bottom:48px}
h1,h2,h3{line-height:1.08}
h1{font-size:clamp(3rem,7vw,6.6rem);letter-spacing:-.05em}
h2{font-size:clamp(2rem,4.2vw,4rem);letter-spacing:-.04em}
h3{font-size:1.25rem}
.lead{font-size:clamp(1.02rem,1.8vw,1.3rem);color:#d3dde0;max-width:780px}
.muted{color:var(--muted)}
.grid{display:grid;gap:22px}
.btns{display:flex;flex-wrap:wrap;gap:14px;margin-top:32px}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;border:1px solid var(--line);border-radius:999px;padding:13px 20px;font-weight:800;transition:.25s ease;cursor:pointer}
.btn.primary{background:var(--accent);color:#001115;border-color:var(--accent)}
.btn.secondary{background:rgba(255,255,255,.03)}
.btn:hover{transform:translateY(-2px);border-color:rgba(255,255,255,.28)}
.btn.primary:hover{background:var(--accent-2)}

/* Hero */
.hero{min-height:calc(100vh - 76px);display:flex;align-items:center;position:relative;padding:80px 0 64px}
.hero-wrap{display:grid;grid-template-columns:1.02fr .98fr;gap:48px;align-items:center}
.hero-copy{position:relative;z-index:2}
.hero h1 span{color:var(--accent);display:block}
.hero-copy .lead{margin-top:24px}
.hero-kicker{margin-bottom:22px}
.hero-stat-row{display:flex;flex-wrap:wrap;gap:10px;margin-top:28px}
.mini-stat{border:1px solid var(--line);background:rgba(255,255,255,.025);padding:9px 13px;border-radius:13px;color:#dce7e9;font-size:.82rem}
.hero-media{position:relative}
.hero-card{background:#f1f3f4;border-radius:28px;padding:18px;box-shadow:var(--shadow);transform:rotate(1deg);position:relative;overflow:hidden}
.hero-card::after{content:"";position:absolute;inset:auto -15% -38% 15%;height:60%;background:radial-gradient(circle,rgba(57,191,212,.18),transparent 65%)}
.hero-card img{width:100%;border-radius:18px;position:relative;z-index:1}
.hero-badge{position:absolute;left:-24px;bottom:30px;z-index:3;background:rgba(15,22,25,.92);border:1px solid var(--line);box-shadow:var(--shadow);border-radius:18px;padding:14px 16px;max-width:240px}
.hero-badge strong{display:block;font-size:1.1rem;color:var(--accent)}

/* Stat strip */
.stat-strip{border-top:1px solid var(--line);border-bottom:1px solid var(--line);background:rgba(255,255,255,.018)}
.stats{display:grid;grid-template-columns:repeat(5,1fr)}
.stat{padding:27px 18px;border-right:1px solid var(--line)}
.stat:last-child{border-right:0}
.stat strong{display:block;font-size:1.75rem;letter-spacing:-.03em}
.stat span{display:block;margin-top:3px;color:var(--muted);font-size:.8rem}

/* Feature cards */
.lp-feature-grid{grid-template-columns:repeat(3,1fr)}
.feature-card{background:linear-gradient(180deg,rgba(255,255,255,.035),rgba(255,255,255,.018));border:1px solid var(--line);border-radius:var(--radius);padding:28px;min-height:220px}
.feature-icon{width:42px;height:42px;border:1px solid rgba(57,191,212,.38);color:var(--accent);border-radius:12px;display:grid;place-items:center;margin-bottom:24px;font-weight:900}
.feature-card p{color:var(--muted);margin-top:10px;font-size:.94rem}

/* Split */
.split{display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center}
.media-card{background:var(--card);border:1px solid var(--line);border-radius:26px;padding:10px;overflow:hidden;box-shadow:var(--shadow)}
.media-card img{width:100%;height:auto;border-radius:18px}
.list{display:grid;gap:16px;margin-top:28px}
.list-item{display:grid;grid-template-columns:34px 1fr;gap:14px}
.num{width:34px;height:34px;border-radius:10px;border:1px solid var(--line);display:grid;place-items:center;color:var(--accent);font-weight:900;font-size:.84rem}
.list-item p{color:var(--muted);font-size:.92rem;margin-top:3px}

/* Metrics */
.metric-grid{grid-template-columns:1.15fr .85fr}
.metric-card{border:1px solid var(--line);border-radius:26px;background:linear-gradient(135deg,rgba(57,191,212,.10),rgba(255,255,255,.02));padding:34px;position:relative;overflow:hidden}
.metric-card::after{content:"";position:absolute;width:300px;height:300px;right:-120px;top:-130px;border-radius:50%;border:1px solid rgba(57,191,212,.17)}
.big-number{font-size:clamp(3.6rem,8vw,7.4rem);line-height:.9;color:var(--accent);font-weight:900;letter-spacing:-.08em;margin:18px 0}
.metric-note{font-size:.96rem;color:#d3dde0;max-width:600px}
.metric-side{display:grid;gap:14px}
.data-row{display:flex;justify-content:space-between;gap:20px;padding:18px 0;border-bottom:1px solid var(--line)}
.data-row strong{font-size:1.2rem}
.data-row span{color:var(--muted);text-align:right}

/* Nozzles */
.nozzle-grid{grid-template-columns:1fr 1fr}
.nozzle-card{background:#0b1013;border:1px solid var(--line);border-radius:26px;overflow:hidden}
.nozzle-card img{width:100%;aspect-ratio:1.5/1;object-fit:contain;background:#0a0d0f}
.nozzle-card .body{padding:22px}
.angle{color:var(--accent);font-weight:900;font-size:.82rem;letter-spacing:.1em;text-transform:uppercase}
.nozzle-card p{color:var(--muted);margin-top:6px;font-size:.92rem}
.dual{margin-top:22px;display:grid;grid-template-columns:1.1fr .9fr;gap:22px;align-items:stretch}

/* Intelligence */
.route-grid{grid-template-columns:1.1fr .9fr;align-items:stretch}
.route-copy{display:flex;flex-direction:column;justify-content:center}
.route-image{min-height:420px;display:flex;align-items:center;justify-content:center;background:#0b1114;border-radius:26px;border:1px solid var(--line);overflow:hidden}
.route-image img{width:100%;height:100%;object-fit:cover}

/* Safety */
.safety{background:linear-gradient(135deg,rgba(57,191,212,.08),rgba(255,255,255,.02));border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.safety-grid{grid-template-columns:repeat(3,1fr)}
.safety-card{border:1px solid var(--line);border-radius:20px;padding:24px;background:rgba(0,0,0,.12)}
.safety-card strong{display:block;margin-bottom:6px}
.safety-card p{color:var(--muted);font-size:.92rem}

/* Comparison table */
.table-wrap{overflow:auto;border:1px solid var(--line);border-radius:22px;background:#0b1013}
table{width:100%;border-collapse:collapse;min-width:760px}
th,td{padding:18px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top;font-size:.9rem}
th{color:#d5e0e2;background:rgba(255,255,255,.03);font-size:.8rem;text-transform:uppercase;letter-spacing:.08em}
td:first-child{color:#fff;font-weight:800;width:22%}
tr:last-child td{border-bottom:0}
.positive{color:#dcfbff}

/* Cases */
.case-grid{grid-template-columns:repeat(3,1fr)}
.case{border:1px solid var(--line);border-radius:20px;overflow:hidden;background:var(--card);cursor:zoom-in}
.case img{width:100%;aspect-ratio:1.52/1;object-fit:cover;transition:transform .35s ease}
.case:hover img{transform:scale(1.035)}
.case .body{padding:18px}
.case .body span{font-size:.72rem;color:var(--accent);font-weight:800;text-transform:uppercase;letter-spacing:.14em}
.case .body h3{margin-top:5px}

/* Scenarios */
.scenario-grid{grid-template-columns:repeat(4,1fr)}
.scenario{position:relative;min-height:310px;border-radius:22px;overflow:hidden;border:1px solid var(--line);background:#0c1114}
.scenario img{width:100%;height:100%;object-fit:cover;position:absolute;inset:0;opacity:.72;transition:.35s ease}
.scenario::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 35%,rgba(0,0,0,.86))}
.scenario:hover img{transform:scale(1.04);opacity:.9}
.scenario-body{position:absolute;left:18px;right:18px;bottom:16px;z-index:2}
.scenario-body p{margin-top:2px;color:#c2ced2;font-size:.84rem}

/* Specs */
.specs{display:grid;grid-template-columns:1fr 1fr;border:1px solid var(--line);border-radius:26px;overflow:hidden;background:#0b1013}
.spec{display:flex;justify-content:space-between;gap:25px;padding:18px 22px;border-bottom:1px solid var(--line);border-right:1px solid var(--line)}
.spec:nth-child(2n){border-right:0}
.spec:nth-last-child(-n+2){border-bottom:0}
.spec span{color:var(--muted);font-size:.9rem}
.spec strong{text-align:right;font-size:.9rem}

/* CTA */
.lp-cta{padding-bottom:120px}
.cta-box{border:1px solid rgba(57,191,212,.3);background:radial-gradient(circle at 80% 20%,rgba(57,191,212,.13),transparent 30%),rgba(255,255,255,.025);border-radius:32px;padding:58px;display:flex;justify-content:space-between;gap:35px;align-items:center}
.cta-box p{color:var(--muted);max-width:650px;margin-top:10px}

/* Lightbox */
.lightbox{position:fixed;inset:0;background:rgba(0,0,0,.88);display:none;place-items:center;padding:28px;z-index:100}
.lightbox.open{display:grid}
.lightbox-inner{max-width:1200px;width:100%;position:relative}
.lightbox img{width:100%;max-height:85vh;object-fit:contain;border-radius:14px}
.close{position:absolute;right:0;top:-44px;background:transparent;border:0;color:#fff;font-size:2rem;cursor:pointer}

@media (max-width: 980px){
  .hero-wrap,.split,.metric-grid,.route-grid{grid-template-columns:1fr}
  .hero{padding-top:55px}
  .hero-media{max-width:780px;margin:0 auto;width:100%}
  .stats{grid-template-columns:repeat(2,1fr)}
  .stat:nth-child(3),.stat:nth-child(5){border-right:0}
  .stat:nth-child(-n+3){border-bottom:1px solid var(--line)}
  .lp-feature-grid,.case-grid,.safety-grid{grid-template-columns:1fr 1fr}
  .scenario-grid{grid-template-columns:1fr 1fr}
  .specs{grid-template-columns:1fr}
  .spec{border-right:0}
  .spec:nth-last-child(-n+2){border-bottom:1px solid var(--line)}
  .spec:last-child{border-bottom:0}
  .cta-box{padding:42px}
}
@media (max-width: 640px){
  .lp-container{width:min(var(--max),calc(100% - 28px))}
  .lp-section{padding:76px 0}
  .lp-feature-grid,.case-grid,.safety-grid,.scenario-grid,.nozzle-grid{grid-template-columns:1fr}
  .stats{grid-template-columns:1fr 1fr}
  .stat{padding:20px 12px}
  .stat strong{font-size:1.35rem}
  .dual{grid-template-columns:1fr}
  .hero-badge{position:static;margin-top:14px}
  .hero-card{transform:none}
  .cta-box{flex-direction:column;align-items:flex-start;padding:30px}
  .btns{width:100%}
  .btn{width:100%}
  table{min-width:680px}
}
</style>
