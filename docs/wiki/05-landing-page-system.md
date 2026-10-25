# 05 · 落地页系统：16 区块、内容叠加与可视化编辑

这是本项目最"自研"的部分，也是改动最频繁的地方。一句话概括：

> 一个产品详情页 = **一套 i18n 文案树** + **一份区块布局** + **一组图片/视频覆盖**，
> 三者都由 `landing_content` 表按 `(namespace, lang)` 存储差异，页面用 16 个可插拔区块渲染出来。

`ProductDetailView.vue` 只有约 230 行，全部 16 个区块都在 `components/product/sections/` 下独立实现——这是这套系统能维护的前提。

---

## 1. 区块清单

`src/components/product/sectionIds.ts` 定义了唯一的顺序真相：

| # | id | 组件 | i18n 子树 | 中文标签 |
|---|---|---|---|---|
| 1 | `hero` | `HeroSection` | `hero` | Hero banner |
| 2 | `strip` | `StatStripSection` | `strip` | Key stats |
| 3 | `why` | `WhySection` | `why` | Why this product |
| 4 | `designed` | `DesignedSection` | `designed` | Design highlights |
| 5 | `output` | `OutputSection` | `output` | Performance |
| 6 | `spray` | `SpraySection` | `spray` | Key features |
| 7 | `intelligence` | `IntelligenceSection` | `intelligence` | Smart features |
| 8 | `safety` | `SafetySection` | `safety` | Safety |
| 9 | `multiangle` | `MultiangleSection` | `multiangle` | Flexible design |
| 10 | `compare` | `CompareSection` | `compare` | Comparison |
| 11 | `applications` | `ApplicationsSection` | `applications` | Applications |
| 12 | `scenarios` | `ScenariosSection` | `scenarios` | Use cases |
| 13 | `video` | `VideoSection` | `video` | Video |
| 14 | `kit` | `KitSection` | `kit` | Kit contents |
| 15 | `specs` | `SpecsSection` | `specs` | Specifications |
| 16 | `cta` | `CtaSection` | `cta` | Call to action |

映射关系在两处，必须同步改：

```ts
// sectionIds.ts —— 顺序 + 标签 + 类型
export const SECTION_IDS = ['hero','strip',…,'cta'] as const
export type SectionId = (typeof SECTION_IDS)[number]
export const SECTION_LABELS: Record<SectionId, string> = { … }

// sectionRegistry.ts —— id → 组件
export const SECTION_COMPONENTS: Record<SectionId, Component> = { hero: HeroSection, … }
```

`SECTION_LABELS` 是给后台 `SectionPanel` 显示的，`SECTION_COMPONENTS` 里的 `Record<SectionId, …>` 保证漏写任何一个 id 都会被 TS 报错。

---

## 2. 渲染流程

`ProductDetailView.vue` 的模板只有十几行：

```vue
<div class="d15r-landing" :class="`theme-${theme}`">
  <SectionPanel v-if="editMode" v-model="sectionLayout" />
  <main id="top">
    <template v-for="item in sectionLayout" :key="item.id">
      <component :is="SECTION_COMPONENTS[item.id]" v-if="item.visible" />
    </template>
  </main>
  <div class="lightbox" …>…</div>
</div>
```

关键在 `<component :is>` 的动态渲染——页面结构完全由数据驱动，没有一处写死区块。

### 2.1 参数化：`slug` 即命名空间

```ts
const ns = computed(() => (route.params.slug as string) || 'd15r')
const tt = (p: string) => t(`${ns.value}.${p}`)
watch(ns, (v) => registerProductNamespace(v), { immediate: true })

const IMG_BASE = computed(() => (ns.value === 'd15r' ? '/d15r/images/' : `/images/${ns.value}/`))
```

同一个组件服务所有产品：`/products/y160-delivery-drone` 的 `ns` 就是 `y160-delivery-drone`，文案取 `y160-delivery-drone.hero.title1`，图片取 `/images/y160-delivery-drone/xxx`。

> `CLAUDE.md` 里"ProductDetailView 是 D15R 写死页面"的说法已过期。`d15r` 现在只是**兜底默认值**（`|| 'd15r'`）和几个特判分支（`D15R_IMAGE_SETS`、`/d15r/images/` 前缀）。

