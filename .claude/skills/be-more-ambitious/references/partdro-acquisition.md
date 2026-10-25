# Partdro 获客系统 — 数据地图、基线、判据与操作手册

> 配套 `../SKILL.md`。目标：任何接手 Partdro 获客的 agent，读完这一页就能知道**数据在哪、怎么取、现在处于什么状态、什么算成功、什么不能做**。
> 最后核验：2026-10-25。数据会变，先跑一遍校验再引用。

## 1. 真正要优化的结果

北极星：**销售确认的合格询盘数（SQL / qualified inquiries per month）**。

```
广告曝光 → 点击 → 落地会话 → 产品页互动 → 表单开始 → 表单提交（询盘）
        → 首次响应 → 建立联系 → 合格（预算/需求/决策权/时间）
        → 报价 → 谈判 → 成交 → 复购/转介绍
```

单看询盘数会骗人：2 条询盘里可能 1 条是垃圾。每个环节都要有来源与结果，才能算：

- **合格询盘成本** = 渠道花费 ÷ 销售确认的合格询盘数
- **CAC** = 渠道花费 ÷ 新成交客户数
- **回收期** = CAC ÷ 客户月毛利
- **收入侧**：客单价、毛利率、成交周期、赢单率、丢单原因

## 2. 数据地图（哪里取什么）

### 2.1 Supabase（线索唯一真源）

- 项目：`Drone World Tech (Partdro)`，ref `gcsshuvfzuinevacraao`，region `us-east-2`。
- 主表 `public.inquiries`：姓名/邮箱/电话/类型/留言/时间 + 归因列（`page_path`、`landing_page`、`referrer`、`utm_*`、`gclid`、`gbraid`、`wbraid`、`dclid`、`fbclid`、`first_referrer`、`first_landing_page`、`first_visit_at`、`gclid_captured_at`）+ `lead_profile`（AI 调研的 jsonb）。
- **没有**：销售状态、负责人、首次响应时间、资格判定、报价金额、成交/丢单原因、下次跟进时间。
- 产品表 `products` + `product_langs`（8 个已发布产品）：`d15r`、`d50r`、`c15`（cleaning）；`c500-delivery-drone`、`sl80-delivery-drone`、`y160-delivery-drone`、`yp800-delivery-drone`（cargo）；`fp800-agricultural-drone`（agricultural）。另有独立落地页 `c500-partdro-eavision`。
- 内容：`posts` 96 篇、`cases` 6、`documents` 6、`landing_content` 47 条（D15R 等落地页的多语言覆盖层）。
- 访问方式：Supabase MCP（已可用）或 service_role REST。**service_role key 不能进前端。**

### 2.2 BigQuery（三源汇总，自建 ETL）

- 由 `fc/bq-etl/index.ts` 写入。默认 dataset `dw_analytics`，location `asia-east2`（香港），项目由 `BQ_PROJECT` 决定。
- 表：
  - `gsc_query_page`：date × query × page × country × device，clicks/impressions/ctr/position。**query 层会被 GSC 隐私阈值整行丢弃，不能用它算总量。**
  - `gsc_page_daily`：date × page。**自然流量的唯一可信总量口径。**
  - `inquiries_attribution`：询盘归因（无 PII，整表替换）。
  - `ads_campaign_daily`、`ads_keyword_daily`、`ads_search_term_daily`：Ads 花费/点击/转化。搜索词层是浪费的主要发现处。
  - `ga4_traffic_daily`：source/medium/campaign/landing_page 的会话、互动、关键事件。
  - `ga4_leads_daily`：按真实线索事件过滤后的线索数。**不要用 GA4 `keyEvents` 当线索**——`click`/`scroll` 也被登记成了关键事件。
  - `v_daily_overview`：GSC + Ads + GA4 + leads 的按天汇总视图。
