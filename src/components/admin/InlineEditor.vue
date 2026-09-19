<template>
  <!-- 编辑模式浮层 -->
  <div v-if="editMode" class="inline-editor-overlay">
    <!-- 顶部保存栏 -->
    <div class="edit-toolbar">
      <div class="tb-left">
        <span class="tb-badge">EDIT MODE</span>
        <span class="tb-hint">Hover to edit · Click text/image to modify</span>
      </div>
      <div class="tb-right">
        <a-select v-model:value="lang" size="small" style="width: 100px">
          <a-select-option value="en">EN</a-select-option>
          <a-select-option value="es">ES</a-select-option>
          <a-select-option value="de">DE</a-select-option>
          <a-select-option value="fr">FR</a-select-option>
        </a-select>
        <a-button size="small" @click="onReload">Reload</a-button>
        <a-button size="small" type="primary" :loading="saving" @click="onSave">
          Save{{ dirty ? " *" : "" }}
        </a-button>
        <a-button size="small" @click="onLogout">Sign out</a-button>
      </div>
    </div>

    <!-- 文本编辑面板（自定位，fixed 坐标系） -->
    <div v-if="activeText" class="ie-panel ie-panel-text" :style="panelStyle" @click.stop>
      <div class="ie-panel-arrow" :class="{ right: panelPlacement === 'right' }" />
      <div class="ie-panel-inner">
        <div class="ie-pop-key">{{ activeText.key }}</div>
        <textarea
          v-model="activeText.value"
          class="ie-textarea"
          rows="3"
          @keydown.enter.meta.prevent="commitText"
        />
        <div class="ie-pop-actions">
          <button class="ie-btn ie-btn-ghost" @click="cancelText">Cancel</button>
          <button class="ie-btn ie-btn-primary" @click="commitText">Save</button>
        </div>
      </div>
    </div>

    <!-- 图片编辑面板 -->
    <div v-if="activeImg" class="ie-panel ie-panel-img" :style="panelStyle" @click.stop>
      <div class="ie-panel-arrow" :class="{ right: panelPlacement === 'right' }" />
      <div class="ie-panel-inner">
        <div class="ie-pop-key">{{ activeImg.key }}</div>
        <input
          v-model="activeImg.value"
          class="ie-input"
          placeholder="Image URL or filename in /d15r/images/"
        />
        <div class="ie-pop-preview">
          <img v-if="activeImg.value" :src="imgPreviewUrl(activeImg.value)" alt="preview" />
          <span v-else class="ie-pop-noimg">No image</span>
        </div>
        <div class="ie-pop-actions">
          <button class="ie-btn ie-btn-ghost" @click="openInpaint" :disabled="!activeImg.value">🪄 Inpaint</button>
          <button class="ie-btn ie-btn-ghost" @click="cancelImg">Cancel</button>
          <button class="ie-btn ie-btn-primary" @click="commitImg">Save</button>
        </div>
      </div>
    </div>

    <!-- Inpainting 编辑器（IOPaint 核心交互的 Vue 重写） -->
    <InpaintEditor
      v-if="inpaintOpen && activeImg"
      :image-url="imgPreviewUrl(activeImg.value)"
      @close="inpaintOpen = false"
      @saved="onInpaintSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, type CSSProperties } from "vue";
import { useI18n } from "vue-i18n";
import { message } from "ant-design-vue";
import { useAuthStore } from "../../stores/auth";
import {
  dirty,
  saving,
  applyTextEdit,
  applyImgEdit,
  saveAll,
  reload,
} from "../../composables/useInlineEdit";
import InpaintEditor from "./InpaintEditor.vue";

const auth = useAuthStore();
const { locale } = useI18n();

const editMode = computed(() => auth.isLoggedIn);
const lang = ref<string>((locale.value as string) || "en");

watch(
  () => locale.value,
  (l) => {
    lang.value = l;
  },
);

function imgPreviewUrl(p: string) {
  if (!p) return "";
  if (p.startsWith("http") || p.startsWith("/")) return p;
  return `/d15r/images/${p}`;
}

