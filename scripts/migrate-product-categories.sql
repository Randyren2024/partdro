-- ============================================================
-- 产品类目迁移：window / solar → 新三类目体系
-- 新类目：agricultural（农业无人机）/ cargo（运载无人机）/ cleaning（清洗无人机）
-- 执行方式：Supabase Dashboard → SQL Editor，从上到下全部执行
-- 说明：products 表上存在旧 CHECK 约束 products_category_check（只允许
--       window/solar），必须先替换约束，否则 UPDATE 会被 23514 拒绝
-- ============================================================

-- 1) 删除旧的类目 CHECK 约束
ALTER TABLE products DROP CONSTRAINT products_category_check;

-- 2) 迁移现有产品（擦窗、光伏清洗统一并入 cleaning）
UPDATE products SET category = 'cleaning' WHERE category IN ('window', 'solar');

-- 3) 按新类目体系重建 CHECK 约束
ALTER TABLE products
  ADD CONSTRAINT products_category_check
  CHECK (category IN ('agricultural', 'cargo', 'cleaning'));

-- 验证：应只余下 agricultural / cargo / cleaning 三种值
SELECT category, count(*) AS product_count
FROM products
GROUP BY category
ORDER BY category;
