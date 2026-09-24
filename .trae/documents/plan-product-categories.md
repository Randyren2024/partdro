# 产品类目体系改造：农业 / 运载 / 清洗无人机

## Context

当前站点产品类目硬编码为 `'window' | 'solar'`（擦窗 / 光伏清洗），用户计划将类目调整为三个无人机类目：**农业无人机、运载无人机、清洗无人机**。

已与用户确认的三项决定：
1. `/products` 列表页**新增类目筛选标签**（全部 / 三类切换）
2. 顶部导航 Products **改为类目下拉菜单**（链接到 `/products?category=xxx`）
3. Supabase 数据迁移**只提供 SQL 脚本**，由用户自行在 Supabase SQL Editor 执行

新类目 ID 设计：`agricultural` / `cargo` / `cleaning`。现有产品（D15R 为 `window`）统一迁入 `cleaning`。

## 改动清单

### 1. `src/types/index.ts`（L6）
```ts
export type ProductCategory = 'agricultural' | 'cargo' | 'cleaning'
// Product.category: ProductCategory
```

### 2. `src/composables/useSupabase.ts`（L104）
`useProducts(category?: ProductCategory)` — 参数类型改为新类型，`.eq('category', category)` 过滤逻辑不变（现有两个调用点均无参调用，不受影响）。

### 3. `src/views/ProductsView.vue` — 新增筛选标签
- 顶部加 tab 行：`products.all` + 三个 `products.category.*`，高亮当前选中
- 读 `route.query.category`（校验合法性，非法值视为全部），点击 tab 用 `router.replace` 同步 URL
- `filteredProducts` 按 `route.query.category` 过滤（替换 L39 现状：直接返回全部）
- 卡片类目标签（L15）无需改 —— `t('products.category.' + category)` 自动适配新 key

### 4. `src/components/layout/Header.vue` — Products 下拉
- 桌面端：Products 项改为 hover 触发的下拉面板（沿用现有手写 CSS 风格，纯 CSS `:hover` 显示），含「全部产品 + 三个类目」共 4 个 `/products?category=` 链接，点击后关闭移动端菜单
- 移动端（≤992px 抽屉）：Products 主链接下方缩进平铺 3 个类目子项

### 5. `src/components/home/ProductSolutions.vue`（L41-42）
删除 `category === 'window' ? ... : ...` 三元硬编码，改为 `t(\`products.category.${product.category}\`)`。

### 6. i18n 四个语言文件 `src/i18n/{en,es,de,fr}.json`
- `products.category` 下删除 `window`/`solar`，新增三键；`products` 下新增 `all`
- 删除未使用的遗留键 `nav.windowCleaning` / `nav.solarCleaning`（全站无引用）

| key | en | es | de | fr |
|---|---|---|---|---|
| products.all | All | Todos | Alle | Tous |
| products.category.agricultural | Agricultural Drone | Dron Agrícola | Agrardrohne | Drone Agricole |
| products.category.cargo | Cargo Drone | Dron de Carga | Frachtdrohne | Drone de Fret |
| products.category.cleaning | Cleaning Drone | Dron de Limpieza | Reinigungsdrohne | Drone de Nettoyage |

（hero 副标题、products.subtitle 等"window cleaning"营销文案不在本次范围，保持不动。）

### 7. 新建 `scripts/migrate-product-categories.sql`（用户自执行）
```sql
-- 旧类目统一并入 cleaning（window/solar 均属清洗无人机）
UPDATE products SET category = 'cleaning' WHERE category IN ('window', 'solar');

-- 验证
SELECT category, count(*) FROM products GROUP BY category;
```

## 执行顺序与验证

1. 代码改动（上述 1-6）
2. `npm run build`（本仓库的类型检查就是 build）
3. `npm run dev`（端口 5173），浏览器验证：
   - `/products` 筛选标签切换 + URL query 同步
   - 导航下拉四个入口可达且正确高亮
   - 卡片类目标签显示新文案（四种语言抽查）
4. **提醒用户先执行 SQL 再验收**：未迁移数据时，旧产品行的标签会显示原始 key（如 `products.category.window`）
