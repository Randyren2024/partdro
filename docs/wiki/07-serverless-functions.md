# 07 · 服务端函数与自动化

仓库里有**两套服务端入口**：Netlify Functions（原生）与阿里云 FC（迁移后）。它们共用同一份 handler 源码——因为 `fc/index.ts` 把 `/api/*` 原样转发给 Netlify 时代的函数体，所以「换平台」只换了外壳，业务代码一行没改。

```
netlify/functions/*.ts   ──┐
                          ├── 相同的 handler 签名 (event) => { statusCode, headers, body }
fc/index.ts  ─────────────┘   API_HANDLERS 表把 /api/xxx 路由到对应函数

fc/<name>/index.ts       独立部署的 7 个自动化函数（定时 / 事件触发，不是 Web 路由）
iopaint/app.py           本地 Flask 服务，不参与线上
```

## 0. 全景

| 位置 | 平台 | 触发方式 | 作用 |
|---|---|---|---|
| `netlify/functions/landing-content.ts` | Netlify | `POST /api/landing-content` | 保存落地页文案（见 06 §5.5） |
| `netlify/functions/admin-products.ts` | Netlify | `POST /api/admin-products` | 产品 CRUD 四个 action（见 06 §5.4） |
| `netlify/functions/inquiry-webhook.ts` | Netlify | Supabase `pg_net` → HTTP | 询盘落库后发邮件、发飞书、触发 AI 调研 |
| `netlify/functions/sitemap.ts` | Netlify | `GET /sitemap.xml` | 运行时生成站点地图（已迁到构建期） |
| `fc/index.ts` | 阿里云 FC 3.0 | HTTP 触发器（全站） | 静态站托管 + `/api/*` 反代 + `/reply` 反代 |
| `fc/daily-report/` | FC Timer | 每天 | GSC 日报 → OSS → 邮件 + 飞书 |
| `fc/ads-daily-report/` | FC Timer | 每天 | Google Ads + GA4 日报 |
| `fc/deep-analysis/` | FC Timer | 每天 09:30 | GSC 深度分析与建议 |
| `fc/inquiry-analysis/` | FC（异步） | 被 `inquiry-webhook` 触发 | AI 调研询盘公司背景 |
| `fc/inquiry-reply/` | FC HTTP | 邮件里的审批链接 | 起草回信 + 人工批准后发送 |
| `fc/bq-etl/` | FC HTTP / Timer | 手动 + 每日 | BigQuery 幂等分区 ETL（GSC/Ads/GA4/询盘） |
| `fc/gcfg/` | FC HTTP | 手动 | GA4 / Ads / GSC **配置的读写**（沙箱连不上 Google） |
| `iopaint/app.py` | 本地 Flask | `POST /api/edit` | 图像局部重绘（FLUX / 通义万相） |

> **数量口径**：`fc/` 下是 **1 个 Web 入口（`index.ts`）+ 7 个自动化函数目录 + 1 个 `shared/`**。仓库根目录旧 `README.md` 曾写「8 个运营函数」、`docs/wiki` 早期版本曾写「9 个 FC 函数」，均已按实际目录更正。`fc/index.ts` 不是运营函数而是全站 HTTP 入口，统计时不要混在一起。

---

## 1. Netlify Functions

四个函数共享 `netlify/shared/verifyAdmin.ts` 的基座（错误类、`json()`、`parseBody()`、`methodGuard()`、`verifyAdmin()`），打包由 `netlify.toml` 的 esbuild 完成，运行时 Node 20。

### 1.1 `inquiry-webhook.ts`（337 行）—— 询盘链路的唯一出口

这是全仓唯一被**外部系统**（Supabase 数据库触发器）调用的函数，也是唯一用 HMAC 而不是 JWT 鉴权的函数。

数据流：

```
inquiries 表 INSERT
   │  Supabase trigger → pg_net → POST /api/inquiry-webhook
   │  Header: x-webhook-secret
   ▼
methodGuard('POST') → assertWebhookSecret() → parseBody()
   │  payload.type !== 'INSERT'  →  return { ok: true, skipped: type }
   ▼
Promise.allSettled([ sendInquiryEmail(), sendFeishuNotification() ])
   │  邮件失败 → throw（必须让上游重试）；飞书失败 → 只 console.error
   ▼
Promise.race([ triggerLeadAnalysis(record), 3s timeout ])
   │  异步触发 fc/inquiry-analysis
   ▼
{ ok: true }
```

