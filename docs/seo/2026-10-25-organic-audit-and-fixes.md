# 自然搜索诊断与修复 — 2026-10-25

> 数据窗口：GSC 90 天 2026-07-26 ~ 2026-10-23（延迟 2 天），28 天 2026-09-26 ~ 2026-10-23。
> 裁判：Google Search Console（页面级 / query 级 / URL Inspection）、线上 curl、构建产物、Supabase 询盘真源。
> 不使用 GA4 `keyEvents` 或 Ads 后台「转化」数评价 SEO。

## 1. 结论

自然搜索当前不是增长主引擎：90 天约 **5 次点击 / 433 次展示**。但其中很大一部分是**自己造成的损耗**，不是需求不存在：

- 96 篇文章里只有 5 篇有 es/de/fr 翻译，但三个本地化新闻列表各自生成了 96 条 `/de|es|fr/news/<slug>` 链接；生产 FC 没有 SPA 回退，未翻译的 91 条 × 3 = **273 条本地化内链直接 404**。
- Google 已经记录到这些 404 URL 的展示（例如 `/fr/news/what-is-a-delivery-drone...` 90 天 33 次展示、0 点击）。
- C500 EAVision 投放落地页不在 sitemap，URL Inspection 为 **URL is unknown to Google**。
- `/en/...` 全部 404（客户端重定向在 FC 静态层之前就断了）。
- 产品标题/描述偏品牌口号：`C500 Delivery Drone - Heavy Payload, | Partdro`（悬空逗号）、`Photovoltaic Intelligent Cleaning,`，没有覆盖 `solar panel cleaning drone`、`heavy-lift cargo drone`、`agricultural spraying drone` 等商业词。
- 首页把自己定位成 “drone retailer / B2C & B2B”，与高客单 B2B 询盘目标不一致。

本轮修复了技术性损耗与页面级基础，**SEO 的复利仍然取决于内容集群与外链**，见 §6。

## 2. 基线（GSC）

### 2.1 90 天 queries（按展示排序，前 10）

| query | 展示 | 点击 | 平均排名 | 当前主要落地页 |
|---|---:|---:|---:|---|
| crop protection drone | 55 | 0 | 47.0 | `/news/agri-drones-are-making-crop-protection-easier...` |
| fertilizer application drone | 43 | 0 | 70.9 | `/news/exploring-the-application-of-drone-technology...` |
| smart farming drone solutions | 24 | 0 | 50.8 | `/news/crop-spraying-drone-solutions-for-smart-farming` |
| for beginners drone common problems | 19 | 0 | 69.5 | `/news/5-common-mistakes-beginners-make...` |
| drone fertilizer application | 12 | 0 | 65.3 | 同上农业文章 |
| high-rise drone cleaning | 10 | 0 | 75.9 | `/news/how-cleaning-drones-are-transforming-high-rise-facade-cleaning` |
| delivery drone | 7 | 0 | 36.4 | `/fr/news/what-is-a-delivery-drone...`（修复前 404） |
| eco friendly drone | 7 | 0 | **8.6** | `/news/why-agricultural-drones-are-considered-environmentally-friendly` |
| drone farm safety | 6 | 0 | 84.7 | 农业安全文章 |
| drone fertilizer spreading | 6 | 0 | 52.8 | `/news/can-drones-spread-fertilizer` |

商业词几乎空缺：`facade cleaning drone` 1 次展示（排名 90）、`drone facade cleaning` 2 次、`solar panel cleaning drone` 90 天没有进入有展示的 query 列表。

### 2.2 钱页（90 天）

| 页面 | 展示 | 点击 | 平均排名 |
|---|---:|---:|---:|
| `/products/d15r` | 10 | 0 | 6.4 |
| `/products/c500-delivery-drone` | 9 | 1 | 21.2 |
| `/products/y160-delivery-drone` | 2 | 0 | 1.5 |
| `/products/c15` | 3 | 0 | 51.3 |
| `/products/d50r` | 2 | 0 | 9.0 |
| `/products/fp800-agricultural-drone` | 2 | 0 | 26.0 |
| `/products/c500-partdro-eavision` | — | — | 未收录 |

