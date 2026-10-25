# 06 · 后台与鉴权

后台只有三件事：**登录**、**管产品**、**改文案**。没有角色体系、没有权限矩阵、没有多租户——刻意保持最小。

```
/admin/login      登录（用户名 + 密码）
/admin/products   产品列表：新建 / 发布开关 / 删除 / 进入编辑
/admin/editor     → redirect /products/d15r（编辑入口就是产品页本身）
```

管理员登录后，`App.vue` 里常驻的 `InlineEditor` 会让**任意页面**进入可视化编辑态——这是本项目「后台」最反直觉也最省事的点：没有独立的编辑后台界面，编辑器就长在真实页面上。

---

## 1. 鉴权模型

真正的身份源是 **Supabase Auth**，`admins` 表只做「在册校验」。

```
用户输入 username + password
   │
   ▼ usernameToEmail()
   │   'randy'  →  'randy@admin.partdro.com'
   │   'a@b.com' →  'a@b.com'（兼容误填完整邮箱）
   ▼
supabase.auth.signInWithPassword({ email, password })
   │  成功 → 拿到 session.access_token
   ▼
supabase.from('admins').select('username').eq('user_id', uid).maybeSingle()
   │  查不到 → 立刻 signOut() + 记失败次数
   ▼
auth.isAdmin = true → isLoggedIn = true
```

**两步都不能省**：第一步证明"你是这个 Auth 用户"，第二步证明"你是管理员"。任何 Auth 用户（比如未来开放的注册用户）都不自动获得后台权限。

### 1.1 用户名映射的取舍

```ts
const ADMIN_EMAIL_DOMAIN = 'admin.partdro.com'
```

用一个**不可收信的域名**做后缀。好处是：

- 管理员不用记邮箱，输 `randy` 即可。
- 这些账号永远不会被用于收信，也就不存在"被注册/被找回"的攻击面。
- 密码重置只能走 Supabase Dashboard，管理员无法自助重置——安全换便利，符合站点规模。

### 1.2 前端限流

```ts
const failCount = Number(sessionStorage.getItem('admin_fails') || '0')
const lockedUntil = Number(sessionStorage.getItem('admin_locked_until') || '0')
if (lockedUntil && Date.now() < lockedUntil) { this.error = 'Too many attempts…'; return false }

recordFail(count) {
  const n = count + 1
  sessionStorage.setItem('admin_fails', String(n))
  if (n >= 5) {
    sessionStorage.setItem('admin_locked_until', String(Date.now() + 60_000))
    sessionStorage.setItem('admin_fails', '0')
  }
}
```

**5 次失败锁 60 秒**，状态放 `sessionStorage`。

必须承认这是**弱防护**：清掉 sessionStorage 或换个标签页就能绕过。它的定位是「挡住误触和顺手试密码」，真正的防护依赖 Supabase Auth 自身的速率限制。之所以不放到服务端，是因为登录直接打 Supabase，不经过我们自己的函数。

---

## 2. `stores/auth.ts`

这是全站唯一的 Pinia store（其余数据都放 composable 局部状态）。

```ts
state: { userId, username, isAdmin, ready, loading, error }
getters: { isLoggedIn: (s) => !!s.userId && s.isAdmin }
```

`isLoggedIn` 要求**两个条件同时成立**——只有 `userId`（Auth 登录了）但不在 `admins` 表里，不算登录。

### 2.1 `init()`：只跑一次

```ts
async init() {
  if (this.ready) return
  try {
    const { data } = await supabase.auth.getSession()
    if (data.session?.user) await this.refreshProfile(data.session.user.id)
  } catch { /* ignore */ } finally {
    this.ready = true
    if (!subscribed) {
      subscribed = true
      supabase.auth.onAuthStateChange((_e, session) => {
        if (session?.user) this.refreshProfile(session.user.id)
        else this.clearProfile()
      })
    }
  }
}
```

三个细节：

- **`ready` 是一次性闸门**。路由守卫里 `if (!auth.ready) await auth.init()`，页面刷新时只查一次 session，不会每次导航都请求。
- **`finally` 里置 `ready = true`**：即使查询抛错也要放行，否则整个站点会卡在守卫里永远进不去。
- **`subscribed` 是模块级变量**（在 store 外面）：保证 `onAuthStateChange` 只注册一次。放 store state 里反而会被 persist 或重置。

### 2.2 `refreshProfile()`：单一真相

```ts
async refreshProfile(uid) {
  const { data, error } = await supabase.from('admins')
    .select('username').eq('user_id', uid).maybeSingle()
  if (error || !data) { this.clearProfile(); return }
  this.userId = uid; this.username = data.username; this.isAdmin = true
}
```

