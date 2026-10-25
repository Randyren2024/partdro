# 03 · 前端核心：装配、路由、i18n、布局、SEO

本章讲清浏览器里那层「骨架」：从 `index.html` 到第一帧之间发生了什么，以及路由、语言、SEO 三件容易互相纠缠的事是怎么解耦的。

---

## 1. 启动链路

```
index.html
  ├─ GTM (GTM-KJ7GJ3V5) + Google Fonts(Barlow/Poppins) + favicon 家族
  └─ <div id="app"> + <script type="module" src="/src/main.ts">
        │
        ▼
src/main.ts
  ├─ createApp(App)
  ├─ use(createPinia()) / use(router) / use(i18n) / use(Antd)
  ├─ captureAttribution()   ← 必须在 mount 之前
  └─ mount('#app')
        │
        ▼
src/App.vue
  ├─ <a-config-provider :locale="antLocale">   ← AntD 组件语言随 i18n 切
  ├─ <router-view />
  ├─ <InlineEditor />                          ← 全局常驻（未登录自隐藏）
  ├─ <div class="whatsapp-float">              ← 右侧悬浮 WhatsApp
  ├─ useLandingContent()                       ← 触发内容加载
  └─ injectJsonLd('ld-organization', …)
```

`main.ts` 只有 29 行，但有两处顺序是刻意的：

1. **`captureAttribution()` 在 `mount` 之前**。注释写明原因：「晚于路由跳转就会丢掉广告落地页的真实 query」。`/products/d15r?gclid=xxx` 一旦被路由守卫改写或清掉 query，归因就丢了。
2. **`import '@fontsource-variable/inter'`** 是自托管字体。注释记录历史：`landing.css` / `SectionPanel` 都声明了 `Inter`，但全站此前从未真正加载，一直在走系统兜底字体；走 `@fontsource` 打包进 `dist` 是为了不依赖 Google Fonts（国内访问慢、易被墙）。

`App.vue` 承担的职责清单：

| 职责 | 实现 |
|---|---|
| AntD 语言包 | `antLocale = computed(() => locales[locale.value] || enUS)`，映射 en/es/de/fr 四个 locale 模块 |
| 内容加载入口 | `useLandingContent()` 在 setup 阶段调用，内部 `onMounted` 再拉远端 |
| 全局内联编辑器 | `<InlineEditor />` 挂在 `router-view` 之外，所以后台登录后**任意页面**都可直接改文案 |
| 站点级结构化数据 | `buildOrganizationLd({ siteUrl, logo, email })` + `injectJsonLd('ld-organization', …)`，同 id 原地更新不重复注入 |
| WhatsApp 悬浮按钮 | `trackEvent('whatsapp_chat_initiated', { channel:'whatsapp', phone })` 后 `window.open('https://wa.me/...')` |
| 动效降级 | `@media (prefers-reduced-motion: reduce)` 关闭 bob / pulse 动画 |

---

## 2. 路由

`src/router/index.ts`（165 行）由三部分组成：路由表、`afterEach`（SEO 元信息）、`beforeEach`（语言 + 鉴权）。

### 2.1 路由表

```ts
{ path: '/admin/login',    name: 'admin-login',    component: AdminLoginView    }
{ path: '/admin/products', name: 'admin-products', component: AdminProductsView }
{ path: '/admin/editor',   redirect: '/products/d15r' }
{ path: '/products/c500',  redirect: '/products/c500-delivery-drone' }   // Google Ads 旧 finalUrl

{ path: '/:locale(en|es|de|fr)?', component: DefaultLayout, children: siteChildren }
```

`siteChildren` 全部懒加载（`() => import(...)`）：

| path | name | 视图 | 说明 |
|---|---|---|---|
| `''` | `home` | `HomeView` | 由 4 个 home 组件拼装 |
| `products` | `products` | `ProductsView` | 分类筛选列表 |
| `products/c500-partdro-eavision` | `c500-eavision` | `C500EavisionView` | 独立定制的 EAVISION 合作落地页 |
| `products/:slug` | `product-detail` | `ProductDetailView` | **唯一的产品详情模板**，`slug` 同时当 i18n 命名空间与图片目录 |
| `cases` | `cases` | `CasesView` | |
| `news` | `news` | `NewsView` | |
| `news/:slug` | `news-detail` | `NewsDetailView` | |
| `documents` | `documents` | `DocumentsView` | |
| `about` | `about` | `AboutView` | |
| `contact` | `contact` | `ContactView` | |

注意 `products/c500-partdro-eavision` 必须排在 `products/:slug` **之前**，否则会被参数路由抢先匹配。

`scrollBehavior()` 恒返回 `{ top: 0 }`，没有做滚动位置恢复——落地页场景里回到顶部更符合预期。

### 2.2 `beforeEach`：先语言，后鉴权

顺序不能换，因为鉴权分支的跳转目标依赖已经确定的语言环境：