**三个必须记住的坑：**

1. **DirectMail 端点不能按 region 拼。**
   ```ts
   // dm.<region>.aliyuncs.com 中的 cn-hangzhou 不存在，不要按 region 拼端点
   const ENDPOINT = process.env.DIRECTMAIL_ENDPOINT || 'dm.aliyuncs.com'
   ```
   `cn-hongkong` 有独立域名，但 `cn-hangzhou` 走全局域名。用 `DIRECTMAIL_ENDPOINT` 显式覆盖，别赌规则。

2. **Node 20 的 fetch 报错要读 `e.cause.message`。** undici 抛出的 `TypeError: fetch failed` 本身没有信息，根因在 `cause` 里（DNS / TLS / 连接被拒）。

3. **异步触发必须 `await`，不能 fire-and-forget。**
   ```ts
   // FC 实例在 handler 返回后立即冻结，fire-and-forget 的 fetch 会被截断导致调研永不触发（已实测）
   // Async 调用同区域内网通常 <500ms 受理；3s 上限兜底，避免拖垮上游 pg_net 5s 总超时
   await Promise.race([triggerLeadAnalysis(record), sleep(3000)])
   ```
   这是本项目最容易被误改的一行。写成 `triggerLeadAnalysis(record)` 不 await，本地测试全绿，线上调研 0% 触发。

**DirectMail 签名**（RPC 风格，无需 SDK）：

```ts
function percentEncode(v: string) {
  return encodeURIComponent(v)
    .replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase())
    .replace(/%7E/g, '~')
}
function rpcSignature(params: Record<string, string>, secret: string, method = 'POST') {
  const canonical = Object.keys(params).sort()
    .map(k => `${percentEncode(k)}=${percentEncode(params[k])}`).join('&')
  const stringToSign = `${method}&${percentEncode('/')}&${percentEncode(canonical)}`
  return createHmac('sha1', `${secret}&`).update(stringToSign).digest('base64')
}
```

请求参数固定带 `Action=SingleSendMail`、`Version=2015-11-23`、`Format=JSON`、`RegionId`、`AccountName`、`AddressType='1'`（发信地址别名）、`ReplyToAddress='true'`、`SignatureNonce=randomUUID()`、`Timestamp=new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')`。DirectMail 对 `Timestamp` 的格式很挑，必须去掉毫秒。

**回信链接签名**：

```ts
// HMAC-SHA256(secret, `reply:${id}`) → base64url → 截前 32 字符
// URL: https://www.droneworld.tech/reply?id=<id>&t=<token>
```

用 `secret` 而不是把 id 本身当凭据——链接可以转发，但 token 只对单条询盘有效，且 `inquiry-reply` 里还有 `TOKEN_DAYS = 14` 的时效。

**`assertWebhookSecret`**：先比长度再 `timingSafeEqual`。长度不等时直接拒绝，避免 `timingSafeEqual` 抛 `RangeError`。密钥未配置时返回 `503` 而不是静默放行——宁可链路断掉，也不能让任意人往 `inquiries` 里灌垃圾触发群发邮件。

**飞书卡片**：`fields.length > 4` 时前 4 条用 `is_short` 走双列网格，其余走整段 `lark_md`；`escapeMd` 转义 `* _ ~ \``，否则公司名里带下划线会把整段变斜体。按钮文案刻意写成「起草回复（需我批准后发送）」——提醒操作者这不是一键发送。

**环境变量**：`DIRECTMAIL_ACCESS_KEY_ID` / `DIRECTMAIL_ACCESS_KEY_SECRET`（别名 `ALIYUN_ACCESS_KEY_ID` / `ALIYUN_AK`、`ALIYUN_ACCESS_KEY_SECRET` / `ALIYUN_SK`）、`DIRECTMAIL_ACCOUNT`、`DIRECTMAIL_REGION`（默认 `cn-hangzhou`）、`DIRECTMAIL_ENDPOINT`（默认 `https://dm.aliyuncs.com/`）、`DIRECTMAIL_REPLY_TO_ADDRESS`、`INQUIRY_NOTIFY_TO`、`INQUIRY_WEBHOOK_SECRET`、`INQUIRY_ANALYSIS_URL`、`INQUIRY_REPLY_URL`、`FEISHU_APP_ID` / `FEISHU_APP_SECRET` / `FEISHU_OPEN_ID`。`requireEnv()` 支持多别名按顺序回退，兼容不同平台注入时的命名习惯。

