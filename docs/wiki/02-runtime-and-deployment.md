# 02 · 运行方式、环境变量与部署

本章回答三个问题：**本地怎么跑起来**、**每个变量从哪来**、**代码怎么变成线上站点**。

> 环境要求：Node.js **20**（`netlify.toml` 的 `build.environment.NODE_VERSION = "20"`，`scripts/build-fc.mjs` 的 esbuild `target: 'node20'`）。低于 20 会在 `vue-tsc` / esbuild 上出问题，`CLAUDE.md` 记录的 `vue-tsc --noEmit` 不可用也源于此。

---

## 1. 本地启动

```bash
npm ci
cp .env.example .env          # 至少填 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
npm run dev                   # → http://localhost:5173
```

三种本地形态，按需要选：

| 命令 | 端口 | 覆盖范围 | 适合场景 |
|---|---|---|---|
| `npm run dev` | 5173 | 仅 Vite 前端。`/api/*` 请求会 404（`useSupabase` 里的 `callFunction` 走 `VITE_API_BASE`） | 改页面、改样式、改 i18n |
| `npm run netlify:dev` | 8888（转发到 5173） | 前端 + `netlify/functions`，`/api/*` 与 `/sitemap.xml` 真正可调用 | 改 Functions、改后台保存逻辑 |
| `npm run preview` | 4173 | 预览 `dist/` 的构建产物（已预渲染） | 验收构建结果、查 SEO 标签 |

`netlify.toml` 的 `[dev]` 段把 `targetPort = 5173`（Vite）和 `port = 8888`（Netlify Dev）钉死，所以 `netlify dev` 不会自己再起一个 Vite。

`vite.config.ts` 只有 21 行、做四件事：注册 `@vitejs/plugin-vue`、`server.port = 5173`、`build.outDir = 'dist'` + `sourcemap: false`、`rollupOptions.output.manualChunks` 把 `vue`/`vue-router` 拆成 `vendor`、`ant-design-vue`/`@ant-design/icons-vue` 拆成 `antd`。没有配 `resolve.alias`——尽管 `tsconfig.json` 里声明了 `@/* → ./src/*`，源码实际统一用相对路径导入，别依赖别名。

### 可选：本地图像重绘服务

`InpaintEditor.vue` 支持两个可选的本地服务，不启动不影响主流程，只是后台「局部重绘」按钮会显示离线提示：

| 变量 | 默认 | 服务 |
|---|---|---|
| `VITE_IOPAINT_URL` | `http://localhost:8080` | IOPaint（LaMa 模型，CPU 可跑） |
| `VITE_FLUX_EDIT_URL` | `http://localhost:5000` | Flask + FLUX.1-Fill-dev（`gradio_client`） |

`InpaintEditor` 的离线提示里内置了 WSL2 启动命令（`iopaint start --host 0.0.0.0 --port 8080 --model lama --device cpu --no-half ...`），照抄即可。

---

## 2. npm 脚本逐条说明

```jsonc
"dev":      "vite",
"build":    "npx playwright install chromium && vite build && node scripts/inject-seo-links.mjs && node scripts/prerender.mjs && node scripts/generate-sitemap.mjs",
"sitemap":  "node scripts/generate-sitemap.mjs",
"prerender":"node scripts/prerender.mjs",
"preview":  "vite preview",
"netlify:dev": "netlify dev"
```

`build` 是一条五段链路，任何一段失败都算构建失败：

| 段 | 作用 | 细节 |
|---|---|---|
| `playwright install chromium` | 准备预渲染用的浏览器 | CI 里另有一行 `--with-deps` 装系统依赖 |
| `vite build` | 产出 `dist/`（SPA + 分包） | `vue-tsc` 不参与，**构建并不做类型检查**（esbuild 只转译，见 09 §3.2） |
| `inject-seo-links.mjs` | 往 `dist/index.html` 注入 `<noscript>` 全站内链 | 给不执行 JS 的爬虫留一条爬取路径 |
| `prerender.mjs` | 逐「路由 × 语言」落盘静态 HTML | 详见 [08-build-and-seo.md](./08-build-and-seo.md) |
| `generate-sitemap.mjs` | 生成 `dist/sitemap.xml` | 阿里云线上实际由 `fc/index.ts` 调 `sitemapHandler` 出运行时版本（见 07 §1.2） |

包里还有两个**已知失效**的条目，不要照跑：

- `optimize-images` → `scripts/optimize-images.js` **文件不存在**
- `generate-favicons` → `scripts/generate-favicons.js` 存在，但仓库里 favicon 家族已生成完毕，属一次性工具

