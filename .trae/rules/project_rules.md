# 项目规则：默认野心反射（be-ambitious 常驻）

来源：`be-ambitious` 技能（Felix Rieseberg《How to be more ambitious》）。
目的：让"更有野心"成为默认答题姿态，而不是一个要手动 `/` 触发的技能。
适用范围：本项目 = droneworld.tech（Partdro）无人机 B2B 获客，仓库 `Randyren2024/partdro`，分支 `be-more-ambitious-trial`。

## 何时生效
每个**非平凡**任务都生效（改 bug、搭功能、做分析、写文档等）。
纯查询、闲聊、一两步的琐碎操作可豁免。

## 每次交付前必须过三问（默认，不必等用户喊技能名）
1. **目标背后的目标** —— 用户真正想让发生的是什么？"修一个崩溃" → "登录永远不崩"；"做 SEO/投 Ads" → "让获客机器自己赚钱"。
2. **专家方法，而非专家词汇** —— 这个领域顶尖的人会从**原始数据/原始素材**出发用什么方法、什么工具？不要只是换个说法。
3. **外部裁判** —— 除了"我"和"用户"，什么能证明结果是对的？（测试、指标、复现、留出数据、独立反方 agent）

## 四条硬线
- **更好，不是更大**：不增加交付物/功能/支线；只提升成果、标准或视角。
- **不许自评**：我不得给自己的产出打分；判定必须来自外部裁判。
- **硬目标当合理目标对待**：目标看着不可能时，默认它可解并继续；如实报告，允许诚实的未达标，禁止虚构。
- **没有权限就说没有**：缺数据/工具/访问时，点名缺什么、能解锁什么；绝不编造来源或结果。

---

## 最终目标（用户订立）
**把 droneworld.tech 做成一台可自证的高意向 B2B 无人机获客闭环：谷歌自然流量 + 谷歌 Ads 带来源源不断的优质询盘，CAC 可测量、可放量、可验证 —— 最终让这套获客机器自己赚钱，而不靠人肉盯着。**

### Altitude 三级梯（逐级升，别停在最低一级）
1. **看懂，别填空** —— 摸清每一分 Ads 花费去了哪、每个落地页是否真的能产生询盘、自然流量排在哪些词上却零点击。
2. **走到决策** —— 让获客闭环自负盈亏（CAC < 客户价值）：把赢的渠道/词放量，把烧钱零转化的词砍掉，把高意图 query 精准接到对应产品页。
3. **替换仪式** —— 这台机器自己跑：日报定时产出、否定词/暂停亏损词/放量优胜词自动执行；站点成为德语/全球高意向「清洗 & 货运无人机」查询的第一答案，自然询盘不靠付费也持续进来。

### 外部裁判（唯一打分者，绝不自己给自己打分）
| 裁判 | 证明什么 |
|---|---|
| Google Search Console | 真实曝光/点击、query→page 映射、收录状态 |
| GA4 | 真实事件漏斗 `form_start → contact_form_submission / whatsapp_chat_initiated` |
| Google Ads | 真实花费、转化、CPA |
| Supabase `inquiries` 表 | 真实询盘行数（终点验收 = 有没有真客户联系进来） |

**通过标准**：Ads 侧出现 `conversions > 0` 且 `inquiries` 表持续增长；自然侧高意图词进入 Top10 并带来会话。达不到就如实报告数字，不粉饰。

---

## 今日真实进展（2026-10-19 → 2026-10-20）
- **端到端打通取数通道**：本地沙箱访问 Google API 被墙（ECONNRESET）→ 用**阿里云 E2B 云沙箱（香港）**作代理直连 Google Ads/GA4/GSC API，拿到真实基线（此前只有自评，现在有外部裁判）。
- **锁定真实瓶颈**：产品落地页 `form` 数 = 0 → GTM 里已建的 Ads 转化标签 `contact_form_submission`（仅在表单提交成功时触发）**永不触发** → Supabase `inquiries` 历史累计 0 行 → Ads 转化恒为 0。
- **已交付（待推送）**：
  - `44c193d` 产品落地页/CTA 区接入 `InquiryForm` 询盘表单，打通转化回传；同时修掉左下固定主题切换按钮遮挡提交按钮 ~49px 的转化泄漏。
  - `5d6cde3` 博客页追加「相关产品」内链，修正高意图流量错配。
- **定时任务（外部裁判：cron 开关 + OSS 真实日报产出）**：阿里云 FC 三条 cron 均已 `enable=true` 并产出日报：
  - `gsc-daily-report` → `0 0 1 * * *`（北京 09:00）
  - `gsc-deep-analysis` → `0 30 1 * * *`（北京 09:30）
  - `ads-daily-report` → `0 15 1 * * *`（北京 09:15），今日已产出 `ads-reports/2026-10-20.md`。
- **线上真实数据（ads 日报，2026-10-13~19）**：D15R - Search - DE 花 ¥39.94、23 点击、**0 转化**；GA4 近 7 天 `form_start=2` 但 `contact_form_submission=0`（有人开始填表、无人提交成功）。
- **今日实测验收（全部机器测量，非自评）**：
  - 完整构建通过 → 预渲染 **160/160** 页、sitemap **156** 条 URL（产品 8 / 新闻 96）。
  - 9/9 产品页预渲染 HTML 均含 `<form>`（`id="quote"`），d15r 的 de/es/fr 三语言版本亦各 1 个。
  - Playwright 实测 CTA 提交按钮与主题按钮 **overlapArea=0**、命中元素为按钮自身（桌面 + 移动端）→ 遮挡泄漏确认修复。
  - 抓取已发布公开容器 `gtm.js?id=GTM-KJ7GJ3V5` 解析：`contact_form_submission`→tag44(GA4)+tag48(Ads 转化 11160320746/I6LCCOXOgpIdEOr108kp)；`whatsapp_chat_initiated`→tag10(GA4)+tag47(SlZrCNTMgpIdEOr108kp) → **GTM 接线正确，只缺真实提交**（故失效的 GTM API token 不阻塞验证）。
  - 新发现的静默坑：本地若缺 Supabase 变量，`npm run build` 会**预渲染 0 页 + sitemap 降级 28 条却仍 exit 0**，CI 可把无正文站点发上线 → 建议给 prerender 加硬门禁。