`login()` 与 `init()` 都走它，保证「登录成功后」与「刷新页面后」的状态推导路径完全一致。

`clearProfile()` 只清三个字段，不动 `ready`——退出登录后不应该触发重新初始化。

### 2.3 `logout()`

```ts
await supabase.auth.signOut()
this.clearProfile()
```

先 `signOut` 再清本地状态。如果反了，`onAuthStateChange` 回调可能在清空后又把状态刷回来。

---

## 3. 路由守卫的配合

```ts
const auth = useAuthStore()
if (!auth.ready) await auth.init()
if (to.name === 'admin-login' && auth.isLoggedIn) return { path: '/products/d15r' }
if (to.path.startsWith('/admin') && to.name !== 'admin-login' && !auth.isLoggedIn)
  return { path: '/admin/login' }
```

三个规则：

| 场景 | 行为 |
|---|---|
| 已登录访问 `/admin/login` | 直接送回 `/products/d15r` |
| 未登录访问 `/admin/*` | 跳登录页 |
| 未登录访问普通页面 | 放行（编辑态由 `editMode = auth.isLoggedIn` 自己判断） |

守卫在 `beforeEach` 的**第三段**，前两段是语言处理（见 03 章）。顺序不能反——登录后的跳转目标 `/products/d15r` 需要语言前缀已经确定。

---

## 4. 后台页面

### 4.1 `AdminLoginView.vue`

纯 AntD 表单，64 行脚本 + 样式，零业务逻辑：

```ts
async function onSubmit() {
  const ok = await auth.login(username.value, password.value)
  if (ok) router.push('/admin/editor')       // → redirect /products/d15r
}
```

暗色卡片 + 径向渐变背景，与站点深色主视觉一致。`autocomplete="username"` / `current-password` 是刻意加的，方便密码管理器。

### 4.2 `AdminProductsView.vue`

一张 `a-table`（`pagination: false`），六个列：

| 列 | 渲染 |
|---|---|
| Slug | 文本 |
| Category | `a-tag` |
| Name (per language) | 逐行 `lang 标签 + name` |
| Sort | `sort_order` |
| Published | `a-switch` → 即时 `update` |
| 操作 | `Edit landing page →` + `Delete`（`a-popconfirm`） |

数据全部经 `callFunction('admin-products', { action: 'list' })` 拿，**不走浏览器直连 Supabase**——因为要看到未发布的产品，而 anon 的 RLS 只给已发布的。

新建弹窗（`width: 720`）：

- Slug：前端不校验，交给服务端正则（`/^[a-z0-9-]+$/`）
- Category：三选一，硬编码三个 option
- Sort order、Published
- 四个 `a-tab-pane`（EN/ES/DE/FR），每个含 name / short_desc / description
- 底部提示明确边界：

> Landing-page copy (hero, features, specs…) is edited visually on the product page after creation. Only the listing name/description is set here.

**这个分工很重要**：建产品只填「列表页需要的最小信息」，落地页的全部内容随后在真实页面上可视化编辑。避免了两套编辑器。

删除走 Supabase RPC，前端只传 id：

```ts
callFunction('admin-products', { action: 'delete', id })
```

服务端调 `admin_delete_product(product_id)`，单事务内完成 5 步（见 04 章的 SQL 说明），失败时错误信息会带提示：

```
Delete failed: … — run scripts/admin-functions.sql in Supabase Dashboard first
```

这说明「数据库函数没建」是预期内的常见故障，直接把修复动作写进错误消息。

---

## 5. 服务端契约

### 5.1 调用方式

前端唯一入口是 `src/lib/netlifyApi.ts`：