const activeText = ref<{ key: string; value: string; x: number; y: number } | null>(null);
const activeImg = ref<{ key: string; value: string; x: number; y: number } | null>(null);

// 面板定位：用视口坐标（和 getBoundingClientRect 一致），fixed 定位
const panelPlacement = computed(() => {
  const x = activeText.value?.x ?? activeImg.value?.x ?? 0;
  return x > window.innerWidth * 0.6 ? "right" : "left";
});

const panelStyle = computed<CSSProperties>(() => {
  const anchorX = activeText.value?.x ?? activeImg.value?.x ?? 0;
  const anchorY = activeText.value?.y ?? activeImg.value?.y ?? 0;
  const w = activeText.value ? 440 : 380;
  const arrowOffset = 14;

  let left: number, top: number;
  if (panelPlacement.value === "right") {
    // anchor 在面板右侧，面板左对齐 anchor
    left = Math.max(8, anchorX - w - arrowOffset);
  } else {
    // anchor 在面板左侧，面板右对齐 anchor
    left = Math.min(window.innerWidth - w - 8, anchorX + arrowOffset);
  }

  top = anchorY;
  // 如果面板超出底部，往上翻
  if (top + 200 > window.innerHeight - 20) {
    top = window.innerHeight - 210;
  }
  // 不超出顶部
  top = Math.max(10, top);

  return {
    position: "fixed",
    left: left + "px",
    top: top + "px",
    width: w + "px",
  };
});

function onDocClick(e: MouseEvent) {
  if (!editMode.value) return;
  const target = e.target as HTMLElement;
  if (!target) return;

  // 点击面板内部不处理（.ie-panel 是编辑小面板，.ipe-overlay 是 InpaintEditor 弹层）
  if (target.closest(".ie-panel")) return;
  if (target.closest(".ipe-overlay")) return;

  const textEl = target.closest("[data-edit-key]") as HTMLElement | null;
  const imgEl = target.closest("[data-edit-img]") as HTMLElement | null;

  if (textEl) {
    const key = textEl.dataset.editKey!;
    const rect = textEl.getBoundingClientRect();
    activeImg.value = null;
    activeText.value = {
      key,
      value: textEl.textContent?.trim() ?? "",
      x: rect.left + rect.width / 2,
      y: rect.top,
    };
    e.stopPropagation();
  } else if (imgEl) {
    const key = imgEl.dataset.editImg!;
    const rect = imgEl.getBoundingClientRect();
    activeText.value = null;
    activeImg.value = {
      key,
      value:
        (imgEl as HTMLImageElement).src || (imgEl as HTMLImageElement).getAttribute("src") || "",
      x: rect.left + rect.width / 2,
      y: rect.top,
    };
    e.stopPropagation();
  } else {
    activeText.value = null;
    activeImg.value = null;
  }
}

function commitText() {
  if (!activeText.value) return;
  applyTextEdit(activeText.value.key, activeText.value.value);
  activeText.value = null;
}
function cancelText() {
  activeText.value = null;
}
function commitImg() {
  if (!activeImg.value) return;
  // 原样保存（完整 URL、/ 开头路径、或纯文件名均可）
  applyImgEdit(activeImg.value.key, activeImg.value.value);
  activeImg.value = null;
}
function cancelImg() {
  activeImg.value = null;
}

async function onSave() {
  try {
    await saveAll();
    message.success("Changes saved");
  } catch (e: any) {
    message.error("Save failed: " + (e?.message || "Unknown error"));
  }
}
function onReload() {
  reload();
}

// ====== Inpainting（核心交互在 InpaintEditor.vue 中）======
const inpaintOpen = ref(false);

function openInpaint() {
  if (!activeImg.value || !activeImg.value.value) {
    message.warning("No image to inpaint");
    return;
  }
  inpaintOpen.value = true;
}

/** InpaintEditor 保存到服务端后回填文件名，用户在图片面板点 Save 即可应用 */
function onInpaintSaved(filename: string) {
  inpaintOpen.value = false;
  if (activeImg.value) {
    activeImg.value.value = filename;
  }
}
async function onLogout() {
  await auth.logout();
}