## 2026-10-20 已上线并完成端到端验证（这条链现在是真的通的）
- **已合并推送**：`be-more-ambitious-trial` → `main`，merge commit `544f209`；GitHub Actions `deploy-aliyun.yml` 跑完 **success**（run 39432260417）。
- **线上确认**：`/products/d15r`、`/de/products/d15r`、`/products/c500-partdro-eavision`、`/products/y160-delivery-drone` 的静态 HTML 均有 `form` 与 `id="quote"`；bundle 已更新为 `index-Buwhgjjd.js`。
- **真实提交实测（Playwright 打线上）**：在 `/products/d15r` 填表并点击提交 → 出现成功提示 → dataLayer 收到 `{"event":"contact_form_submission","form_type":"contact"}` → **Supabase `inquiries` 1 行 → 2 行**（新行 id=26）。
- **Ads 转化真的打出去了（关键证据，在香港云沙箱内用真实 chromium 复跑）**：
  - `GET googleadservices.com/pagead/conversion/11160320746/?...&en=conversion`
  - `GET googleadservices.com/ccm/conversion/11160320746/`
  - `POST googleads.g.doubleclick.net/pagead/viewthroughconversion/11160320746/`
  - `POST google.com/measurement/conversion?...&tid=G-0D439MT8T0&en=contact_form_submission`
  - 结论：`VERDICT = ADS_CONVERSION_FIRED`。**从表单到 Ads 转化的整条链路已实测通过**，不再是推断。
- **数据修正**：`inquiries` 基线不是 0 行，而是 **1 行**（id=20，2026-10-06 来自联系页的真实询盘）。此前"历史累计 0 行"的说法不准确。
- **测试数据已清理**：两条 `TRAE*` 测试行已用 service_role 删除，表恢复为 1 行真实数据。
- **待观察**：上述测试命中没有 gclid，Ads 里会记一次转化但**不会归因到 D15R - Search - DE 系列**；真实广告转化需等带 gclid 的访客，3–6 小时后看系列转化列。

## 2026-10-20 重大更正：真正带来客户的系列曾被暂停
- **事实**：`D15R - Search - Global` 只在 10/5–10/11 跑了 7 天，花 ¥110.19 / 18 点击，产出 **3 次主转化** + 加拿大客户 Kal Essa（KALZ Group / Sentinel Maintenance，D15R 双喷头专业版报价已发、等 licensing）→ **即将成交**；另有 2 条 WhatsApp 咨询（含 C500 定制：开源主板/抗干扰器/按键扩展）。
- **归因证据**：GA4 显示 Kal 为 `google / cpc`，落地 `/products/d15r`，点击词 `drone pressure washing`（¥14.40），提交在 `/contact`。
- **隐形原因**：那笔表单提交在 Ads 里只进了 HIDDEN 的 GA4 导入（allConv=1，conv=0），主转化 `contact_form_submission - droneworld.tech` 记 0 → Smart Bidding 看不到转化 → 系列被暂停。
- **已执行（用户批准）**：Global 日预算 ¥20→¥10 并重新 ENABLED；DE 保持 ¥10。合计 ¥20/天。API 回读确认。
- **教训（写进决策规则）**：**看到「0 转化」先怀疑测量，再怀疑渠道**。检查顺序：主转化标签是否真的发出（抓包）→ 转化动作是否 HIDDEN/非主 → 是否有 gclid → 最后才判断渠道不行。
- **归因代码已就绪但未部署**（commit `081231d`）：新增 useAttribution + 表单写入 page_path/landing_page/referrer/utm_*/gclid/product_slug；SQL 在 `scripts/inquiries-attribution.sql`。**必须先建列再部署**，否则真实询盘会因缺列插入失败。
- **产品页表单的价值被证实**：Kal 当时落在 `/products/d15r` 却只能另找 `/contact` 提交——今天上线后这一步摩擦已消除。

## 2026-10-20 归因分析结论（近 30 天，GA4/Ads/GSC 原始报表）
- **渠道**：google/cpc 75 会话 / 28 关键事件（唯一产出线索的渠道）；google/organic 仅 6 会话；GSC 28 天 304 曝光 / 2 点击 / CTR 0.66% / 平均排名 49.8 → **自然搜索目前不产生业务价值**。
- **成本**：总花费 ¥361.20 / 81 点击 / 3 主转化 ≈ **¥120/线索**。其中 Global ¥130.02 → 3 转化（≈¥43/线索）；DE ¥142.57 → 0 转化。**36% 的钱拿到 100% 的转化。**
- **逐条线索**：Kal（10-06，Oakville 桌面，google/cpc，落地 /products/d15r，提交于 /contact，点击词 `drone pressure washing` ¥14.40）；WhatsApp ×2（10-08，LA + Portland，google/cpc，落地 /products/d15r/），疑对应 `drone window cleaning franchise`（allConv=2，且 "franchise" = 连锁/加盟商，高价值画像）。同日加拿大另有 Vaughan 桌面 + Vancouver 移动，全部 cpc→d15r。
- **自然搜索错配（可直接修）**：`crop protection drone`(31 展示, 排名 44.6) 落在 news 文章；`delivery drone` 被 es/fr 三篇 news 抢占（排名 8.3~70）；`500g payload drone amazon` 落在 news；`d15r` 已排第 3 但 0 点击（标题/描述无吸引力）。
- **测量卫生问题（必须先修，否则所有漏斗数字不可信）**：tagassistant 流量 45 会话/125 关键事件；`/admin/login` 的 form_start 近 30 天 30+ 次，把「表单开始填写」这个指标彻底污染。→ GTM 转化标签需排除 `tagassistant`、`/admin`、内部 IP。
- **重开核实**：Global 下 4 个广告组 ENABLED、8 条广告 ENABLED+APPROVED、final_urls 均指向 `/products/d15r` → 确认「真能投」，不是只拨开关。
- **样本警告**：仅 3 条线索，任何「转化率」结论都不可靠；要证因果需重开后观察 ≥2 周看每线索成本是否稳定在 ¥43 附近。