---

## 3. 环境变量全表

变量按**可见范围**分成三层，这是本项目最容易踩坑的地方：`VITE_` 前缀的会被打进浏览器 bundle，任何没有前缀的只在服务端可读。

### 3.1 前端可见（`VITE_*`，写进 bundle，等同公开）

| 变量 | 必填 | 用途 |
|---|---|---|
| `VITE_SUPABASE_URL` | ✅ | Supabase 项目 URL，`src/lib/supabase.ts` 建客户端 |
| `VITE_SUPABASE_ANON_KEY` | ✅ | anon key，浏览器直连 REST，靠 RLS 保护 |
| `VITE_API_BASE` | 部署时 | 服务端函数基址。空 → 走同源 `/.netlify/functions/*`；CI 里设为阿里云 FC 的 URL |
| `VITE_IOPAINT_URL` | 可选 | 本地 IOPaint 地址 |
| `VITE_FLUX_EDIT_URL` | 可选 | 本地 FLUX 编辑服务地址 |

> **安全提示**：`VITE_SUPABASE_ANON_KEY` 泄露不算事故（RLS 是防线），但 `SUPABASE_SERVICE_ROLE_KEY` 绝不可加 `VITE_` 前缀。

### 3.2 Netlify Functions 运行时

| 变量 | 用途 | 使用者 |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | 绕过 RLS 的写入 / 管理校验 | `landing-content`、`admin-products`、`inquiry-webhook`、`sitemap`、`shared/verifyAdmin.ts` |
| `INQUIRY_WEBHOOK_SECRET` | 校验来源的共享密钥 | `inquiry-webhook` |
| `INQUIRY_NOTIFY_TO` | 新询盘通知收件地址 | `inquiry-webhook` |
| `DIRECTMAIL_ACCESS_KEY_ID` | 阿里云邮件推送 AK | `inquiry-webhook` |
| `DIRECTMAIL_ACCESS_KEY_SECRET` | 同上 | 同上 |
| `DIRECTMAIL_ACCOUNT` | 发信地址，默认 `noreply@droneworld.tech` | 同上 |
| `DIRECTMAIL_REGION` | 默认 `cn-hangzhou` | 同上 |

`DIRECTMAIL_*`、`INQUIRY_*` 这一组在 `.env.example` 里就是给 Netlify 侧准备的，本地跑 `netlify dev` 时同样生效。

预留但当前未启用：`STRIPE_*`、`SENDGRID_*`（`.env.example` 中被注释；`@stripe/stripe-js` / `stripe` 两个依赖也在 `package.json` 里挂着未使用）。

### 3.3 阿里云 FC 各函数

FC 的环境变量在控制台按函数配置，**不进仓库**。CI 只上传代码、不覆盖这些值（见 `scripts/deploy-report-fns.mjs` 的注释）。

**通用 / Web 入口（`fc/index.ts`）**

| 变量 | 默认 | 用途 |
|---|---|---|
| `OSS_BUCKET` | 构建期 `__OSS_BUCKET__` | 静态站点桶 |
| `OSS_REGION` | `cn-hongkong` | 桶所在区域 |
| `OSS_INTERNAL` | `true` | 走内网 endpoint（`oss-<region>-internal`），省流量费 |
| `INQUIRY_REPLY_UPSTREAM` | — | `/reply` 反代目标（`inquiry-reply` 的 FC 域名） |

`OSS_AK_ID` / `OSS_AK_SECRET` 只在各业务函数里出现，`fc/index.ts` 本身依赖 FC 服务角色免密读取 OSS。

**日报类（GSC / Ads / Deep）**

