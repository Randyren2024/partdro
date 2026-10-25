# 01 · 整体架构

## 1. 仓库全景

这是一个"一个主站 + 若干运维子项目"的单仓：

| 目录 | 角色 | 是否参与 `npm run build` |
|---|---|---|
| `src/` | Vue 3 SPA 源码（唯一前端构建入口 `index.html` → `src/main.ts`） | ✅ |
| `public/` | 不经打包的静态资源（favicon、logo、`d15r/`、`images/`） | ✅ 原样拷入 `dist/` |
| `netlify/functions/` | Netlify 服务端函数（写入类 API + 询盘 Webhook + 运行时 sitemap） | ❌（Netlify/esbuild 单独打包） |
| `fc/` | 阿里云函数计算源码：`fc/index.ts` 是全站 Web 入口；其余 8 个是运营自动化 | ❌（`scripts/build-fc.mjs` 单独打包） |
| `iopaint/app.py` | 本地图像局部重绘服务（Flask，:5000） | ❌ |
| `scripts/` | 构建管线三件套 + 大量一次性迁移/内容/抓取/截图脚本 | ✅ 仅 `inject-seo-links.mjs`、`prerender.mjs`、`generate-sitemap.mjs` |
| `related/` | 站外运营工具（GA4 / Google Ads / GSC / Colab 微调实验） | ❌ |
| `data/` | Reddit 调研原始数据（JSON/CSV）与合并结果 | ❌ |
| `.trae/` | 编辑器技能与计划文档（人读，不参与运行） | ❌ |

---

## 2. 运行时分层

```
┌──────────────────────────────────────────────────────────────────────┐
│ 浏览器（SPA + 已预渲染的静态 HTML）                                    │
│   HomeView / ProductsView / ProductDetailView / C500EavisionView ...  │
│   composables: useSupabase / useLandingContent / useInlineEdit / ...   │
└───────┬───────────────────────────────────────────────┬──────────────┘
        │ (1) 读：Supabase REST（anon key）              │ (2) 写：/api/*（Bearer JWT）
        ▼                                               ▼
┌──────────────────────┐                    ┌───────────────────────────┐
│ Supabase             │                    │ 网关层（二选一）            │
│ products/product_langs│                    │  · Netlify Functions       │
│ posts / cases / ...  │                    │  · 阿里云 FC（fc/index.ts）│
│ landing_content      │◄───────────────────┤ landing-content           │
│ inquiries / admins   │  service_role      │ admin-products            │
└───────┬──────────────┘                    │ inquiry-webhook / sitemap │
        │ Database Webhook                  └───────────┬───────────────┘
        │ (INSERT inquiries)                            │ 静态资源
        ▼                                               ▼
┌──────────────────────┐                    ┌───────────────────────────┐
│ FC: inquiry-analysis │                    │ 阿里云 OSS dist/           │
│ FC: inquiry-reply    │                    │ （预渲染 HTML + assets）    │
└──────────────────────┘                    └───────────────────────────┘
```

要点：

1. **读走 Supabase 直连**（浏览器持 anon key，靠 RLS 保护）；**写走函数**（`service_role` 只在服务端）。
2. **同一套 handler 被两个平台复用**：`fc/index.ts` 直接 `import { handler } from '../netlify/functions/...'`，所以 Netlify 与阿里云两条部署链路的行为一致。
3. **HTML 首屏是预渲染产物**：构建期把每个 `路由 × 语言` 用 Playwright 渲染成 `dist/<path>/index.html`，线上由 FC 读 OSS 对象直出。

---

## 3. 前端内部结构

