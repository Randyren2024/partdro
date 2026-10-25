# 09 · 依赖清单

`package.json` 只有 16 个运行时依赖 + 13 个开发依赖，体量很小。但**其中 4 个是装而未用的**，看着容易误判。这一章按「真的在用 / 间接在用 / 装了没用」三类给结论。

---

## 1. 运行时依赖

| 包 | 版本 | 状态 | 用在哪 |
|---|---|---|---|
| `vue` | ^3.4.0 | ✅ 在用 | 全局，`<script setup lang="ts">` |
| `vue-router` | ^4.2.0 | ✅ 在用 | `src/router/index.ts`，多语言前缀 + 守卫 |
| `pinia` | ^3.0.4 | ✅ 在用 | 只有 `stores/auth.ts` 一个 store |
| `vue-i18n` | ^9.14.5 | ✅ 在用 | `legacy: false` 组合式 API，4 语言 |
| `ant-design-vue` | ^4.0.0 | ✅ 在用 | 表格 / 表单 / 弹窗 / Switch / Tag / Popconfirm 等 |
| `@ant-design/icons-vue` | ^7.0.0 | ✅ 在用 | 图标（含 07 章提到的 `AppstoreOutlined` 兜底图标） |
| `@supabase/supabase-js` | ^2.108.2 | ✅ 在用 | REST + Auth（anon key 直连） |
| `@fontsource-variable/inter` | ^5.3.0 | ✅ 在用 | `main.ts` 第 13 行 `import '@fontsource-variable/inter'` |
| `vuedraggable` | ^4.1.0 | ✅ 在用 | `src/components/product/SectionPanel.vue`——编辑器里拖拽区块排序 |
| `sortablejs` | ^1.15.7 | ⚙️ 间接 | `vuedraggable` v4 的 peer dependency，**不要单独升级**，必须与 `vuedraggable` 匹配 |
| `ws` | ^8.21.3 | ⚠️ 服务端专用 | 只在 `netlify/shared/verifyAdmin.ts` 里注入 Supabase Realtime，见下 |
| `@stripe/stripe-js` | ^9.8.0 | ❌ 未使用 | 无任何引用 |
| `stripe` | ^22.2.3 | ❌ 未使用 | 无任何引用 |
| `vue3-map-chart` | ^0.2.0 | ❌ 未使用 | 无任何引用 |
| `@vueuse/motion` | ^3.0.3 | ❌ 未使用 | **`src/` 里没有任何 `v-motion` / `useMotion` / `MotionPlugin`** |

### 1.1 两个容易误判的点

**`@vueuse/motion` 装而不用。** 站点确实有进场动画，但全部是**纯 CSS**：

- `src/assets/styles/variables.css` 的 `.reveal { opacity: 0; transform: translateY(30px) }` + `.reveal.visible`
- `C500EavisionView` 的 `.motion-ready .reveal` 系列（`src/components/c500eavision/c500.css`）

所以看到 `package.json` 里有 `@vueuse/motion` 就去找 `v-motion`，会一无所获。真要用它，得先在 `main.ts` 里 `app.use(MotionPlugin)`。

**`ws` 不是前端依赖。** 前端 bundle 里没有 `ws`。它只出现在 Netlify Functions：

```ts
// netlify/shared/verifyAdmin.ts
const clientOptions = {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: { transport: ws as unknown as typeof WebSocket },
}
```

原因：**Node 20 没有全局 `WebSocket`**，`supabase-js` 构造 `RealtimeClient` 时会直接抛错——即使你根本不订阅任何 channel。`@types/ws` 就是为了这行 `as unknown as typeof WebSocket` 的类型断言。

### 1.2 `stripe` / `vue3-map-chart` 的来历

三个包都是**早期站点模板的遗留**：模板带支付和世界地图组件，实际业务没用上。`package.json` 里留着没有副作用（Vite 按需打包，未 import 的包**不会进 bundle**），但会让 `npm ci` 慢一点、也让「这个项目支持在线支付吗」这类问题产生歧义。

`.env.example` 里同样留着被注释的 `STRIPE_*` / `SENDGRID_*`。