### 1.2 `sitemap.ts`（105 行）—— 被 `fc/index.ts` 复用为运行时出口

```ts
const SITE_URL = 'https://www.droneworld.tech'
const LOCALES = ['en', 'es', 'de', 'fr']
```

产品与新闻 slug 从 Supabase 读（`VITE_SUPABASE_URL` 或 `SUPABASE_URL`），读失败 `return []` 降级成纯静态路由——**站点地图永远不该 500**。

每条 URL 输出 `<url>` 时同时附 4 个 `hreflang` + `x-default`：

```
/products/xxx     ← 默认语言（en 无前缀）
/es/products/xxx
/de/products/xxx
/fr/products/xxx
```

新闻条目**只有英语** + `<lastmod>`，注释说明「翻译情况不确定，避免声明不存在的语言版本」。这与 `prerender.mjs` 的 `injectSeo()` 是同一套判断（见 08 章），两处必须同步。

响应头 `Cache-Control: public, max-age=3600`。

**现状**：这个函数**没有退役**。`fc/index.ts` 在静态服务之前就拦截 `/sitemap.xml` 并直接调用 `sitemapHandler`（`fc/index.ts:241`），所以阿里云线上命中的就是这份运行时实现——读 Supabase 实时 slug，返回 `Cache-Control: max-age=3600`。`scripts/generate-sitemap.mjs` 在构建期另外落一份 `dist/sitemap.xml`（见 08 §3），服务于 Netlify / 纯静态托管 / `npm run preview`。两条路径逻辑同构，**改一处必须同步另一处**。

### 1.3 `landing-content` / `admin-products`

契约见 06 §5.4、§5.5，这里只记两条不显眼但关键的实现细节：

- `landing-content` 用 `upsert(..., { onConflict: 'namespace,lang' })`，靠唯一约束做幂等，不做「先查再写」。
- `admin-products` 的 `delete` 调 `rpc('admin_delete_product')`，数据库函数没建时错误消息里直接带修复指令：`… — run scripts/admin-functions.sql in Supabase Dashboard first`。

---

## 2. `fc/index.ts`（273 行）—— 静态站为什么还需要一个函数

OSS 静态托管**不支持子目录 index 解析**：`/de/cases` 无法命中 `de/cases/index.html`，只会回退首页或 404；而 OSS 的路由规则只支持 301，不支持内部改写。所以必须有一个函数坐在 OSS 前面做「URL → 对象键」的映射。这就是整个文件存在的唯一理由。

### 2.1 路由顺序

```ts
toEvent()                          // HTTP 触发器 → 统一 event 形态
rawPath = rawPath || path || requestContext.http.path   // 三处兜底
OPTIONS                     → 204
/sitemap.xml                → 由 generate-sitemap 落盘的静态对象
/reply                      → proxyInquiryReply()  ← 必须在 API 之前
API_HANDLERS[path]          → /api/landing-content | /api/admin-products | /api/inquiry-webhook
非 GET / HEAD               → 405
canonicalHostRedirect()     → droneworld.tech / *.droneworld.tech → 301 www
serveStatic()
```

**`/reply` 在 `/api/*` 之前**：它不是 API，但也不是静态路径（页面上没有 `reply/index.html`），需要单独反代到 `fc/inquiry-reply`。

### 2.2 `serveStatic` 的取舍

```ts
if (path !== '/' && path.endsWith('/'))            → 301 去掉尾斜杠
if (path.endsWith('/index.html'))                  → 301 去 index.html（避免重复 URL）
有扩展名 → 精确取对象
无扩展名 → 只尝试 `${path}/index.html`
```

最后一条的注释很关键：

> 不尝试精确对象：避开 OSS 控制台建的 0 字节目录占位对象被当正文返回。

OSS 控制台手动建目录会生成 0 字节的 `<dir>` 对象。如果「无扩展名时先试精确对象」，`/products` 就会命中这个空对象，返回 200 + 空 body，比 404 更难排查。

### 2.3 缓存策略

```ts
if (key.startsWith('assets/'))  return 'public, max-age=31536000, immutable'
if (key.startsWith('images/'))  return 'public, max-age=86400'
return 'public, max-age=60'   // HTML 短缓存保证更新可见
```