watch(lang, (l) => {
  if (l !== locale.value) {
    locale.value = l;
  }
});

// 编辑模式切换时，动态注入/移除 hover CSS
const HOVER_STYLE_ID = "__inline_editor_hover_css__";
const HOVER_CSS = `
[data-edit-key], [data-edit-img] { transition: outline 0.15s ease; }
[data-edit-key]:hover, [data-edit-img]:hover {
  outline: 2px dashed rgba(57,191,212,0.6);
  outline-offset: 2px;
  cursor: pointer;
}
`;
watch(
  () => editMode.value,
  (v) => {
    if (v) {
      if (!document.getElementById(HOVER_STYLE_ID)) {
        const s = document.createElement("style");
        s.id = HOVER_STYLE_ID;
        s.textContent = HOVER_CSS;
        document.head.appendChild(s);
      }
    } else {
      document.getElementById(HOVER_STYLE_ID)?.remove();
    }
  },
  { immediate: true },
);

onMounted(() => {
  document.addEventListener("click", onDocClick, true);
});
onBeforeUnmount(() => {
  document.removeEventListener("click", onDocClick, true);
  document.getElementById(HOVER_STYLE_ID)?.remove();
});
</script>

<style scoped>
.inline-editor-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 2147483647 !important;
}
.edit-toolbar {
  pointer-events: auto;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: #10171b;
  border-bottom: 1px solid rgba(57, 191, 212, 0.5);
  padding: 10px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}
.tb-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.tb-badge {
  background: rgba(57, 191, 212, 0.15);
  color: #39bfd4;
  border: 1px solid rgba(57, 191, 212, 0.5);
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.15em;
}
.tb-hint {
  color: #a8b4b9;
  font-size: 0.78rem;
}
.tb-right {
  display: flex;
  gap: 8px;
  align-items: center;
}

/* 自定位编辑面板 */
.ie-panel {
  pointer-events: auto;
  background: #10171b;
  border: 1px solid rgba(57, 191, 212, 0.5);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
  overflow: hidden;
}
.ie-panel-inner {
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ie-panel-arrow {
  position: absolute;
  width: 12px;
  height: 12px;
  background: #10171b;
  border-top: 1px solid rgba(57, 191, 212, 0.5);
  border-left: 1px solid rgba(57, 191, 212, 0.5);
  transform: rotate(45deg);
  top: 10px;
  left: -7px;
}
.ie-panel-arrow.right {
  left: auto;
  right: -7px;
  border-top: 1px solid rgba(57, 191, 212, 0.5);
  border-left: 1px solid rgba(57, 191, 212, 0.5);
}

.ie-pop-key {
  font-size: 0.72rem;
  color: #39bfd4;
  font-family: monospace;
  word-break: break-all;
}
.ie-textarea {
  width: 100%;
  background: #0d1215;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  color: #f4f7f8;
  padding: 8px 10px;
  font-size: 0.9rem;
  font-family: inherit;
  resize: vertical;
  line-height: 1.5;
  outline: none;
  transition: border-color 0.15s;
}
.ie-textarea:focus {
  border-color: #39bfd4;
}
.ie-input {
  width: 100%;
  background: #0d1215;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  color: #f4f7f8;
  padding: 8px 10px;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.15s;
}
.ie-input:focus {
  border-color: #39bfd4;
}
.ie-pop-preview {
  width: 100%;
  height: 120px;
  background: #0d1215;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.12);
}
.ie-pop-preview img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
.ie-pop-noimg {
  color: #6b7a80;
  font-size: 0.8rem;
}
.ie-pop-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 4px;
}
.ie-btn {
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  border: 1px solid transparent;
}
.ie-btn-ghost {
  background: transparent;
  color: #a8b4b9;
  border-color: rgba(255, 255, 255, 0.15);
}
.ie-btn-ghost:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #f4f7f8;
}
.ie-btn-primary {
  background: #39bfd4;
  color: #001115;
  border-color: #39bfd4;
}
.ie-btn-primary:hover {
  background: #74e6f4;
}

</style>
