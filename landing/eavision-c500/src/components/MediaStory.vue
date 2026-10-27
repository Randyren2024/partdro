<script setup>
import C500Media from './C500Media.vue'

defineProps({
  story: { type: Object, required: true },
  metrics: { type: Array, default: () => [] }
})
</script>

<template>
  <section
    :id="story.id"
    class="media-story media-story--staged"
    :data-scene="'title'"
    style="--story-top: 55px"
  >
    <C500Media
      :image="story.image"
      :video="story.video"
      :width="story.width"
      :height="story.height"
      :alt="story.title"
    />
    <div class="media-story__shade"></div>
    <div class="media-story__copy section-inner staged-copy">
      <h2 class="gradient-text">{{ story.title }}</h2>
      <dl v-if="metrics.length" class="power-metrics">
        <div v-for="metric in metrics" :key="metric.label">
          <dt>
            <strong>{{ metric.value }}</strong
            >{{ metric.unit ? ` ${metric.unit}` : '' }}
            <sup v-if="metric.note"
              ><a :href="`#c500-note-${metric.note}`">[{{ metric.note }}]</a></sup
            >
          </dt>
          <dd>{{ metric.label }}</dd>
        </div>
      </dl>
    </div>
  </section>
</template>