## 2026-10-20 归因字段已上线（可验证）
- **部署**：push `081231d` → CI run 39437409259 **success**。
- **建列**：Supabase 的 `rest/v1`（PostgREST）**不支持 DDL**，service role key 也不行；必须走 Management API `POST https://api.supabase.com/v1/projects/<ref>/database/query` + 个人访问令牌（`sbp_`）。已执行 → 10 个字段全部建成。
- **实测落库**（线上真实提交，id=28，已删除）：`page_path=/products/d15r`、`landing_page` 含完整 UTM+gclid、`utm_source=google`、`utm_medium=cpc`、`utm_campaign=global_cleaning`、`utm_term=drone pressure washing`、`gclid` 非空、`product_slug=d15r` → 8/10 字段有值（referrer/utm_content 因本次访问无该数据，属正确）。
- **归因能力边界**：只能归因「通过本站表单提交」的询盘；WhatsApp 直聊、邮件直发、老客户复购无法自动归因；清缓存/换设备/超 90 天会丢首次触点——只能提高概率，不能保证。
- **安全**：PAT 为账号级凭据，任务完成后需 user 自行 revoke。

## 反问机制（默认开启，用户 2026-10-20 明确要求）
**原则：能自己查的必须先查；查不到、但会改变行动方向的变量，必须主动反问。**
不问 = 拿猜测当依据。问太多 = 把判断责任推给用户。上限 3 个，且必须具体到能一句话回答。

**反问优先级**
1. **决策变量**：金额、预算上限、成功标准、时间窗口、可接受的最坏结果。
2. **权限与访问**：缺哪个 key、要不要授权、这个不可逆动作是否执行。
3. **人的处境**（不是客套，必须影响方案设计）。

**把"人的处境"翻译成方案差异**
| 用户的真实处境 | 我必须怎么改方案 |
|---|---|
| 资金紧张 | 优先零成本/低成本动作；任何花钱的事，同时给出「不花钱的替代方案」和「最坏情况损失上限」 |
| 数据太少而焦虑 | 先讲清「现在的样本能支撑什么、不能支撑什么」；该说"还不能下结论"就直说，不硬给建议 |
| 注意力/精力不足 | 一次只给 1 个下一步（最多 3 个）；不给长清单；能用脚本/定时任务代替人肉盯的，直接做掉 |
| 时间碎片化 | 输出先给「一句话结论 + 现在就能做的一个动作」，细节折叠到后面 |
| 对技术细节不确定 | 说清「我验证过什么、用什么验证的、哪部分仍是推断」 |

**禁止**
- 为了显得有用而假装有把握；用模糊话掩盖样本不足。
- 用反问推卸本该自己查的事。
- 只报好消息、不报阻塞。

**已确认的约束（截至 2026-10-20）**
- Kal 单值 < ¥10 万（人民币等值）→ CAC 承受力充足，瓶颈是线索量而非预算。
- 广告预算：暂不设月上限，**先看 2 周数据再定**；期间不主动加预算。
- 30 天成功标准：**成交 1 单**（不是"更多线索"）。
- 每日自动化已建：北京时间 10:00 跑只读体检（`/workspace/scripts/daily-attribution-check.mjs`）。

## 2026-10-20 三个日报已同步推送飞书
- 改动（commit `ec8be2a`，已推送）：新增 `fc/shared/feishu.ts`，GSC 日报 / Ads 日报 / GSC 深度分析在发邮件之后，再把同一份 Markdown 推到飞书私聊卡片。
- 关键设计：飞书卡片不支持 Markdown 表格 → 逐行降级为「- 单元格 · 单元格」，不丢数据；未配置 `FEISHU_*` 或推送失败时**静默跳过**，绝不影响 OSS 存档与邮件。
- 三个函数已用自建部署脚本更新：代码包上传 OSS `fc/<fn>.zip` + 合并环境变量（从 partdro-api 继承 `FEISHU_APP_ID/SECRET/OPEN_ID`）。回读确认 FEISHU=3/3。
- 端到端实测（真实调用，非模拟）：返回体 `email:{ok:true}, feishu:{ok:true}`。
- **已纳入 CI**（commit `d1bd671`）：`scripts/deploy-report-fns.mjs` 自带 OSS V1 + FC ACS3 签名，不依赖 aliyun CLI；workflow 里新增 `Deploy report functions (GSC / Ads / Deep)` 步骤。
  - 安全设计：脚本**只合并 `FEISHU_*`**，其余环境变量（GSC/Ads/E2B/DirectMail）原样保留 → CI 只需阿里云 AK + 桶名，不会因缺 secret 清空线上凭据。
  - `e2b` 已显式锁 2.31.0 到 devDependencies（此前只在开发者本机，CI 无法打包；2.56.0 创建沙箱会 405）。
  - 验证：CI run 39442252288 success，该步骤 OK；三个函数 `lastModifiedTime` 刷新到 14:50Z，`FEISHU=3/3` 保留。

## 日报硬规则（用户 2026-10-21 订立）

