# 集成 eavision C500 落地页到 partdro 项目

## Context

用户做了一个独立的 Vue 3 全屏沉浸式 C500 落地页项目（`C:\Users\81102\Desktop\eavision_c500_landing_page_vue`），用于 Google Ads 广告投放。现在要把它集成到 partdro 主站作为**备用落地页**，与现有的 `/products/c500-delivery-drone`（ProductDetailView 驱动）并存。

**用户决策**：
- 路由：`/products/c500-partdro-eavision`（固定路径，非 :slug）
- 布局：挂 DefaultLayout（带 partdro 主站 header/footer）
- 文案：翻译成 en/es/de/fr 四语种，接入 vue-i18n

**为什么不走 ProductDetailView 的 section 注册系统**：eavision 落地页是 7 组件硬编码的媒体叙事流（MediaStory×5 + GallerySection×5 交替节奏），强行塞进 section-registry 会破坏叙事结构。新建独立视图 `C500EavisionView.vue` 直接挂载组件。

---

## 文件清单

### 新建（10 个 + 4 个 i18n 追加）

| 路径 | 职责 |
|---|---|
| `src/views/C500EavisionView.vue` | 主视图，组装 7 组件 + onMounted + i18n + SEO watch |
| `src/components/c500eavision/ProductNav.vue` | 页内锚点导航，sticky top 改 74px |
| `src/components/c500eavision/ScrollIndicator.vue` | 自定义滚动条，top 改 74px |
| `src/components/c500eavision/C500Media.vue` | 图片/视频媒体，IntersectionObserver 播放 |
| `src/components/c500eavision/MediaStory.vue` | 媒体故事 + powerMetrics |
| `src/components/c500eavision/GallerySection.vue` | 3 variant 画廊（slides/tabs/cards） |
| `src/components/c500eavision/DecisionSection.vue` | 决策能力手风琴 |
| `src/components/c500eavision/VideoModal.vue` | 视频弹窗 |
| `src/composables/useC500State.ts` | 3 个 ref（reducedMotion/motionReady/videoOpen），TS 化 |
| `src/data/c500eavision.ts` | 结构数据 + 资源路径（OSS CDN），文案移除 |
| `src/components/c500eavision/c500.css` | 样式，全局选择器收编 + ProductNav/ScrollIndicator top 调 74px |
| `src/i18n/{en,es,de,fr}.json` | 各追加 `c500eavision` 命名空间 |

### 修改（1 个）

| 路径 | 修改点 |
|---|---|
| `src/router/index.ts` | siteChildren 在 `products/:slug` 前插入固定路径 `products/c500-partdro-eavision` |

**不修改**：main.ts（c500.css 由视图级按需 import）、vite.config.ts（无 @ alias，用相对路径）、DefaultLayout.vue、Header.vue。

---

## 关键改造点