```ts
// ① /en/... 与根路径英文重复 → 301 式去前缀，避免重复内容
if (to.params.locale === 'en') return { path: stripEn(to.path), query, hash, replace: true }

// ② URL 决定语言：路径前缀 > ?lang= > 默认 en
const locale = isLocale(to.params.locale) ? to.params.locale
             : isLocale(to.query.lang)     ? to.query.lang
             : DEFAULT_LOCALE
i18n.global.locale.value = locale
localStorage.setItem('lang', locale)
document.documentElement.lang = locale

// ③ 鉴权
if (!auth.ready) await auth.init()
if (to.name === 'admin-login' && auth.isLoggedIn) return { path: '/products/d15r' }
if (to.path.startsWith('/admin') && to.name !== 'admin-login' && !auth.isLoggedIn)
  return { path: '/admin/login' }
```

`localStorage.setItem('lang', …)` 这里只**写**不读——`i18n/index.ts` 的 `detectInitialLocale()` 明确注释了「localStorage 不再参与判定，避免在英语 URL 上残留上次选择的语言，导致正文语言与 URL / canonical 不一致」。写它只是为了给 `LangSwitcher` 之类的地方留一个可读的偏好。

### 2.3 `afterEach`：按路由 × 语言刷新 head

```ts
const META_ROUTES = ['home','products','cases','news','documents','about','contact']
```

对 `META_ROUTES` 里的路由，从 `meta.<name>.title` / `meta.<name>.description` 取文案，写入 `document.title`、`description`、`og:title/description`、`twitter:title/description`；随后无条件更新 `og:url` 与 `link[rel=canonical]` 为 `${SITE_URL}${to.path}`。

两个设计点：

- **`to.path` 已含语言前缀**，所以 canonical 天然就是该语言的规范 URL，预渲染直接吃这个结果即可，无需再算一遍。
- **详情页不在 `META_ROUTES` 里**（`product-detail` / `news-detail` / `c500-eavision`）。它们的数据是异步的，标题只能由各自视图在拿到数据后自己设。`setMetaContent()` 支持「不存在就创建」，所以视图侧不用担心 head 里没有对应标签。

---

## 3. 多语言

### 3.1 四个 locale

```ts
export const SUPPORTED_LOCALES = ['en', 'es', 'de', 'fr'] as const
export const DEFAULT_LOCALE: Locale = 'en'
```

`createI18n({ legacy: false, locale: initialLocale, fallbackLocale: 'en', messages: {…} })`。

**`legacy: false`（Composition API 模式）是硬性前提**：全套 `useLandingContent` 都靠 `i18n.global.setLocaleMessage()` 做运行时注入，Options API 的 `$t` 习惯在这里会失效。

**`messages` 用 `JSON.parse(JSON.stringify({...}))` 深拷贝**，而不是直接传 import 的对象。原因：`applyNamespaceOverrides` 会就地改写 message 对象，直接引用模块级 import 会污染原始静态数据，导致一次覆盖永久生效、跨语言串数据。

### 3.2 URL 形态

| 语言 | URL | 例子 |
|---|---|---|
| en（默认） | 无前缀 | `/products/d15r` |
| es | `/es` 前缀 | `/es/products/d15r` |
| de | `/de` 前缀 | `/de/products/d15r` |
| fr | `/fr` 前缀 | `/fr/products/d15r` |

选择「默认语言不带前缀」的唯一理由写在路由注释里：**保持根路径已收录 URL 不变**，同时让其它语言拥有独立可抓取 URL。代价是 `/en/*` 必须 301 去掉（`beforeEach` 第一段），否则与根路径构成重复内容。

### 3.3 链接本地化：`useLocalePath`

```ts
export function stripLocalePrefix(path: string): string
export function withLocalePrefix(path: string, locale: unknown): string
export function useLocalePath()  // 读取当前 route.params.locale，返回 (path) => string
```

规则：**`<router-link>` 里永远写裸路径**，再用 `lp()` 包一层。例：

```vue
<router-link :to="lp(`/news/${post.slug}`)">…</router-link>
```

在 `/de` 页面上会得到 `/de/news/xxx`，在根路径上原样返回 `/news/xxx`。这套约定让 48 个 `.vue` 里没有一处手写 `/de/` 前缀。

`Header.vue` / `Footer.vue` 的 `showCta` 判断也用它：`stripLocalePrefix(route.path) !== '/products/d15r'`——D15R 页面自带完整 CTA，不再叠一层页脚 CTA。

---

## 4. 布局与导航

### 4.1 `DefaultLayout.vue`（25 行）

```vue
<Header />
<main><router-view /></main>
<Footer />
```

```css
min-height: 100vh; display: flex; flex-direction: column;
main { flex: 1 }
```

`flex: 1` 是为了让短页面（如 404 兜底、空列表）也能把 Footer 压到视口底部。

### 4.2 `Header.vue`（261 行）

| 特性 | 实现 |
|---|---|
| 定位 | `position: sticky; height: 74px` |
| 产品下拉 | `const CATEGORIES: ProductCategory[] = ['agricultural','cargo','cleaning']` |
| 滚动渐变 | `scrolled = window.scrollY > 50` → 加毛玻璃背景 |
| 语言切换 | 内嵌 `LangSwitcher` |
| 移动端 | 汉堡菜单 |

