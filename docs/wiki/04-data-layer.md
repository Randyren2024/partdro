# 04 · 数据层：Supabase、表结构、读取约定与归因

本站没有传统后端。数据分两半：

- **读**：浏览器拿 `anon` key 直连 Supabase REST（PostgREST），靠 **RLS 策略**兜底安全。
- **写**：一律经服务端函数（`SUPABASE_SERVICE_ROLE_KEY`），因为写操作要校验管理员身份或要绕过 RLS。

`service_role` 密钥永不出现在前端 bundle 里——这是整套数据层设计的红线。

---

## 1. 客户端

`src/supabase/client.ts` 只有 6 行：

```ts
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || '',
)
```

没有配 `auth.persistSession` 之类的选项——用默认值（session 存 localStorage）。这意味着管理员登录状态在刷新/重开浏览器后仍然保留，`auth.init()` 靠 `supabase.auth.getSession()` 自动恢复。

所有业务代码都从 `src/composables/useSupabase.ts` 间接使用它，不直接 `import { supabase }`（例外：`stores/auth.ts` 与 `lib/netlifyApi.ts`，它们做的就是 auth 本身）。

---

## 2. 表结构

表结构没有 migration 目录，真相分散在 `scripts/*.sql`、`src/types/index.ts` 与各 composable 的 `select` 语句里。汇总如下。

### 2.1 内容四表（主表 + 语言子表）

`products` / `posts` / `cases` / `documents` 都是「主表存语言无关字段，`<table>_langs` 子表存可翻译字段」的结构。

```ts
// products ─────────────── product_langs
id            number       product_id  → products.id
slug          string       lang        'en' | 'es' | 'de' | 'fr'
category      ProductCategory           ← 'agricultural' | 'cargo' | 'cleaning'
image_url     string       name
gallery       string[]     description
specs         Record<string,string>    short_desc
features      ProductFeature[]   // { icon, title, description }
sort_order    number
published     boolean
created_at    timestamptz
```

```ts
// posts ──────────────────── post_langs
id, slug, category, image_url, published, published_at, created_at
                            post_id, lang, title, summary, content

// cases ──────────────────── case_langs
id, slug, image_url, product_id (nullable), published, created_at
                            case_id, lang, title, description, location

// documents ──────────────── document_langs
id, file_url (nullable), file_size (nullable), product_id (nullable),
published, created_at
                            document_id, lang, title, description
```

`category` 的取值受数据库 CHECK 约束保护：

```sql
ALTER TABLE products ADD CONSTRAINT products_category_check
  CHECK (category IN ('agricultural', 'cargo', 'cleaning'));
```

> **这是本项目最容易踩的坑**：`CLAUDE.md` 里仍写着 `'window' | 'solar'`。那是旧体系，`scripts/migrate-product-categories.sql` 已经把它们全部迁到 `cleaning` 并重建了约束。代码侧 `src/types/index.ts`、`Header.vue`、`AdminProductsView.vue`、`netlify/functions/admin-products.ts` 四处一致，都是新的三类。

### 2.2 `inquiries`（询盘）

除基础字段外，有两大类扩展列，都是为「可归因」加的：

```sql
-- scripts/inquiries-attribution.sql
page_path      text   -- 提交时所在页面（含语言前缀，如 /de/products/d15r）
landing_page   text   -- 会话首次落地页（含 query）
referrer       text   -- 首次来源域名
utm_source / utm_medium / utm_campaign / utm_term / utm_content  text
gclid          text   -- 非空 = 可精确归因到某次广告点击
product_slug   text   -- 刻意不用 product_id 外键

-- scripts/inquiry-lead-profile-column.sql
lead_profile   jsonb  -- fc/inquiry-analysis 写入的 AI 背景调研结果
```

`product_slug` **故意不做外键**，注释写得很直白：

> 产品页 slug 未必都在 products 表里，用外键会让那条询盘写入失败——宁可有 slug 没 id，也不能丢线索。

两个索引：`inquiries_created_at_idx (created_at desc)`、`inquiries_utm_source_idx (utm_source)`。

### 2.3 `landing_content`（落地页差异）

```sql
namespace  text   -- = 产品 slug 或静态命名空间名（hero / footer / d15r …）
lang       text   -- 'en' | 'es' | 'de' | 'fr'
content    jsonb  -- 只存相对静态 json 的「差异叶子」
PRIMARY KEY (namespace, lang)
```

管理员保存时走 `upsert(..., { onConflict: 'namespace,lang' })`。删除产品时，`admin_delete_product` 会按 slug 连带删掉对应 namespace 的行。