Vite 的 `assets/` 带内容哈希，可以永久缓存；HTML 不能——它是 FC 生成的，必须短缓存，否则发版后用户看到旧页面。

### 2.4 `proxyInquiryReply`：一个被平台逼出来的反代

```ts
// FC 默认域名(*.fcapp.run)强制加 Content-Disposition: attachment
// → 邮件里的审批链接点开是「下载」而不是「打开页面」，只能走自定义域名
```

反代时**剔除** `content-length` / `transfer-encoding` / `connection` / `content-disposition` / `date` / `server`，再设回 `inline`。`content-length` 必须删，否则和改写后的 body 长度对不上。

同文件里还有一条运维警告：

> 自定义域名的证书私钥无法从 API 读回，改动 routes 有打挂 HTTPS 的风险。

也就是说：**这个函数的域名路由是「改前先备份、改后立刻验」的高危区**，不是随便删改的配置。

### 2.5 构建期常量注入

```ts
declare const __OSS_BUCKET__: string
declare const __OSS_REGION__: string
const BUCKET = process.env.OSS_BUCKET || __OSS_BUCKET__ || ''
const INTERNAL = (process.env.OSS_INTERNAL ?? 'true') !== 'false'
```

`__OSS_*__` 由 `scripts/build-fc.mjs` 的 esbuild `define` 打进产物——因为 FC 控制台不方便给「全站函数」单独配环境变量，把桶名编进代码更省事。`OSS_INTERNAL=true` 走内网 endpoint，线上同区域免流量费；本地调试设 `false` 走公网。

---

## 3. 阿里云 FC 自动化函数

七个函数里有**三个日报类**（daily-report / ads-daily-report / deep-analysis）用的是同一套「沙箱脚本」骨架，另外四个各自独立。

### 3.1 统一骨架：E2B 云沙箱

```
Timer 触发 handler
  ▼ 检查必需环境变量
  ▼ 鉴权（服务账号 JWT 或 OAuth refresh_token）
  ▼ Sandbox.create(TEMPLATE, { timeoutMs: 300_000 ~ 900_000 })
  ▼ 写 python / claude 脚本进沙箱
  ▼ sbx.commands.run('python3 /home/user/report.py')
  ▼ 读回 /home/user/report.md
  ▼ finally { await sbx.kill() }
  ▼ OSS PUT（私有归档，7 天签名下载链接）
  ▼ 邮件（try/catch）
  ▼ 飞书（try/catch）
  ▼ return { ok, ossKey, email, feishu }
```

**为什么用云沙箱而不是直接 Node 里写？**

- 分析脚本要跑 python（`google-analytics-data`、`googleads` 之类），Node 侧没有等价物，且这些 SDK 装在 FC 层的体积/冷启动代价太大。
- 沙箱能直连 Google，而 FC 的出口 IP 经常被 Google API 风控。
- 脚本可以随时改，不用重新部署函数（写进沙箱即可）。

**模板常量**是最容易踩的坑：

```ts
const TEMPLATE = process.env.E2B_TEMPLATE || 'claude-code-hk-1792472444'
// code-interpreter-v1 的底层 FC 函数已于 2026-10-21 被删除（创建沙箱直接 404），
// 默认值换成已验证可用、且沙箱内具备 python3 + 能直连 Google 的 claude-code 模板
```

E2B 的模板会随平台调整消失。这个默认值不是「最佳实践」，是「当前唯一能跑」。换模板后必须验证三件事：有 `python3`、能出网、`/home/user` 可写。

**脚本里的错误处理是刻意变笨的**：

```python
def http(url, payload, headers, attempts=4):
    ...
    except urllib.error.HTTPError as e:
        raise SystemExit("FATAL http ... body=" + e.read().decode()[:500])
```

注释：**否则上层只能拿到裸 traceback，分不清「OAuth 失效」和「沙箱出不了网」**。`SystemExit` 的 message 会进 `CommandExitError` 的 stderr，Node 侧再拼进错误日志。

### 3.2 Google API 鉴权：两条路

