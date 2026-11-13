<template>
  <div class="jf-node" :class="{ 'is-leaf': !hasChildren }">
    <div class="jf-row">
      <span class="jf-key" :title="nodeKey">{{ nodeKey }}</span>
      <a-textarea
        v-if="!hasChildren"
        class="jf-input"
        :value="modelValue"
        auto-size
        @update:value="(v: string) => emit('update:modelValue', v)"
      />
      <a-button v-else size="small" type="link" @click="open = !open">
        {{ open ? 'Collapse' : 'Expand' }} ({{ childCount }})
      </a-button>
    </div>
    <div v-if="hasChildren && open" class="jf-children">
      <JsonField
        v-for="k in keys"
        :key="k"
        :node-key="k"
        :model-value="(modelValue as any)[k]"
        @update:model-value="onChild(k, $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{ nodeKey: string; modelValue: any }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: any): void }>()

const open = ref(true)
const hasChildren = computed(
  () =>
    props.modelValue !== null &&
    typeof props.modelValue === 'object' &&
    !Array.isArray(props.modelValue) &&
    Object.keys(props.modelValue).length > 0,
)
const keys = computed(() => (hasChildren.value ? Object.keys(props.modelValue) : []))
const childCount = computed(() => keys.value.length)

function onChild(k: string, v: any) {
  const next = { ...(props.modelValue as object), [k]: v }
  emit('update:modelValue', next)
}
</script>

<style scoped>
.jf-node {
  border-left: 1px solid rgba(255, 255, 255, 0.12);
  margin-left: 4px;
  padding-left: 14px;
  margin-bottom: 8px;
}
.jf-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}
.jf-key {
  color: #39bfd4;
  font-weight: 600;
  min-width: 120px;
  font-size: 13px;
  word-break: break-all;
}
.jf-input {
  flex: 1;
  min-width: 240px;
}
.jf-children {
  margin-top: 4px;
}
</style>