### 1. 样式隔离
- **不引入 base.css**（全局 html/body/* 重置会污染 partdro 浅色主题）
- **c500.css 改造**：
  - 全局 `sup` / `sup a` / `button:focus-visible`（行 40-42）→ 收成 `.c500 sup` 等
  - `html.industrial-product-detail-scroll` 三行（行 201-203）→ 删除（主站浅色，不强求暗色滚动条）
  - ProductNav 重复定义（行 73 + 行 95）→ 合并，`top: 0` 改 `top: var(--header-height, 74px)`，`z-index: 20`（低于 Header 1000）
  - `.product-scroll-indicator { top: 0 }` → `top: var(--header-height, 74px)`
  - `.hero { height: calc(100vh - 220px) }` → 视觉验证后微调（原 220 = ProductNav 55 + 缓冲；现 Header 74 + ProductNav 55 = 129，建议 `calc(100vh - 184px)`）
- **引入方式**：`C500EavisionView.vue` 顶部 `import '../components/c500eavision/c500.css'`（视图级按需加载）

### 2. .reveal 冲突处理
partdro `variables.css` 行 75 有全局 `.reveal { opacity:0; transform:translateY(30px) }`，eavision 用 `.reveal.is-visible`（partdro 用 `.reveal.visible`，类名不冲突）。c500.css 的 `.motion-ready .reveal` 特异性高于 partdro 的 `.reveal`，会覆盖。**保留 .reveal 类名**，依赖 c500.css 特异性覆盖。若 build 后发现动画异常再考虑改名 `.c500-reveal`。

### 3. i18n 组织（c500eavision 命名空间）
参照 d15r 的层级模式。结构：
```
c500eavision.hero.{eyebrow,title,summary,watchVideo}
c500eavision.nav.{intro,specs}
c500eavision.overview.{paragraphs.{0,1,2}, technologyAlt}
c500eavision.abilities.{0-7}.{title,alt,detail?}
c500eavision.powerMetrics.{0-3}.label
c500eavision.stories.{0-4}.title
c500eavision.galleries.{power,energy,perception,cluster,functions}.{label, items.{0-N}.{title,detail?,detailParts?,detailNote?,titleParts?}}
c500eavision.decisions.{0-2}.{title,detail}
c500eavision.applications.{0-3}.title
c500eavision.packages.{0-3}.alt
c500eavision.specifications.{0-15}.label
c500eavision.noteIntro.{0-3}
c500eavision.notes.{0-9}.{text,extra?}
```

### 4. 数据层分离
`src/data/c500eavision.ts` 只保留：
- 资源路径：`ASSET_BASE` / `VIDEO_BASE` / `img()` / `vid()` / `heroImage` / `heroVideo` / `technologyImage`
- 结构数据：abilities 的 key/image/video、galleries 的 variant/autoplay/overlayCaption/items 的 image/video/notes（note 编号）、specifications 的 value（数值）、notes 的 extra 结构
- **移除所有中文字符串**（title/detail/label/text 全走 i18n）

### 5. 路由配置
`src/router/index.ts` siteChildren 在 `products/:slug` 前插入：
```ts
{
  path: 'products/c500-partdro-eavision',
  name: 'c500-eavision',
  component: () => import('../views/C500EavisionView.vue'),
},
```
vue-router 4 用评分匹配（static > dynamic），显式前置更清晰。

### 6. 组件 TS 化
- 所有 `<script setup>` → `<script setup lang="ts">`
- props 加类型：`defineProps<{ image?: string; video?: string; ... }>()`
- ref 泛型：`ref<HTMLVideoElement | null>(null)`
- import 路径：`from '../../composables/useC500State'`、`from '../../data/c500eavision'`（去掉 .js）

### 7. SEO meta
`META_ROUTES` 不含 c500-eavision，在 C500EavisionView.vue 内自设 watch（参照 ProductDetailView.vue 行 124-145 模式）写 title/description/og。

---

## 实施顺序

1. **骨架文件**：useC500State.ts → c500eavision.ts（删中文）→ c500.css（执行样式改造）
2. **基础组件**：C500Media.vue（TS 化）→ ProductNav/ScrollIndicator/VideoModal（TS 化 + 路径）
3. **数据驱动组件**：MediaStory/DecisionSection（接入 i18n tt）→ GallerySection（最复杂，最后）
4. **主视图**：C500EavisionView.vue（组装 + onMounted + i18n + SEO watch + import c500.css）
5. **i18n**：en.json 写完 → es/de/fr 翻译
6. **路由**：router/index.ts 加固定路径
7. **build 验证**：`npm run build`（build 即类型检查）
8. **dev 验证**：`npm run dev` → 访问 `/products/c500-partdro-eavision` + 切语言

---

## 验证方法

### Build
```bash
npm run build
```
build 即类型检查（CLAUDE.md 明确 vue-tsc 坏）。失败则修 TS 错误（常见：props 类型、ref 泛型、event 类型）。

### Dev + 浏览器
```bash
npm run dev
```
访问 `http://localhost:<port>/products/c500-partdro-eavision`（注意实际端口）。

### 检查清单
| 检查项 | 预期 |
|---|---|
| Header 不遮挡 ProductNav | ProductNav sticky top:74px，紧贴 Header 下方 |
| /de/products/c500-partdro-eavision | 德语文案 |
| /es/ / /fr/ 前缀 | 对应语言文案 |
| 视频自动播放 | IntersectionObserver 进入视口播放，离开暂停 |
| VideoModal | 点击 Watch Video 弹出，Escape 关闭 |
| GallerySection slides/tabs/cards | 三 variant 切换正常，autoplay 5s |
| DecisionSection 手风琴 | 点击展开/收起，视频切换 |
| reveal 动画 | 滚动进入视口 fade-up |
| Header/Footer 浅色 | 主站 header/footer 不被 c500 暗色污染 |
| ScrollIndicator | 右侧自定义条 hover 显示 |

### 风险点
1. **OSS CDN 跨域**：img/video 标签无跨域问题，无需处理
2. **.reveal 冲突**：c500.css 特异性覆盖 partdro 全局 .reveal，可接受
3. **hero 高度**：原 calc(100vh - 220px) 基于无 Header 全屏，现挂 DefaultLayout 需视觉微调
4. **i18n key 漂移**：命名空间大，先写 en.json，用 t() 兜底返回 key 本身快速发现遗漏
