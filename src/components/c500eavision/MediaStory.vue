<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import C500Media from './C500Media.vue'
import { powerMetrics, type Story } from '../../data/c500eavision'

const props = defineProps<{
  story: Story
}>()

const { t } = useI18n()

const title = computed(() => t(`c500eavision.stories.${props.story.i18nKey}.title`))
</script>

<template>
  <section
    :id="story.id"
    class="media-story media-story--staged"
    :data-scene="'title'"
    style="--story-top: 55px"
  >
    <C500Media :image="story.image" :video="story.video" :alt="title" />
    <div class="media-story__shade"></div>
    <div class="media-story__copy section-inner staged-copy">
      <h2 class="gradient-text">{{ title }}</h2>
      <dl v-if="story.metrics" class="power-metrics">
        <div v-for="(metric, index) in powerMetrics" :key="index">
          <dt>
            <strong>{{ metric.value }}</strong> {{ t(`c500eavision.powerMetrics.${index}.unit`) }}
            <sup v-if="metric.note"
              ><a :href="`#c500-note-${metric.note}`">[{{ metric.note }}]</a></sup
            >
          </dt>
          <dd>{{ t(`c500eavision.powerMetrics.${index}.label`) }}</dd>
        </div>
      </dl>
    </div>
  </section>
</template>