| 变量 | 所属 | 说明 |
|---|---|---|
| `GSC_SITE_URL` | daily-report | 默认 `sc-domain:droneworld.tech` |
| `GSC_TARGET_URL` | daily-report | 默认 fp800 落地页 |
| `GSC_SA_JSON` | daily-report | Service Account JSON；**缺失时回退 `refresh_token` 流程** |
| `GSC_CLIENT_ID` / `GSC_CLIENT_SECRET` / `GSC_REFRESH_TOKEN` | daily-report | 回退路径 |
| `E2B_API_KEY` / `E2B_API_URL` / `E2B_DOMAIN` | 日报类 | E2B 云沙箱 |
| `E2B_TEMPLATE` | daily-report / deep-analysis | 默认 `claude-code-gsc` 一类模板 ID |
| `ANTHROPIC_AUTH_TOKEN` / `ANTHROPIC_BASE_URL` / `ANTHROPIC_MODEL` | deep-analysis | 指向百炼的 Anthropic 兼容中转；模型默认 `deepseek-v4.1-flash`（也可 `qwen3.7-max`） |
| `BAILIAN_API_KEY` | deep-analysis | 百炼直连 |
| `ADS_CUSTOMER_ID` / `ADS_LOGIN_CUSTOMER_ID` / `ADS_DEVELOPER_TOKEN` / `ADS_CLIENT_ID` / `ADS_CLIENT_SECRET` / `ADS_REFRESH_TOKEN` / `ADS_SA_JSON` | ads-daily-report | Google Ads API **v25** |
| `GA4_PROPERTY_ID` / `GA4_CLIENT_ID` / `GA4_CLIENT_SECRET` / `GA4_REFRESH_TOKEN` / `GA4_SA_JSON` | ads-daily-report | GA4 Data API |

**数据与邮件**

| 变量 | 用途 |
|---|---|
| `BQ_PROJECT` / `BQ_DATASET`（默认 `dw_analytics`）/ `BQ_LOCATION`（默认 `asia-east2`） | BigQuery ETL 目标 |
| `BQ_SA_JSON` / `SA_JSON` / `GCFG_SA_JSON` | 三个函数各自的服务账号 JSON 别名 |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | `inquiry-analysis` 回写 `inquiries.lead_profile` |
| `DIRECTMAIL_*` | 日报与询盘邮件 |
| `DM_TO` / `DM_REPLY_TO` / `DM_FROM_ALIAS`（默认 `Randy Ren - Partdro`） | 收件 / 回信 / 发信别名 |
| `ARCHIVE_BCC` | 每封回信强制密送归档 |
| `REPLY_MODEL`（默认 `qwen-plus`）/ `DASHSCOPE_API_KEY` | 询盘回信草稿模型 |

**飞书（`fc/shared/feishu.ts`）**

| 变量 | 行为 |
|---|---|
| `FEISHU_APP_ID` / `FEISHU_APP_SECRET` / `FEISHU_OPEN_ID` | 三者任一缺失 → `sendFeishuReport` 打印跳过日志并 `return false`，**不视为错误** |

---

## 4. 双轨部署

同一份 `dist/` 与同一份 handler 代码，被两套平台消费。两条轨道互不阻塞，任意一条挂掉另一条仍能服务。

### 4.1 轨道 A：Netlify

配置全在 `netlify.toml`（49 行），逐条都已经有明确理由：

```toml
[build]          command = "npm run build"; publish = "dist"; functions = "netlify/functions"
[build.environment] NODE_VERSION = "20"
[dev]            targetPort = 5173; port = 8888; framework = "vite"
[functions]      node_bundler = "esbuild"
```

`redirects` 的**顺序即优先级**，前三条必须出现在 SPA catch-all 之前：

| # | from | to | status | 为什么必须在前 |
|---|---|---|---|---|
| 1 | `/api/*` | `/.netlify/functions/:splat` | 200 | 否则被 `/*` 吞掉，API 全 404 |
| 2 | `/sitemap.xml` | `/.netlify/functions/sitemap` | 200 | 静态站点地图会漏掉 Supabase 里的新产品 / 新文章 |
| 3 | `/products/c500` | `/products/c500-delivery-drone` | **301** | C500 历史短链，含 Google Ads 的旧 finalUrl；301 保权重 |
| 4 | `/*` | `/index.html` | 200 | SPA fallback |

`headers` 段给 `/images/*` 与 `/assets/*` 打 `max-age=31536000, immutable`。

### 4.2 轨道 B：阿里云（OSS + FC）

`.github/workflows/deploy-aliyun.yml`，触发条件 `push: [main]` 或手动 `workflow_dispatch`，并发组 `deploy-aliyun` 且 `cancel-in-progress: false`（部署不允许被新提交打断）。

十步链路：

1. `checkout`
2. `setup-node 20` + npm 缓存
3. `npm ci`
4. `npx playwright install --with-deps chromium`
5. `npm run build`，注入 `VITE_API_BASE=${{ secrets.ALIYUN_FC_API_URL }}`、`VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY`
6. 安装 `aliyun-cli v3.5.1`，region `cn-hongkong`
7. **上传静态产物**：
   ```bash
   aliyun oss sync dist/ "oss://$BUCKET/" -e oss-cn-hongkong.aliyuncs.com -f
   ```
   > 刻意**不加 `--delete`**。桶里还有 `ads-reports/`、`gsc-reports/`、`gsc-deep-analysis/`、`fc/` 等运维产物，加了 `--delete` 会被一起清掉。代价是旧 hash 资源会残留，需要偶尔手动清理。
