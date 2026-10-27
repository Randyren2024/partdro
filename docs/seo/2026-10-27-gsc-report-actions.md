# GSC 深度分析报告（2026-10-26）解读与本批落地

- 报告窗口：2026-09-25 ~ 2026-10-24；跟踪页 `https://www.droneworld.tech/products/fp800-agricultural-drone`
- 数据口径：GSC query/page 导出（可见子集，部分 query 因字母序/隐私阈值被截断）
- 本批部署：2026-10-27，commit `d59c931`，workflow `40455014456`

## 1. 报告关键数字

| 指标 | 值 | 判读 |
|---|---:|---|
| 点击 / 展示 / CTR | 5 / 433 / 1.15% | 10-06 起被 Google 批量收录，典型新站曲线 |
| 平均排名（30 天） | 46.9 | 10-18 的 57.5 → 10-23 的 33.3，末段改善 |
| 点击门槛 | 排名 ≤ 29.7 | 5 个有点击页全部 ≤ 29.7，CTR ≥ 8.33% |
| 移动端 | 74 展示 / 3 点击 / CTR 4.05% / 排名 31.7 | **唯一有效渠道** |
| 桌面端 | 357 展示 / 2 点击 / CTR 0.56% / 排名 50.2 | 无效曝光；KPI 改为「排名进前 30」 |
| 美国 | 114 展示 / 1 点击 / 排名 58 | 大而不甜 |
| 南非 + 博茨瓦纳 | 43 展示 / 1 点击 | 第二优先级市场 |

Top query：`crop protection drone`（55 展示 / 排名 47.0）、`fertilizer application drone`（43 / 70.9）、
`smart farming drone solutions`（24 / 50.8）、`for beginners drone common problems`（19 / 69.5）、
`drone fertilizer application`（12 / 65.3）。

## 2. 本批已落地（线上已验证）

1. **3 个四语种商业 hub**（12 个页面）
   - `/solutions/facade-cleaning` → D15R、C15
   - `/solutions/solar-panel-cleaning` → D50R、D15R
   - `/solutions/heavy-lift-logistics` → C500、SL80、Y160、YP800
   - 每页含 BreadcrumbList + FAQPage + ItemList 结构化数据、5 条 hreflang、自指 canonical。
2. **文章页「相关文章」内链**：每篇 4 条同分类链接，按真实翻译回退英语。
   此前 96 篇文章正文零内链，只能靠 `/news` 分类页被发现；现在形成植保/清洗/物流文章簇。
3. **sitemap**：构建期与 FC 运行时两个来源都登记 hub；线上 187 条 `<url>`（含 hub 72 处
   loc/hreflang 引用）。站内尾斜杠链接扫描：**0 条**；FC 对 `/path/` 的 301 线上实测生效。
4. **C500 独立落地页**四语种守门通过（`id="c500-quote"`、`GTM-KJ7GJ3V5`、`x-default`）。

## 3. 对报告建议的逐条判读

| 报告建议 | 处理 |
|---|---|
| 改写 8 个「前 20 零点击」词的 title/meta | **暂缓**。这些词仅 1~7 次展示，按 1~3 次展示改标题属过拟合；报告 4.2 节也承认样本不足。先做统一内链加权，再按 4 周窗口决定 |
| 品牌词 `droneworld` 落 `/de/cases` | **部分处理**。已有 Organization `alternateName`（Drone World Tech / Drone World）+ WebSite schema；不同意「首页 title 首词改 DroneWorld」——该词 30 天仅 4 次展示，不值得牺牲首页商业词前置 |
| 4 组尾斜杠重复 URL | **已收敛**。FC 对尾斜杠 301、canonical/sitemap 统一无斜杠、站内 0 条尾斜杠内链；GSC 中的重复是 10-24 前历史数据，等待重抓收敛 |
| FP800 零曝光 | **诊断已更新**：GSC 显示最后抓取 2026-10-19，而「相关产品」内链 2026-10-20 才上线。也就是说报告窗口内 Google 从未抓到指向 FP800 的内链。线上现有 97+ 个静态 HTML 锚文本内链（含肥料文章），下一步在 GSC URL Inspection 手动请求重新抓取 |
| `crop protection drone` 内容加深 / 肥料词簇聚合 | **部分**：文章簇内链已补齐；农业 hub 尚未建（见下） |
| `/de/products` 重写 | 已在 `6cdaeca` 完成（`Industriedrohnen: Reinigung, Transport & Landwirtschaft`） |

## 4. 尚未处理 / 下一批候选

1. **农业 hub**：`/solutions/crop-protection`（或 `agricultural-spraying`），主攻
   `crop protection drone`，观察 `fertilizer application drone`；只链 FP800，避免与 90 篇农业文章互食。
2. **eco friendly drone**：文章 `why-agricultural-drones-are-considered-environmentally-friendly`
   排名 8.6 / 7 展示 / 0 点击，标题未含 query 词。改 `post_langs.title`（Supabase）前需业务确认，
   因为会同步改 H1 与列表标题。
3. **GSC 手动操作**：对 FP800、3 个 hub、6 个重点产品页请求重新抓取；在 GSC 里确认尾斜杠重复
   随 301 收敛。
4. **移动端**：报告显示移动端排名 31.7 vs 桌面 50.2，移动 CTA/首屏需单独检查（未做）。
5. **巴西/葡语**：BR 排名 24 但 0 点击、无葡语版本；评估葡语本地化的成本与需求证据，不先做。
6. **外链**：仍是最大瓶颈，代码无法替代；分销商目录、行业协会、联合案例是下一步。

## 5. 基础设施遗留问题（本批发现，未修）

- `https://droneworld.tech/`（裸域）返回 **AliyunOSS 403**（`The bucket you access does not belong to you`），
  未按 `fc/index.ts` 的 `canonicalHostRedirect` 301 到 `www`。裸域 DNS 绑定疑似仍指向 OSS 而非 FC。
  需要阿里云域名/OSS 自定义域名配置层面修复；在修复前，裸域既拿不到权重也不符合 canonical 方案。
- `verify-fc-deploy.mjs` 把该裸域检查报为「200 直出」WARN，与实际 403 不一致，脚本判据待修正。

## 6. 通过标准（本批）

| 指标 | 本批后状态 | 裁判 |
|---|---|---|
| hub 页面可访问 | 12/12，200，canonical/hreflang/FAQ 正确 | 线上 curl（已通过） |
| 文章页相关内链 | 每篇 4 条，静态 HTML 可见 | 线上 HTML（已通过） |
| sitemap 收录 hub | 187 条 URL，hub 出现 | 线上 sitemap（已通过） |
| FP800 重新抓取 | 待 GSC 手动请求 | GSC URL Inspection |
| 4 周后展示 | 农业/清洗/物流簇非品牌 impressions 是否上升 | GSC 页面级 |
