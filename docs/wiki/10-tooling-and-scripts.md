# 10 · 工具与脚本

`scripts/` 里躺着 **80 多个文件**，但只有 5 个参与构建/部署，其余全是**一次性脚本**——它们记录了这个站点是「怎么被做出来的」，而不是「怎么运行的」。

理解这批脚本的关键是分清两类：

| 类型 | 特征 | 能不能删 |
|---|---|---|
| **管线脚本** | 被 `package.json` 或 CI 引用，每次构建/部署都跑 | 不能 |
| **一次性脚本** | 文件头写着「一次性脚本」「运行：node scripts/xxx.mjs」 | 能（但删了就丢了当时的操作记录） |

一次性脚本的注释写得很诚实，几乎每个都标了 `一次性` 和确切用法。**这是本仓库最有价值的隐文档**：想知道某个产品页的内容是怎么灌进数据库的，去看对应脚本比看代码快。

---

## 1. 构建与部署（管线脚本 · 5 个）

| 脚本 | 触发方 | 作用 |
|---|---|---|
| `inject-seo-links.mjs` | `npm run build` | `<noscript>` 内链注入（见 08 §1） |
| `prerender.mjs` | `npm run build` | Playwright 逐「路由 × 语言」预渲染（见 08 §2） |
| `generate-sitemap.mjs` | `npm run build` | 落盘 `dist/sitemap.xml`（见 08 §3） |
| `build-fc.mjs` | CI | esbuild 打 `fc/index.ts` → `dist-fc/index.js`（单文件 CJS，`node20`） |
| `deploy-report-fns.mjs` | CI | 部署三个日报函数到 FC |

### 1.1 `build-fc.mjs`（34 行）

把 `fc/index.ts`（含 `netlify/functions/*` 与 `shared/*` 的依赖）打成**单个 CJS 文件**，handler 名 `index.handler`：

```js
await build({
  entryPoints: ['fc/index.ts'], bundle: true, platform: 'node', target: 'node20',
  format: 'cjs', outfile: 'dist-fc/index.js', minify: true, sourcemap: false,
  define: {
    __OSS_BUCKET__: JSON.stringify(process.env.ALIYUN_OSS_BUCKET || process.env.OSS_BUCKET || ''),
    __OSS_REGION__: JSON.stringify(process.env.ALIYUN_OSS_REGION || 'cn-hongkong'),
  },
})
```

`define` 把桶名/区域编进代码——FC 控制台给「全站函数」配环境变量很麻烦，编译期注入更省事。

### 1.2 `deploy-report-fns.mjs`（134 行）

`TARGETS` 三个：

```js
[{ dir: 'fc/daily-report', fn: 'gsc-daily-report' },
 { dir: 'fc/ads-daily-report', fn: 'ads-daily-report' },
 { dir: 'fc/deep-analysis', fn: 'gsc-deep-analysis' }]
```

核心约束写在文件头：

> 只做「重新打包 + 上传代码 + 合并飞书凭据」，**绝不覆盖已有凭据**——避免因为 CI 缺少某个 secret 而把线上凭据清空。

这是很成熟的一条设计：`UpdateFunction` 接口如果整份覆盖 `environmentVariables`，CI 里少配一个 secret 就会把线上的 GSC/Ads/E2B 凭据全清掉，函数第二天静默失败。所以脚本先 `GET` 现有配置，只**合并** `FEISHU_*`。

签名是手写的 **ACS3-HMAC-SHA256**（阿里云 3.0 版）：

```
canonicalHeaders: host / x-acs-date / x-acs-content-sha256 / x-acs-signature-nonce / content-type
canonicalRequest: [method, path, '', canonicalHeaders, signedHeaders, contentSha].join('\n')
signature       = HMAC-SHA256(SK, 'ACS3-HMAC-SHA256\n' + sha256hex(canonicalRequest))
Authorization   = ACS3-HMAC-SHA256 Credential=…,SignedHeaders=…,Signature=…
```

### 1.3 `verify-fc-deploy.mjs`

迁移后的**全站体检**，专门覆盖迁移中真出现过的故障：

> A. 目录路由回退首页（`/de/cases` 返回首页内容）—— canonical 检测法一击必中

