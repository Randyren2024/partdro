<template>
  <div class="ipe-overlay">
    <div class="ipe-modal">
      <!-- 顶栏：对齐原生（左侧尺寸徽标，右侧紧凑控件 + 图标关闭） -->
      <div class="ipe-header">
        <span class="ipe-dim-chip">{{ imgW }}×{{ imgH }}</span>
        <div class="ipe-header-right">
          <input
            v-if="currentIsResult"
            v-model="saveName"
            class="ipe-savename"
            title="保存到服务端的文件名"
            spellcheck="false"
          />
          <label class="ipe-auto-toggle" title="涂抹后自动触发 inpainting">
            <input type="checkbox" v-model="autoInpaint" />
            <span>Auto</span>
          </label>
          <select
            class="ipe-select"
            :value="currentModel"
            :disabled="modelLoading"
            title="Model"
            @change="onModelChange(($event.target as HTMLSelectElement).value)"
          >
            <option v-for="m in serverModels" :key="m.name" :value="m.name">{{ m.name }}</option>
          </select>
          <button class="ipe-icon-btn" title="Close (Esc)" @click="emit('close')">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
          </button>
        </div>
      </div>

      <!-- 服务未启动提示 -->
      <div v-if="serverOnline === false" class="ipe-server-warn">
        IOPaint 服务未连接 ({{ IOPAINT_URL }})。请在 WSL2 中启动：
        <code>source ~/iopaint/.venv/bin/activate &amp;&amp; iopaint start --host 0.0.0.0 --port 8080 --model lama --device cpu --no-half --input /home/user1102/partdro/public/d15r/images --output-dir /home/user1102/partdro/public/d15r/images/inpainted</code>
      </div>

      <!-- 画布区：canvas 常驻挂载（ref 必须在 onload 前就存在），状态用浮层显示 -->
      <div class="ipe-stage" title="滚轮缩放 · Space/中键拖拽平移 · 按住 Tab 查看原图 · [ ] 调画笔">
        <div
          v-show="phase === 'ready'"
          class="ipe-canvas-box"
          :class="{ 'ipe-space': spaceHeld, 'ipe-panning': panning }"
          :style="{ transform: `translate(${view.x}px, ${view.y}px) scale(${scale})` }"
          @mousemove="onCursorMove"
          @mouseleave="hideCursor"
          @wheel.prevent="onWheel"
        >
          <canvas ref="imgCanvasRef" class="ipe-img-canvas" />
          <canvas
            v-show="!showOriginal"
            ref="maskCanvasRef"
            class="ipe-mask-canvas"
            @mousedown="onCanvasMouseDown"
            @mousemove="draw"
            @mouseup="endDraw"
            @mouseleave="endDraw"
          />
          <div
            v-show="cursorVisible && !spaceHeld && !panning && !showOriginal"
            ref="cursorRef"
            class="ipe-cursor"
            :style="cursorStyle"
          />
        </div>
        <!-- 处理中遮罩：半透明 + spinner，对齐原生处理时的动态反馈（放在 stage 层级，不随缩放变形） -->
        <div v-if="processing" class="ipe-processing-overlay">
          <div class="ipe-spinner" />
          <span class="ipe-processing-text">Inpainting...</span>
        </div>
        <div v-if="phase === 'loading'" class="ipe-status">Loading image...</div>
        <div v-else-if="phase === 'error'" class="ipe-status ipe-status-error">
          图片加载失败。外部图片需要允许跨域，建议使用 /d15r/images/ 下的文件名。
        </div>
        <!-- 视图控制角标 -->
        <div v-if="phase === 'ready'" class="ipe-viewbar">
          <button class="ipe-fit-btn" title="重置视图" @click="resetView">Fit</button>
          <span class="ipe-zoom-label">{{ Math.round(scale * 100) }}%</span>
        </div>
      </div>

      <!-- AnyText 等 need_prompt 模型：文字输入条（悬浮于工具条上方） -->
      <div v-if="phase === 'ready' && needPrompt" class="ipe-promptbar">
        <span class="ipe-promptbar-label">Text</span>
        <input
          v-model="prompt"
          class="ipe-promptbar-input"
          placeholder="要替换成的文字，如：D15R PRO"
          spellcheck="false"
        />
      </div>

      <!-- 底部悬浮胶囊工具条：对齐原生 IOPaint（黄色滑块 + 图标按钮） -->
      <div class="ipe-toolbar">
        <input
          class="ipe-slider"
          type="range"
          v-model.number="brushSize"
          min="3"
          max="120"
          step="1"
          title="Brush size ([ / ])"
          :style="{ '--fill': sliderFill + '%' }"
        />
        <span class="ipe-brush-value">{{ brushSize }}px</span>
        <span class="ipe-divider" />
        <button class="ipe-icon-btn active" title="Brush">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
        </button>
        <button class="ipe-icon-btn" title="Undo (Ctrl+Z)" :disabled="!canUndo" @click="undo">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /></svg>
        </button>
        <button class="ipe-icon-btn" title="Redo (Ctrl+Shift+Z)" :disabled="!canRedo" @click="redo">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 14 5-5-5-5" /><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13" /></svg>
        </button>
        <button
          class="ipe-icon-btn"
          :class="{ active: showOriginal }"
          title="按住查看原图 (Tab)"
          :disabled="phase !== 'ready'"
          @mousedown.prevent="pressOriginal"
          @mouseup="releaseOriginal"
          @mouseleave="releaseOriginal"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
        </button>
        <button class="ipe-icon-btn" title="Clear" :disabled="!strokes.length" @click="clearMask">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
        </button>
        <span class="ipe-divider" />
        <button
          class="ipe-icon-btn"
          :title="saving ? 'Saving...' : 'Save to Server（保存到 inpainted/ 并回填文件名）'"
          :disabled="!currentIsResult || saving"
          @click="saveToServer"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
        </button>
        <button v-if="!autoInpaint" class="ipe-run" :disabled="phase !== 'ready' || processing" @click="runInpaint">
          {{ processing ? 'Run…' : 'Run' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  reactive,
  computed,
  onMounted,
  onBeforeUnmount,
  nextTick,
} from "vue";
import { message } from "ant-design-vue";
import {
  runInpainting,
  probeServer,
  getCurrentModel,
  switchModel,
  saveImage,
  listServerModels,
  blobToBase64,
  IOPAINT_URL,
} from "../../composables/useInpainting";

const props = defineProps<{ imageUrl: string }>();
const emit = defineEmits<{ (e: "close"): void; (e: "saved", filename: string): void }>();

// 服务端可用模型（探测成功后用真实列表覆盖；need_prompt 模型显示文字输入条）
const serverModels = ref<{ name: string; need_prompt: boolean }[]>([
  { name: "lama", need_prompt: false },
  { name: "cv2", need_prompt: false },
]);
const prompt = ref("");

// ====== 状态 ======
const phase = ref<"loading" | "ready" | "error">("loading");
const serverOnline = ref<boolean | null>(null);
const brushSize = ref(24);
const processing = ref(false);
const saving = ref(false);
const currentIsResult = ref(false);
const currentModel = ref("lama");
const modelLoading = ref(false);
const needPrompt = computed(
  () => serverModels.value.find((m) => m.name === currentModel.value)?.need_prompt ?? false,
);
const autoInpaint = ref(true); // 涂抹后自动触发 inpainting（原生默认行为）
let autoTimer: ReturnType<typeof setTimeout> | null = null;
const imgW = ref(0); // 原生同款左上角尺寸徽标
const imgH = ref(0);

// ====== 视图（缩放/平移） ======
const scale = ref(1);
const view = reactive({ x: 0, y: 0 });
const spaceHeld = ref(false);
const panning = ref(false);
const showOriginal = ref(false);
const saveName = ref("");
const MIN_SCALE = 0.2;
const MAX_SCALE = 5;
let panStart: { px: number; py: number; vx: number; vy: number } | null = null;

const imgCanvasRef = ref<HTMLCanvasElement | null>(null);
const maskCanvasRef = ref<HTMLCanvasElement | null>(null);
const cursorRef = ref<HTMLDivElement | null>(null);

// 当前工作图（可能是原图或上次 inpaint 结果）
let currentBlob: Blob | null = null;
let currentDataUrl = "";
let workImg: HTMLImageElement | null = null; // 当前工作图（结果迭代后更新）
let origImg: HTMLImageElement | null = null; // 本次打开时的原图（Tab 对比用）
const cursor = reactive({ nx: 0, ny: 0, visible: false });
const cursorVisible = computed(() => cursor.visible);

// ====== 笔画历史（undo/redo 基础）======
interface Stroke {
  size: number;
  pts: { x: number; y: number }[];
}
const strokes = ref<Stroke[]>([]);
const redoStack = ref<Stroke[]>([]);
const canUndo = computed(() => strokes.value.length > 0);
const canRedo = computed(() => redoStack.value.length > 0);
// 原生同款黄色填充滑块：已填充部分百分比
const sliderFill = computed(() => ((brushSize.value - 3) / (120 - 3)) * 100);

let drawing = false;
let currentStroke: Stroke | null = null;
let lastPos: { x: number; y: number } | null = null;

// ====== 初始化 ======
onMounted(async () => {
  serverOnline.value = await probeServer();
  loadCurrentModel();
  // 拉取服务端真实模型列表（AnyText 下载后才会出现在这里）
  try {
    const infos = await listServerModels();
    if (infos.length) serverModels.value = infos;
  } catch {
    /* 保留静态兜底列表 */
  }
  loadImage();
  window.addEventListener("keydown", onKeydown);
  window.addEventListener("keyup", onKeyup);
});
onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKeydown);
  window.removeEventListener("keyup", onKeyup);
  if (autoTimer) clearTimeout(autoTimer);
});