### 一、日报必须包含完整花费构成（三部分，缺一不可）
日报的「花费」不能只写广告，必须三块都写清楚，且各自标注口径：

| 构成 | 数据源 | 口径 | 性质 |
|---|---|---|---|
| 阿里云 | BSS OpenAPI `QueryAccountBill` | 自然日实际计费，按产品拆分 | **账单**（准） |
| DeepSeek | `GET https://api.deepseek.com/user/balance` | 余额差值（上次记录余额 − 当前余额） | **推算**（非账单，必须标注） |
| Google Ads | OSS 上的 `ads-reports/<date>.md` | 近 7 天汇总 | **账单**（准，但不是单日） |

- **阿里云**：每个自然日的阿里云**实际计费**（`PretaxAmount` 合计），按产品拆分；既要「当日」也要「前一自然日」（早报跑的时候当日可能还没结算完）。
  - 数据源：`Granularity=DAILY` + `BillingDate=<YYYY-MM-DD>` + `BillingCycle=<YYYY-MM>`。**只给 BillingCycle 会返回月累计，不是每日花费**，必须带 BillingDate。
  - 凭据：`/workspace/.secrets/partdro.env` 的 `OSS_AK_ID` / `OSS_AK_SECRET` 已具备账单只读权限，**无需另配 AK**。
  - 已验证（2026-10-21 实测，脚本与 CLI 双向核对一致）：10-21 ¥8.58、10-20 ¥22.49、10-19 ¥6.47。
- **DeepSeek**：官方**只有余额接口，没有按日账单或用量明细 API**，所以只能用余额差值推算。必须在输出里写明「余额差值推算，非官方账单」，禁止把它当成精确账单。
  - 凭据：`/workspace/.secrets/partdro.env` 的 `DEEPSEEK_API_KEY`（只读 `/user/balance`）。
  - 基线状态存在 OSS `state/deepseek-balance.json`（每次运行覆盖，记录 checked_at + balance）。
  - 首次运行没有基线时必须显式写「暂无对比基线」，不得编造消耗金额。
- **Google Ads**：直接复用 ads 日报，**口径是近 7 天，不是单日**；写报告时必须标明，不能与阿里云的「当日」混为一谈。
- **失败时**：任何一块查询失败都必须显式输出「查询失败（原因）」，**禁止用估算值或历史均值填充**；单块失败不得阻塞其余段落。
- **实现位置**：`/workspace/scripts/daily-attribution-check.mjs` 的「## 2. 花费构成」（零依赖，不依赖 aliyun CLI）。

### 一之二、广告系列暂停状态（2026-10-21 起）
- `D15R - Search - Global` 与 `D15R - Search - DE` **保持暂停**，由用户明确要求。
- 触发原因：2026-10-21 阿里云欠费导致 `www.droneworld.tech` 全站 403（OSS 返回 `Current user is in debt`），落地页不可访问期间继续投放等于空烧。
- **恢复条件（必须同时满足，且需用户明确点头）**：站点 HTTP 200 且产品页表单存在 + 用户确认恢复 + 明确日预算。
- 自动化任务**只读**，不得自行恢复或修改系列状态。

### 二、每天晚上定时产出日报（已迁到阿里云 FC，不依赖 TRAE）
- **晚间日报**：每天 **21:00（北京时间）** 生成，覆盖「当日」完整数据 —— 这是唯一能看到当天阿里云账单接近终值的时点。
- **实现**：阿里云 FC 函数 **`partdro-daily-brief`**（nodejs20，cpu 0.5 / 内存 512 / 超时 120s，代码在 `/workspace/fc-daily-brief/index.js`，包在 OSS `fc/daily-brief.zip`）。
- **触发器**：`daily-2100-bj`，cron `0 0 13 * * *`（**FC 定时器用 UTC**，13:00 UTC = 北京 21:00），已 `enable=true`。
- **推送**：邮件（DirectMail `SingleSendMail`）+ 飞书（`im/v1/messages`，text 消息保留原文不丢表格），两路并行，互不阻塞。
- **实测**（2026-10-21，线上 invoke）：返回 `{ok:true, email:{ok:true}, feishu:{ok:true}, runLog:true}`，阿里云 ¥8.58 / DeepSeek 余额 ¥4.11 / 站点 200 / 表单 1。
- **为什么不用 TRAE automation**：两次 trigger 后 `Executions` 计数涨到 2，但脚本**一次都没被执行**（OSS `state/run-log.json` 无新增），平台也不回传成功/失败。两个 TRAE 任务（`LSOOLSUZKWL0UW` 10:00、`.AX21TTHB2J6U0` 21:00）已 **pause**，待云端额度问题确认后再决定是否恢复。
- **可验证性（关键）**：每次运行（无论 FC、本地还是 automation）都会往 OSS `state/run-log.json` 写一条 `{at, bj, source}`。**「日报有没有跑」只看这个文件，不看任何口头声称。**
- **同步飞书文档**（2026-10-21 新增）：日报除邮件/飞书消息外，还按文档模板**追加**到**日报专用文档**《Drone World Tech Partdro 每日日报》`HHwQwlfTeih9E7kJmPAcCTQCnRh`（wiki 节点；写入前经 get_node 解析成 docx id）。
  - 与工作日志《20261019 Trae droneworld.tech》`R8ljw7cPwifISSkY9zbcHDCdnVf` **分开**：日报只进专用文档，不再往工作日志里追加（2026-10-21 已把误写入工作日志的那一块删净，恢复为 285 块）。
  - 模板结构（2026-10-21 扩充为完整版，共 8 段、约 100 个块）：
    1. 结论先行（站点/询盘/花费三句话）
    2. 花费构成（阿里云 BSS 按产品 / DeepSeek 余额差值 / Ads 近 7 天）
    3. 询盘与归因（近 24h，逐条含 gclid / utm / 落地页）
    4. 自然搜索（GSC 整体 + Top 查询 + 查询→落地页错配 + 深度分析关键结论 + A 类关键词机会）
    5. 广告投放（按系列 / 昨日表现 / 高花费零转化词 / 广告→网站漏斗 / 数据口径与暂停状态）
    6. 站点与转化链路（`/`、`/products`、`/products/d15r`、`/sitemap.xml` 四路径 HTTP + 表单数）
    7. 系统运行与部署（三份 FC 日报是否产出 + GitHub Actions 最近一次部署结论）
    8. 待解问题与下一步（按严重度编号 + 验收标准）
  - 幂等：当天标题已存在则跳过，同日重复运行不会写两遍。
  - **双触发兜底**：`daily-2100-bj`（`0 0 13 * * *`，北京 21:00）+ `daily-2300-bj`（`0 0 15 * * *`，北京 23:00）。函数入口先查「当天日报块是否已存在」：已存在则**整体跳过**（不发邮件/飞书），所以第二个触发点只在第一次失败时补位，正常情况不会重复打扰。
  - **已验证**（2026-10-21）：授权 `docx:document` 后写入成功（35 个块），文档末尾出现「2026-10-21 日报：…」；同日再次调用返回 `skipped`，且未重复推送。