检测思路很聪明：`/de/cases` 如果错误地回退到首页，页面里的 `<link rel="canonical">` 会指向首页而不是 `/de/cases`。**读 canonical 就知道服务端到底给了哪个页面**，比比对正文可靠得多。

### 1.4 `test-fc-handler.mjs`

不启动服务，直接 `import('../dist-fc/index.js')` 拿 `handler` 打各种伪造 event：

```js
process.env.OSS_INTERNAL = 'false'   // OSS 内网 endpoint 仅阿里云内网可达，测试走公网
```

这是验证 `fc/index.ts` 那堆 event 形态兜底（`rawPath` / `path` / `requestContext.http.path`）的唯一手段。

### 1.5 `fc-domain-setup.mjs`

临时脚本，把 `www.droneworld.tech` 绑到 FC 函数 `partdro-api`（含 CAS 证书）。通过 `execFileSync('aliyun', ...)` 调 CLI 而非 SDK。**这类脚本不要随便重跑**——见 07 §2.4 关于「证书私钥无法读回」的警告。

---

## 2. 内容写入（产品上架 · 一次性）

新建一个产品页 = 「写产品行 + 写四语 `product_langs` + 写 `landing_content` 的四语内容 + 拷图片」。这套动作每个产品都重复一遍，于是每个产品都有一个同名脚本。

| 脚本 | 产品 | 说明 |
|---|---|---|
| `c500-content.mjs` | C500 重载运输无人机 | 产品行 + 多语言卡片 + 落地页内容 |
| `d50r-content.mjs` | D50R 光伏清洗无人机 | 源站 jsirobot.com，**品牌 JIUSI → Partdro 改写** |
| `c15-content.mjs` | C15 清洗无人机 | 同上模式 |
| `c15-en.json` / `sl80-en.json` / `y160-en.json` / `yp800-en.json` | — | 英文内容快照（**静态文本是权威来源**） |
| `c15-fetch-en.mjs` / `sl80-fetch-en.mjs` / `y160-fetch-en.mjs` / `yp800-fetch-en.mjs` | — | 从 DB 读回 en 行存成 JSON |
| `c15-i18n.mjs` / `sl80-i18n.mjs` / `y160-i18n.mjs` / `yp800-i18n.mjs` | — | 补齐 es/de/fr 三语行 |
| `c15-fix-image-keys.mjs` | C15 | `__images` / `__videos` 键名从裸键改 ns 前缀 |
| `c15-restore-en.mjs` | C15 | **事故恢复**：en 行文本键被意外破坏（15 键 → 3 键）后重建 |
| `c15-polish.mjs` | C15 | 收尾打磨：大数字改可编辑、裁方图 |
| `fix-c15-image.mjs` | C15 | 产品卡图 `placeholder.svg` → `product.png` |

### 2.1 `c15-restore-en.mjs` 值得单独看

```
背景：c15/en 行文本键被意外破坏（15 键 → 3 键），静态树是权威文本来源。
```

它把 `src/i18n/en.json` 的 `c15` 子树 + 快照里的 `__images/__videos/__layout` 重新拼成一行写回 DB。这解释了一个**容易搞混的架构点**（见 05 章）：

- 文本基底在 `src/i18n/en.json`
- `landing_content.en` 行只存**差异叶子**（多数情况下只有 `__images` / `__layout` / `__videos`）
- 渲染时 `deepMerge(静态树, DB 行)`

所以「DB 里 c15/en 只有 3 个键」是**正常的**，不是数据损坏。这个脚本恢复的是被错误覆盖的那次操作。

### 2.2 所有内容脚本的共同约定

```js
// 仅在本地 Node 环境使用 service_role（服务端语义，绝不进入前端代码/VITE_*）
// 运行：node scripts/c15-content.mjs
```

**`SUPABASE_SERVICE_ROLE_KEY` 只允许出现在脚本里，永远不进 `src/`，也永远不加 `VITE_` 前缀**——加了前缀会被 Vite 打进前端 bundle，等于把数据库管理权限公开。这条约定在每个内容脚本的头部都写了一遍，是硬红线。

---

