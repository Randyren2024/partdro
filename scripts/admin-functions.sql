-- ============================================================
-- 管理端 Function 支撑 SQL
-- 执行方式：Supabase Dashboard → SQL Editor，整段执行一次
-- 说明：
--   admin_delete_product 供 Netlify Function (admin-products
--   action=delete) 通过 service_role 调用，在单事务内完成
--   原前端 6 步串行删除，避免中途失败留下孤儿行。
-- ============================================================

create or replace function admin_delete_product(product_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from product_langs where product_langs.product_id = admin_delete_product.product_id;
  update cases set product_id = null where cases.product_id = admin_delete_product.product_id;
  update documents set product_id = null where documents.product_id = admin_delete_product.product_id;
  update inquiries set product_id = null where inquiries.product_id = admin_delete_product.product_id;
  delete from landing_content where namespace = (
    select slug from products where products.id = admin_delete_product.product_id
  );
  delete from products where products.id = admin_delete_product.product_id;
end;
$$;

-- 仅 service_role / 服务端可执行（前端永远拿不到 service_role，
-- authenticated 用户也不应直接调用该函数）
revoke execute on function admin_delete_product(uuid) from public, anon, authenticated;
grant execute on function admin_delete_product(uuid) to service_role;