- **日常维护**：改代码后需重新打包上传 OSS 并更新函数代码（`ossObjectName` 不变时也要触发一次更新），否则线上仍是旧包。
- **两者都只读**：不暂停/恢复系列、不改代码、不动数据库；任何变更必须先问用户。

### 三、询盘数据的口径与判定纪律（2026-10-21 修正）
- **不能只看 24 小时**：实测 15 天仅 1 条询盘，24h 窗口 93% 的日子是 0。日报必须同时给出「近 7 天 / 近 30 天 / 历史累计」，否则「0 条」会被误读成渠道失效。
- **归因时间闸**：`gclid/utm_*` 字段 2026-10-20 才上线。更早的行这些字段为空是**历史原因**，必须标注「归因字段上线前的历史数据（渠道无法判定，不代表自然流量）」，**禁止判成自然/直接流量**（否则会把 Kal 这类确定来自广告的客户误报成自然来源）。
- **限流**：24h 明细最多取 50 条、展示 20 条，超出显示「另有 N 条未展示」，防止文档块爆炸。
- **过滤自测数据**：name/email 含 `test` 或 `trae` 的行不计入统计，并在报告中注明排除条数。
- **排序**：按 `created_at.desc`，不用 `id.desc`。

## 本地工具与 skill 库（2026-10-21 建立）

- **百炼 CLI**：全局安装 `bailian-cli@2.5.0`（命令 `bl` / `bailian`，位于 `$(npm prefix -g)/bin`）。
  - 认证：`bl auth login --api-key "$DASHSCOPE_API_KEY"`，凭据存 `/root/.bailian/config.json`；key 来自 `/workspace/.secrets/partdro.env`。
  - **默认端点**（2026-10-21 切换）：`https://llm-9v5dueszmhe0o86i.cn-beijing.maas.aliyuncs.com` —— 百炼 MaaS 专属端点，聚合 **178 个模型**（Qwen 全系 + deepseek-v4.1 / kimi-k3 / glm-5.3 / MiniMax / StepFun / 小米 mimo 等）。
  - 已实测通过：`bl text chat`（qwen3.8-flash、deepseek-v4.1-flash、kimi-k3、glm-5.3）、`bl image generate`（文本与图像在该端点均可用）、`bl auth status`、`bl config show`。
  - 切回公共端点：`bl auth login --api-key "$DASHSCOPE_API_KEY" --base-url https://dashscope.aliyuncs.com/compatible-mode/v1`。
  - 注意：`bl text chat` 用 `--message`，不是位置参数；输出里的 `[UNDICI-EHPA] Warning` 可忽略。
- **`.trae/skills/` 共 55 个 skill**：平台内置 7 + 项目自有 1（be-ambitious）+ 用户上传 5（be-more-ambitious、hyperframes×4）+ lark 27 + office 4 + office-mac 4 + html 2 + research 1 + prd 1 + 自建 bailian 3。
  - office 与 office-mac 的 docx/pdf/pptx/xlsx **同名但内容不同**，mac 版统一加 `office-mac-` 前缀，勿覆盖。
  - 插件 skill 在项目内是**副本**，平台更新插件后不会自动同步，需手动重拷。
- **自建 skill**（2026-10-21，基于真实命令实测编写）：`bailian-cli`（对话/视觉/决策/应用/记忆/config agent）、`bailian-docs-llm-wiki`（knowledge 建库检索）、`bailian-gen`（图像/视频生成与异步任务）。
  - `bl knowledge search/chat` 需要控制台「知识检索」页创建的 `--agent-id`，**不是**知识库 `--index-id`。

## 站点改动记录（SEO）

### 2026-10-21 d15r 标题优化（已上线，待观察）
- **触发证据**：GSC 近 7 天，查询 `d15r` 平均排名 **3.0**、2 次展示、**0 点击**。排名已进前三 → 缺的是点击理由，不是相关性。
- **改动**（仅 `src/i18n/en.json` 两个字段，commit `1b62123`，merge `d493bd2`）：
  - H1 / SEO title：`Multi-functional Washing UAV` → `Window & Facade Cleaning Drone`（30 → 30 字符，布局宽度不变）
  - 最终 title：50 → 47 字符
  - meta description：去掉三个空泛并列，前置 `20 MPa / 1,000 m²/h / 100 m hose`，149/160 字符未截断