```
src/
├── main.ts                # createApp → pinia → router → i18n → Antd → mount
├── App.vue                # a-config-provider + 全局 InlineEditor + WhatsApp 浮标 + Organization JSON-LD
├── router/index.ts        # 路由表、locale 前缀、admin 守卫、meta/canonical 注入
├── i18n/
│   ├── index.ts           # createI18n、locale 探测、SUPPORTED_LOCALES
│   ├── en|es|de|fr.json   # 静态文案（顶层即"命名空间"）
│   └── landingTemplate.ts # 新产品默认落地页 i18n 骨架
├── layouts/DefaultLayout.vue        # Header + <router-view> + Footer
├── views/                 # 路由级页面（12 个）
├── components/
│   ├── layout/            # Header、Footer
│   ├── home/              # HeroBanner、CompanyStats、ProductSolutions、LatestNews
│   ├── product/           # 区块注册表 + 16 个 section + SectionPanel
│   ├── c500eavision/      # C500 专属长页组件
│   ├── admin/             # InlineEditor、InpaintEditor、JsonField
│   └── common/            # InquiryForm、LangSwitcher
├── composables/           # 9 个组合式函数（数据 / CMS / 追踪 / 归因 / 视频 / 重绘）
├── stores/auth.ts         # Pinia 鉴权
├── lib/netlifyApi.ts      # callFunction()：统一 /api/* 调用与 Authorization
├── seo/structuredData.ts  # Product / Organization / Breadcrumb JSON-LD
├── supabase/client.ts     # anon client
├── data/c500eavision.ts   # C500 静态结构数据（语言中性）
└── types/index.ts         # Product / Post / Case / Document / Inquiry / Lang
```

依赖方向（单向，无环）：

```
views / components
   ↓
composables + stores
   ↓
lib/netlifyApi + supabase/client
   ↓
types
```

`components/product/sections/*` 是唯一"反向"依赖的地方：它们不接收 props，而是通过 `inject` 从 `ProductDetailView` 拿上下文（见 05 章）。

---

## 4. 内容四层叠加模型（本项目最核心的架构）

落地页的可见内容 = 四层依次覆盖：

```
① 静态 i18n JSON            src/i18n/<lang>.json 的 [namespace]
        ↓ deepMerge（只覆盖被改过的叶子）
② landing_content 文案差异   DB 表 landing_content: (namespace, lang) → content(JSON)
        ↓ 键级合并（非 en 语言缺键时从 en 行补）
③ __images / __videos 覆盖  同一个 content 对象里的特殊键
        ↓
④ __layout 区块顺序与显隐    同一个 content 对象里的特殊键（语言无关）
```

- **①** 是"代码里的默认值"，也是新环境的种子。
- **②** 只存**差异叶子**（`diffAgainst`），因此改版 JSON 后未被改动的文案自动跟随新默认值。
- **③/④** 与文案同表不同键，省掉两张表。
- 运行时由 `useLandingContent()` 在 `locale` 变化时 `loadAndMerge(lang)`，最终落到 `i18n.global.setLocaleMessage` + `reactive` 的覆盖对象上（详见 05 章）。

---

## 5. 请求链路（三个典型场景）

### 5.1 访问产品页 `GET /de/products/fp800-agricultural-drone`

1. 浏览器 → `https://www.droneworld.tech/de/products/fp800-agricultural-drone`
2. FC `handler` 收到事件：`path` 无扩展名 → 只尝试 OSS 对象 `de/products/fp800-agricultural-drone/index.html`
3. 命中构建期预渲染的 HTML（含标题、canonical、hreflang、正文快照）→ 直出
4. HTML 加载 `src/main.ts` → 路由 `/:locale(en|es|de|fr)?` 匹配 `locale=de` → `i18n.locale = 'de'`
5. `ProductDetailView` 以 `route.params.slug` 作为**命名空间**渲染区块；`useLandingContent` 拉 `landing_content` 的 `de` 行并深合并

### 5.2 访客提交询盘

```
InquiryForm
  → supabase.from('inquiries').insert({...form, ...attributionFields(route.path, productSlug)})
  → Supabase RLS 允许 anon INSERT
  → Database Webhook（带 x-webhook-secret）
  → FC/Netlify `inquiry-webhook`
      ├─ Aliyun DirectMail：发送通知邮件到 info@droneworld.tech
      ├─ 飞书：tenant_access_token → im/v1/messages 交互卡片（含签名回信链接）
      └─ 异步触发 FC `inquiry-analysis`（x-fc-invocation-type: Async，3s 超时竞速）
```

### 5.3 管理员改文案

```
登录 /admin/login（username → <username>@admin.partdro.com，Supabase Auth）
  → 进入任意页面，全局 InlineEditor 生效（editMode = auth.isLoggedIn）
  → 点击 [data-edit-key] 元素 → 文本面板 → applyTextEdit()（本地 i18n 就地更新）
  → Save → saveAll() → saveAllNamespaces(locale)
  → 逐命名空间 POST /api/landing-content（Bearer JWT）
  → verifyAdmin 校验 JWT + admins 表 → service_role upsert landing_content
```