async function loadCurrentModel() {
  try {
    currentModel.value = await getCurrentModel();
  } catch {
    /* 服务未启动时忽略，保留默认值 */
  }
}

async function onModelChange(name: string) {
  const prev = currentModel.value;
  currentModel.value = name;
  if (name === prev) return;
  modelLoading.value = true;
  try {
    await switchModel(name);
    message.success(`Model switched to ${name}`);
  } catch (e: any) {
    currentModel.value = prev;
    message.error("Switch model failed: " + (e?.message || "unknown"));
  } finally {
    modelLoading.value = false;
  }
}

/** 把图片绘制到底图画布，并重置 mask 与历史 */
function applyImageToCanvas(img: HTMLImageElement) {
  imgW.value = img.naturalWidth;
  imgH.value = img.naturalHeight;
  const imgC = imgCanvasRef.value!;
  const maskC = maskCanvasRef.value!;
  imgC.width = img.naturalWidth;
  imgC.height = img.naturalHeight;
  maskC.width = img.naturalWidth;
  maskC.height = img.naturalHeight;
  imgC.getContext("2d")!.drawImage(img, 0, 0);
  maskC.getContext("2d")!.clearRect(0, 0, maskC.width, maskC.height);
  strokes.value = [];
  redoStack.value = [];
}

