-- ============================================================
-- Supabase Database Webhook：inquiries 新增 → 通知阿里云 FC 发邮件
--
-- 链路：
--   inquiries INSERT
--     → 本触发器（pg_net 异步发 HTTP）
--     → POST https://www.droneworld.tech/api/inquiry-webhook
--     → FC 调用阿里云邮件推送 DirectMail -> info@droneworld.tech
--
-- 执行方式：Supabase Dashboard → SQL Editor，整段执行一次。
--
-- 执行前：
--   1) 把下面的 <WEBHOOK_SECRET> 换成与 FC 环境变量 INQUIRY_WEBHOOK_SECRET 相同的随机串；
--   2) 确认 FC 已部署且 /api/inquiry-webhook 可访问（见 netlify/functions/inquiry-webhook.ts）。
--
-- 说明：若更希望用官方 UI 方式（Database → Webhooks）配置，可跳过本文件，
--       在 UI 里填 URL=https://www.droneworld.tech/api/inquiry-webhook、
--       事件=insert、表=public.inquiries，并加自定义 header x-webhook-secret。
-- ============================================================

-- pg_net：Postgres 内异步发 HTTP（Supabase 已内置该扩展）
create extension if not exists pg_net with schema extensions;

-- 私有配置表：只存 webhook 密钥，开启 RLS 且不建任何策略 → anon/authenticated 均读不到
create table if not exists public.app_secrets (
  key   text primary key,
  value text not null
);
alter table public.app_secrets enable row level security;
revoke all on public.app_secrets from anon, authenticated;

insert into public.app_secrets (key, value)
values ('inquiry_webhook_secret', '<WEBHOOK_SECRET>')
on conflict (key) do update set value = excluded.value;

-- 触发器函数：读密钥 → 异步 POST 到 FC（security definer 以绕过 RLS 读密钥）
create or replace function public.notify_inquiry_webhook()
returns trigger
language plpgsql
security definer
set search_path = public, extensions, net
as $$
declare
  secret text;
begin
  select value into secret from public.app_secrets where key = 'inquiry_webhook_secret';

  perform net.http_post(
    url := 'https://www.droneworld.tech/api/inquiry-webhook',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', coalesce(secret, '')
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', TG_TABLE_NAME,
      'schema', TG_TABLE_SCHEMA,
      'record', to_jsonb(NEW),
      'old_record', null
    ),
    timeout_milliseconds := 5000
  );

  return NEW;
end;
$$;

-- 仅允许触发器内部调用（security definer 定义者执行）
revoke execute on function public.notify_inquiry_webhook() from public, anon, authenticated;

-- 触发器：inquiries 每次 INSERT 触发一次
drop trigger if exists inquiries_notify_webhook on public.inquiries;
create trigger inquiries_notify_webhook
  after insert on public.inquiries
  for each row
  execute function public.notify_inquiry_webhook();