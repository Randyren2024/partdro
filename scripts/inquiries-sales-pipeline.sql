-- ============================================================
-- inquiries 销售流水线字段
--
-- 背景：原来 inquiries 只有询盘内容与归因，没有销售阶段/报价/成交结果，
--       无法计算合格询盘率、CAC、回收期。本迁移补齐销售闭环字段。
--
-- 执行方式：Supabase Dashboard → SQL Editor（幂等，可重复执行）。
-- 2026-10-25 已在生产项目 gcsshuvfzuinevacraao 应用；本文件是仓库内可复现来源。
-- ============================================================

alter table public.inquiries
  add column if not exists lead_status text not null default 'new',
  add column if not exists owner text,
  add column if not exists company text,
  add column if not exists country text,
  add column if not exists first_responded_at timestamptz,
  add column if not exists qualified_at timestamptz,
  add column if not exists quote_sent_at timestamptz,
  add column if not exists quote_value numeric(12,2),
  add column if not exists quote_currency text default 'USD',
  add column if not exists won_at timestamptz,
  add column if not exists lost_at timestamptz,
  add column if not exists lost_reason text,
  add column if not exists next_follow_up_at timestamptz,
  add column if not exists notes text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'inquiries_lead_status_check') then
    alter table public.inquiries
      add constraint inquiries_lead_status_check
      check (lead_status in ('new','contacted','qualified','quoted','negotiation','won','lost','spam'));
  end if;
end $$;

create index if not exists inquiries_lead_status_idx on public.inquiries (lead_status);
create index if not exists inquiries_next_follow_up_idx on public.inquiries (next_follow_up_at);

comment on column public.inquiries.lead_status is '销售阶段：new/contacted/qualified/quoted/negotiation/won/lost/spam';
comment on column public.inquiries.owner is '线索负责人';
comment on column public.inquiries.company is '客户公司（可从 lead_profile 提取）';
comment on column public.inquiries.country is '客户国家';
comment on column public.inquiries.first_responded_at is '首次人工响应时间，用于首响 SLA';
comment on column public.inquiries.qualified_at is '销售确认合格的时间';
comment on column public.inquiries.quote_sent_at is '正式报价发出时间';
comment on column public.inquiries.quote_value is '报价/预计订单金额';
comment on column public.inquiries.quote_currency is '报价币种';
comment on column public.inquiries.won_at is '成交时间';
comment on column public.inquiries.lost_at is '丢单时间';
comment on column public.inquiries.lost_reason is '丢单原因';
comment on column public.inquiries.next_follow_up_at is '下次跟进时间';
comment on column public.inquiries.notes is '内部销售备注（PII 最小化）';