- 入口模式：`{mode:'daily'|'backfill'|'bootstrap'|'verify'|'inquiries'|'sql'|'adsaudit'|'adsconv'|'adsnetwork'|'terms'|'leads'|'ga4keys'}`；`sql` 模式可直接跑只读 SQL 并返回 ≤500 行。
- **硬约束：BigQuery Sandbox，表和分区 60 天后过期，最多回溯 59 天。** 需要更长历史就得升级或定期导出。
- 已知坑：GSC 数据延迟约 2 天；Jobs 必须带 `location=asia-east2`；`gsc_query_page` 不能当总量。

### 2.3 Google Search Console

- 属性：`sc-domain:droneworld.tech`（域名属性）。
- 用途：页面级 impressions/clicks/position、query 意图、收录状态、国家/设备、内链机会。
- 访问：Search Console API（service account 邮箱需在 GSC 里加为用户），或浏览器 `kimi-webbridge` 走 UI（见 `.trae/skills/seo-agent/references/gsc-automation.md`）。
- 注意：**REQUEST INDEXING 让用户手点**，不要自动点；URL Inspection 不能用 `?id=<full-url>` 深链。

### 2.4 GA4

- 属性由 `GA4_PROPERTY_ID` 指定。
- 站点：`index.html` 里 GTM 容器 `GTM-KJ7GJ3V5`；`trackEvent()` 推 `dataLayer`；表单提交事件 `contact_form_submission`；另有 `whatsapp_chat_initiated`。
- 用途：落地页会话、互动率、来源/媒介/活动、语言/设备、转化事件。
- 注意：关键事件口径被污染（click/scroll）；以 `ga4_leads_daily` 或 Supabase 询盘为准。

### 2.5 Google Ads

- API：v25，`ADS_CUSTOMER_ID` / `ADS_LOGIN_CUSTOMER_ID` / `ADS_DEVELOPER_TOKEN`；脚本在 `related/google-ads/src/`（OAuth 方式，`.env` 不入库）。
- **权限现状（2026-10-25）**：service account 可读（customer/GAQL），**不可写**（`conversionActions:mutate` 返回 `ACTION_NOT_PERMITTED`）。写操作使用 `google_api/google_ads/.env` 里的 OAuth refresh token（目录已加入 `.gitignore`，绝不提交）。`google_api/google_ads/src/client.mjs` 支持 `GOOGLE_ADS_FORCE_OAUTH=1` 强制走 OAuth。
- 可做的事：`adsaudit` 看自动标记（auto-tagging）、系列状态/预算、转化动作；`adsconv` 按转化动作拆解；`adsnetwork` 按网络拆；`terms` 补搜索词；搜索词/关键词诊断脚本已存在。
- 已知系列（由 `related/google-ads/src/create-campaigns.mjs` 创建，默认 ¥20/天、Maximize Conversions）：
  - `D15R - Search - Global`、`C15 - Search - Global`、`D15R - Search - DE`、`C15 - Search - DE`、`C500 - Search - Global`、`S150 - Search - Global`。
- 注意：建系列脚本默认 PAUSED；c500 的旧 finalUrl 是 `/products/c500`，会 301 到 `/products/c500-delivery-drone`（FC 已部署，2026-10-25 验证）。**v25 中 `ad.final_urls` 是 immutable，不能 UPDATE；改落地页必须新建 RSA 再暂停旧广告。** 2026-10-25 已为 C500 新建 5 条 RSA 指向 `/products/c500-partdro-eavision`（每广告组 1 条，复用原文案 + UTM），并暂停 7 条旧 ENABLED 广告；新 RSA 审核中。S150 系列已 **REMOVED**。
- 当前投放：D15R Global + C500 均 ENABLED，预算各 **¥10/天**（合计 ¥20/天）；DE 保持 PAUSED；D15R 广告 APPROVED。
- 转化动作：`email_click` 已降为 **secondary**；`whatsapp_chat_initiated` + `contact_form_submission` 保留 **primary**（Kal 的成交在 WhatsApp 上推进，保留 WhatsApp 作为真实联系信号）。30 天 3 次 primary 转化 = 2 WhatsApp + 1 email，表单为 0；每次动手前先 `adsaudit` 核实当前真实状态。