### 2.2 主题切换

```ts
const THEME_KEY = 'lp-theme'
const theme = ref<Theme>((localStorage.getItem(THEME_KEY) as Theme) || 'light')
```

外层类名 `theme-dark` / `theme-light` 驱动 `landing.css` 里的 CSS 变量。偏好存 localStorage，与语言无关。

### 2.3 Lightbox

`openLightbox(name)` 通过 `inject` 下发给区块，只有**非编辑模式**下才生效——编辑模式下点击图片是用来替换图片的，不能同时放大。这个判断在 `editMode = computed(() => auth.isLoggedIn)`。

---

## 3. 上下文契约

区块组件不 import 产品数据，全部靠 `inject`。契约定义在 `sectionContext.ts`：

```ts
export interface LandingSectionContext {
  ns: ComputedRef<string>              // 当前产品命名空间
  tt: (p: string) => string            // t(`${ns}.${p}`) 的简写
  imgEdit: (name: string, key?: string) => string  // 带覆盖的图片 URL 解析
  alt: (desc: string) => string        // 统一 alt 文本
  editMode: ComputedRef<boolean>       // 是否管理员登录态
  mailtoHref: ComputedRef<string>      // 带产品名的 mailto 链接
  trackEvent: typeof trackEvent        // 埋点
  openLightbox: (name: string, alt?: string) => void
  nozzleImages: ComputedRef<string[]>
  caseImages: ComputedRef<string[]>
  scenarioImages: ComputedRef<string[]>
  videoResolved: ComputedRef<boolean>
  parsedVideo: ComputedRef<any>
  videoPoster: ComputedRef<string | undefined>
  extraVideos: ComputedRef<{ parsed: { type: string; url: string }; title: string }[]>
}

export const landingSectionKey: InjectionKey<LandingSectionContext> = Symbol('landingSection')

export function useLandingSection(): LandingSectionContext {
  const ctx = inject(landingSectionKey)
  if (!ctx) throw new Error('useLandingSection must be used inside a landing section provider')
  return ctx
}
```

这一层的价值：

- **区块组件零 props**，加一个新区块不需要动父组件的 props 声明。
- **`useLandingSection()` 缺 provider 时直接抛错**，而不是返回 `undefined` 让组件在运行时静默白屏。
- 所有区块共享同一份 `ns`，切换产品时 `computed` 自动重算，无需重新挂载。

图片三组（`nozzleImages` / `caseImages` / `scenarioImages`）在父组件里按 `ns` 决定：

```ts
const D15R_IMAGE_SETS = {
  nozzles: ['page005_img001.png', …4 张],
  cases: ['page010_img002.png', …6 张],
  scenarios: ['page014_img002.png', …4 张],
}
const PLACEHOLDER_SETS = { nozzles: Array(4).fill('/images/placeholder.svg'), … }
const images = computed(() => (ns.value === 'd15r' ? D15R_IMAGE_SETS : PLACEHOLDER_SETS))
```

新产品默认全用 `placeholder.svg`——**不会出现裂图**，但视觉上明确提示"这里还没配图"，这是刻意的。

### 3.1 每个可编辑节点都带标记

区块模板里的每段文字、每张图都挂数据属性：

```vue
<h1 :data-edit-key="`${ns}.hero.title1`">{{ tt('hero.title1') }}</h1>
<img :data-edit-img="`${ns}.hero.mainImg`" :src="imgEdit('page001_img001.png', `${ns}.hero.mainImg`)" />
```

`InlineEditor` 靠全局事件委托找这些属性，所以**新增区块时只要带上 `data-edit-key` / `data-edit-img`，编辑器自动支持，不需要改编辑器代码**。

---

## 4. 内容四层叠加

一个 key（如 `d15r.hero.title1`）的最终值，可能经过四层：

```
① 静态基底   src/i18n/<lang>.json 的 [ns] 子树
              │  （新产品无静态数据时用 defaultLandingTemplate()）
              ▼
② 文案差异   landing_content.content 里除三个特殊键之外的所有叶子
              │  deepMerge(base, diff)，只存改动过的叶子
              ▼
③ 媒体覆盖   content.__images / content.__videos
              │  键级合并，非 en 语言缺键时从 en 行补齐
              ▼
④ 区块布局   content.__layout = [{ id, visible }, …]
              语言无关，任一语言的合法 __layout 即生效
```

