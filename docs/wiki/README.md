# Partdro / Drone World 代码 Wiki

> 本文档基于仓库当前代码静态分析生成。线上站点：<https://www.droneworld.tech>
>
> **文档可信度约定**：仓库根目录的 `README.md`（端口 3001、旧目录结构）与 `AGENTS.md`（"从源站生成落地页"的 8 阶段工作流）已与代码脱节。本 Wiki 一律以**代码为准**；`CLAUDE.md` 是当前唯一基本准确的架构说明，但仍有个别过期点（例如产品分类枚举），已在各章标注。

---

## 1. 项目定位

Partdro 是一个**无人机（UAV）B2B/B2C 官网 + 内容运营系统**，主体是一个 Vue 3 单页应用，配套：

- Supabase 作为内容数据库（产品 / 新闻 / 案例 / 文档 / 询盘 / 落地页文案）
- 一套"区块化落地页 + 可视化内联编辑 + CMS 差异存储"的自建建站系统
- 构建期 Playwright 预渲染 + 站点地图生成的多语言 SEO 管线
- 阿里云函数计算（FC）承担全站 Web 服务与各类运营自动化（日报、询盘 AI 调研、自动回信）

---

## 2. 文档目录

| 文档 | 内容 |
|---|---|
| [01-architecture.md](./01-architecture.md) | 仓库全景、运行时分层、请求链路、内容四层叠加模型、部署拓扑、关键设计决策 |
| [02-runtime-and-deployment.md](./02-runtime-and-deployment.md) | 环境变量、安装与启动、npm 脚本、本地联调、双轨部署（Netlify / 阿里云） |
| [03-frontend-core.md](./03-frontend-core.md) | 入口装配、路由与守卫、i18n 与多语言 URL、布局组件、主题、SEO 元信息 |
| [04-data-layer.md](./04-data-layer.md) | Supabase 客户端、数据表结构、`useSupabase` 系列组合式函数、归因与埋点 |
| [05-landing-page-system.md](./05-landing-page-system.md) | 16 区块注册表、区块上下文契约、`landing_content` 差异存储、内联编辑器、图像重绘 |
| [06-admin-and-auth.md](./06-admin-and-auth.md) | 鉴权 store、后台页面、Netlify Functions API 契约、权限校验流程 |
| [07-serverless-functions.md](./07-serverless-functions.md) | Netlify Functions（4 个）、阿里云 FC（1 个 Web 入口 + 7 个自动化函数）、IOPaint / FLUX 本地重绘服务 |
| [08-build-and-seo.md](./08-build-and-seo.md) | `inject-seo-links` → `prerender` → `generate-sitemap` 三段式构建管线、多语言 hreflang 策略 |
| [09-dependencies.md](./09-dependencies.md) | 依赖清单与用途、版本约束、未被使用/遗留依赖 |
| [10-tooling-and-scripts.md](./10-tooling-and-scripts.md) | `scripts/` 分类导览、`related/` 运营工具、`data/` 调研数据、`.trae/` 技能与计划文档 |

---

## 3. 30 秒速览

```bash
# 环境：Node 20（CI 与 Netlify 均锁定 20）
npm ci
cp .env.example .env       # 填 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY

npm run dev                # Vite，默认 http://localhost:5173
npm run build              # Playwright 预渲染 + 站点地图 → dist/
npm run preview            # 预览构建产物
npm run netlify:dev        # Netlify Dev，http://localhost:8888（含 Functions）
```

| 维度 | 取值 |
|---|---|
| 前端框架 | Vue 3.4 + TypeScript（`strict`） + Vite 5 |
| UI / 状态 / 路由 | Ant Design Vue 4、Pinia 3（仅 `auth` 一个 store；`pinia-plugin-persistedstate` 已安装但未挂载）、vue-router 4 |
| 国际化 | vue-i18n 9（`legacy: false`），语言 `en / es / de / fr` |
| 后端即服务 | Supabase（anon key 直连 REST） |
| 服务端 | Netlify Functions（Node 20，esbuild）+ 阿里云 FC 3.0 |
| 构建期工具 | Playwright（预渲染）、sharp（图片）、cheerio（抓取） |
| 站点根 | `https://www.droneworld.tech`（`SITE_URL`，见 `src/router/index.ts`） |

---

## 4. 目录地图（顶层）

```
/workspace
├── src/                    # 前端源码（唯一构建入口，见 03/04/05/06）
├── public/                 # 静态资源：favicon 家族、logo、d15r/ 与 images/ 产品图
├── netlify/
│   ├── functions/          # landing-content / admin-products / inquiry-webhook / sitemap
│   └── shared/verifyAdmin.ts
├── fc/                     # 阿里云函数计算源码（全站 Web 入口 + 7 个自动化函数）
├── iopaint/app.py          # 本地图像局部重绘 Flask 服务（:5000）
├── scripts/                # 构建管线 + 一次性迁移/内容/抓取/截图脚本（见 10）
├── related/                # 站外运营工具：GA4 / Google Ads / GSC / 微调实验
├── data/                   # Reddit 调研原始数据与合并结果
├── .trae/                  # 编辑器技能（skills）与计划文档（documents）
├── docs/wiki/              # 本 Wiki
├── netlify.toml            # Netlify 构建、重定向、函数打包配置
├── vite.config.ts          # 端口 5173、手动分包 vendor/antd
├── tsconfig.json           # strict、@/* → src/*（代码实际多用相对路径）
└── package.json
```

---

## 5. 建议阅读路径

- **想跑起来**：02 → 03
- **想改文案/加产品**：05 → 06 → 04
- **想改 SEO / 上线**：08 → 02
- **想理解后端自动化**：07 → 06

---

## 6. 快速定位常见改动

| 我要… | 去哪 |
|---|---|
| 新增一个产品落地页 | `/admin/products` 建档 → 登录后在该产品页上直接内联编辑排版（`/admin/editor` 只是重定向到 `/products/d15r`，见 05 §5、06 §3） |
| 改首页文案 | 内联编辑（登录后）或 `src/i18n/en.json` 的 `hero/stats/...`（05 §2） |
| 改导航/页脚 | `src/components/layout/Header.vue` / `Footer.vue` + `nav`、`footer` 命名空间 |
| 加一门语言 | `src/i18n/index.ts` 的 `SUPPORTED_LOCALES`、`src/router/index.ts` 的 `:locale(...)` 正则、`prerender.mjs` 的 locale 列表 |
| 改询盘通知 | `netlify/functions/inquiry-webhook.ts`（邮件 + 飞书卡片） |
| 改站点地图 | `scripts/generate-sitemap.mjs`（构建期）与 `netlify/functions/sitemap.ts`（运行时） |