- **线上验证**（部署后 curl 实测，run 333s success）：
  - `<title>D15R - Window & Facade Cleaning Drone | Partdro</title>` ✅
  - `<h1>Window & Facade Cleaning Drone` ✅
  - 旧标题残留 **0** 处 ✅
  - 页面 259,486 字节（预渲染正常，非空白页）✅
  - `/de`、`/es` 仍为原文（本次只改英文站，符合预期）✅
- **观察窗口**：**3–7 天**看 GSC 排名/点击变化。期间**不要再改同一个词**，否则无法归因是哪次改动起作用。
- **未验证**：H1 换行视觉（沙箱无法下载 chromium，未截图）。若视觉异常，回退只需 revert 该 commit。

### 2026-10-21 字体修复：Inter 从「声明」到「真的加载」（已上线）
- **根因**：`landing.css:5` 和 `SectionPanel.vue:125` 都写 `font-family: Inter`，但**全站既无 `@font-face` 也无 Inter 字体文件**，`index.html` 只引了 Barlow/Poppins。所有访客实际看到的是系统字体（macOS SF / Windows Segoe UI / Linux DejaVu），产品页视觉跨设备不一致，H1 换行宽度也会随系统字体漂移。
- **修法**（commit `eec9592`，merge `ac2652e`）：自托管 `@fontsource-variable/inter`（wght 轴 100–900 可变字体），字体名 `"Inter Variable"`，保留 `Inter`/`system-ui` 回退。**不用 Google Fonts** —— 不新增外部依赖，国内访问不受影响。
- **体积**：7 个子集 woff2 共 224KB，按 `unicode-range` 拆分；实测线上只请求 **1 个文件**（`inter-latin-wght-normal`，48KB）。
- **线上验证**：
  - `getComputedStyle(h1).fontFamily` → `"Inter Variable"` ✅
  - `document.fonts.check('100px "Inter Variable"')` → `true` ✅
  - 实际请求：`200 inter-latin-wght-normal-*.woff2`（仅 1 个）✅
  - H1 高度 653px / 6 行，**与修复前一致 → 未引入布局位移** ✅

## 阿里云成本与资源（2026-10-21 整理）

- **费用结构实测**（BSS `QueryAccountBill`，按产品）：
  - 2026-10-21：函数计算 ¥10.98 + 百炼 ¥1.41 = **¥12.39**
  - 2026-10-20：函数计算 ¥8.30 + 百炼 ¥14.19 = **¥22.49**
  - 对象存储、云数据传输均为 ¥0.00
- **日报自身成本可忽略**：`partdro-daily-brief` ¥0.04、`gsc-daily-report` ¥0.13、`gsc-deep-analysis` ¥0.09、`ads-daily-report` ¥0.03 —— 四个加起来每天约 **¥0.3**。
- **真正的成本来源是 E2B 沙箱**（`e2b-sandbox-template-*`，custom-container，**超时 86400s = 24 小时**）：
  - 2c/8192MB ≈ ¥1.15/小时 ≈ ¥27.6/天
  - 2c/4096MB ≈ ¥0.95/小时 ≈ ¥22.8/天
  - 2c/2048MB ≈ ¥0.85/小时 ≈ ¥20.4/天
  - **模板本身不跑不计费；风险在于沙箱启动后忘记 stop，会按 24 小时上限持续烧钱。**
- **2026-10-21 已清理**（用户确认，不可逆）：删除 `base-3021f292`、`claudeco-beb2eeb3`（10-15 旧版）、`codeinte-0fc4ca04` 三个模板。
  - 保留：`akdopenc-7965d86b`（2c/4GB）、`claudeco-0f2a5a6b`（2c/8GB，10-20 版）。
  - 删除后函数总数 14 → 11，日报四个函数与 `partdro-api` 全部健在（已回读验证）。
- **口径差异**：`QueryAccountBill`（扣减后的应付）与 `DescribeInstanceBill`（原价明细）金额不一致，**以 QueryAccountBill 为准**。

## 客户邮件发信规范（2026-10-22 订立）

**背景事实（已实测）**
- `droneworld.tech` 的 MX 指向**阿里企业邮箱**（`mx1/mx2/mx3.qiye.aliyun.com`，SPF `include:spf.qiye.aliyun.com`），`info@droneworld.tech` 是真实可收信邮箱。
- 阿里云 DirectMail 的发信地址 `report@edm.droneworld.tech` 是 **trigger 型发信地址**（`Sendtype=trigger`），**没有收件箱、不保存已发送副本、不回写任何邮箱**。所以「在邮箱里看不到发出去的客户邮件」是这个通道的正常行为，不是发送失败。
- 发送成功与否只能从 DirectMail 侧判断：API 返回 `EnvId`，逐封状态看「邮件推送控制台 → 发送记录」，汇总看 `SenderStatisticsByTagNameAndBatchID`。

**硬规则**
1. 所有发给客户的邮件**必须 Bcc 到 `info@droneworld.tech`**，并把 `Reply-To` 设为 `info@droneworld.tech`。否则客户回信会退回 `report@edm.droneworld.tech` 并**直接丢失**。
2. 发客户邮件统一用 `scripts/send-customer-mail.mjs`（零依赖，凭据自动从 FC `gsc-deep-analysis` 读取），**不要临时拼脚本**，避免漏掉 Bcc/Reply-To：
   `node scripts/send-customer-mail.mjs --to <邮箱> --subject "<主题>" --html <文件> [--text <文件>] [--dry-run]`
3. 发完必须回读结果（`EnvId` + 当日 `faildCount`），并如实报告，不假设已送达。

**已验证（2026-10-22 端到端）**
- `SingleSendMail` 接受 `BccAddress` 参数：测试 EnvId `600000362814877810`。
- 人工核对结果：**收到 2 封、邮件头「密送」字段含 info@、服务端未去重** → Bcc 归档通道确认可用，无需再验证。