/** 从 imageUrl 提取文件名并生成默认保存名 */
function baseSaveName(suffix: string) {
  const raw = props.imageUrl.split("/").pop() || "image";
  const base = raw.split("?")[0].replace(/\.[^.]+$/, "");
  return `${base}${suffix}.png`;
}

/** 重绘底图：work=当前工作图，original=本次打开时的原图（Tab 对比） */
function drawBaseCanvas(which: "work" | "original") {
  const img = which === "work" ? workImg : origImg;
  if (!img) return;
  imgCanvasRef.value?.getContext("2d")?.drawImage(img, 0, 0);
}

async function loadImage() {
  phase.value = "loading";
  try {
    const res = await fetch(props.imageUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    currentBlob = await res.blob();
    currentDataUrl = await blobToBase64(currentBlob);
    currentIsResult.value = false;
    await nextTick();
    const img = new Image();
    img.onload = () => {
      workImg = img;
      origImg = img;
      // 自然分辨率画布（mask 与原图尺寸天然一致），CSS 负责缩放显示
      applyImageToCanvas(img);
      resetView();
      saveName.value = baseSaveName("-inpainted");
      phase.value = "ready";
    };
    img.onerror = () => {
      phase.value = "error";
    };
    img.src = currentDataUrl;
  } catch (e: any) {
    console.error("loadImage failed:", e);
    phase.value = "error";
  }
}

// 结果图作为新工作图（支持在结果上继续涂抹迭代）
async function showResult(blob: Blob) {
  currentBlob = blob;
  currentIsResult.value = true;
  currentDataUrl = await blobToBase64(blob);
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.onload = () => {
    workImg = img;
    applyImageToCanvas(img); // 保留当前视图（缩放/平移），便于对比前后
    saveName.value = baseSaveName("-inpainted");
    URL.revokeObjectURL(url);
  };
  img.src = url;
}

// ====== 绘制 ======
function maskCtx(): CanvasRenderingContext2D | null {
  return maskCanvasRef.value?.getContext("2d") ?? null;
}

/** 屏幕坐标 → 画布自然坐标 */
function canvasPos(e: MouseEvent): { x: number; y: number } {
  const rect = maskCanvasRef.value!.getBoundingClientRect();
  const k = maskCanvasRef.value!.width / rect.width;
  return { x: (e.clientX - rect.left) * k, y: (e.clientY - rect.top) * k };
}

function drawStrokeSegment(ctx: CanvasRenderingContext2D, from: { x: number; y: number } | null, to: { x: number; y: number }, stroke: Stroke) {
  ctx.globalCompositeOperation = "source-over";
  // 原生 IOPaint 同款黄色高亮：白底/黑底上都可见
  ctx.fillStyle = "rgba(255, 200, 0, 0.6)";
  const points = from ? [from, to] : [to];
  // 插值补点，步长取笔刷半径一半，避免快速移动断裂
  if (from) {
    const dist = Math.hypot(to.x - from.x, to.y - from.y);
    const step = Math.max(1, stroke.size / 2);
    const n = Math.ceil(dist / step);
    for (let i = 1; i <= n; i++) {
      const t = i / n;
      points.push({ x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t });
    }
  }
  for (const p of points) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, stroke.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function redrawMask() {
  const ctx = maskCtx();
  if (!ctx) return;
  const maskC = maskCanvasRef.value!;
  ctx.clearRect(0, 0, maskC.width, maskC.height);
  for (const s of strokes.value) {
    for (let i = 0; i < s.pts.length; i++) {
      drawStrokeSegment(ctx, i > 0 ? s.pts[i - 1] : null, s.pts[i], s);
    }
  }
}

function startDraw(e: MouseEvent) {
  if (phase.value !== "ready" || processing.value) return;
  drawing = true;
  const pos = canvasPos(e);
  currentStroke = { size: brushSize.value, pts: [pos] };
  lastPos = pos;
  const ctx = maskCtx();
  if (ctx && currentStroke) drawStrokeSegment(ctx, null, pos, currentStroke);
  // 挂到 window：拖出画布/视图后继续绘制，松开即收笔
  window.addEventListener("mousemove", onWinDraw);
  window.addEventListener("mouseup", onWinEndDraw);
}
function onWinDraw(e: MouseEvent) {
  draw(e);
}
function onWinEndDraw() {
  endDraw();
}

function draw(e: MouseEvent) {
  if (!drawing || !currentStroke) return;
  const pos = canvasPos(e);
  const ctx = maskCtx();
  if (ctx) drawStrokeSegment(ctx, lastPos, pos, currentStroke);
  currentStroke.pts.push(pos);
  lastPos = pos;
}

function endDraw() {
  if (!drawing) return;
  drawing = false;
  window.removeEventListener("mousemove", onWinDraw);
  window.removeEventListener("mouseup", onWinEndDraw);
  if (currentStroke && currentStroke.pts.length) {
    strokes.value.push(currentStroke);
    redoStack.value = [];
  }
  currentStroke = null;
  lastPos = null;
  // Auto-inpaint：停手后延迟自动触发（与原生行为一致，debounce 避免连续涂抹多次请求）
  if (autoInpaint.value && strokes.value.length > 0) {
    scheduleAutoInpaint();
  }
}

function scheduleAutoInpaint() {
  if (autoTimer) clearTimeout(autoTimer);
  autoTimer = setTimeout(() => {
    autoTimer = null;
    if (!processing.value && strokes.value.length > 0) {
      runInpaint();
    }
  }, 450);
}

// ====== 视图操作：滚轮缩放（鼠标锚点）+ Space/中键平移 ======
function onWheel(e: WheelEvent) {
  if (phase.value !== "ready") return;
  const box = e.currentTarget as HTMLElement;
  const rect = box.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
  const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale.value * factor));
  if (next === scale.value) return;
  // 保持鼠标下的内容点不动：visual = tx + base*scale
  view.x = mx - ((mx - view.x) / scale.value) * next;
  view.y = my - ((my - view.y) / scale.value) * next;
  scale.value = next;
}