| 方式 | 环境变量 | 实现 |
|---|---|---|
| 服务账号（首选） | `GSC_SA_JSON` / `ADS_SA_JSON` / `GA4_SA_JSON` / `SA_JSON` / `BQ_SA_JSON` | 纯 `node:crypto` 手写 RS256 JWT，换 access_token |
| OAuth 刷新 | `*_REFRESH_TOKEN` + `CLIENT_ID` + `CLIENT_SECRET` | 标准 `grant_type=refresh_token` |

服务账号断言的实现（无第三方库）：

```ts
function buildSaAssertion(scope: string) {
  const head = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claims = b64url(JSON.stringify({
    iss: sa.client_email, scope,
    aud: 'https://oauth2.googleapis.com/token',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  }))
  const signer = createSign('RSA-SHA256')
  signer.update(`${head}.${claims}`)
  return `${head}.${claims}.${signer.sign(sa.private_key, 'base64url')}`
}
```

注释说明为什么优先服务账号：**不过期、不受 refresh token 数量上限影响、无需用户再次 consent**。refresh_token 方案保留是因为早期就是这么配的，改造成本大于收益。

`fc/bq-etl` 还有第三种：直接读 `GOOGLE_APPLICATION_CREDENTIALS` 指向的文件，交给 BigQuery 客户端自己处理。

### 3.3 `daily-report`（GSC 日报，458 行）

```
窗口：end = today - 2 天，start = end - 6 天   （GSC 数据延迟 2 天，取最近 7 个自然日）
维度：总览 + top query 10 + top page 10 + query×page 300 + urlInspection
输出：/home/user/report.md  → OSS gsc-reports/${day}.md
```

`SITE_URL = process.env.GSC_SITE_URL || 'sc-domain:droneworld.tech'`——注意是 `sc-domain:` 形式（Domain 属性），不是 `https://…`（URL 前缀属性），两者调 API 时格式不同，混用会 403。

`ossSignedGetUrl(key, hours = 168)` 生成 7 天有效的下载链接，随邮件一起发出。OSS 签名用 Signature V1：

```
PUT\n\n${contentType}\n${date}\n/${bucket}/${key}
→ HMAC-SHA1(accessKeySecret, stringToSign) → base64
Authorization: OSS ${ak}:${sig}
```

### 3.4 `ads-daily-report`（763 行）

同一骨架，但接 **12 个凭据**（Ads 4 + GA4 4 + 客户 id / 属性 id 4）。python 侧的 `http()` 多了重试：

```python
attempts=4；429 或 >=500 → time.sleep(2 + 2*i) 重试
4xx（除 429）→ 直接 SystemExit
access_token() 里 HTTP 400 invalid_grant 不重试 —— 这是凭据问题，重试没有意义
```

用 `hasSa = Boolean(process.env.ADS_SA_JSON || process.env.GA4_SA_JSON || process.env.SA_JSON)` 判断走哪条鉴权；都不满足时要求 6 个 OAuth 变量齐全，缺哪个报哪个。

输出 `ads-reports/${day}.md`，飞书卡片 `template: 'green'`。

### 3.5 `deep-analysis`（490 行）

GSC 深度分析 + 行动建议。默认模型 `deepseek-v4.1-flash`（经百炼中转），默认模板 `claude-code-gsc`。

两条最重要的运维注释，都是**被线上故障教出来的**：

```ts
// 分析已完成，立刻销毁沙箱 —— 不等 finally。
// 原因：函数若在 900s 被 FC 强杀，finally 根本不执行，沙箱会一直计费
```

```ts
// 该函数未接 SLS，FC 只回 errorMessage/errorType，
// 空 message 的 CommandExitError 无法定位（本次故障即为此）
catch (e) {
  throw new Error(`stage=${stage} | type=${e?.name} | exit=${e?.exitCode} | ` +
    `stderr=${…} | stdout=${…} | msg=${…} | at=${new Date().toISOString()}`)
}
```

也就是说：**「成功路径上提前 kill」比「依赖 finally 清理」更可靠**。FC 的强杀是硬超时，任何清理逻辑都不会跑；计费按沙箱存活时间算，一次漏杀就是几百块的沙箱账单。

### 3.6 `inquiry-analysis`（538 行）

AI 调研询盘背后的公司。输入是 `inquiries` 表的一条 record，输出 `LeadProfile`：

```ts
interface LeadProfile {
  company: string; industry: string; region: string; position: string
  website: string; credibility: 'high' | 'medium' | 'low'
  intent: string; summary_cn: string; sources: string[]
}
```