### 2.3 其他

- 国家：USA 114 展示、PHL 29、DEU 26、ZMB 24、ZAF 23、ZWE 23、BWA 20、NAM 19、GBR 16、AUS 15。
- 设备：DESKTOP 357 展示 / 2 点击；MOBILE 74 / 3；TABLET 2 / 0。
- Sitemap：提交 156、GSC 报表 indexed 0（该报表经常滞后，不作为唯一裁判）；关键英文页面 URL Inspection 均为 Submitted and indexed。
- 修复后 sitemap = **175 URL**：4 语言 × 16 个栏目/产品路径（含 EAVision）+ 96 英文新闻 + 15 篇真实翻译新闻。

## 3. 根因与修复

### 3.1 本地化新闻 404（影响最大）

- 事实：`post_langs` 只有 5 篇文章有 es/de/fr 翻译；本地化 `/news` 列表却用 `lp()` 给全部 96 篇生成带语言前缀的链接。
- 修复：
  1. `mapPost` 暴露 `availableLangs`；列表只给真实存在的翻译生成本地化 URL，其余指向英语正文。
  2. prerender 只预渲染真实翻译（5 篇 × 3 语言 = 15 页）。
  3. FC 对 `/(es|de|fr)/news/<slug>` 静态对象不存在时 **301 回英语正文**，保留 query；有翻译的页面先命中静态对象，不受影响。
  4. 真实翻译的新闻页注入 hreflang（英语 + 实际翻译语言 + x-default）；只有英语的文章不声明 alternates。
  5. 动态 sitemap 输出真实翻译集群，不再声明不存在的语言版本。

### 3.2 `/en/*` 404

- FC 增加 `/en` 与 `/en/...` → 去掉前缀的 301，保留 query；与历史链接规则叠加（`/en/products/c500` → `/products/c500-delivery-drone`）。

### 3.3 EAVision 落地页不可发现

- `/products/c500-partdro-eavision` 不在 `products` 表，原 sitemap 抓不到。
- 修复：4 种语言加入 sitemap（含 hreflang），并纳入 prerender 的静态路由列表。

### 3.4 页面级元数据

- 新增 `src/seo/productMeta.ts`：8 个产品英语 title/description 按商业意图手写；其他语言沿用本地化 hero 文案，但去掉尾部的悬空逗号并统一 `| Partdro`。
- 首页与产品列表 meta 从 B2C “retailer” 改为 B2B 供应定位，并补上 “Drone World Tech” 品牌实体。
- C500 EAVision 标题从 “Flying Robot” 改为 “Heavy-Lift Cargo Drone”。
- Product JSON-LD `name` 使用完整产品名（如 `D50R Solar Panel Cleaning Drone`），而不是裸型号。
- 站点级新增 `WebSite` schema；`Organization` 增加 `alternateName`（Drone World Tech / Drone World）、`areaServed`、销售 `contactPoint`。

### 3.5 图片 alt

- 商品区块组件共用，但 C500/SL80/Y160/YP800/FP800 页面之前继承了清理机 alt（“multi-functional cleaning drone”“cleaning a building facade at height”）。
- 现在按产品映射 alt，未覆盖产品回退中性文案。

### 3.6 构建可靠性

- 预渲染静态服务器在浏览器中断请求时会二次 `writeHead`，一次中断可打挂整个构建；已加 `headersSent` 保护。
- 本地化产品页的 `landing_content` 请求偶尔超过 8s 空闲阈值；等待上限提高到 15s。

## 4. 验证

本地：