function resetView() {
  scale.value = 1;
  view.x = 0;
  view.y = 0;
}

/** mask 画布上的按下：Space 按住或中键 → 平移；左键 → 涂抹 */
function onCanvasMouseDown(e: MouseEvent) {
  if (spaceHeld.value || e.button === 1) {
    e.preventDefault();
    startPan(e);
    return;
  }
  if (e.button === 0) startDraw(e);
}

function startPan(e: MouseEvent) {
  panning.value = true;
  panStart = { px: e.clientX, py: e.clientY, vx: view.x, vy: view.y };
  window.addEventListener("mousemove", onPanMove);
  window.addEventListener("mouseup", endPan);
}
function onPanMove(e: MouseEvent) {
  if (!panStart) return;
  view.x = panStart.vx + (e.clientX - panStart.px);
  view.y = panStart.vy + (e.clientY - panStart.py);
}
function endPan() {
  panning.value = false;
  panStart = null;
  window.removeEventListener("mousemove", onPanMove);
  window.removeEventListener("mouseup", endPan);
}

function undo() {
  if (!strokes.value.length) return;
  redoStack.value.push(strokes.value.pop()!);
  redrawMask();
}
function redo() {
  if (!redoStack.value.length) return;
  strokes.value.push(redoStack.value.pop()!);
  redrawMask();
}
function clearMask() {
  strokes.value = [];
  redoStack.value = [];
  redrawMask();
}