**一个必须记住的 CSS 陷阱**，源码里有明确注释：

> `backdrop-filter` 会把 header 变成 fixed 后代的 containing block，导致 `.header__nav` 的 `top/bottom` 相对 header（74px）定位 → 菜单高度为 0 不可见。移动端直接去掉毛玻璃。

所以不要在移动端 media query 里「顺手」把 `backdrop-filter` 加回去。

### 4.3 `Footer.vue`

- `showCta = stripLocalePrefix(route.path) !== '/products/d15r'`
- CTA 点击：`trackEvent('generate_lead', { location: 'footer_cta' })`
- 邮箱来自 i18n：`t('footer.cta.mail')`，不硬编码
- 深色底 `#070a0c` + 细斜线纹理，视觉上承接 D15R 页面的收尾观感
- 社交图标 `href="#"`（占位，未接真实账号）

---

## 5. 样式体系

```
src/assets/styles/
  variables.css   ← CSS 变量（色板、间距、圆角）
  global.css      ← reset、字体基价、通用 utility
```

加载顺序在 `main.ts`：`ant-design-vue/dist/reset.css` → `variables.css` → `global.css`。AntD 的 reset 必须最靠前，否则会覆盖自定义样式。

字体三条来源并存，各有分工：

| 字体 | 来源 | 用途 |
|---|---|---|
| Inter Variable | `@fontsource-variable/inter`（自托管） | 正文、UI |
| Barlow | `index.html` 里的 Google Fonts `<link>` | 标题 |
| Poppins | 同上 | 装饰性数字、强调 |

> 历史包袱：`index.html` 仍从 Google Fonts 拉 Barlow/Poppins，国内访问会慢/失败，但因为是 `font-display` 兜底，不影响功能。Inter 已经迁到自托管就是因为这个原因，另两个尚未迁。

---

## 6. SEO 层

前端侧有三处写 head 的代码，分工明确：

| 位置 | 写入内容 | 时机 |
|---|---|---|
| `router.afterEach` | title / description / og / twitter / canonical / og:url | 每次成功导航 |
| 各详情视图 | 产品名 / 文章标题等动态 title | 数据到达后 |
| `src/seo/structuredData.ts` | JSON-LD（Organization / Product / BreadcrumbList） | `App.vue` 与产品页 |

`structuredData.ts` 的三个导出：

```ts
buildProductLd({ name, url, description?, images?, sku?, category? })
buildOrganizationLd({ siteUrl, logo?, email? })
buildBreadcrumbLd([{ name, url }, …])
injectJsonLd(id, data)   // 同 id 原地更新，避免重复注入
```

注释里记录了一条重要决策：**Product 不带 `offers`**。schema.org 要求 `Offer` 必须包含 `price`，而本站是询盘制、无公开价格；强行填 0 或 `priceCurrency` 反而会被判无效。缺价格的富媒体结果本就不适用，保留实体识别与品牌关联即可。

另一条与预渲染的耦合：`prerender.mjs` 的 `stripRuntimePixels` **只按广告 host 过滤 `<script>`**，所以这段内联 `ld+json` 会被完整保留进静态 HTML。

---

## 7. `src/` 结构速查

```
src/
├─ main.ts / App.vue
├─ assets/styles/{variables,global}.css
├─ components/
│  ├─ layout/{Header,Footer,LangSwitcher}.vue
│  ├─ home/{HeroBanner,ProductSolutions,CompanyStats,LatestNews}.vue
│  ├─ product/            ← 产品详情各区段（非 landing 区块）
│  ├─ product/sections/   ← 16 个 landing 区块（见 05 章）
│  ├─ c500eavision/       ← C500 定制页专用组件（7 个）
│  ├─ admin/{InlineEditor,InpaintEditor,SectionPanel,JsonField}.vue
│  └─ …
├─ composables/   useSupabase / useLandingContent / useLocalePath /
│                 useTracking / useAttribution / useInlineEdit /
│                 useInpainting / useVideo / useC500State
├─ data/          纯静态资源映射（c500eavision.ts 等）
├─ i18n/          index.ts + en/es/de/fr.json + landingTemplate.ts
├─ layouts/       DefaultLayout.vue
├─ lib/           netlifyApi.ts（callFunction / authHeaders）
├─ router/        index.ts
├─ seo/           structuredData.ts
├─ stores/        auth.ts
├─ supabase/      client.ts
├─ types/         index.ts
└─ views/         页面级组件（含 admin/ 三个后台页）
```

依赖方向是单向的：`views → composables / stores → lib / supabase → types`。唯一例外是 `components/product/sections/*`，它们不 import 具体产品数据，而是通过 `inject` 拿上下文（见 [05-landing-page-system.md](./05-landing-page-system.md)）。

---

下一篇：[04-data-layer.md](./04-data-layer.md) — Supabase 客户端、表结构、`useSupabase` 系列与归因埋点。