- `npx vite build` + `inject-seo-links` + `prerender` + `generate-sitemap` 通过；预渲染 **175/175**。
- `node scripts/build-fc.mjs && node scripts/test-fc-handler.mjs` 全部通过（新增 `/en` 与历史链接组合用例）。
- 本地化新闻 301 回退单测：未翻译 → 301 英语（保留 query）；有翻译对象 → 200。
- sitemap 175 条，与 dist 中 175 个 `index.html` 数量一致。
- 修复后抽查：产品 title/description、JSON-LD `name`、翻译新闻的 hreflang、C500/FP800 alt 均正确。

线上（第一批已通过 `deploy-aliyun.yml` 上线）：

- `/en/about` → 301 `/about`。
- `/fr/news/what-is-a-delivery-drone...` → 301 英语正文。
- `/fr/news/d15r-cleaning-drone-product-film` → 200（真实翻译）。
- 线上 sitemap 175 条，EAVision 4 条，de/es/fr 新闻各 5 条。
- `/products/d15r` title 已是 `D15R Tethered Facade & Window Cleaning Drone | Partdro`。

## 5. 未完成/待确认

- 图片 alt 细化、EAVision 标题、新闻 hreflang、Product JSON-LD 完整名等最后一批改动已本地构建验证，**尚未提交/推送**；推送会触发阿里云生产部署。
- GSC 的 “Request Indexing” 需要人工在 GSC UI 点击（不自动提交）；建议对 8 个产品页、EAVision 与 5 篇翻译新闻各点一次。
- DE/ES/FR 新增/修改的 meta 文案为直译级别，建议母语复核后再长期使用。

## 6. 30 / 60 / 90 天计划

**0–7 天（让修复被 Google 看到）**

1. 部署最后一批改动。
2. GSC 重新抓取 sitemap；对关键 URL 手动 Request Indexing。
3. 用 URL Inspection 确认：EAVision 从 “unknown” 变为已提交；本地化新闻 301 被识别；无新的 404。

**7–30 天（集中商业意图）**

1. 建 3 个商业 hub（不是再写泛博客）：
   - facade / window cleaning drone（承接 D15R、C15）
   - solar panel cleaning drone（承接 D50R）
   - heavy-lift cargo drone 100–240 kg（承接 C500、SL80、Y160）
2. 每个 hub 必须包含：真实规格、适用场景、与脚手架/人工的成本对比、FAQ（价格区间、交付周期、电池运输、当地执照）、案例/视频、RFQ 表单。
3. 从现有 96 篇博客用描述性锚文本内链到对应 hub/产品（农业 → FP800；清洁 → D15R/C15/D50R；重载 → C500/Y160/SL80）。
4. 外链：分销商/合作伙伴目录、行业协会、真实案例联合发布。外链是当前排名的主要瓶颈，代码无法替代。

**30–90 天（复利与裁判）**

- 以 GSC 页面级数据判断：目标钱页的非品牌 impressions/clicks 是否上升；目标 query 的平均排名是否进入前 20。
- 以 Supabase `landing_page` / UTM / `lead_status` 判断自然搜索是否产生合格询盘；不以询盘数单独作为成功标准。
- 每 4 周复盘一次，失败就如实记录，不中途改多个变量。

## 7. 目标与通过标准（外部裁判）

| 指标 | 当前 | 28 天目标 | 裁判 |
|---|---:|---:|---|
| 钱页非品牌展示/月 | 个位数 | +50% | GSC 页面级 |
| 目标商业 query 进入前 20 的数量 | ~0 | ≥3 | GSC query 级 |
| 本地化新闻 404 | 273 条内链 | 0 | 线上 curl / GSC 覆盖 |
| EAVision 收录 | unknown | Submitted and indexed | URL Inspection |
| 自然搜索询盘 | 0（可归因） | ≥1 条带 landing_page/UTM | Supabase |

> 注：28 天窗口不足以证明排名提升（尤其低权重站），因此用「展示/覆盖是否改善」作为先行指标；成交与合格询盘仍是最终裁判。