function isTypingTarget(e: KeyboardEvent) {
  const t = e.target as HTMLElement | null;
  return !!t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable);
}

/** 眼睛按钮按住看原图（与 Tab 一致） */
function pressOriginal() {
  if (phase.value === "ready" && !showOriginal.value) {
    showOriginal.value = true;
    drawBaseCanvas("original");
  }
}
function releaseOriginal() {
  if (showOriginal.value) {
    showOriginal.value = false;
    drawBaseCanvas("work");
  }
}

function onKeydown(e: KeyboardEvent) {
  if (isTypingTarget(e)) return;
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
    e.preventDefault();
    if (e.shiftKey) redo();
    else undo();
    return;
  }
  if (e.key === "Escape") {
    emit("close");
    return;
  }
  if (e.code === "Space") {
    e.preventDefault(); // 防止页面滚动
    spaceHeld.value = true;
    return;
  }
  if (e.key === "Tab") {
    e.preventDefault();
    pressOriginal();
    return;
  }
  if (e.key === "[") {
    brushSize.value = Math.max(3, brushSize.value - 4);
    return;
  }
  if (e.key === "]") {
    brushSize.value = Math.min(120, brushSize.value + 4);
  }
}

function onKeyup(e: KeyboardEvent) {
  if (e.code === "Space") {
    spaceHeld.value = false;
  } else if (e.key === "Tab") {
    releaseOriginal();
  }
}