> **建议**：如果要清理，删这四个（`stripe`、`@stripe/stripe-js`、`vue3-map-chart`、`@vueuse/motion`）+ `.env.example` 对应注释块。但**先确认没有未提交的分支在用它们**——`@vueuse/motion` 在 `v3` 迁移时被 CSS 方案替换，属于「刚删掉代码、还没删依赖」的典型残留。

---

## 2. 开发依赖

| 包 | 版本 | 用在哪 |
|---|---|---|
| `vite` | ^5.0.0 | 开发服务器 + 构建（`outDir: 'dist'`） |
| `@vitejs/plugin-vue` | ^5.0.0 | SFC 编译 |
| `typescript` | ^5.3.0 | `tsconfig.json`（`strict: true`） |
| `vue-tsc` | ^1.8.0 | **实际上跑不起来**，见 §3.2 |
| `@netlify/functions` | ^4.3.0 | `Handler` / `HandlerEvent` / `HandlerContext` 类型 |
| `netlify-cli` | ^26.1.0 | `npm run netlify:dev`（本地起 8888，含 Functions） |
| `playwright` | ^1.60.0 | `scripts/prerender.mjs` 的 `chromium.launch()` |
| `@playwright/test` | ^1.60.0 | 未使用（截图脚本用的是裸 `playwright`，不是 test runner） |
| `sharp` | ^0.34.5 | `scripts/generate-favicons.js` 等图片处理脚本 |
| `cheerio` | ^1.2.0 | 一次性抓取脚本（`fetch-topxgun-blog.mjs`、`c15-polish.mjs`） |
| `e2b` | **2.31.0（锁定）** | 四个 FC 函数创建云沙箱 |
| `@types/ws` / `@types/sortablejs` | — | 类型补充 |

**`e2b` 精确锁 `2.31.0` 而不是 `^`**——沙箱 SDK 的小版本会改 `commands.run` 的返回结构，而 `fc/*/index.ts` 里有大量 `res.stderr` / `res.exitCode` 的读取。升级前必须先跑 `fc/*/test-local.mjs`。

**`@playwright/test` 是误装的**：截图脚本（`scripts/screenshot-*.mjs`）直接 `import { chromium } from 'playwright'`，仓库里没有 `.spec.ts`。唯一「测试」是 `scripts/prerender.test.mjs`，用的是 Node 内置 `node:test`：

```bash
node --test scripts/prerender.test.mjs
```

它不启动浏览器，而是把 `prerender.mjs` 的源码读成字符串、删掉 `import` 和 `main()`、再用 `vm` 执行——用假 page 对象断言三件事：资源阻断策略、新闻页探针的超时值、context 硬关是否生效。**`package.json` 里没有 `test` 脚本**，要手动跑。

---

## 3. 平台与版本约束

### 3.1 Node 20

CI（`.github/workflows/deploy-aliyun.yml`）、`netlify.toml`、`scripts/build-fc.mjs` 的 `target: 'node20'` 三处一致。

这决定了两件事：

- **没有全局 `WebSocket`** → 需要 `ws` 注入（§1.1）
- **可以用 `node:test` / `fetch` / `AbortSignal.timeout`** → 全仓不用 axios、不用 jest

### 3.2 `vue-tsc` 不可用

`vue-tsc@1.8` 与当前 Node / TS 版本不兼容，`vue-tsc --noEmit` 直接崩。所以：

> **`npm run build` 就是类型检查。** 只有 `vite build` 真正通过（esbuild 转译 + 语法层面报错）才算过。但请注意，**Vite 用 esbuild 转译 TS，默认不做类型检查**——真正的类型错误不会拦构建。

这是本仓库最大的质量缺口：`strict: true` 写在 `tsconfig.json` 里，实际没人执行它。任何重构后要靠 IDE 的红波浪线自觉。

### 3.3 手动分包

```ts
// vite.config.ts
manualChunks: {
  vendor: ['vue', 'vue-router'],
  antd: ['ant-design-vue', '@ant-design/icons-vue'],
}
```