三个特殊键在合并前会被剔除：

```ts
const IMAGES_KEY = '__images', VIDEOS_KEY = '__videos', LAYOUT_KEY = '__layout'
const textOverrides = { ...overrideTree }
delete textOverrides[IMAGES_KEY]; delete textOverrides[VIDEOS_KEY]; delete textOverrides[LAYOUT_KEY]

const base = JSON.parse(JSON.stringify(getLocaleMessage(lang)?.[ns] ?? {}))
const merged = deepMerge(base, textOverrides)
i18n.global.setLocaleMessage(lang, { ...msgs, [ns]: merged })   // 一次调用，一次重渲染
```

> **为什么要 `JSON.parse(JSON.stringify())`**：`getLocaleMessage` 返回的是活引用，直接 merge 会把上次的覆盖结果当成新的基底，导致"改一次永久生效、切语言串数据"。深拷贝是这层的安全阀。

`deepMerge` 只认纯对象（`isPlainObject` 排除数组），数组整体替换。所以 `strip: { 0: …, 1: … }` 这种数字键对象能增量合并，而 `gallery: []` 这类数组会被整体覆盖。

### 4.1 初始化：缓存优先 + 并行拉取

```ts
async function loadAndMerge(lang) {
  imgOverridesByLang[lang] = {}; videoOverridesByLang[lang] = {}

  // ① 先同步套用所有命中缓存（跨语言切换时零延迟）
  const uncached = []
  for (const ns of allNamespaces()) {
    const cached = cache.get(`${ns}::${lang}`)
    cached ? applyNamespaceOverrides(lang, ns, cached) : uncached.push(ns)
  }

  // ② 并行拉未缓存的，最后统一应用一次
  const results = await Promise.all(uncached.map(ns => supabase.from('landing_content')
    .select('content').eq('namespace', ns).eq('lang', lang).maybeSingle()))
  for (const r of results) if (r) applyNamespaceOverrides(lang, r.ns, r.content)

  // ③ 布局与媒体从 en 补
  await ensureLayoutFromEn(lang)
  await ensureMediaFromEn(lang)

  // ④ 产品页布局兜底
  for (const ns of ['d15r', ...dynamicNamespaces]) {
    if (!layoutByNs[ns]) layoutByNs[ns] = (ns === 'd15r' || STATIC.en?.[ns]) ? getSectionLayout(ns) : []
  }
}
```

三个设计点：

1. **缓存同步应用**，避免语言切换时闪一下旧文案。
2. **结果先收集再统一应用**，`setLocaleMessage` 只调 N 次（每个 ns 一次）而不是 N×M 次——否则每个响应都会触发一轮全站重渲染。
3. `cache` 是模块级 `Map`，键为 `${ns}::${lang}`，生命周期 = 页面生命周期。

### 4.2 布局的三档回退

`getSectionLayout(ns)` 是**同步**函数，在数据到达前就要给出可渲染结果：

```ts
function getSectionLayout(ns) {
  if (layoutByNs[ns]) return layoutByNs[ns]                 // DB 已加载
  if (ns === 'd15r') return fullSectionLayout()             // legacy 页面：全 16 个
  if (STATIC.en?.[ns])                                      // 静态写过的产品（如 fp800）
    return SECTION_IDS.filter(id => STATIC.en[ns][id] !== undefined)
                      .map(id => ({ id, visible: true }))
  return defaultSectionLayout()                             // 新产品：空白 []
}
```

第二档的判断很讲究：**有静态文案的区块才渲染**。否则数据未加载时会渲染出 16 个只显示原始 key（`d15r.hero.title1`）的空区块。第三档返回空数组，是刻意的——新产品从空白页开始，由管理员在 `/admin/editor` 里排版后再保存 `__layout`。

`normalizeSectionLayout(raw)` 负责外部数据净化：非数组返回 `null`（表示"没存过"），空数组是**合法**结果（表示"存过，且是空白页"），过滤非法 id、去重、`visible !== false` 视为可见。