### 2.6 阿里云函数计算（生产管道）

| 函数 | 作用 | 关键点 |
|---|---|---|
| `fc/bq-etl` | GSC/Ads/GA4 → BigQuery | SA JWT；`daily`/`backfill`/`sql`/`adsaudit` 等模式 |
| `fc/ads-daily-report` | Ads + GA4 日报 → 飞书/邮件 | 含搜索词浪费、零转化、落地率对账 |
| `fc/daily-report` | GSC 日报 | 页面/国家/设备 |
| `fc/deep-analysis` | GSC 深度分析 | 关键词/页面机会 |
| `fc/inquiry-analysis` | 询盘背景调研 | 写回 `lead_profile` |
| `fc/inquiry-reply` | 询盘回信草稿 + 审批页 | 禁止自动发送；每封 Bcc 归档 |
| `netlify/functions/inquiry-webhook` | 新询盘 → DirectMail + 飞书 + 触发分析/草稿 | 需 `x-webhook-secret` |

### 2.7 仓库里已有的研究资产

- `data/cargo/analysis_report.md`：Reddit 重载需求挖掘（100–160 kg 空白带、绞盘、场景排序）。
- `related/google-ads/data/keyword-ideas-*.md`：US/GB/DE 关键词量与 CPC。
- `related/gsc/snapshots/audit-*.json`：历史收录状态快照。
- `.trae/skills/seo-agent/`：产品页 SEO + GSC 提交流程（硬经验，先读再用）。

## 3. 当前基线（2026-10-25 核验）

> 完整 30 天数据、分系列花费与诊断：`docs/acquisition/baseline-2026-10-25.md`
> 周度指标表与实验登记：`docs/acquisition/scorecard.md`

### 3.1 询盘（Supabase 实测）

| id | 时间 | 客户/公司 | 产品 | 归因 | 备注 |
|---|---|---|---|---|---|
| 20 | 2026-10-06 | Kal Essa / KALZ Group（加拿大） | 无 `product_slug` | 全空（早于归因字段上线） | GA4 事后回溯：google/cpc → `/products/d15r`；**已报价 D15R（2 电池 + 双喷嘴 + 专业版），等加拿大执照；有 distribution 意向；接近成交**；`lead_profile` 有 |
| 29 | 2026-10-22 | Tom Kruger / Hussar Security & Defense（南非） | `c500-delivery-drone` | `landing_page=/products/c500-delivery-drone`，其余全空 | 明确询 C-500 级重载；`lead_profile` 有 |

- 合计 **2 条**。两条都没有 `gclid`/UTM；一条连 `page_path` 都没有。**归因覆盖率 0/2（gclid）、1/2（landing_page）。**
- 询盘表无销售状态；无法回答合格/报价/成交/丢单。

### 3.2 归因实现与断点

- 前端 `src/composables/useAttribution.ts`：localStorage 90 天；首次落地页/referrer 取首次，UTM/gclid 取最近一次；`main.ts` 在 mount 前调用。
- 表单 `src/components/common/InquiryForm.vue` 直接插 `inquiries`，写 `attributionFields()`。
- 只写 `gclid`（`gclid`/`gbraid`/`wbraid` 都塞进 `gclid` 列），**没有写** `dclid`/`fbclid`/`first_referrer`/`first_landing_page`/`first_visit_at`/`gclid_captured_at`，尽管表里有这些列。
- 已实测（2026-10-25，Playwright）：直达 `/products/c500-delivery-drone?...gclid=TEST...` 时 localStorage 与表单 payload **正确写入** `gclid/utm/landing_page/page_path/product_slug`；归因链路本身可用。
- 已确认断点：
  1. **生产环境 `/products/c500` 返回 404**（FC 静态服务；`netlify.toml` 的 301 不生效）。Ads API 显示 ENABLED 的 C500 广告已指向 `/products/c500-delivery-drone`，只有 PAUSED 旧广告仍指向 `/products/c500`——潜在风险，不是当前活跃花费漏损。`fc/index.ts` 已加 301 + query 透传（待部署）。
  2. **`/products/s150` 返回 404，而 S150 - Search - Global 的 ENABLED 广告 finalUrl 就是它**；30 天 4 次点击 / ¥13.34 会掉进 404。需建页、301 或删广告。
  3. GA4 有大量 `tagassistant.google.com` 测试流量（30 天 48 会话，至少 12 个 lead 事件），会污染转化信号。
  4. 询盘表无销售状态/结果，无法计算合格率/CAC。
  5. Ads 30 天 3 次 primary 转化 = 2×`whatsapp_chat_initiated` + 1×GA4 导入 `email_click`；`email_click`/`whatsapp` 都是 `primary_for_goal=true`，表单为 0。**系统在优化 WhatsApp/email 点击，不是询盘。** 原生表单转化标签本身已验证正常（Playwright 仿真带 gclid 提交，正确触发 `AW-11160320746/I6LCCOXOgpIdEOr108kp`）。