## 3. 博客迁移（TopXGun → Partdro · 一次性）

整条链路是把第三方站点 `topxgunag.com` 的博客搬到本站，**包括图片本地化、品牌改写、slug 重命名**：

```
fetch-topxgun-blog.mjs        抓取 → scripts/blog-data.json + public/images 下载
   │
rebuild-blog-data.mjs         重建整份数据：
   │                             url 还原 → 内容图本地化 → data-src 清理
   │                             → 品牌改写 → 域名改写 → slug 重命名
   ▼
fix-blog-*.mjs                七个小修（见下表）
   │
upload-blog.mjs               全删全插 posts + post_langs（--dry 可预演）
```

| 修 | 作用 |
|---|---|
| `fix-blog-urls.mjs` | 修复品牌改写误伤：`partdroag.com` → `topxgunag.com`，再重下图 |
| `fix-blog-imgsrc.mjs` | 内容 `<img src>` 补前导斜杠 + 反斜杠归一（本地 + DB） |
| `fix-blog-imgsrc-db.mjs` | 只改 DB |
| `fix-blog-covers.mjs` | 封面是 TopXGun logo 的，换成正文首图或按分类复用 |
| `fix-blog-slugs.mjs` | slug `topxgun*` → `partdro*`，同步本地目录 + Supabase |
| `fix-blog-summary-brand.mjs` | 摘要里的品牌残字 |
| `fix-blog-final-pass.mjs` | 最后扫一遍 `topxgunag.com` 残留 |
| `repair-blog-images.mjs` | 补下抓取脚本漏掉的图（缺 `mkdir`） |
| `list-blog-imgs.mjs` | 列出每篇首图，供封面复用规划 |

**这段历史解释了两件事**：

1. 为什么 `public/images/` 里的博客图命名是 `topxgun-*` 风格而不是语义命名。
2. 为什么 `fix-blog-urls.mjs` 里有一句 `partdroag.com -> topxgunag.com` 的「反向修复」——批量品牌替换把域名也替换了，属于典型的**全局替换误伤**。这是本仓库最值得记住的操作教训：**改品牌名不能用全局字符串替换，必须先保护 URL**。

---

## 4. 数据检查（只读 · 一次性）

| 脚本 | 作用 |
|---|---|
| `check-inquiries.mjs` | 用 service_role 读 `inquiries` 全表（绕 RLS，看真实询盘） |
| `check-landing-langs.mjs` | 列 `landing_content` 的 `namespace / lang / __images` 键 |
| `check-product-img.mjs` | 比对 c15 产品 `image_url` 与实际文件是否存在 |
| `db-final-check.mjs` | 品牌残留 + 内容完整性（用 anon key，只查已发布） |
| `d15r-inspect.mjs` | D15R 行的全字段 dump |
| `d15r-kit-layout.mjs` | 调 `landing_content` 的 `__layout`（套装区排版） |
| `d15r-video-update.mjs` | 更新 `__videos` 键 |

**注意鉴权差异**：`db-final-check.mjs` 用 anon（受 RLS 限制，只能看已发布），其余用 service_role（看全部，含未发布）。判断「线上到底有没有这条数据」时要用 anon 的那个——service_role 能看到的东西线上访客看不到。

---

## 5. 截图（Playwright · 一次性）

| 脚本 | 目标 |
|---|---|
| `screenshot-c15.mjs` | `/products/c15` 全页 |
| `screenshot-d15r.mjs` | `/products/d15r` 全页 |
| `screenshot-d50r.mjs` | `/products/d50r` 全页 |
| `screenshot-c500-safety.mjs` | C500 safety 区块（可传语言路径） |
| `screenshot-d15r-video.mjs` | D15R 视频区块（主视频 + 网格） |
| `screenshot-news.mjs` | `/news` 列表 + 一条视频新闻详情 |
| `screenshot-about.mjs` | `/about` 团队区 |
| `audit-c500-images.mjs` | 扫 C500 页所有图，找 404 坏图及其 `data-edit-img` 键 |

统一用法：`node scripts/screenshot-xxx.mjs [port]`，默认 `5173`。