**飞书邮箱：暂不迁**
- 需要改 MX（生效窗口内可能丢信）、迁移历史邮件、重配 SPF/DKIM；收益限于「agent 可读信 + 邮件与飞书协作同处」。等客户往来频次上来、或需要自动起草/跟踪未回客户时再评估。

## GSC OAuth 故障与诊断函数（2026-10-22 实测）

**当天三层故障（均已修）**
1. E2B 模板被删 → 沙箱创建 404（`code-interpreter-v1` / `claude-code-gsc` 的后端 FC 函数已不存在）；
2. 阿里云余额到 ¥0.01 → 函数/静态站随时可能失败；
3. GSC refresh token 失效（`invalid_grant`）→ 两个 GSC 函数全线失败。

**常驻诊断函数 `gsc-token-selftest`（无定时器，保留备用）**
- 模式 A（无 `AUTH_CODE`）：香港沙箱内并行验证 `GSC_REFRESH_TOKEN` / `ADS_REFRESH_TOKEN` / `GA4_REFRESH_TOKEN` 能否换出 access_token；
- 模式 B（有 `AUTH_CODE`）：用固定 client 兑换授权码，成功后**自动回写** `gsc-daily-report` 与 `gsc-deep-analysis` 的 `GSC_REFRESH_TOKEN`；
- 结果写 OSS `state/gsc-auth-result.json`，不回显 token 明文。

**硬规则**
- 任何新 refresh token **必须先经该函数验真（gsc 返回 200）才写生产**，禁止直接写。
- `invalid_grant` ≠ client 配错：同 client 的 ads/ga4 token 一直 200，可作为对照实验。
- 授权链接必须把 `client_id` 固化在 URL 里（Playground 的「Use your own OAuth credentials」不持久，丢了就会用 Google 自己的 client 签发，产出永远不可用的 token）。

**FC 同步调用 60s 上限（重要坑）**
- FC OpenAPI 同步调用约 60s 被平台中止并返回 `503 ServiceUnavailable`，但函数仍在后台跑 → 沙箱泄漏。
- 长任务必须用 `x-fc-invocation-type: Async` + 轮询 OSS 产物 / Supabase，不要用同步调用。

## 服务账号（SA）迁移状态（2026-10-22）

- **密钥**：`gsc-reader@artful-striker-458704-g1.iam.gserviceaccount.com`；JSON 按用途分开注入：`GSC_SA_JSON`（GSC 两个函数）/ `ADS_SA_JSON`（Ads）/ `GA4_SA_JSON`（GA4），均指同一把密钥。
- **GSC：已完全切到 SA**（`gsc-daily-report` / `gsc-deep-analysis`），`GSC_REFRESH_TOKEN` 已删除，实测产出正常（2026-10-22 12:00Z 前后各跑一次）。
- **Google Ads：已切到 SA**（`ads-daily-report` 的 `ADS_SA_JSON`），`ADS_REFRESH_TOKEN` 已删除；2026-10-22 12:13Z 实测仅靠 SA 产出报告成功。注意：Ads 后台添加 SA 时**不能直接选 Admin**（会报 "Admin roles are not supported for service accounts"），要先选「仅查看」加进去，需要 Admin 再在列表的访问级别下拉里升级。
- **GA4：已切到 SA**（`ads-daily-report` 的 `GA4_SA_JSON`），`GA4_REFRESH_TOKEN` 已删除；2026-10-22 12:34Z 实测产出含 GA4 段（32 会话 / 10 互动会话 / 3 关键事件），证明 SA 对 Data API 也有权限。授权时在 GA4「媒体资源访问管理」加 SA 为「查看者」（Admin API 只需账号可见即可列出，Data API 需媒体资源级角色，二者都要）。
- **OAuth 已全面退场**：三个 Google API 全部走服务账号 JWT 断言，refresh token 不再参与生产；`*_CLIENT_ID/SECRET` 保留但已无实际作用。
- **Ads API 版本**：当前可用 **v25**（v21–v24 均 404），线上 ads 函数用的就是 v25。
- **代码状态**：`ads-daily-report` 已支持 SA（`ADS_SA_JSON` / `GA4_SA_JSON` 两个独立开关，未配置的一方回退 OAuth），**已部署**；模板改为 `E2B_TEMPLATE` 环境变量驱动（原来硬编码已删除的 `code-interpreter-v1`，从仓库部署会 404，已修）。
- 部署工具：`scripts/deploy-fc-function.mjs`（时间戳对象名，避免 FC 拉旧包；可选 `--invoke` 与 `--watch-oss`，以及 `--env-json <path>` 打环境变量补丁 —— `{KEY: value}`，值为 `null` 表示删除）。

## BigQuery 分析仓库（2026-10-23 起）

**目标**：把 GSC / Google Ads / GA4 三套数据统一落到 BigQuery 做合并分析，机制与现有三套 API 相同 —— 纯 service account，不用 gcloud。

**关键事实（实测）**
- `gcloud` 从未安装；本沙箱对 `*.googleapis.com` 全部 TLS 断开（`000`），装了也用不了 → **不需要 SDK**。
- **阿里云 FC（香港）可直连 Google API**（token 200、BigQuery 200），因此 ETL 不需要 E2B 沙箱，成本几乎为零。
- BigQuery API 已在项目 `artful-striker-458704-g1` 启用；`datasets.list` 返回 200 但为空。
- **两个硬阻塞**：
  1. ~~项目未开通结算~~ → **已决定不开结算，改用 BigQuery Sandbox**（无需信用卡/结算，免费额度内）；
  2. ~~SA 无 BigQuery 角色~~ → 已加 **BigQuery Admin**（2026-10-23 用户授权），`datasets.create` 通过。