// ====== 光标预览（自然坐标 → 未变换布局坐标；transform 会再按 scale 缩放）======
const cursorStyle = computed(() => {
  const maskC = maskCanvasRef.value;
  if (!maskC || !maskC.width) return { display: "none" };
  const baseK = maskC.clientWidth / maskC.width; // 未变换布局宽度 / 自然宽度
  const d = brushSize.value * 2 * baseK;
  const bx = cursor.nx * baseK;
  const by = cursor.ny * baseK;
  return {
    left: bx - d / 2 + "px",
    top: by - d / 2 + "px",
    width: d + "px",
    height: d + "px",
  };
});
function onCursorMove(e: MouseEvent) {
  const pos = canvasPos(e); // 已按 transform 换算为自然坐标
  cursor.nx = pos.x;
  cursor.ny = pos.y;
  cursor.visible = true;
}
function hideCursor() {
  cursor.visible = false;
}

// ====== 提取 mask：笔画（黄色）→ 纯白笔画 + 黑底，导出与原图同尺寸的 PNG ======
function extractMaskBase64(): string {
  const maskC = maskCanvasRef.value!;
  // 1) 只保留笔画像素并统一为纯白（IOPaint 语义：白=重绘区）
  const white = document.createElement("canvas");
  white.width = maskC.width;
  white.height = maskC.height;
  const wctx = white.getContext("2d")!;
  wctx.drawImage(maskC, 0, 0);
  wctx.globalCompositeOperation = "source-in";
  wctx.fillStyle = "#fff";
  wctx.fillRect(0, 0, white.width, white.height);
  // 2) 铺黑底
  const tmp = document.createElement("canvas");
  tmp.width = maskC.width;
  tmp.height = maskC.height;
  const tctx = tmp.getContext("2d")!;
  tctx.fillStyle = "#000";
  tctx.fillRect(0, 0, tmp.width, tmp.height);
  tctx.drawImage(white, 0, 0);
  return tmp.toDataURL("image/png");
}

// ====== Run Inpainting ======
async function runInpaint() {
  if (!currentDataUrl || phase.value !== "ready") {
    message.error("Image not loaded yet.");
    return;
  }
  if (!strokes.value.length) {
    message.warning("Mask is empty. Paint the area to inpaint first.");
    return;
  }
  processing.value = true;
  if (autoTimer) {
    clearTimeout(autoTimer);
    autoTimer = null;
  }
  try {
    let maskBase64: string;
    try {
      maskBase64 = extractMaskBase64();
    } catch {
      throw new Error("Canvas is tainted by a cross-origin image. Only same-origin (/d15r/images/...) images can be inpainted.");
    }
    // need_prompt 模型（如 AnyText）随请求携带文字；sd_steps 降到 20 以适配 CPU
    const opts = needPrompt.value
      ? { prompt: prompt.value.trim(), sd_steps: 20 }
      : undefined;
    if (needPrompt.value && !opts?.prompt) {
      message.warning("请先在 Text 输入框填写要替换成的文字。");
      processing.value = false;
      return;
    }
    const blob = await runInpainting(currentDataUrl, maskBase64, opts);
    showResult(blob);
    message.success("Inpainting done. You can continue painting on the result, or Save to Server.");
  } catch (e: any) {
    console.error("Inpaint failed:", e);
    message.error("Inpaint failed: " + (e?.message || "Unknown error"));
  } finally {
    processing.value = false;
  }
}

