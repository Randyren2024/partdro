-- ============================================================
-- 产品类目迁移：window / solar → 新三类目体系，并追加 EVTOL
-- 新类目：agricultural（农业无人机）/ cargo（运载无人机）/ cleaning（清洗无人机）/ EVTOL（电动垂直起降飞行器）
-- 执行方式：Supabase Dashboard → SQL Editor，从上到下全部执行
-- 幂等性：DROP CONSTRAINT IF EXISTS + 重建约束，可重复执行
-- 回滚：见文件末尾
-- ============================================================

-- 1) 删除旧的类目 CHECK 约束（不存在时跳过）
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_category_check;

-- 2) 迁移遗留类目（window/solar → cleaning），已迁移的数据不受影响
UPDATE products SET category = 'cleaning' WHERE category IN ('window', 'solar');

-- 3) 按新类目体系重建 CHECK 约束（白名单含 EVTOL）
ALTER TABLE products
  ADD CONSTRAINT products_category_check
  CHECK (category IN ('agricultural', 'cargo', 'cleaning', 'EVTOL'));

-- 验证：应只余下 agricultural / cargo / cleaning / EVTOL 四种值
SELECT category, count(*) AS product_count
FROM products
GROUP BY category
ORDER BY category;

-- ============================================================
-- 回滚（仅当已无 EVTOL 产品时执行，否则 23514 会拒绝）：
--   1. UPDATE products SET category = '<其它类目>' WHERE category = 'EVTOL';
--   2. ALTER TABLE products DROP CONSTRAINT IF EXISTS products_category_check;
--   3. ALTER TABLE products
--        ADD CONSTRAINT products_category_check
--        CHECK (category IN ('agricultural', 'cargo', 'cleaning'));
-- ============================================================
