-- 询盘客户背景调研结果写回列（fc/inquiry-analysis 函数 PATCH 写入）
alter table public.inquiries add column if not exists lead_profile jsonb;