因为 `namespace` 复用了产品 `slug`，所以「删产品 = 删它那套落地页文案」是自动的，不需要额外映射表。

### 2.4 `admins`

```sql
user_id   uuid  -- 对应 Supabase Auth 用户
username  text
```

登录时用户名不是邮箱，`stores/auth.ts` 会补齐域名：

```ts
const ADMIN_EMAIL_DOMAIN = 'admin.partdro.com'
if (trimmed.includes('@')) return trimmed
return `${trimmed}@${ADMIN_EMAIL_DOMAIN}`
```

也就是说管理员实际账号形如 `randy@admin.partdro.com`，但界面上只输 `randy`。登录成功后还要再查 `admins` 表——**不是所有 Auth 用户都是管理员**，查不到就立刻 `signOut()`（见 06 章）。

### 2.5 `app_secrets`

只存 webhook 密钥的私有表：

```sql
create table public.app_secrets (key text primary key, value text not null);
alter table public.app_secrets enable row level security;
revoke all on public.app_secrets from anon, authenticated;
```

开了 RLS 且**不建任何策略** = 任何人（含登录用户）都读不到。只有 `security definer` 的触发器函数能读。

---

## 3. RLS 策略总览

| 表 | anon | authenticated | service_role |
|---|---|---|---|
| `products` / `product_langs` | select（公开内容） | select / insert / update / delete | 全权 |
| `cases` / `documents` | select | update（改 `product_id`） | 全权 |
| `inquiries` | **insert only** | select（后台列表） | 全权 |
| `landing_content` | select | delete（另有 select/insert/update 建议补） | 全权 |
| `admins` | 无 | select 自己的行 | 全权 |
| `app_secrets` | 无 | 无 | 全权 |

`scripts/rls-admin-products.sql` 的注释解释了为什么管理页能直接写 `products`：站点全部走 anon key + 客户端请求，管理页需要 `authenticated` 会话的 CRUD 权限。

`scripts/rls-inquiries-select.sql` 里有一段明确的风险权衡，值得全文记住：

> 站点的 `VITE_SUPABASE_ANON_KEY` 是公开打包进前端的，若给 anon 开 SELECT，任何拿到该 key 的人都能读到全部留言（含 name / email / phone 等个人信息）。只是自己验证数据 → 用 Dashboard 或 service_role 查询，不要执行下面的 anon 策略。

---

## 4. `useSupabase.ts`（301 行）

这是全部内容读取的统一入口，导出 5 个组合函数。

### 4.1 统一模式

```ts
function pickLang<T extends { lang: string }>(langs: T[], locale: string): T | undefined {
  return langs.find(l => l.lang === locale) ?? langs.find(l => l.lang === 'en')
}
```

**回退链只有两级**：当前语言 → en。不逐级回退，也不给空字符串兜底。所以 `en` 子表必须有完整数据，否则页面会渲染出 `undefined`。

```ts
function useLocale() {
  return bindLocale(reload)   // watch(locale, reload, { flush: 'post' })
}
```

语言切换时重新拉数据，而不是在客户端把四份语言都缓下来——列表页数据量小，重拉足够快，也避免了四倍内存。

### 4.2 五个查询

| Composable | select | 排序 | 说明 |
|---|---|---|---|
| `useProducts()` | `*, product_langs(lang, name, description, short_desc)` | `sort_order` | `.eq('published', true)` |
| `usePosts({ limit })` | `*, post_langs(lang, title, summary, content)` | `published_at desc` | 可选 `limit`（首页资讯用 3） |
| `usePost(slug)` | `*, post_langs(lang, title, summary, content)` | — | `.eq('slug', slug).maybeSingle()` |
| `useCases()` | `*, case_langs(lang, title, description, location)` | `created_at desc` | |
| `useDocuments()` | `*, document_langs(lang, title, description)` | `created_at asc` | 文档按时间正序更自然 |

**只有 `usePost` 配了超时**：

```ts
.abortSignal(AbortSignal.timeout(10000))
```

理由：详情页是 SEO 与转化主战场，卡住比报错更糟——10 秒后会走错误分支，让页面至少能渲染出「文章不存在」而不是白屏。列表页则交给浏览器默认行为。

### 4.3 返回形态

每个 composable 都返回同一组状态：

```ts
{ items, loading, error, reload }   // 列表
{ post, loading, error }            // 详情
```

组件侧用 `loading` 决定骨架屏，用 `error` 决定空态。这类状态**不进 Pinia**——数据只被当前页面消费，放 store 反而增加跨页污染风险。Pinia 只服务 `auth`。

---

## 5. 归因与埋点

