<script setup>
import { ref } from 'vue'
import C500Media from './C500Media.vue'
import { videoOpen } from '../composables/state'

const props = defineProps({
  items: { type: Array, required: true },
  ariaLabel: { type: String, required: true },
  expandLabel: { type: String, default: 'Show details' },
  collapseLabel: { type: String, default: 'Hide details' }
})

const decisionIndex = ref(0)
const mediaIndex = ref(0)

function select(index) {
  decisionIndex.value = index
}

function onMediaReady(index) {
  if (index === decisionIndex.value) mediaIndex.value = index
}
</script>

<template>
  <section :aria-label="ariaLabel" class="decision section-inner reveal">
    <div class="decision__visual">
      <div class="decision__panels">
        <C500Media
          v-for="(item, index) in items"
          v-show="index === mediaIndex"
          :key="item.title"
          :image="item.image"
          :video="item.video"
          :width="item.width"
          :height="item.height"
          :prepare="index === decisionIndex && index !== mediaIndex"
          :eager="index === decisionIndex && index !== mediaIndex"
          :suspended="videoOpen || index !== mediaIndex"
          :alt="item.title"
          @ready="onMediaReady(index)"
        />
      </div>
    </div>

    <div class="decision__list">
      <div
        v-for="(item, index) in items"
        :key="item.title"
        class="decision-item"
        :class="{ 'is-active': index === decisionIndex }"
      >
        <h3>
          <button
            :id="`c500-decision-title-${index}`"
            type="button"
            :aria-expanded="index === decisionIndex"
            :aria-controls="`c500-decision-detail-${index}`"
            :aria-label="`${item.title} — ${index === decisionIndex ? collapseLabel : expandLabel}`"
            @click="select(index)"
          >
            <span>{{ item.title }}</span>
            <svg
              v-if="index === decisionIndex"
              viewBox="64 64 896 896"
              width="1em"
              height="1em"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                d="M872 474H152c-4.4 0-8 3.6-8 8v60c0 4.4 3.6 8 8 8h720c4.4 0 8-3.6 8-8v-60c0-4.4-3.6-8-8-8z"
              />
            </svg>
            <svg
              v-else
              viewBox="64 64 896 896"
              width="1em"
              height="1em"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                d="M482 152h60q8 0 8 8v704q0 8-8 8h-60q-8 0-8-8V160q0-8 8-8zM176 474h672q8 0 8 8v60q0 8-8 8H176q-8 0-8-8v-60q0-8 8-8z"
              />
            </svg>
          </button>
        </h3>
        <div
          :id="`c500-decision-detail-${index}`"
          role="region"
          :aria-labelledby="`c500-decision-title-${index}`"
          :aria-hidden="index !== decisionIndex"
          class="decision-item__detail"
        >
          <div>
            <p>{{ item.detail }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
