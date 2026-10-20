# related/ — 运维与营销脚本

从本地工作目录 `partdro_related_with_product_files` 纳入的代码部分，便于远端 agent 直接读取上下文。
**凭据不在仓库内**（`.env` 已被忽略），结构见各目录的 `.env.example`。

| 目录 | 用途 |
|---|---|
| `google-ads/` | Google Ads API 脚本：建系列/关键词/广告、出价与预算调整、搜索词诊断、GTM 配置 |
| `ga4/` | GA4 Data API 脚本：OAuth 授权、属性/数据流查询、报表与互动分析 |
| `gsc/` | Search Console API 脚本：收录状态审计、URL 提交、`snapshots/` 为历史审计快照 |
| `seo/` | SEO 流程说明 |
| `nodejs+echarts/` | 关键词数据分析与图表（CSV 解析 + ECharts） |
| `unsloth_finetuning_gemma4/` | 模型微调实验代码与数据 |

## 约定

- 所有脚本从 `process.env` 读取凭据，通过 `dotenv` 加载同目录 `.env`。
- OAuth 客户端为 Google Cloud 项目 `artful-striker-458704-g1`，授权账号 `partdro2023@gmail.com`；
  OAuth 同意屏幕已发布为 **In production**，refresh token 不再 7 天过期。
- 生产定时任务不在此目录，见仓库根 `fc/`（阿里云函数计算）。