8. `node scripts/build-fc.mjs`：esbuild 打包 `fc/index.ts` → `dist-fc/index.js`（bundle / cjs / node20 / minify，`define` 注入 `__OSS_BUCKET__`、`__OSS_REGION__`）
9. `zip fc-code.zip index.js` + `aliyun oss cp` + `aliyun fc PUT /2023-03-30/functions/<fn>`，**重试 5 次、间隔 20s**（FC 更新接口偶发抖动）
10. `node scripts/deploy-report-fns.mjs`：打包并更新 `gsc-daily-report`、`ads-daily-report`、`gsc-deep-analysis` 三个函数

第 10 步的取舍写在脚本注释里：**只重新打包 + 上传代码 + 合并飞书凭据，绝不覆盖函数已有的 GSC / Ads / E2B / DirectMail 环境变量**。因此 CI 不需要持有这些第三方密钥，只需要 OSS 的 AK。

`deploy-report-fns.mjs` 的另一处细节：阿里云 FC 的 OpenAPI 签名没有现成 SDK，脚本用 `node:crypto` 自实现了 **ACS3-HMAC-SHA256**（`sha256hex` / `hmacHex` / `x-acs-date` / `x-acs-content-sha256` / `x-acs-signature-nonce`），host 默认 `fcv3.<region>.aliyuncs.com`，可用 `FC_API_HOST` 覆盖。

### 4.3 为什么静态站点还需要 FC 做 Web 入口

OSS 静态托管**不支持子目录 index 解析**（`/products/d15r` 不会自动找 `/products/d15r/index.html`），而 prerender 产出的正是这种目录结构。所以 `fc/index.ts` 承担了 Web 服务器的职责：

| 职责 | 实现 |
|---|---|
| 静态资源 + 目录 index 解析 | `serveStatic()`：尾斜杠 301、`/index.html` 301、有扩展名走精确对象、**无扩展名只试 `<path>/index.html`** |
| 缓存策略 | `cacheControlFor()`：`assets/` 1 年 immutable、`images/` 1 天、其它 60 秒 |
| API 复用 Netlify handler | `API_HANDLERS` 直接 import 四个 Netlify Function 的 `handler` |
| `/reply` 反代 | FC 默认域名 `*.fcapp.run` 会给所有响应强加 `Content-Disposition: attachment`，邮件里的审批链接会被当成下载；自定义域名的证书私钥无法从 API 读回，改 routes 有打挂 HTTPS 的风险，故在已有的 partdro-api 内做只读转发并强制 `inline` |
| 裸域归一 | `canonicalHostRedirect()`：`droneworld.tech` → `www.droneworld.tech`（301） |
| 协议 | `OPTIONS` → 204；非 GET/HEAD（且非 `/api/*`）→ 405 |

`serveStatic()` 里有一条不起眼但很关键的注释：无扩展名时**只**尝试 `<path>/index.html`，不尝试 `<path>`，因为 OSS 控制台建目录会留下 0 字节的占位对象，直接返回它会得到空响应而不是 HTML。

---

## 5. 部署后的自检清单

```bash
# 1) 构建产物是否含预渲染 HTML
ls dist/products/d15r/index.html

# 2) 站点地图条目数
grep -c "<url>" dist/sitemap.xml

# 3) FC Web 入口是否健康（阿里云）
curl -I https://www.droneworld.tech/products/d15r        # 期望 200 + text/html
curl -I https://droneworld.tech/products/d15r            # 期望 301 → www
curl -I https://www.droneworld.tech/assets/<any>.js      # 期望 immutable

# 4) API 是否直达（Netlify）
curl -s https://<site>/.netlify/functions/landing-content?ns=hero&lang=en | head

# 5) 仓库自带的诊断脚本
node scripts/verify-fc-deploy.mjs
node scripts/test-fc-handler.mjs
```

`.github/workflows/deploy-aliyun.yml` 的失败排查通常落在三处：Playwright 系统依赖没装（第 4 步）、OSS 权限（第 7 步）、FC `PUT` 的签名或 AK 不对（第 9 步）。

---

下一篇：[03-frontend-core.md](./03-frontend-core.md) — 入口装配、路由、i18n 与多语言 URL。