- 仍待验证：Ads auto-tagging 是否开启、跨设备/清缓存丢失、自然/直接访问无 gclid、form 写入无监控。

### 3.3 站点与内容

- SPA（Vue 3 + Vite），构建时预渲染（`scripts/prerender.mjs`）+ sitemap；多语言 en/es/de/fr；英文无前缀。
- 8 个产品；96 篇博客；6 个案例；6 份文档。博客有内链注入（`scripts/inject-seo-links.mjs`）。
- 关键产品落地页：D15R、C500；C15、S150（Ads 用），S150 不在 products 表。
- 已知 SEO 修复：D15R 标题按搜索意图重写；Inter 字体自托管；FR 根路径可能仍是 redirect（以 GSC 最新数据为准）。

### 3.4 已量化的漏点（2026-09-25 ~ 10-24，30 天）

1. **仪表漏（最优先）**：Ads 花费 ¥397.42 / 98 点击 / 5,730 展示，后台记 3 次转化；GA4 记 25 个 lead 事件（11 WhatsApp + 9 email_click + 5 表单），但其中至少 12 个来自 Tag Assistant 测试；Supabase 只有 2 条真实询盘。三方对不上，且没有销售状态 → 无法知道哪条广告/页面/关键词产生合格询盘或成交。
2. **转化信号被污染（已确认）**：30 天 3 次 primary 转化 = 2 次 WhatsApp 点击（10-08）+ 1 次 GA4 导入 email_click（10-06）；所有有花费的搜索词转化都是 0。`email_click`/`whatsapp` 的 `primary_for_goal=true`，表单为 0——Maximize Conversions 在优化“点 WhatsApp/点邮箱”。应先降级这两个动作，只保留表单为主转化。
3. **预算分配与真实价值错位**：D15R DE 花 ¥165.97（42% 预算）/47 点击/0 询盘；**D15R Global 花 ¥142.85/32 点击，产出 Kal 这条已报价、等牌照、接近成交且带分销意向的线索——路径已验证**；C500 花 ¥60.27/10 点击，产出 Tom/Hussar 高意向询盘，但 Ads 记 0 转化。全部系列在 BQ 快照里是 PAUSED，最后一次花费 10-22；日预算：D15R Global/DE ¥10，C500/C15/S150 ¥20。
4. **旧 C500 落地链接 404**：`/products/c500` 在生产 FC 上 404，`netlify.toml` 的 301 不生效；旧广告 finalUrl 的点击直接丢失。
5. **自然搜索不是 30 天杠杆**：GSC 30 天 5 点击 / 472 展示；有展示的是农业博客（位置 45–90，0 点击），与清洁/重载的变现产品错位。
6. **高客单 B2B 的落地页/跟进**：C500 的 “Get a Quote” 跳 #specs，Contact Sales 是 mailto；表单只有姓名/邮箱/电话/留言，无公司/国家/用途/时间表/预算，无日历/WhatsApp 主入口、无 datasheet/合规包/案例/ROI，无首响 SLA。对 2 条高意向询盘，销售跟进质量可能比流量更重要。