只分两包，理由是**首页只需要 antd 的一部分**，但 AntD 的 ESM 结构导致 tree-shaking 效果有限，拆细了反而碎片化。分包上限是按 HTTP/2 多路复用场景估的，不是迷信「越小越好」。

---

## 4. 依赖与模块的对应关系

```
运行时依赖
├─ vue / vue-router / vue-i18n / pinia ──────────► src/ 全部
├─ ant-design-vue / @ant-design/icons-vue ──────► src/views/*、src/components/*
├─ @supabase/supabase-js ───────────────────────► src/lib/supabase.ts、netlify/shared/*
├─ vuedraggable (+ sortablejs) ─────────────────► src/components/product/SectionPanel.vue
├─ @fontsource-variable/inter ──────────────────► src/main.ts
└─ ws ─────────────────────────────────────────► netlify/shared/verifyAdmin.ts

开发依赖
├─ playwright ──────────────────────────────────► scripts/prerender.mjs、scripts/screenshot-*.mjs
├─ sharp ───────────────────────────────────────► scripts/generate-favicons.js
├─ cheerio ─────────────────────────────────────► scripts/fetch-*.mjs、c15-polish.mjs
├─ e2b ─────────────────────────────────────────► fc/{daily-report,ads-daily-report,deep-analysis,inquiry-analysis}
├─ @netlify/functions ──────────────────────────► netlify/functions/*.ts（类型）
└─ netlify-cli ─────────────────────────────────► npm run netlify:dev
```

**注意 `e2b` 在 `devDependencies` 里但被线上函数使用**。这不算错——FC 的三个日报函数各自有独立的 `package.json` 和 `deploy.mjs`，部署时由阿里云侧安装依赖，根 `package.json` 只是给本地 `test-local.mjs` 用的。`fc/bq-etl`、`fc/gcfg`、`fc/inquiry-reply`、`fc/index.ts` 没有自己的 `package.json`，因为它们是**零外部依赖**（只用 `node:crypto` / `fetch`），由 `scripts/build-fc.mjs` 打成单文件。

---

## 5. 升级须知

| 包 | 风险点 |
|---|---|
| `e2b` | 精确锁定，升级要跑四个 `test-local.mjs` |
| `ant-design-vue` | 4.x 内部小版本会改 `a-table` 的 `columns` 类型；`AdminProductsView` 依赖 `pagination: false` |
| `vue-i18n` | `legacy: false` 是全局约定，任何示例代码照抄 Options API 写法都会失效 |
| `vuedraggable` | v4 与 `sortablejs` 版本强绑定，单独升 `sortablejs` 会静默失效 |
| `playwright` | 版本变了必须 `npx playwright install chromium`（`build` 脚本已含）；镜像里缺依赖要 `--with-deps` |
| `pinia` | 3.x 移除了部分 2.x API；本项目只用最基础的 `defineStore`，风险低 |
| `@supabase/supabase-js` | 2.x 内部小版本改过 `auth.getUser` 的错误形态，`verifyAdmin` 依赖它 |

---

## 6. 未被使用的依赖汇总

| 包 | 装的原因 | 现在 |
|---|---|---|
| `@stripe/stripe-js` | 模板自带支付 | 无引用 |
| `stripe` | 模板自带支付 | 无引用 |
| `vue3-map-chart` | 模板自带地图 | 无引用 |
| `@vueuse/motion` | 早期用 `v-motion` 做进场动画 | 已换成 CSS `.reveal`，包未删 |
| `@playwright/test` | 误以为要用 test runner | 截图用裸 `playwright`，单测用 `node:test` |
| `pinia-plugin-persistedstate` | 曾计划持久化 store | `main.ts` 里 `createPinia()` 没挂插件，**实际未启用** |

最后一行值得单独提：`stores/auth.ts` 的状态**没有持久化**，刷新页面靠 `auth.init()` 重新查 session（见 06 §2.1）。装了持久化插件却不挂载，属于「计划过但走了另一条路」。

---

下一篇：[10-tooling-and-scripts.md](./10-tooling-and-scripts.md) — `scripts/`、`related/`、`data/` 导览。
