<template>
  <div class="section-panel" :class="{ open }" @click.stop @mousedown.stop>
    <button
      class="section-panel__fab"
      type="button"
      title="Sections"
      @click="open = !open"
    >
      <span aria-hidden="true">☰</span>
      <span>Sections</span>
    </button>

    <div v-show="open" class="section-panel__body">
      <div class="section-panel__head">
        <strong>Page sections</strong>
        <button type="button" class="icon-btn" aria-label="Close" @click="open = false">×</button>
      </div>
      <p class="section-panel__hint">Drag to reorder · eye toggles visibility · − removes from page</p>

      <p v-if="!layout.length" class="section-panel__empty">
        Blank page — add sections below to build this landing page.
      </p>

      <draggable
        :model-value="layout"
        item-key="id"
        handle=".drag-handle"
        ghost-class="drag-ghost"
        animation="180"
        @update:model-value="onReorder"
      >
        <template #item="{ element }">
          <div class="sp-item" :class="{ hidden: !element.visible }">
            <span class="drag-handle" title="Drag">⠿</span>
            <span class="sp-item__label">{{ labelOf(element.id) }}</span>
            <button
              type="button"
              class="icon-btn"
              :title="element.visible ? 'Hide' : 'Show'"
              @click="toggleVisible(element.id)"
            >
              {{ element.visible ? '👁' : '🚫' }}
            </button>
            <button type="button" class="icon-btn danger" title="Remove" @click="removeSection(element.id)">−</button>
          </div>
        </template>
      </draggable>

      <div v-if="available.length" class="section-panel__add">
        <div class="section-panel__add-title">Add section</div>
        <button
          v-for="id in available"
          :key="id"
          type="button"
          class="sp-add-btn"
          @click="addSection(id)"
        >
          + {{ labelOf(id) }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import draggable from 'vuedraggable'
import { dirty } from '../../composables/useInlineEdit'
import {
  SECTION_IDS,
  SECTION_LABELS,
  type SectionId,
  type SectionLayoutItem,
} from './sectionIds'

const props = defineProps<{
  modelValue: SectionLayoutItem[]
}>()

const emit = defineEmits<{
  'update:modelValue': [items: SectionLayoutItem[]]
}>()

const open = ref(false)

const layout = computed(() => props.modelValue)

const available = computed(() =>
  SECTION_IDS.filter((id) => !props.modelValue.some((it) => it.id === id)),
)

function labelOf(id: SectionId) {
  return SECTION_LABELS[id] ?? id
}

function commit(items: SectionLayoutItem[]) {
  emit('update:modelValue', items)
  dirty.value = true
}

function onReorder(items: SectionLayoutItem[]) {
  commit(items.map((it) => ({ ...it })))
}

function toggleVisible(id: SectionId) {
  commit(props.modelValue.map((it) => (it.id === id ? { ...it, visible: !it.visible } : it)))
}

function removeSection(id: SectionId) {
  commit(props.modelValue.filter((it) => it.id !== id))
}

function addSection(id: SectionId) {
  if (props.modelValue.some((it) => it.id === id)) return
  commit([...props.modelValue, { id, visible: true }])
}
</script>

<style scoped>
.section-panel {
  position: fixed;
  left: 0;
  top: 110px;
  z-index: 80;
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
}
.section-panel__fab {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-left: 12px;
  padding: 9px 14px;
  border: 1px solid rgba(57, 191, 212, 0.45);
  border-radius: 999px;
  background: rgba(10, 16, 20, 0.92);
  color: #e8f7fa;
  font: inherit;
  font-weight: 700;
  font-size: 0.82rem;
  cursor: pointer;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
}
.section-panel__fab:hover {
  border-color: #74e6f4;
}
.section-panel__body {
  width: 280px;
  margin: 10px 0 0 12px;
  padding: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  background: rgba(10, 14, 17, 0.97);
  color: #f4f7f8;
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.45);
  max-height: calc(100vh - 200px);
  overflow: auto;
}
.section-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 0.92rem;
}
.section-panel__hint {
  margin: 0 0 10px;
  font-size: 0.72rem;
  color: #9aabB3;
  line-height: 1.4;
}
.section-panel__empty {
  margin: 0 0 10px;
  padding: 10px;
  border: 1px dashed rgba(255, 255, 255, 0.18);
  border-radius: 10px;
  font-size: 0.75rem;
  color: #9aabB3;
  line-height: 1.4;
}
.sp-item {
  display: grid;
  grid-template-columns: 22px 1fr 28px 28px;
  align-items: center;
  gap: 6px;
  padding: 8px 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.03);
  margin-bottom: 6px;
  font-size: 0.8rem;
}
.sp-item.hidden {
  opacity: 0.45;
}
.sp-item__label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.drag-handle {
  cursor: grab;
  color: #7f9099;
  text-align: center;
  user-select: none;
}
.drag-handle:active {
  cursor: grabbing;
}
.drag-ghost {
  opacity: 0.4;
}
.icon-btn {
  border: 0;
  background: transparent;
  color: #c5d2d8;
  cursor: pointer;
  font-size: 0.85rem;
  line-height: 1;
  padding: 2px;
}
.icon-btn:hover {
  color: #fff;
}
.icon-btn.danger:hover {
  color: #ff7875;
}
.section-panel__add {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px dashed rgba(255, 255, 255, 0.14);
}
.section-panel__add-title {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #8fa0a8;
  margin-bottom: 8px;
}
.sp-add-btn {
  display: block;
  width: 100%;
  text-align: left;
  margin-bottom: 6px;
  padding: 8px 10px;
  border: 1px dashed rgba(57, 191, 212, 0.4);
  border-radius: 10px;
  background: transparent;
  color: #9fe8f4;
  font: inherit;
  font-size: 0.8rem;
  cursor: pointer;
}
.sp-add-btn:hover {
  background: rgba(57, 191, 212, 0.1);
}
</style>