---

## 6. 部署拓扑（双轨）

```
                          ┌──────────────────────┐
   git push main ────────►│ GitHub Actions       │
                          │ deploy-aliyun.yml    │
                          └──────┬───────────────┘
                                 │ npm run build（预渲染）
                                 ├──► aliyun oss sync dist/ → oss://<bucket>/
                                 ├──► scripts/build-fc.mjs → dist-fc/index.js
                                 │      → zip → oss://<bucket>/fc-code.zip
                                 ├──► aliyun fc PUT functions/<fn>（更新代码）
                                 └──► scripts/deploy-report-fns.mjs（日报三函数）
                                          │
   用户 ──► www.droneworld.tech（CNAME → FC 自定义域名）
                                          │
                                    fc/index.ts
                                    ├─ /api/* → 复用 netlify handler
                                    ├─ /sitemap.xml → 运行时生成
                                    ├─ /reply → 反代 inquiry-reply（去掉 Content-Disposition: attachment）
                                    └─ 其余 → 读 OSS 静态对象（含规范化 301、干净 404）

   Netlify（另一条部署链路，同一份 dist/ + netlify/functions）
   ├─ /api/* → /.netlify/functions/:splat
   ├─ /sitemap.xml → sitemap 函数
   └─ /* → /index.html（SPA fallback）
```

为什么要 FC 承担全站路由（源码注释里写得很明确）：OSS 静态托管**不支持子目录 index 解析**（`/de/cases` 不会命中 `de/cases/index.html`），且路由规则只支持 301 不支持内部改写。因此用 FC 读对象并实现完整路由。

---

## 7. 关键设计决策

| 决策 | 原因（来自代码注释） |
|---|---|
| `en` 不带语言前缀，`es/de/fr` 带前缀 | 保持根路径已收录 URL 不变，同时让每种语言有独立可抓取 URL；`/en/*` 会被 301 去前缀避免重复内容 |
| 语言判定不看 `localStorage` | 避免在英文 URL 上残留上次选择的语言，导致正文语言与 URL/canonical 不一致 |
| 落地页文案存"差异"而非全量 | 静态 JSON 改版后，未被管理员改过的文案自动跟随；DB 行体积小 |
| 区块用 `provide/inject` 而非 props | 16 个 section 结构各异，避免 `ProductDetailView` 出现巨大 props 列表 |
| 构建期预渲染而非 SSR | 纯静态托管 + 抓取器友好；预渲染脚本会等待 `/rest/v1/` 请求 idle 再落盘 |
| 询盘通知在服务端发 | 邮箱/飞书凭据不能进前端；同时用 HMAC 签名链接实现"机器写、人点头"的自动回信 |
| 图片重绘在本地服务 | 图像与提示词数据量大、单价高，且管理员只在内网使用；Flask 放开 CORS 供浏览器直连 |

---

## 8. 已知的历史包袱

| 现象 | 说明 |
|---|---|
| `README.md` 仍写 3001 端口与 `partdro_vue` 结构 | 实际端口 5173（`vite.config.ts`） |
| `CLAUDE.md` 写 `ProductCategory = 'window' \| 'solar'` | 实际为 `'agricultural' \| 'cargo' \| 'cleaning'`（`src/types/index.ts`） |
| `AGENTS.md` 的 8 阶段工作流 | 引用的 `src/data/products.ts`、`scripts/screenshot-full.mjs` 在本仓库不存在，属旧仓库流程 |
| `scripts/optimize-images.js` | `package.json` 有 `optimize-images` 脚本，但文件已不存在（`generate-favicons.js` 存在） |
| `netlify/functions/sitemap.ts` | 构建期已生成静态 `dist/sitemap.xml`，但 `fc/index.ts` 仍优先调用该函数生成运行时 sitemap（见 07 §1.2） |
| `src/components/admin/JsonField.vue` | 通用 JSON 编辑器，当前未被引用 |
| `vue3-map-chart`、`stripe`、`@stripe/stripe-js` | 已安装但站内无业务代码引用（见 09 章） |

---

下一篇：[02-runtime-and-deployment.md](./02-runtime-and-deployment.md) — 环境变量、npm 脚本、本地联调与双轨部署。
