<template>
  <div class="cases-page">
    <div class="page-header">
      <div class="container">
        <h1>{{ t('cases.title') }}</h1>
        <p>{{ t('cases.subtitle') }}</p>
      </div>
    </div>
    <div class="page-section">
      <div class="container">
        <div class="cases__grid">
          <div class="cases__card" v-for="c in cases" :key="c.slug">
            <div class="cases__card-image">
              <img :src="c.image_url" :alt="c.title" />
            </div>
            <div class="cases__card-body">
              <h3>{{ c.title }}</h3>
              <p><EnvironmentOutlined /> {{ c.location }}</p>
              <p class="cases__desc">{{ c.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { EnvironmentOutlined } from '@ant-design/icons-vue'
import { useCases } from '~/composables/useSupabase'

const { t } = useI18n()
const { data: cases } = useCases()
</script>

<style scoped>

.cases__grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:clamp(18px,2.2vw,28px); }
.cases__card { min-width:0; overflow:hidden; border:1px solid var(--pd-line); border-radius:var(--pd-radius-lg); background:var(--pd-surface); box-shadow:var(--pd-shadow-sm); transition:transform .22s ease,border-color .22s ease,box-shadow .22s ease; }
.cases__card:hover { transform:translateY(-4px); border-color:color-mix(in srgb,var(--pd-primary) 40%,var(--pd-line)); box-shadow:var(--pd-shadow); }
.cases__card-image { height:clamp(190px,20vw,250px); overflow:hidden; background:var(--pd-bg-soft); }
.cases__card-image img { display:block; width:100%; height:100%; object-fit:cover; transition:transform .45s ease; }
.cases__card:hover .cases__card-image img { transform:scale(1.04); }
.cases__card-body { padding:22px 24px 24px; }
.cases__card-body h3 { margin:0 0 10px; color:var(--pd-ink); font-family:var(--pd-font-display); font-size:21px; font-weight:700; line-height:1.2; }
.cases__card-body p { display:flex; align-items:flex-start; gap:8px; margin:0 0 10px; color:var(--pd-ink-muted); font-size:13px; line-height:1.6; }
.cases__card-body p .anticon { flex:0 0 auto; margin-top:3px; color:var(--pd-primary); }
.cases__card-body .cases__desc { display:block; margin:12px 0 0; color:var(--pd-ink-soft); font-size:14px; line-height:1.75; }
@media(max-width:992px) { .cases__grid { grid-template-columns:repeat(2,minmax(0,1fr)); } }
@media(max-width:640px) { .cases__grid { grid-template-columns:1fr; } .cases__card-image { height:220px; } }

</style>
