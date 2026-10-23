# 迁移到 TRAE International

本分支把所有「让这套项目跑起来」的东西从 TRAE 中国版搬到 TRAE International。

## 为什么必须迁

中国版沙箱对 Google 全线不通，实测：

```
www.google.com           -> 000  SSL_ERROR_SYSCALL
www.googleapis.com       -> 000
googleads.googleapis.com -> 000
```

后果是所有 Google 相关操作都要绕道阿里云函数计算（FC，香港）：
多一层部署、多一份成本、多一个故障点，且无法在本机直接用 `gcloud` / BigQuery 客户端 / 浏览器调试 GA4。

TRAE International 可直连 Google，以上绕行手段全部可以简化成直接调用。

## 这个分支包含什么

| 路径 | 内容 |
|---|---|
| `.trae/skills/` | 55 个技能（平台内置 + 项目自有 + 插件副本） |
| `.trae/rules/project_rules.md` | 项目规则与跨会话记忆（目标、口径、踩坑、已验证事实） |
| `ops/deploy-fc-function.mjs` | 阿里云 FC 部署/调用（零依赖，ACS3 签名） |
| `ops/daily-attribution-check.mjs` | 每日只读体检（站点/询盘/花费） |
| `ops/send-customer-mail.mjs` | 客户邮件发送（强制 Bcc + Reply-To） |
| `ops/fc-daily-brief/index.js` | 晚间日报函数源码（21:00 北京时间） |

## 迁移后怎么用

### 1. 拉分支

```bash
git clone -b trae_international_migration https://github.com/Randyren2024/partdro.git
```

用 TRAE International 打开该目录。`.trae/skills` 与 `.trae/rules` 会被自动加载，无需安装。

### 2. 注入密钥（不进仓库）

在仓库根目录之外放一份 `partdro.env`，变量名如下（值从原环境 `/workspace/.secrets/partdro.env` 复制）：

```
OSS_BUCKET  OSS_REGION  OSS_AK_ID  OSS_AK_SECRET
SUPABASE_URL  SUPABASE_SERVICE_ROLE_KEY
DEEPSEEK_API_KEY  DASHSCOPE_API_KEY  GITHUB_FINE_GRAINED_PAT
```

Google 侧不再需要 refresh token，只需要 service account JSON：
`GSC_SA_JSON` / `ADS_SA_JSON` / `GA4_SA_JSON` / `BQ_SA_JSON`（同一把密钥，按用途分开注入）。
FC 函数里已经配好，国际版本地调试时从 FC 控制台复制即可。

### 3. 插件

以下能力在 TRAE International 里以插件形式安装（与原环境同名）：
`lark`、`Office Document Processing`、`HTML Reports & Presentations`、`Deep Research Assistant`、`PRD Writing`、`seedance`、`seedream`。

### 4. MCP

**当前这套项目没有任何 MCP server 依赖。** 所有外部能力都走 HTTP/CLI：

- Google 三套 API → service account + REST（`fc/bq-etl`、`fc/gcfg`）
- 飞书 → `lark-cli`
- 浏览器 → 平台内置 browser 工具
- 阿里云 → 自签 ACS3 / OSS V1 HMAC

所以迁移不需要导出 MCP 配置。若之后要加 MCP server，在 TRAE International 的 MCP 面板里配即可，不要把它写进仓库（多数 server 需要本机路径或密钥）。

## 国际版下可以简化的地方

迁移完成后，下面这些「绕行」可以按需拆掉，但**不要一次性全拆**：

1. `fc/gcfg` 里读 Google 配置 → 本地直接调 GA4 Admin / Google Ads API。
2. BigQuery 查询 → 本地直接 `gcloud` 或 REST，不必经 FC 转发。
3. `ops/deploy-fc-function.mjs` 仍然要留：生产日报（GSC/Ads/深度分析/晚间简报）跑在 FC 上，和本地分析是两条线。

## 不要带过去的东西

- `aikada-export/`（已删除，不再需要）
- 任何 `*_REFRESH_TOKEN`：已全部切到 service account
- `.secrets/`、`*.env`：永远不进仓库

## 验收清单

在 TRAE International 里逐条执行，全部通过才算迁移成功：

```bash
# 1) 规则与技能被识别
ls .trae/rules/project_rules.md && ls .trae/skills | wc -l      # 期望 55

# 2) 站点可构建（需要 Supabase 变量，否则会静默预渲染 0 页）
npm run build && ls dist/index.html

# 3) Google 直连（国际版应为 200，中国版是 000）
curl -s -o /dev/null -w '%{http_code}\n' https://www.googleapis.com/discovery/v1/apis

# 4) 生产链路仍活（FC 侧）
node ops/deploy-fc-function.mjs --fn bq-etl --invoke-only --invoke --sync --payload '{"mode":"verify"}'
```

## 已知硬约束（与版本无关）

- BigQuery Sandbox：所有表/分区 60 天过期且无法取消 → 分析窗口上限 **59 天**。
- 阿里云 FC 同步调用约 60s 被平台中止，长任务必须 `Async`。
- Ads API 当前可用版本 **v25**。
- 服务账号在 Google Ads 里必须升到「管理员」、在 GA4 里必须升到「编辑者」才能改配置（默认只读）。
