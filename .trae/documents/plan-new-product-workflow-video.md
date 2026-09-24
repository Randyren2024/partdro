# 可视化编辑支持新建产品 + 视频模块

## Context

现状核查结论：**可视化编辑器目前不支持新建产品**。
- `ProductDetailView.vue`（约 614 行）是 D15R 硬编码落地页：所有文案来自 `d15r.*` i18n 键，图片固定 `/d15r/images/`（L279-284），约 66 处 `data-edit-key`/`data-edit-img` 模板绑定
- `InlineEditor`（App.vue 全局挂载）只能点击编辑**已存在**的元素，保存为 JSON diff 写入 Supabase `landing_content`（namespace='d15r'）
- `/products/:slug` 对任何 slug 都渲染 D15R 页面（router L27-35），无产品 CRUD 入口，全站无视频模块

目标工作流：`/admin/products` 创建产品（如 agricultural drone）→ 自动跳转 `/products/<slug>` → 页面用与 D15R 相同的模块结构渲染占位内容 → 管理员直接可视化编辑（文字/图片/视频）→ 保存到 `landing_content` namespace=<slug>。

已确认决策：**视频模块同时支持 MP4 直链和 YouTube/Bilibili 嵌入**（自动识别）；**新建入口做管理页**。

## 实施内容

### 1. ProductDetailView 参数化（d15r 完全向后兼容）

- `ns = computed(() => route.params.slug ?? 'd15r')`；`tt = (p) => t(`${ns.value}.${p}`)`
- `IMG_BASE` 改 computed：d15r → `/d15r/images/`，其他 → `/images/<slug>/`
- `nozzleImages/caseImages/scenarioImages` 改为 per-ns 映射表，default 集全部指向新建的 `public/images/placeholder.svg`（免做真实占位图）
- 机械替换（sed + grep 验证零遗漏）：
  - `t('d15r.xxx')` / `` t(`d15r.xxx`) `` → `tt('xxx')`（脚本 computed 与模板共 ~130 处）
  - `:data-edit-key="'d15r.xxx'"` → `` :data-edit-key="`${ns}.xxx`" ``；`data-edit-img="d15r.xxx"` → `` :data-edit-img="`${ns}.xxx`" ``；`imgEdit(file, 'd15r.xxx')` 第二参同改绑定
- d15r 分支下所有解析结果与现状逐字相同；`landing_content` 存量数据不动
- 细节：hero CTA 的 mailto subject、图片 alt 去掉 "D15R" 硬编码，改为由 slug/产品名派生

### 2. 新产品默认落地页模板（新文件 `src/i18n/landingTemplate.ts`）

- `defaultLandingTemplate()`：按 d15r 现有模块结构生成同构 i18n 树（hero/strip/why/designed/output/spray/intelligence/safety/multiangle/compare/applications/scenarios/specs/cta + 新增 `video`），值为通用英文占位文案，**只注册到 en**（fallbackLocale='en' 已让 es/de/fr 自动回退）
- `useLandingContent.ts` 重构出模块级单例逻辑：
  - `registerProductNamespace(ns)`：加入 `dynamicNamespaces` Set → 把模板写入 en messages → 触发 loadAndMerge；由 ProductDetailView `watch(ns, immediate)` 调用
  - `staticNs` 查不到静态 JSON 且 ns ∈ dynamicNamespaces 时以模板为 base（保证 diff 只存改动叶子）
  - `saveAllNamespaces` 遍历范围 = EDITABLE_NAMESPACES + dynamicNamespaces；修复 `if (!tree) continue`（改为 `msgs?.[ns] ?? {}`，避免"只改图不改文"丢改动）；空 diff 且无图/视频时跳过 upsert（防清空）

### 3. 视频模块

- `useLandingContent.ts`：新增 `videoOverridesByLang`（reactive）+ `__videos` 键，提取/diff/保存逻辑完全镜像现有 `__images`
- 新文件 `src/composables/useVideo.ts`：`parseVideoUrl(url)` → `{type:'file'|'youtube'|'bilibili', ...}`（YouTube 支持 watch/youtu.be/embed/shorts，Bilibili 支持 BV 号）
- `ProductDetailView` 在 scenarios 与 specs 之间新增 video section：有 URL 时公开渲染（file → `<video controls muted loop :poster>`；平台 → 16:9 iframe），无 URL 且管理员登录时显示占位框；元素带 `` :data-edit-video="`${ns}.video.url`" ``
- `useInlineEdit.ts`：新增 `applyVideoEdit`；`InlineEditor.vue`：点击 `data-edit-video` 弹 URL 输入面板（含类型识别提示），hover 高亮样式同步补充

### 4. `/admin/products` 管理页（新文件 `src/views/admin/AdminProductsView.vue`）

- 产品列表（a-table，含未发布）：slug/category/sort_order/published 开关 + "编辑落地页"跳转
- 新建表单：slug（`^[a-z0-9-]+$` + 重复校验）、category 三选一、sort_order、published、en/es/de/fr 四组 name/short_desc/description
- 提交：insert `products`（image_url:''、gallery:[]、specs:{}、features:[]）→ insert `product_langs` × 4 → 跳转 `/products/<slug>`
- `router/index.ts`：注册路由 + `beforeEach` 补 admin 守卫（`/admin/*` 除 login 外须登录）

### 5. RLS SQL（新文件 `scripts/rls-admin-products.sql`，用户在 Supabase 执行）

```sql
create policy "admins select all products" on products for select to authenticated using (true);
create policy "admins insert products" on products for insert to authenticated with check (true);
create policy "admins select all product_langs" on product_langs for select to authenticated using (true);
create policy "admins insert product_langs" on product_langs for insert to authenticated with check (true);
```
若保存 `landing_content` 报权限错误，同法补 authenticated 的 select/update/insert policy。

## 不做的事

- 不迁移 d15r 旧数据、不改 `products` 表结构（`landing_content` 的 JSON content 吸收 `__videos`，无需 DDL）
- 不做产品删除功能（先只做创建/列表/发布开关）

## 验证清单

1. `npm run build` 通过
2. **D15R 回归**：`/products/d15r` 公开渲染与改动前一致；登录后改文本+图片保存，刷新仍生效，存量 `landing_content namespace='d15r'` 未清空
3. `/admin/products` 未登录 → 重定向登录页；创建测试产品（slug 如 `agri-pro`, category=agricultural）→ `products`/`product_langs` 各新增 4+1 行
4. 跳转 `/products/agri-pro`：全部模块显示占位文案（切 es/de/fr 正常回退 en），无原始 key 泄漏，图片显示占位 SVG
5. 编辑：改 2 处文本 + 1 张图 + 分别设置 MP4/YouTube/Bilibili 视频 → Save → 无痕窗口确认公开页渲染正确、`landing_content` 出现 `namespace='agri-pro'` 且 diff 只含改动叶子 + `__images`/`__videos`
6. 清空视频 URL 保存 → 公开页视频 section 隐藏、admin 模式仍显示占位框
7. 测试产品发布开关置 false 后不出现在 `/products` 列表与首页
