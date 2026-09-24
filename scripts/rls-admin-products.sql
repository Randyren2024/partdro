-- ============================================================
-- RLS 策略：允许登录管理员在管理页创建/读取/删除产品
-- 背景：站点全部走 anon key + 客户端请求；products / product_langs
--       需要允许 authenticated（管理员会话）的 select / insert，
--       管理页的发布开关还需要 update，删除功能需要 delete。
-- 执行方式：Supabase Dashboard → SQL Editor
-- ============================================================

-- products
create policy "admins select all products"
  on products for select to authenticated using (true);

create policy "admins insert products"
  on products for insert to authenticated with check (true);

create policy "admins update products"
  on products for update to authenticated using (true) with check (true);

create policy "admins delete products"
  on products for delete to authenticated using (true);

-- product_langs
create policy "admins select all product_langs"
  on product_langs for select to authenticated using (true);

create policy "admins insert product_langs"
  on product_langs for insert to authenticated with check (true);

create policy "admins update product_langs"
  on product_langs for update to authenticated using (true) with check (true);

create policy "admins delete product_langs"
  on product_langs for delete to authenticated using (true);

-- cases (nullable FK to products)
create policy "admins update cases product_id"
  on cases for update to authenticated using (true) with check (true);

-- documents (nullable FK to products)
create policy "admins update documents product_id"
  on documents for update to authenticated using (true) with check (true);

-- inquiries (nullable FK to products)
create policy "admins update inquiries product_id"
  on inquiries for update to authenticated using (true) with check (true);

-- landing_content (logical reference by namespace/slug)
create policy "admins delete landing_content"
  on landing_content for delete to authenticated using (true);

-- 说明：匿名访客读取产品走的是已有 anon select 策略（站点列表页已在用）。
-- 若管理页保存落地页时报 RLS 权限错误，对 landing_content 同法补充
-- authenticated 的 select/update/insert 策略即可。