两块，职责不同，都在 `src/composables/`。

### 5.1 `useAttribution.ts` — 数据，不是事件

存 `localStorage['pd_attribution_v1']`，TTL **90 天**。

```ts
const UTM_KEYS = ['utm_source','utm_medium','utm_campaign','utm_term','utm_content']
const gclid = params.get('gclid') || params.get('gbraid') || params.get('wbraid')
```

两段逻辑分工明确：

| 字段 | 取值策略 | 回答的问题 |
|---|---|---|
| `landing_page` / `referrer` | **只取第一次**（`isFirstTouch`） | 他最初从哪认识我们 |
| `utm_*` / `gclid` | **取最近一次**（仅当本次带广告参数才覆写） | 这次是哪条广告把他带回来 |

设计备注（源码注释）：为什么用 localStorage 而不是 sessionStorage——B2B 决策周期以周/月计（加拿大客户 Kal 从询盘到报价确认用了两周），会话级存储会把这些线索的来源全丢掉。

为什么「只有带明确广告参数才覆写」——避免普通站内跳转把来源冲掉。

写入侧的两个细节：

```ts
function writeStored(v) {
  try { localStorage.setItem(...) } catch { /* 隐私模式/配额满时静默失败 */ }
}
```

归因是增强项，**绝不能因为存储失败挡住询盘提交**。

对外只导出两个函数：

```ts
captureAttribution()                    // main.ts 启动时调一次
attributionFields(pagePath, productSlug) // 提交表单时生成要写进 inquiries 的字段
```

### 5.2 `useTracking.ts` — 埋点事件

只有 10 行，极其克制：

```ts
export function trackEvent(event: string, params: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({ event, ...params })
}
```

不引第三方 SDK，直接喂 GTM 的 `dataLayer`（GTM 容器 `GTM-KJ7GJ3V5` 在 `index.html` 里）。GA4 / Google Ads 转化都在 GTM 后台配。

已知事件名：

| 事件 | 触发点 | 参数 |
|---|---|---|
| `whatsapp_chat_initiated` | `App.vue` 悬浮按钮 | `channel: 'whatsapp'`, `phone` |
| `generate_lead` | `Footer.vue` CTA | `location: 'footer_cta'` |
| （各落地页区块的交互） | `sections/*` 通过 `useLandingSection().trackEvent` | 见 05 章 |

---

## 6. 写入链路：从表单到邮件

询盘是本项目唯一的高价值写入。它跨了三个系统，值得单独画一遍：

```
InquiryForm.vue
  ├─ supabase.from('inquiries').insert({ ...attributionFields(path, slug) })
  │     └─ anon key，靠 RLS insert 策略
  ▼
Postgres AFTER INSERT 触发器 (scripts/supabase-inquiry-webhook.sql)
  └─ net.http_post(...) 异步 → POST https://www.droneworld.tech/api/inquiry-webhook
        headers: x-webhook-secret ← 从 app_secrets 读
  ▼
fc/index.ts 路由到 netlify/functions/inquiry-webhook.ts
  ├─ 校验 x-webhook-secret
  ├─ 阿里云 DirectMail → INQUIRY_NOTIFY_TO
  └─ 触发 fc/inquiry-analysis（异步，AI 背景调研）
        └─ PATCH inquiries.lead_profile
```

三个关键点：

1. **触发器是 `security definer`**，否则读不到 `app_secrets`。
2. **`net.http_post` 是异步的**，失败不会回滚询盘插入——线索优先，通知可以重试。
3. **整条链路有备用方案**：`scripts/supabase-inquiry-webhook.sql` 开头就说明，也可以用 Supabase 官方的 Database Webhooks UI 配同样的 URL + 事件 + header，跳过手动建触发器。

---

## 7. 数据层约定速记

| 约定 | 原因 |
|---|---|
| 组件永不直接 `import { supabase }` | 唯一入口在 `useSupabase.ts`，便于统一加超时/回退 |
| 语言回退只有两级（当前 → en） | 保证渲染永不为空；代价是 en 必须补全 |
| 写操作一律走服务端 | `service_role` 不能进 bundle |
| `inquiries.product_slug` 不做外键 | 宁可丢 id 也不能丢线索 |
| 归因存 localStorage 90 天 | B2B 决策周期长，session 会丢来源 |
| 列表数据不进 Pinia | 避免跨页污染，Pinia 只放 `auth` |
| `landing_content` 用 slug 当 namespace | 删产品自动删文案，无需映射表 |

---

下一篇：[05-landing-page-system.md](./05-landing-page-system.md) — 16 区块落地页系统、内容四层叠加与后台编辑器。