## 4. 外部裁判（每类工作的「通过标准」）

| 工作 | 外部裁判 | 通过标准示例 |
|---|---|---|
| 归因/仪表 | Supabase 询盘 vs GA4 vs Ads 三方对账 | gclid 覆盖率 ≥80%；每条询盘有 landing_page/page_path；无归因字段的询盘有原因分类 |
| Google Ads | BQ 的 Ads 数据 vs 平台；搜索词层 | 花费/点击对账误差 <5%；零转化高花费搜索词占比 <20%；转化动作审计通过 |
| 转化优化 | 预注册 A/B + 销售确认 | 主指标（表单提交率）显著提升，且销售确认的合格率不下降 |
| SEO | GSC 页面级 clicks/impressions/position | 目标页非品牌 impressions 与 clicks 上升；收录状态不恶化；无 cannibalization |
| 销售跟进 | 真实回复/会议/报价记录 | 工作时间内首响 ≤1 个工作日（目标 5 分钟自动化）；回复率、会议率可测 |
| 数据管道 | BigQuery 完整性/新鲜度 | 无缺失天；GSC 延迟 2 天内；分区未过期 |
| 商业结果 | 真实成交与回款 | 合格询盘成本、CAC、回收期按渠道/关键词可算 |

**不能当裁判的**：GA4 `keyEvents` 原始值、Ads 后台「转化」数（可能含错误动作）、GSC 平均排名单独看、询盘数单独看、自己写的总结。

## 5. 访问与凭据（安全）

用户已开通 Google service account + JSON key。推荐放置：

```
<repo>/.tmp/google-sa.json        # .tmp/ 已在 .gitignore
<repo>/.tmp/google.env            # 变量，600 权限；不要提交
```

需要的变量（按实际项目填）：

```
BQ_PROJECT=<GCP 项目 ID>
BQ_DATASET=dw_analytics
BQ_LOCATION=asia-east2
GSC_SITE_URL=sc-domain:droneworld.tech
GA4_PROPERTY_ID=<数字属性 ID>
ADS_CUSTOMER_ID=<10 位纯数字>
ADS_LOGIN_CUSTOMER_ID=<MCC ID，若开发者令牌来自 MCC>
ADS_DEVELOPER_TOKEN=<Ads API 开发者令牌>
SA_JSON_FILE=.tmp/google-sa.json
```

- **不要把 JSON 私钥贴进聊天或提交仓库。** 可以让用户把文件放到上述路径后告诉你「放好了」。
- GSC：把 service account 的 `client_email` 加为属性用户；GA4：加为属性 Viewer；BigQuery：授予 Job User + Data Viewer；Ads：若 SA 方式失败，需要 OAuth refresh token（`related/google-ads/.env.example` 有模板）。
- 操作前先做只读验证：GSC `sites.list`、GA4 `properties.get`/`runReport`、Ads `customers` + `adsaudit`、BQ `verify`。任何一项失败，先修访问，不要绕过。

## 6. 接入后的前 72 小时（固定动作）

1. **存凭据**（`.tmp/`），跑只读校验，把每个 API 的账户/属性/项目 ID 写进 `docs/acquisition/access-check.md`。
2. **拉基线**（过去 28/90 天，能拉多少拉多少）：
   - GSC：按页面 + 按 query + 国家/设备；区分产品页/博客/首页；标记目标「钱页」。
   - Ads：按系列/广告组/关键词/搜索词/网络/设备/地区；`adsaudit` + `adsconv`；确认 auto-tagging。
   - GA4：来源/媒介/落地页/语言/设备；`ga4_leads_daily` 真实线索事件。
   - BQ：`v_daily_overview`、`inquiries_attribution`、数据新鲜度、对账。
   - Supabase：2 条询盘 + `lead_profile` + 与客户确认的后续状态（成交/报价/丢单）。
3. **建一张 scorecard**（`docs/acquisition/scorecard.md`）：渠道 × 花费 × 点击 × 会话 × 询盘 × 合格 × 报价 × 成交 × CAC。
4. **量化三个最大漏点**，每个给出「如果修好，预计影响多少」的量级（用真实数据，不用行业平均）。
5. **只选一个实验**先跑（通常是归因/转化信号修复，因为它是其他实验的前提）。