**BigQuery Sandbox 限制（官方文档 + 实测 2026-10-23）**
- 免费额度：10 GB 活跃存储 + 每月 1 TB 查询；项目不绑结算。
- **所有表/视图/分区 60 天后自动过期** → 历史窗口上限 **59 天**（含昨天），做不到 90 天。代码已强制 clamp 到 59 并在返回里标 `clamped`。
- **60 天过期无法取消（已实测）**：`mode:'noexpiry'` 里 PATCH dataset/table 清空 `defaultTableExpirationMs` / `partitionExpirationMs` → 全部 `403 Billing has not been enabled for this project`。dataset 回读始终为 `5184000000`（60 天）。→ **滚动 59 天窗口是硬上限**，要留更久历史只能另外导出到 OSS。
- 不支持：Streaming API、DML（INSERT/UPDATE/DELETE/MERGE）、BigQuery Data Transfer Service。
- 我们不受影响：Load Job（batch）可用、`CREATE OR REPLACE VIEW` 属 DDL、调度用阿里云 FC Timer 而不是 BQ 定时查询。

**已上线**
- `partdro/fc/bq-etl/index.ts` → FC 函数 `bq-etl`（nodejs20，0.5c/512MB，超时 900s）。
- **Timer `bq-etl-0945`**：`0 45 1 * * *`（=北京 09:45），payload `{"mode":"daily"}`，已启用。
- 事件：`bootstrap` 建结构并回读过期策略 / `daily` 近 7 天 / `backfill` 回溯（clamp 59）/ `verify` 回读各表行数与日期范围 / `noexpiry` 试探解除过期。
- 数据集 `dw_analytics`（`asia-east2` 香港），四张按 `date` 分区的表：
  `gsc_query_page`（date/query/page/country/device）、`ads_campaign_daily`、`ads_keyword_daily`、`ga4_traffic_daily`（source/medium/campaign/landing_page）；
  视图 `v_daily_overview` 按天把三源聚合到一行。
- **幂等**：每个 (表, 日) 单独发 load job 到 `表$YYYYMMDD` 分区，`WRITE_TRUNCATE` → 重跑只覆盖当天，不产生重复行。
- **首次数据（2026-10-23 05:2xZ 回溯 59 天实测）**：gsc_query_page 260 行（09-28~10-20）、ads_campaign_daily 28 行（10-05 起）、ads_keyword_daily 163 行、ga4_traffic_daily 210 行（09-01 起）、视图 47 天。GSC 天数少是因为站点那之前没有搜索曝光，Ads 是 10-05 才开始投放，GA4 受媒体资源数据保留期限制。
- 部署：`node scripts/deploy-fc-function.mjs --fn bq-etl --entry partdro/fc/bq-etl/index.ts`（支持 `--env-from` / `--env-json` / `--payload` / `--sync` / `--invoke-only`）。

**踩坑（重要）**
- **「Search 系列」实际有 44% 预算花在展示网络（2026-10-23 实测）**：按 `segments.ad_network_type` 拆分，22 天 397.42 花费中 CONTENT（展示扩展）占 173.69 / 5007 曝光 / 70 点击 / 0 转化，SEARCH 只有 213.12（25 点击），SEARCH_PARTNERS 10.61。所有 *- Search - * 系列都开了展示扩展 → 这是最大的单一浪费项，优化前先关。诊断入口：`{mode:'adsnetwork',from,to}`。
- **search_term_view 的指标是不完整的**：59 天搜索词表只覆盖 79.51 / 397.42 的花费、10 / 98 的点击（隐私阈值 + 延迟），只能做方向性判断，不能用来对账。表 `ads_search_term_daily` 已建（298 行），回补用 `{mode:'terms',days:N}`。
- **GA4 的 keyEvents 是脏数据（2026-10-23 实测确认）**：Admin API `properties/389497133/keyEvents` 显示 `click`、`scroll`、`email_click` 都被登记为关键事件 → 报表里的 820「关键事件」绝大部分是滚动/点击。**禁止再用 `keyEvents` 当转化口径**。已新增 `ga4_leads_daily` 表（date/source/medium/campaign/landing_page/event_name/events），只统计 `contact_form_submission` / `generate_lead` / `whatsapp_chat_initiated` / `email_click` / `purchase`；`v_daily_overview` 的转化列已从 `key_events` 换成 `leads`。回补用 `{mode:'leads',days:N}`（只动该表，不重跑其它源）。
- **自流量污染**：59 天里 43 个线索事件有 29 个来自 `tagassistant.google.com`（我们调 GTM 的预览流量）；`/admin/login`、`/admin/products` 也进 GA4。分析前必须先剔除。
- BigQuery 作业必须带 `location`：数据集在 `asia-east2`，jobs.insert 不带 location、或 `jobs.get` 不带 `?location=` 会直接 `404 Not found: Job`（表现为「作业明明提交了却查不到」）。已在 runQuery / waitJob / loadPartition 全部显式传。
- **FC 部署后立刻调用可能命中旧实例（跑的是上一版代码）**：表现为新加的 `mode` 不生效、悄悄走默认 `daily`。所以「部署 → sleep 20s → `--invoke-only` 调用」是可靠顺序。
- FC 事件参数包装不固定（本轮实际是 Buffer）。handler 已做 3 层剥壳 + 从原始字符串正则兜底取 `mode`/`days`。

## 边界（诚实的天花板）
- 我没有跨会话持久记忆，也改不了自身权重。"灵魂"不可达，能做到的是：**本会话内默认反射** + **通过本文件跨会话持久化** + **外部裁判可验证**。
- 判定是否真的内化，只看反方 agent / 真实测量，不看我的自述。

## 触发词（可选强化）
`/be-ambitious`、"be more ambitious"、"aim higher"、"go deeper"、"raise the bar"。