### 4.3 媒体覆盖的语言回退

`__images` / `__videos` **不走 vue-i18n 的 fallbackLocale**（它们是普通对象，不在 message 树里），所以单独实现键级补齐：

```ts
async function ensureMediaFromEn(lang) {
  if (lang === 'en') return
  for (const ns of allNamespaces()) {
    const content = await getEnContent(ns)
    for (const [k, v] of Object.entries(content[IMAGES_KEY] ?? {}))
      if (!(k in imgOverridesByLang[lang])) imgOverridesByLang[lang][k] = v
    // videos 同理
  }
}
```

**按 key 而非按 namespace 回退**：德语版换了 3 张图，剩下 20 张仍用英文的。这是「部分本地化」能工作的前提。

---

## 5. 可视化编辑器

三件套：`InlineEditor`（浮层 + 面板）、`useInlineEdit`（编辑状态与写入）、`SectionPanel`（区块排序）。

### 5.1 编辑状态

`useInlineEdit.ts` 用**模块级单例**（不是 Pinia，因为只有 4 个值，且需要跨任意组件直接 import）：

```ts
export const dirty = ref(false)
export const saving = ref(false)

applyTextEdit(key, value)   // 写进当前语言 message 树，dirty = true
applyImgEdit(key, value)    // 写进 imgOverridesByLang[lang]
applyVideoEdit(key, value)  // 写进 videoOverridesByLang[lang]
saveAll()                   // → saveAllNamespaces(lang, videos)
reload()                    // 丢弃改动 + location.reload()
```

`applyTextEdit` 支持两种 key 形态：`hero.title`（顶层命名空间）与 `d15r.hero.kicker`（产品命名空间）——因为它只是按 `.` 拆路径、逐级创建。

### 5.2 `InlineEditor` 的三个面板

`InlineEditor.vue`（1136 行）挂在 `App.vue` 里，所以**任意页面**登录后都能编辑，不只是产品页。

| 面板 | 触发 | 内容 |
|---|---|---|
| 文本 | 点 `[data-edit-key]` | textarea + key 显示 + Cancel/Save（⌘+Enter 提交） |
| 图片 | 点 `[data-edit-img]` | URL 输入 + 实时预览 + **🪄 Inpaint** 按钮 |
| 视频 | 点视频区块 | URL 输入 + 类型识别提示（MP4/WebM/YouTube/Bilibili） |

顶部工具栏：语言下拉（EN/ES/DE/FR）、Reload、Save（`dirty` 时显示 `*`）、Sign out。

图片面板的 placeholder 会根据 ns 变：

```
Image URL, or filename in /d15r/images/   （d15r）
Image URL, or filename in /images/        （about / contact）
Image URL, or filename in /images/<ns>/   （其它产品）
```

### 5.3 保存：只存差异

`saveEditableNamespace(ns, lang, editedText, images?, videos?)` 的核心是 `diffAgainst(base, edited)`：

```ts
function diffAgainst(base, edited) {
  // 递归比较，只返回与 base 不同的叶子
  // 跳过 __images / __videos / __layout
}
```

差异相对**静态 json 基底**计算（新产品则相对 `defaultLandingTemplate()`）。好处是：

- 存下来的 jsonb 极小（改 3 个字段就存 3 个字段）。
- 将来改 `en.json` 的默认文案，未覆盖的语言/字段自动跟随更新——不会被"全量快照"冻住。

还有一层**空保存保护**：如果 diff 结果为空且没有图片/视频改动，直接跳过请求，避免把空对象 upsert 上去反而覆盖掉已有内容。

`saveAllNamespaces(lang, videos)` 遍历 `EDITABLE_NAMESPACES` + 动态命名空间，逐个调 `saveEditableNamespace`。这里有一处注释级别的坑：

```ts
const msgs = allMessages?.[ns] ?? {}    // 用 ?? {} 而不是 continue
```

因为「只改了图片、没改任何文字」的命名空间也必须保存——用 `continue` 跳过会把图片改动丢掉。

### 5.4 `SectionPanel`：区块排序

```vue
<draggable :model-value="layout" item-key="id" handle=".drag-handle" @update:model-value="onReorder">
```