**失败语义**（写在文件顶部）：只记函数日志 + OSS 错误存档 + 表回写 `failed` 标记，**不发飞书/邮件**——调研失败不是业务事件，推送只会制造噪音。成功时才三路并发：

```ts
Promise.allSettled([sendLeadFeishu(profile), sendLeadEmail(profile), patchLeadProfile(id, profile)])
```

**免费邮箱短路**：内置约 28 个域名（gmail / outlook / yahoo / qq / 163 / 126 / sina / sohu / 139 / 189 …），可用 `SKIP_FREE_EMAIL_DOMAINS` 以逗号追加。命中即**不开沙箱、不写回、不推送**。理由很实际：一个 `@gmail.com` 的询盘没有「公司背景」可查，花 10 分钟跑一次 Claude 是纯浪费。

**调用 Claude 的方式**：

```
envs: ANTHROPIC_DEFAULT_HAIKU_MODEL / SONNET / OPUS 全部指向同一个 MODEL
echo '{}' > /home/user/.claude.json          ← 跳过首次运行的 onboarding
claude --dangerously-skip-permissions < /dev/null -p ${JSON.stringify(prompt)}   （timeout 600s）
```

`</dev/null` 是必须的：不带的话 `claude` 在某些模板里会等待 stdin 而挂满超时。

**鉴权只在有 HTTP 上下文时校验**：

```ts
// FC OpenAPI 直调（无 HTTP 上下文）视为内部调用放行
if (isHttpRequest(event)) assertSecret(event)
```

这条规则配合 `inquiry-webhook` 的 `x-fc-invocation-type: Async`——异步调用不经过 HTTP 触发器，所以没有 header 可查。

### 3.7 `inquiry-reply`（411 行）—— 三条写死的硬约束

```
1. Bcc 归档 + Reply-To 指向归档邮箱（所有回信留档）
2. 同一询盘只发一次（OSS ledger 有 sent 即拒；本函数不暴露 force 参数）
3. 草稿不得出现价格 / 交期承诺（正则拦截）
```

第 3 条的正则：

```ts
/(\bUSD\s?\d|\$\s?\d|¥\s?\d|\bprice is\b|\bcost is\b|\bdiscount\b|\blead time\b|\bdelivery in \d)/i
```

命中就返回「草稿含价格或交期表述，已拦截」页面，不发送。这不是「AI 可能会说错」的兜底，而是硬性合规要求：报价必须由人给，AI 报出去的价格后期改不了。

其它：

- `TOKEN_DAYS = 14`，链接过期后 `!tokenOk` → 403 `forbidden` **纯文本**（不泄露询盘内容，也不告诉攻击者「这条询盘存在」）。
- `toEvent()` 三重兜底（对象 / Buffer / 正则从原始 body 捞 `id`、`t`）；`queryOf()` 合并 `queryParameters` + `queryStringParameters` + `requestContext.http.queryString` + `rawPath` 里的 `?`。FC 的 HTTP 触发器在不同入口下 event 形态不一致，只能层层兜底。
- GET 无 `id` → 返回 `{ ok: true, service: 'inquiry-reply', model, hasSecret }`，当作健康检查。
- `FROM_ALIAS` 默认 `'Randy Ren - Partdro'`——发件人显示名带人名，回信率明显高于「Partdro Sales」。

### 3.8 `bq-etl`（987 行）—— 幂等是关键

四种事件形态（`backfill` / `daily` / `bootstrap` / `inquiries`），十三个 mode 分支：

`noexpiry` / `ga4keys` / `adsnetwork` / `terms` / `adsconv` / `adsaudit` / `leads` / `inquiries` / `sql` / `verify` / `bootstrap` / `backfill` / `daily`（默认）

**幂等设计**（文件顶部注释）：

> 每个 (表, 日期) 单独发一个 load job，目标是 `表$YYYYMMDD` 分区，写处置 `WRITE_TRUNCATE` → 同一天重复跑只会覆盖该分区，不会产生重复行。

八张表：

| 表 | 说明 |
|---|---|
| `gsc_query_page` | GSC query × page 维度 |
| `gsc_page_daily` | 页面级日汇总（**唯一可信的流量口径**） |
| `inquiries_attribution` | 询盘归因，不分区，整表替换 |
| `ads_campaign_daily` | Ads 广告系列日报 |
| `ads_keyword_daily` | Ads 关键词日报 |
| `ads_search_term_daily` | Ads 搜索词 |
| `ga4_traffic_daily` | GA4 流量（含 `landing_page` 聚类） |
| `ga4_leads_daily` | GA4 **真实线索**（含 `landing_page` 聚类） |