**这批脚本没有 `screenshot-full.mjs`。** `AGENTS.md` 的脚本文档表里列了 `screenshot-full.mjs`、`screenshot-lumenfly-mini.mjs`、`debug-lumenfly-mini.mjs`、`redact-skyrover.py`、`verify-image.py`、`optimize-images.js`、`scrape-allynav-images.js`、`convert-logos.js`——**这些文件在当前仓库里都不存在**。`AGENTS.md` 记录的是另一条产品线（Skyrover / AllyNav / Lumenfly）的工作流，与本仓库代码无关。

连带后果：`package.json` 的 `npm run optimize-images` 指向 `scripts/optimize-images.js`，**该文件不存在，命令必然失败**。

`audit-c500-images.mjs` 里的 `data-edit-img` 键名值得注意——它对应编辑器里图片的 `data-edit-*` 属性体系（见 05 章），说明这个脚本是配合可视化编辑器用的：报告「哪张图挂了」的同时告诉你「在 CMS 里该改哪个键」。

---

## 6. Reddit 市场调研（一次性 · 数量最多）

这是一整套「多源采集 + 清洗 + 摘要 + AI 细读」的数据流水线，产物在 `data/`。

### 6.1 采集（三个源，互相备份）

| 源 | 脚本 | 特点 |
|---|---|---|
| PullPush API | `fetch-reddit-d15r.mjs`、`collect_v2.mjs`、`fetch-post-comments-pp.mjs` | 免 key，但限流严重 |
| PullPush via curl | `collect_pullpush_curl.mjs` | 注释：**node fetch 被 PullPush 标记为 "agents"，但 curl 可以通过** |
| Arctic Shift | `fetch-comments-arctic.mjs` | PullPush 限流期的替代源 |
| Apify | `scrape-reddit-apify.mjs`、`scrape-reddit-cargo-apify.mjs` | 需 `APIFY_TOKEN` |
| Kimi WebBridge | `wb-scrape.mjs`、`wb-search-reddit.mjs`、`wb-brand-queries.mjs` | 走本机浏览器，`http://127.0.0.1:10086/command` |
| Reddit 公开 JSON | `fetch-post-comments.mjs` | 最简单，最容易被封 |

`collect_v2.mjs` 是编排器：

```bash
node scripts/collect_v2.mjs --phase all|pullpush|webbridge|merge
#  --pages 2   --sleep-ms 4000   --no-merge
```

「node fetch 被标记、curl 能过」这条注释特别有价值：**反爬经常按 TLS 指纹 / UA 判定，而不是 IP**。同一个 IP 上 curl 能过、undici 不能过，说明对方在比对 TLS 握手特征。

`fetch-fp800-images.mjs` 是同一类问题的另一解：

> 本机 shell 的 curl TLS 指纹被字节系 CDN 屏蔽，且域名 DNS 被污染；浏览器环境可正常访问。用 Playwright 下载。

### 6.2 清洗与摘要（Python）

| 脚本 | 作用 |
|---|---|
| `clean_posts_v2.py` | 删噪声子版 + 内容级噪音过滤 + 补 `lang` + 重新统计（`--profile clean\|cargo`） |
| `make_digest.py` | 按时间倒序、每帖一行压缩格式，供 AI 分批细读（默认 4 批） |
| `merge_data.py` | 多源合并成统一 JSON（`--profile` / `--dir`） |

**为什么用 Python 而不用 Node**：这三个脚本要处理几百 MB JSON、做文本密度统计，Python 的 `json` + 列表推导更短；且它们和后续的微调实验（`related/unsloth_finetuning_gemma4/`）共用一套数据处理习惯。

### 6.3 `--profile` 参数

`clean_posts_v2.py`、`merge_data.py`、`wb-search-reddit.mjs` 都支持 `--profile clean|cargo`，对应两条业务线：

- `clean` → 清洗无人机（外墙 / 光伏）
- `cargo` → 运载 / 重载无人机

产物分目录：`data/v2_deep/`（clean）与 `data/cargo/`（cargo）。

---

## 7. SQL 脚本

`scripts/*.sql` 是**手工在 Supabase Dashboard 执行**的 DDL/DML，没有迁移框架：