```ts
export async function authHeaders() {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Not logged in')
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

export async function callFunction<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}/api/${path}`, { method: 'POST', headers: await authHeaders(), body: JSON.stringify(body) })
  if (!res.ok) throw new Error(json?.error || `Request failed (${res.status})`)
  return json as T
}
```

`API_BASE` 来自 `VITE_API_BASE`：

- 本地 / Netlify：空字符串 → 同源 `/api/*`
- 阿里云：FC 的自定义域名 → `https://<fc>/api/*`（`fc/index.ts` 按 `API_HANDLERS` 路由到同一份 handler）

**同一个函数体，两种部署形态**，前端无需知道自己在哪套平台上。

### 5.2 `verifyAdmin`：两道校验

`netlify/shared/verifyAdmin.ts` 是四个 function 的公共基座。

```ts
export async function verifyAdmin(event): Promise<AdminContext> {
  const token = bearerToken(event)
  if (!token) throw new Unauthorized('Missing Authorization bearer token')

  const anon = createClient(supabaseUrl(), anonKey(), clientOptions)
  const { data, error } = await anon.auth.getUser(token)
  if (error || !data.user) throw new Unauthorized('Invalid or expired session')

  const admin = serviceRoleClient()
  const { data: row } = await admin.from('admins')
    .select('username').eq('user_id', data.user.id).maybeSingle()
  if (!row) throw new Forbidden('Not an administrator')

  return { userId: data.user.id, username: row.username }
}
```

**为什么不能只查 `admins` 表**：`admins` 表只存 `user_id`，而 `user_id` 是客户端可伪造的。必须先让 Supabase 用 anon client 验签 JWT，拿到**可信的** `data.user.id`，再拿这个 id 去查表。顺序反了就是一个越权漏洞。

`clientOptions` 里有一条不起眼但必须有的配置：

```ts
const clientOptions = {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: { transport: ws as unknown as typeof WebSocket },
}
```

注释：**Node 20 没有全局 WebSocket**，`supabase-js` 的 `RealtimeClient` 构造时会抛错，所以注入 `ws`。这也是 `ws` 和 `@types/ws` 出现在依赖里的原因。

### 5.3 错误处理

```ts
class HttpError extends Error      // 基类，带 statusCode
class BadRequest   extends HttpError  // 400
class Unauthorized extends HttpError  // 401
class Forbidden    extends HttpError  // 403
class UpstreamError extends HttpError // 透传上游状态码

function errorResponse(e) {
  if (e instanceof HttpError) return json(e.statusCode, { error: e.message })
  console.error('Unhandled function error:', e)
  return json(500, { error: … })
}
```

所有 handler 都是同一个骨架：

```ts
try {
  const guard = methodGuard(event, 'POST'); if (guard) return guard
  await verifyAdmin(event)
  const body = parseBody<Body>(event)
  // …业务…
} catch (e) { return errorResponse(e) }
```

`methodGuard` 只认 POST（`sitemap` 除外），其它方法直接 405。

### 5.4 `admin-products` 的四个 action

| action | 入参 | 行为 |
|---|---|---|
| `list` | — | `select('*, product_langs(lang, name, short_desc)')` + `order sort_order`，**含未发布** |
| `create` | `slug, category, sort_order, published, langs[]` | 校验 slug 正则 / category 枚举 / en.name 必填；插 products（占位图 `placeholder.svg`）+ product_langs |
| `update` | `id, published` | 只改发布开关 |
| `delete` | `id` | `rpc('admin_delete_product')` 单事务删除 |

`create` 的校验在服务端做，逐条都对应一条约束：

```ts
if (!/^[a-z0-9-]+$/.test(slug)) throw new BadRequest('Slug may only contain lowercase letters, digits and hyphens')
if (!CATEGORIES.has(body.category)) throw new BadRequest('Invalid category')   // agricultural|cargo|cleaning
if (!en?.name?.trim()) throw new BadRequest('English name is required')
```

`en` 必填是因为它是 `pickLang` 的回退终点（见 04 章）——没有 en，任何语言都可能渲染出空。

其它语言的 name 为空时回落到 en：

```ts
name: (l.name || '').trim() || en.name.trim()
```

### 5.5 `landing-content` 的契约

```ts
interface SaveBody { namespace: string; lang: string; content: Record<string, unknown> }

// 校验：namespace 长度 ≤ 64；lang ∈ {en,es,de,fr}；content 必须是对象（不能是数组/null）
supabase.from('landing_content').upsert({ namespace, lang, content }, { onConflict: 'namespace,lang' })
```

只有 POST 一个动作，没有 `action` 分发。写入用 `service_role`，因为管理员保存时不该受 RLS 限制，也不需要给 `landing_content` 开 authenticated 的写策略。

---

## 6. 安全边界总表

| 边界 | 做法 |
|---|---|
| `service_role` 密钥 | 只在 Functions 运行时；前端 bundle 里只有 anon key |
| 身份校验 | JWT 验签（anon client）→ `admins` 表在册校验（service_role），顺序不可反 |
| 登录限流 | 前端 5 次 / 60 秒（弱防护，真实防护在 Supabase Auth） |
| 管理员口令 | 不可自助重置，只能 Dashboard 操作 |
| 未发布内容 | 只有 service_role 能读到（`list` 走服务端） |
| 删除产品 | 走 `security definer` RPC，`revoke execute` 掉 public/anon/authenticated |
| 询盘隐私 | anon 无 SELECT，只有 INSERT（见 04 章的风险说明） |
| Webhook | `x-webhook-secret` 与 `app_secrets` 表比对，表本身 RLS 全封 |

---

下一篇：[07-serverless-functions.md](./07-serverless-functions.md) — 4 个 Netlify Functions 与 1 个 FC Web 入口 + 7 个自动化函数。
