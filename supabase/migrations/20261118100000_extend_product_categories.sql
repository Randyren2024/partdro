-- 供应商产品入库：扩展产品类目约束
--
-- 背景：suppliers.category 的取值（helicopter / fixed_wing / components /
-- defense / industrial / other）无法映射进 products 原有的四类。
-- 这里把约束扩展为前端 ProductCategory 的完整集合，避免入库时被拒绝。
--
-- 幂等：重复执行只会重建同名约束。

do $$
begin
  alter table public.products drop constraint if exists products_category_check;
  alter table public.products add constraint products_category_check check (
    category = any (array[
      'agricultural',
      'cargo',
      'cleaning',
      'EVTOL',
      'helicopter',
      'fixed_wing',
      'components',
      'defense',
      'industrial',
      'other'
    ]::text[])
  );
end
$$;