三条注释解释了「为什么不合并」：

```ts
// 页面级 GSC：唯一可信的流量口径。query 维度会被 GSC 隐私阈值整行丢弃（clicks 恒 0），
// 所以 organic_clicks/impressions 只能来自这张表，绝不能读 gsc_query_page。
```

```ts
// 询盘归因：只保留归因字段，刻意丢弃 name/email/message 等 PII。不分区（整表替换）
```

```ts
// 只存「真正的线索事件」。GA4 把 click / scroll 也登记成了关键事件，
// 直接用 keyEvents 会把滚动当成转化
```

**第一张表的坑值得单独强调**：GSC 的 query 维度有隐私阈值，长尾查询会被整行剔除且 `clicks = 0`。任何「用 query 表汇总总点击」的查询都会得到远低于真实值的数字，而且不会报错。

**时间约束**：`SANDBOX_MAX_DAYS = 59`，超出自动 clamp。原因是 **BigQuery Sandbox 强制 60 天分区过期**，回填更早的数据上去就立刻消失。

**事件解包**：三轮循环（string / Buffer / `{ payload: string }`），最后还有一层「从原始 body 正则捞 `mode` / `days`」的兜底。丑，但这是唯一能在 FC 各种触发器形态下都拿到参数的写法。

### 3.9 `gcfg`（265 行）—— 唯一能改配置的地方

> 本沙箱连不上 Google，所有「查看/修改」GA4 / Ads / GSC 配置的动作都在这里执行。

| mode | 作用 |
|---|---|
| `probe` | 只读体检 + 用 `validateOnly` 试探写权限（不实际写入） |
| `query` | 执行任意 GAQL（人工排查用） |
| `ads` | 4 个 action：`pause-campaign` / `pause-keyword` / `network` / `negative` |
| `ga4-keys` | 列出 GA4 关键事件 |
| `ga4-key-delete` | 删除 GA4 关键事件 |

`SCOPES = { ads: '…/adwords', ga4: '…/analytics.edit', gsc: '…/webmasters' }`，`tokenCache` 是模块级缓存（同一实例复用，冷启动即失效——足够）。`call()` 带 `AbortSignal.timeout(60000)`，所有请求 60 秒硬上限。

这个函数的存在说明一件事：**「能读」和「能写」被有意分开**。日常 ETL 只读，改配置走 `gcfg`，权限最小化，误操作面也最小。

### 3.10 `fc/shared/feishu.ts`（125 行）

```ts
const MAX_CARD_CHARS = 18000   // 飞书单卡约 30KB，保守截断
```

`mdToFeishu()` 把 Markdown 降级成飞书卡片可渲染的子集：

| Markdown | 飞书卡片 |
|---|---|
| 表格行 | `- **单元格** · 单元格`（飞书卡片不支持 MD 表格） |
| `## 标题` | 加粗整行 |
| `> 引用` | 原样保留 |
| 3+ 连续换行 | 压成一个 |

`feishuPost` 带 `AbortSignal.timeout(20_000)`，`data.code !== 0` 即抛。未配 `FEISHU_*` 时 `console.log` 后 `return false`——**调用方不把「未配置飞书」当错误**，否则所有日报都会在本地调试时报错。

---

## 4. 询盘端到端时序

把 04（数据）、06（鉴权）、07（函数）串起来：

