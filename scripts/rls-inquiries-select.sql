-- ============================================================
-- RLS：让 inquiries 可被读取（用于验证表单数据是否真的写入）
--
-- ⚠️ 权衡提示
--   站点的 VITE_SUPABASE_ANON_KEY 是公开打包进前端的，
--   若给 anon 开 SELECT，任何拿到该 key 的人都能读到全部留言
--   （含 name / email / phone 等个人信息）。
--   - 只是自己验证数据 → 用 Supabase Dashboard（Table Editor 绕过 RLS）
--     或 scripts 里用 SUPABASE_SERVICE_ROLE_KEY 查询，不要执行下面的 anon 策略。
--   - 确认要开放 → 再执行 anon 那一条。
--
-- 执行方式：Supabase Dashboard → SQL Editor
-- ============================================================

-- （可选）开放匿名读取 —— 公开风险自负
create policy "anon select inquiries"
  on inquiries for select
  to anon
  using (true);

-- 管理员登录会话读取（后台留言列表用，安全，建议执行）
create policy "authenticated select inquiries"
  on inquiries for select
  to authenticated
  using (true);