基于 `vuedraggable`（底层 `sortablejs`）。四个操作都会置 `dirty = true`：

| 操作 | 效果 |
|---|---|
| 拖拽 | 改顺序 |
| 👁 / 🚫 | 切 `visible`（隐藏但保留配置） |
| − | 从 `layout` 移除 |
| + 某区块 | 追加到末尾，`visible: true` |

`available` 是「所有 SECTION_IDS 减去当前 layout 里已有的」，所以同一个区块不会重复添加。空白页会显示提示：`Blank page — add sections below to build this landing page.`

### 5.5 `InpaintEditor`：局部重绘

从图片面板的 🪄 进入，1136 行的画布应用。能力：

| 能力 | 细节 |
|---|---|
| 画笔涂抹 | `[` `]` 调画笔尺寸，滚轮缩放，`Space`/中键拖拽平移，按住 `Tab` 看原图 |
| 本地 IOPaint | `VITE_IOPAINT_URL`（默认 :8080），未连接时显示 WSL2 启动命令 |
| 云端 FLUX Fill | `☁ FLUX Fill（免费 · 局部重绘）` |
| 云端通义 | `☁ wanx2.1 图像编辑（付费 · 局部重绘）` |
| 尺寸徽标 | `{{imgW}}×{{imgH}}` |
| 保存 | 输入文件名后写回图片覆盖 |

模型下拉 = 本地服务端模型 + 两个云端选项。保存后文件名会回填到图片面板的 URL 输入框。

---

## 6. 样式与动画

- `components/product/landing.css`：整套落地页样式，只在 `ProductDetailView` 里 import。
- 主题走 CSS 变量 + `theme-dark` / `theme-light` 类名。
- 进场动画**全部是 CSS，没有用 `@vueuse/motion`**（`package.json` 里装了但全站无 `v-motion` / `useMotion` 引用，见 09 章）。机制是 `variables.css` 里的一对规则：

  ```css
  .reveal { opacity: 0; transform: translateY(30px) }
  .reveal.visible { opacity: 1; transform: translateY(0) }
  ```

  C500 页面改用自己的 `is-visible` 变体（`c500.css` 的 `.motion-ready .reveal`），并显式兜底「未开启动效时直接可见」：

  ```css
  .c500:not(.motion-ready) .reveal { opacity: 1; transform: none }
  ```

  **对预渲染的影响**：`prerender.mjs` **不做**任何 `opacity` 强制覆盖。静态 HTML 里 `.reveal` 元素仍是 `opacity: 0`，但文本节点真实存在——爬虫读的是 DOM 文本，不是渲染结果，所以不影响收录；JS 加载后 IntersectionObserver 补上 `.visible` / `.is-visible`，视觉才出现。不要指望预渲染产物在禁用 JS 的浏览器里「看起来正常」，它只保证**可索引**。

---

## 7. 如何新增一个产品落地页

最短路径（对应 README 里的「快速定位常见改动」）：

1. `/admin/products` 建产品 → 得到 slug，`category` 选 `agricultural` / `cargo` / `cleaning`。
2. 访问 `/products/<slug>`：此时是空白页（`getSectionLayout` 返回 `[]`），但 i18n 基底已由 `registerProductNamespace` 自动写入 `defaultLandingTemplate()`。
3. 登录后台 → ☰ Sections 添加区块 → 拖动排序。
4. 逐块点文案、点图片替换 → Save。
5. 图片放 `public/images/<slug>/`，或直接在图片面板填完整 URL。

需要**新增区块类型**时（少见）：

1. `SECTION_IDS` 加 id + `SECTION_LABELS` 加标签。
2. `sectionRegistry.ts` 加 `id → Component`（`Record<SectionId, Component>` 会强制你补）。
3. 写 `sections/XxxSection.vue`，用 `useLandingSection()` 取上下文，给可编辑节点加 `data-edit-key` / `data-edit-img`。
4. `landingTemplate.ts` 加默认文案树，否则新产品会渲染出 key。

---

下一篇：[06-admin-and-auth.md](./06-admin-and-auth.md) — 鉴权流程、后台页面与 Functions API 契约。