// ====== 保存到服务端 output 目录（inpainted/），文件名回填给图片面板 ======
async function saveToServer() {
  if (!currentBlob) return;
  const filename = (saveName.value || baseSaveName("-inpainted")).trim() || baseSaveName("-inpainted");
  saving.value = true;
  try {
    await saveImage(currentBlob, filename);
    message.success(`Saved as inpainted/${filename}`);
    emit("saved", `inpainted/${filename}`);
  } catch (e: any) {
    console.error("Save failed:", e);
    message.error("Save failed: " + (e?.message || "Unknown error"));
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.ipe-overlay {
  position: fixed;
  inset: 0;
  background: rgba(9, 9, 11, 0.92);
  display: flex;
  z-index: 2147483647;
  pointer-events: auto;
  font-family: "Inter", "Inter var", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}
.ipe-modal {
  position: relative;
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: rgb(9, 9, 11);
  color: rgb(250, 250, 250);
  overflow: hidden;
}
.ipe-header {
  flex: none;
  height: 60px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  background: rgba(9, 9, 11, 0.7);
  border-bottom: 1px solid rgb(39, 39, 42);
}
.ipe-dim-chip {
  background: rgba(39, 39, 42, 0.6);
  border: 1px solid rgb(39, 39, 42);
  border-radius: 8px;
  padding: 5px 12px;
  font-size: 14px;
  color: rgb(250, 250, 250);
  font-variant-numeric: tabular-nums;
}
.ipe-header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}
.ipe-select {
  height: 36px;
  background: rgb(9, 9, 11);
  color: rgb(250, 250, 250);
  border: 1px solid rgb(39, 39, 42);
  border-radius: 6px;
  padding: 0 10px;
  font-size: 14px;
  outline: none;
  cursor: pointer;
}
.ipe-select:hover:not(:disabled) {
  background: rgb(24, 24, 27);
}
.ipe-auto-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  color: rgb(161, 161, 170);
  font-size: 13px;
  cursor: pointer;
  user-select: none;
}
.ipe-auto-toggle input {
  accent-color: #eab308;
  cursor: pointer;
}
.ipe-server-warn {
  background: rgba(220, 80, 80, 0.12);
  border: 1px solid rgba(220, 80, 80, 0.5);
  color: #ffb4b4;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 0.8rem;
  line-height: 1.5;
  word-break: break-all;
  margin: 12px 24px 0;
}
.ipe-server-warn code {
  display: block;
  margin-top: 4px;
  font-size: 0.72rem;
  color: rgb(250, 250, 250);
}
.ipe-stage {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  background: rgb(9, 9, 11);
  display: flex;
  align-items: center;
  justify-content: center;
}
.ipe-viewbar {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  gap: 6px;
  align-items: center;
  background: rgba(9, 9, 11, 0.7);
  backdrop-filter: blur(8px);
  border: 1px solid rgb(39, 39, 42);
  border-radius: 8px;
  padding: 4px 8px;
  z-index: 2;
}
.ipe-zoom-label {
  color: rgb(250, 250, 250);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  min-width: 40px;
  text-align: center;
}
.ipe-fit-btn {
  height: 26px;
  padding: 0 10px;
  border: none;
  border-radius: 5px;
  background: transparent;
  color: rgb(250, 250, 250);
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
}
.ipe-fit-btn:hover {
  background: rgb(39, 39, 42);
}
.ipe-status {
  color: rgb(161, 161, 170);
  padding: 60px 20px;
  font-size: 0.9rem;
}
.ipe-status-error {
  color: #ffb4b4;
}
.ipe-canvas-box {
  position: relative;
  max-width: 100%;
  margin: 0 auto;
  transform-origin: 0 0;
}
.ipe-canvas-box.ipe-space .ipe-mask-canvas {
  cursor: grab;
}
.ipe-canvas-box.ipe-panning .ipe-mask-canvas {
  cursor: grabbing;
}
.ipe-img-canvas {
  display: block;
  max-width: 100%;
  height: auto !important;
}
.ipe-mask-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  cursor: none;
}
.ipe-cursor {
  position: absolute;
  border: 2px solid rgba(255, 200, 0, 1);
  background: rgba(255, 200, 0, 0.18);
  border-radius: 50%;
  pointer-events: none;
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.6),
    0 0 8px rgba(255, 200, 0, 0.55);
}
/* 处理中遮罩：覆盖整个画布区，半透明 + 居中 spinner */
.ipe-processing-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  pointer-events: none;
  z-index: 5;
}
.ipe-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid rgba(234, 179, 8, 0.25);
  border-top-color: #eab308;
  border-radius: 50%;
  animation: ipe-spin 0.8s linear infinite;
}
.ipe-processing-text {
  color: rgb(250, 250, 250);
  font-size: 0.82rem;
  letter-spacing: 0.05em;
}
@keyframes ipe-spin {
  to {
    transform: rotate(360deg);
  }
}
/* AnyText 等 need_prompt 模型的文字输入条（悬浮于工具条上方，同款胶囊风格） */
.ipe-promptbar {
  position: absolute;
  left: 50%;
  bottom: 88px;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 10px;
  height: 44px;
  padding: 0 16px;
  background: rgba(9, 9, 11, 0.7);
  backdrop-filter: blur(8px);
  border: 1px solid rgb(39, 39, 42);
  border-radius: 999px;
  z-index: 6;
}
.ipe-promptbar-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: #eab308;
  text-transform: uppercase;
}
.ipe-promptbar-input {
  width: 280px;
  height: 30px;
  padding: 0 10px;
  font-size: 13px;
  color: rgb(250, 250, 250);
  background: rgba(250, 250, 250, 0.08);
  border: 1px solid rgb(39, 39, 42);
  border-radius: 8px;
  outline: none;
}
.ipe-promptbar-input::placeholder {
  color: rgba(250, 250, 250, 0.35);
}
.ipe-promptbar-input:focus {
  border-color: #eab308;
}
/* 底部悬浮胶囊工具条：对齐原生（rgba(9,9,11,.7) + 大圆角 + backdrop blur） */
.ipe-toolbar {
  position: absolute;
  left: 50%;
  bottom: 20px;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 14px;
  height: 54px;
  padding: 8px 20px;
  background: rgba(9, 9, 11, 0.7);
  backdrop-filter: blur(8px);
  border: 1px solid rgb(39, 39, 42);
  border-radius: 999px;
  z-index: 6;
  white-space: nowrap;
}
/* 原生同款黄色填充滑块（Radix 风格） */
.ipe-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 192px;
  height: 6px;
  border-radius: 999px;
  outline: none;
  cursor: pointer;
  display: block;
  border: none;
  padding: 0;
  background: linear-gradient(
    to right,
    #eab308 var(--fill, 30%),
    rgba(250, 250, 250, 0.15) var(--fill, 30%)
  );
}
.ipe-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: rgb(9, 9, 11);
  border: 2px solid rgb(250, 250, 250);
  cursor: pointer;
}
.ipe-slider::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: rgb(9, 9, 11);
  border: 2px solid rgb(250, 250, 250);
  cursor: pointer;
}
.ipe-slider::-moz-range-track {
  height: 6px;
  border-radius: 999px;
  background: rgba(250, 250, 250, 0.15);
}
.ipe-slider::-moz-range-progress {
  height: 6px;
  border-radius: 999px;
  background: #eab308;
}
.ipe-brush-value {
  color: rgb(161, 161, 170);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  min-width: 38px;
  text-align: right;
}
.ipe-divider {
  width: 1px;
  height: 22px;
  background: rgb(39, 39, 42);
  flex: none;
}
/* 图标按钮（原生：36×36 / 6px 圆角 / 无描边 / hover zinc-800） */
.ipe-icon-btn {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: rgb(250, 250, 250);
  cursor: pointer;
  padding: 0;
  transition: background 0.15s, color 0.15s;
}
.ipe-icon-btn:hover:not(:disabled) {
  background: rgb(39, 39, 42);
}
.ipe-icon-btn.active {
  background: rgb(39, 39, 42);
  color: #eab308;
}
.ipe-icon-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.ipe-icon-btn svg {
  display: block;
}
.ipe-run {
  height: 36px;
  padding: 0 16px;
  border: none;
  border-radius: 6px;
  background: rgb(250, 250, 250);
  color: rgb(9, 9, 11);
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
}
.ipe-run:hover:not(:disabled) {
  background: rgb(228, 228, 231);
}
.ipe-run:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.ipe-savename {
  height: 36px;
  width: 210px;
  background: rgb(9, 9, 11);
  color: rgb(250, 250, 250);
  border: 1px solid rgb(39, 39, 42);
  border-radius: 6px;
  padding: 0 10px;
  font-size: 13px;
  outline: none;
}
.ipe-savename:focus {
  border-color: rgb(82, 82, 91);
}
</style>