## 7. 目标设定模板（必须和用户确认，不要擅自定数）

先测基线，再定目标。模板：

- **30 天**：归因覆盖 ≥80%；每条询盘有来源/落地页/产品；建立销售状态字段与首响 SLA；scorecard 每周更新；完成一次 Ads 转化动作审计与一次落地页基线。
- **60 天**：至少 2 个预注册实验完成并复盘；合格询盘成本有基线；自然搜索的「钱页」集群有可测量的提升；销售跟进流程有模板和 SLA。
- **90 天**：合格询盘数达到基线的 2–3 倍（具体数字由流量/预算决定）；1–2 个渠道跑出「可放大」证据；明确砍掉无效花费；CAC 与回收期可算。

硬目标示例（按实际情况调整）：
- 表单提交率 ≥10%（高客单 B2B 从产品页/落地页到表单）。
- 工作时间内首响 ≤5 分钟（自动化 + 人工兜底）。
- gclid 覆盖率 ≥80%，Ads 离线转化匹配率 ≥70%。
- 零转化且高花费搜索词占比 <20%。

## 8. 每周运营节奏（让系统自己跑）

- **周一（30–45 分钟）**：拉 scorecard；回答三问——上周发生了什么？为什么？本周最紧急的三个决策是什么？写入 `docs/acquisition/decision-log.md`。
- **周中**：只推进当前登记的 1–2 个实验；不改其他变量。
- **周五**：记录实验状态；更新风险/阻塞；把需要用户确认的花钱/不可逆动作列出来。
- **每月**：三方对账（Supabase / BQ / Ads+GA4+GSC）；按渠道/关键词/产品线重算 CAC；决定加预算/砍渠道/换素材。
- **每季度**：重设 ICP 与目标；复盘「询盘 → 成交」定义是否仍成立。

实验登记字段：`日期 | 假设 | 改动 | 主指标 | 护栏指标 | 样本/时长 | 裁判 | 结果 | 决策 | 负责人`。

## 9. 护栏与红线

- **花钱/不可逆先问**：改出价、预算、系列状态、提交索引、发客户邮件、改线上站点、删数据。
- **不伪造**：没有权限就说没有；不要用行业均值冒充账户数据；不要编造成交/线索。
- **小样本**：n=2 时不做统计推断；先补仪表和定性访谈。
- **PII**：询盘 PII 只在必要范围使用；不贴外部服务；日志脱敏。
- **合规**：Google Ads 政策、GSC 不自动提交、隐私政策/同意、DE 的 GDPR 语境。
- **语言**：DE/ES/FR 文案与落地页必须人工/专家复核。
- **变更可回滚**：每次改广告/站点前记录原值；批量改动先在 1 个系列/1 个页面试。

## 10. 快速命令与文件索引

- 本地询盘导出：`node scripts/check-inquiries.mjs`（需要根 `.env` 的 Supabase 变量；当前本地无 `.env`）。
- BQ ETL：`fc/bq-etl/index.ts`（`mode:'sql'` 可做临时查询；生产入口在阿里云 FC）。
- Ads 脚本：`related/google-ads/src/`（`diag-campaign.mjs`、`check-conversion-volume.mjs`、`list-conversion-actions.mjs`、`diag-global-campaign.mjs`、`optimize-*`）。
- GSC 脚本：`related/gsc/src/` + `snapshots/`。
- GA4 脚本：`related/ga4/src/`。
- SEO 流程：`.trae/skills/seo-agent/SKILL.md` + `references/gsc-automation.md`。
- 市场研究：`data/cargo/analysis_report.md`、`related/google-ads/data/keyword-ideas-*.md`。
- 日报/分析函数：`fc/ads-daily-report/`、`fc/daily-report/`、`fc/deep-analysis/`、`fc/inquiry-analysis/`、`fc/inquiry-reply/`。