| 文件 | 作用 |
|---|---|
| `admin-functions.sql` | `admin_delete_product()` 等 security definer 函数 |
| `rls-admin-products.sql` | products 相关 RLS 策略 |
| `rls-inquiries-select.sql` | inquiries 的 SELECT 策略 |
| `supabase-inquiry-webhook.sql` | **pg_net 触发器**：INSERT → HTTP 调 `inquiry-webhook` |
| `inquiries-attribution.sql` | 归因字段（`landing_page` / `gclid` / `first_*`） |
| `inquiry-lead-profile-column.sql` | `lead_profile jsonb` 列（存 AI 调研结果） |
| `migrate-product-categories.sql` | 分类枚举迁移（`agricultural` / `cargo` / `cleaning`） |

**没有迁移工具是一处真实风险**：schema 变更靠人肉执行 + 提交 SQL 文件留痕。新环境搭建必须按顺序跑完这七个文件，顺序错了会因外键/函数依赖失败。

`supabase-inquiry-webhook.sql` 是最关键的——它是「数据库主动调函数」的唯一连接点，也是 07 章询盘链路的第一跳。

---

## 8. 仓库里的数据快照

| 文件 | 说明 |
|---|---|
| `scripts/blog-data.json` | TopXGun 博客全量（含 `content` HTML），迁移脚本的中间产物 |
| `scripts/blog-upload-report.json` | 上传结果（成功/失败条数） |
| `scripts/news-video-content.json` | 新闻视频区块内容 |
| `scripts/d15r-video-prompt.txt` | 视频生成提示词 |
| `scripts/*-en.json` | 各产品英文内容快照（**权威文本**） |
| `scripts/prerender.test.mjs` | 唯一的单元测试（`node --test`） |

把 `blog-data.json`（几 MB）提交进仓库不算好实践，但它是「可重放的证据」——迁移已经做完，留着能证明改写规则到底做了什么。

---

## 9. `related/` —— 站外运营工具

与主站**零代码耦合**，独立的脚本集，各有自己的 `.env`：

```
related/
├── ga4/            src/{auth,ga4,d15r-de-engagement}.mjs + .env.example
├── google-ads/     ~45 个脚本：campaign 创建/诊断/优化、GTM 系列、keyword-ideas
│   └── data/keyword-ideas-{DE,DE-generic,GB,US,US-cargo}.md
├── gsc/            src/{auth,gsc,audit-urls}.mjs、gsc-submit.mjs
│   └── snapshots/audit-2026-10-0{7,8,9,10,11}.json
├── nodejs+echarts/ 关键词 CSV 分析、图表/NLP/CSV parser demo
├── seo/            README.md（策略笔记）
└── unsloth_finetuning_gemma4/
    ├── dataset/    2025–2026 每日 txt（约 250 个）+ monthly/*.md（15 个月）+ gemma_finetune_dataset.jsonl
    └── training_terminal_google_colab_runtime/  10 个 py/yaml 训练脚本
```

**它和 `fc/` 的分工**：`related/` 是「人在本地跑的运营工具」（改广告、提 URL、看 GSC），`fc/` 是「线上定时跑的自动化」。同一个 Google API 在两处各有一套 auth 实现——`related/` 用 OAuth（要人登录），`fc/` 用服务账号（无人值守）。这不是重复，是**两种身份场景的必然结果**。

`unsloth_finetuning_gemma4/` 是另一个方向：把 Reddit 语料做成微调数据集，训练行业模型。属于实验，不参与站点运行。

---

## 10. `data/` —— Reddit 原始数据

```
data/
├── archive/       早期 D15R 抓取（csv + json）
├── cargo/         运载无人机线：posts_all.json、comments_*.{json,csv}、digest_*.txt、analysis_report.md
├── reddit_de/     德语帖（Apify）
├── v2_deep/       清洗无人机线：posts_pullpush + posts_webbridge + posts_all、digest 分 4 批
└── reddit_post_*_comments.{json,csv}   单帖评论（约 20 帖）
```

命名规则：`posts_<source>.json` 是单源原始，`posts_all.json` 是合并结果，`digest_*.txt` 是给 AI 读的压缩版，`analysis_report.md` 是人工/AI 的分析产出。