```
① 访客提交表单（ContactView / 产品页 CTA）
       │  前端直连 Supabase：insert into inquiries
       │  （anon 只有 INSERT 权限，无 SELECT）
       ▼
② Supabase trigger → pg_net → POST /api/inquiry-webhook
       │  Header x-webhook-secret
       ▼
③ inquiry-webhook
       ├─ DirectMail 发通知邮件给 INQUIRY_NOTIFY_TO（失败即 throw，让 pg_net 重试）
       ├─ 飞书卡片推送（失败只 log）
       └─ Async 触发 inquiry-analysis（3 秒 race 兜底）
       ▼
④ inquiry-analysis（E2B 沙箱）
       ├─ 免费邮箱 → 直接返回
       ├─ Claude 调研公司 → LeadProfile
       ├─ 写回 inquiries.lead_profile
       ├─ 飞书 + 邮件推送调研结果
       └─ 失败 → 表里标 failed + OSS 存档，不推送
       ▼
⑤ 人点开邮件里的「起草回复」链接（带 HMAC token，14 天有效）
       │  GET /reply?id=…&t=…
       ▼
⑥ fc/index.ts → proxyInquiryReply → fc/inquiry-reply
       ├─ 校验 token（HMAC + 14 天 + 只能发一次）
       ├─ Claude/qwen 起草回复
       ├─ 价格/交期正则拦截
       └─ 人确认 → DirectMail 发送（Bcc 归档 + Reply-To 归档）
```

每一跳都有独立的失败语义：③ 邮件失败必须重试（否则线索丢失），飞书失败无所谓；④ 全链路失败都不推送（避免噪音）；⑥ 双重幂等（token 时效 + OSS ledger）。

---

## 5. `iopaint/app.py` —— 本地图像重绘

不属于线上服务，是**编辑器的辅助工具**：落地页里图片的局部重绘（去掉第三方位标、换文案）用它，跑在本地 `:5000`。

```python
FLUX_SPACE  = "black-forest-labs/FLUX.1-Fill-dev"      # Gradio Space
QWEN_BASE_URL = "https://maas.qianwenaiapi.com/api/v1"  # 通义万相
```

| 路由 | 作用 |
|---|---|
| `GET /` | `render_template("index.html")`，一个极简的画布 UI：涂抹 mask → 提交 |
| `POST /api/edit` | 读 `model`（默认 `'flux'`）分流到 `edit_flux` / `edit_wanx` |

三个实现细节：

1. **`_flux_client` 是模块级懒单例**：`gradio_client.Client(FLUX_SPACE, token=os.environ.get("HF_TOKEN"))`。Gradio Space 每次新建 client 都要拉一次 `/config`，慢且容易被限流。
2. **`_NoProxy` 上下文管理器**：临时 `pop` 掉 `HTTP_PROXY` / `HTTPS_PROXY` / `ALL_PROXY`（大小写各一份）。注释：避免本地代理未运行导致连接失败。
3. **`@app.after_request` 加 CORS**：`Access-Control-Allow-Origin: *`，注释说明「partdro 编辑器从 `http://localhost:5173` / `8888` 直连本服务」——画布在 Vue 应用里，跨端口调 Flask，不开 CORS 直接被浏览器拦。

`edit_wanx` 超时 90 秒后返回 `{"success": False, "error": …}` 而不是抛异常——前端只判断 `success` 字段，不需要区分「网络错误」和「模型拒绝」。

`app.run(host="0.0.0.0", port=5000, debug=False)`，绑 `0.0.0.0` 是为了容器/远程开发机能访问。

---

## 6. 运维约定与坑汇总

| 主题 | 约定 | 出处 |
|---|---|---|
| 异步触发 | 必须 `await Promise.race([...])`，不能 fire-and-forget | `inquiry-webhook.ts` |
| 沙箱清理 | 成功路径先 `kill()`，不要只靠 `finally` | `deep-analysis/index.ts` |
| 错误日志 | 拼 `stage/type/exit/stderr/stdout/at`，FC 无 SLS 时靠它定位 | `deep-analysis/index.ts` |
| 模板 | `E2B_TEMPLATE` 可覆盖；默认值随平台变动，换后验三件事 | `daily-report/index.ts` |
| 分区过期 | BigQuery Sandbox 只留 60 天 → 回填上限 59 天 | `bq-etl/index.ts` |
| OSS 目录占位 | 无扩展名路径只试 `<path>/index.html`，不试精确对象 | `fc/index.ts` |
| HTML 缓存 | 60 秒，不能长期缓存（内容由 FC 动态给出） | `fc/index.ts` |
| 飞书未配置 | 视作正常降级，不抛错 | `fc/shared/feishu.ts` |
| 免费邮箱 | 命中即短路，不消耗沙箱 | `inquiry-analysis/index.ts` |
| 价格/交期 | 硬正则拦截，不可配置绕过 | `inquiry-reply/index.ts` |

---

下一篇：[08-build-and-seo.md](./08-build-and-seo.md) — 三段式构建管线与多语言 hreflang 策略。