**`digest_part1..4.txt` 的分批结构**是为了适配上下文窗口：一次丢 500 帖给模型会丢中间内容，分 4 批、每批读一份 digest 更稳。

---

## 11. `.trae/` —— 编辑器技能与计划文档

```
.trae/
├── skills/
│   ├── bailian-image-video/   阿里百炼：qwen-image / happyhorse 生成与编辑
│   ├── kimi-webbridge/        本机浏览器自动化（对应 scripts/wb-*.mjs）
│   ├── landing-page-builder/  从素材/URL 建落地页（对应 AGENTS.md 的工作流）
│   ├── nano-banana/           Gemini 图像生成/编辑（scripts/generate.py）
│   ├── reddit-data-miner/     Reddit 采集 + 洞察报告（对应 scripts/collect_*）
│   └── seo-agent/             Partdro 页面 SEO + GSC 提交（对应 related/gsc）
└── documents/
    ├── d50r-product-page.md                D50R 上架全记录
    ├── integrate-c500-eavision-landing.md  C500 落地页集成方案（含 CSS 冲突分析）
    ├── partdro-to-wsl2-migration.md        迁移到 WSL2
    ├── plan-new-product-workflow-video.md  新产品 + 视频工作流规划
    ├── plan-product-categories.md          分类枚举设计
    └── wsl-migrate-step1.sh
```

`skills/` 是**给 AI 助手用的操作手册**（每个 `SKILL.md` 描述一个可复用流程），`documents/` 是**给人看的设计记录**。

`documents/` 里有两份特别值得读：

- `integrate-c500-eavision-landing.md`——完整记录了 C500 落地页的集成决策，包括 `.reveal` 类名冲突、CSS 特异性覆盖、`motion-ready` 的降级处理。**想理解 C500 为什么长这样，看这份比看代码快。**
- `partdro-to-wsl2-migration.md`——解释了为什么本仓库有大量 `node scripts/xxx.mjs` 的绝对路径写法。

---

## 12. 一次性脚本的通用约定

| 约定 | 说明 |
|---|---|
| 环境变量 | 多数脚本**手写 `readFile('.env')` 解析**（`check-*.mjs`、`fix-*.mjs`），少数 `import 'dotenv/config'`（`d15r-*`、`scrape-*`）。两种风格并存，改脚本时照抄同目录的写法 |
| service_role | 只在本地脚本用，**绝不打 `VITE_` 前缀** |
| 幂等性 | 内容脚本多数是 `upsert` 或「先删后插」，可重跑；`upload-blog.mjs` 是全删全插，**加 `--dry` 先看** |
| 失败策略 | 管线脚本「失败不阻断构建」；一次性脚本「失败即抛」 |
| 端口参数 | 截图脚本第一个参数是端口，默认 `5173` |

**三条实操建议**：

1. 跑任何 `fix-*` / `*content*.mjs` 前，先 `git status` 确认工作区干净，并确认 `.env` 里有 `SUPABASE_SERVICE_ROLE_KEY`。
2. 跑 `upload-blog.mjs` 之前一定先 `--dry`。它全删全插，中断会留下半张表。
3. `scripts/` 里没有 `screenshot-full.mjs`，`npm run optimize-images` 是坏的——不要照着 `AGENTS.md` / `README.md` 的命令敲。

---

## 附：文档一致性备忘

以下五处仓库内既有文档与代码不符，本 Wiki 以代码为准（`README.md` 的函数数量已在本次校验中同步修正）：

| 文档 | 过期内容 | 实际 |
|---|---|---|
| `README.md` | 开发端口 3001 | `vite.config.ts` 是 **5173** |
| `README.md` / `AGENTS.md` | 「Motion Animations using v-motion」 | 无 `v-motion`，动画是 CSS `.reveal` |
| `AGENTS.md` | 脚本文档表列了 8 个不存在的脚本 | 见 §5 |
| `CLAUDE.md` | 产品分类枚举含 window / solar | 实际是 `agricultural` / `cargo` / `cleaning` |
| `package.json` | `optimize-images` → `scripts/optimize-images.js` | 文件不存在，命令必失败 |

---

返回：[README.md](./README.md)
