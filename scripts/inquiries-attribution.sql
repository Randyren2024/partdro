-- ============================================================
-- inquiries 归因字段：让每条询盘都能回答「客户从哪来、看的是哪个产品」
--
-- 背景：在此之前 inquiries 只有 name/email/phone/type/message/created_at/lead_profile，
--       没有任何来源信息。2026-10-06 加拿大客户 Kal Essa 成交前的那条询盘，
--       只能事后用 GA4 回溯才查出「google / cpc → /products/d15r」；
--       一旦 GA4 数据过期或采样，这条线索就永久不可归因，CAC 也算不出来。
--
-- 执行方式：Supabase Dashboard → SQL Editor（只需执行一次）
-- ============================================================

alter table public.inquiries
  -- 客户提交表单时所在页面（含语言前缀，如 /de/products/d15r）
  add column if not exists page_path      text,
  -- 该会话第一次落地的页面（含 query，能看出是不是广告落地页）
  add column if not exists landing_page   text,
  -- 首次来源域名（Google 搜索结果页、Bing、direct 时为空）
  add column if not exists referrer       text,
  -- 标准 UTM
  add column if not exists utm_source     text,
  add column if not exists utm_medium     text,
  add column if not exists utm_campaign   text,
  add column if not exists utm_term       text,
  add column if not exists utm_content    text,
  -- Google Ads 点击 ID：有值即可确认「这条询盘来自付费广告，且能精确归因到点击」
  add column if not exists gclid          text,
  -- 产品 slug（如 d15r）。刻意不用 product_id 外键：产品页 slug 未必都在 products 表里，
  -- 用外键会让那条询盘写入失败——宁可有 slug 没 id，也不能丢线索。
  add column if not exists product_slug   text;

-- 按时间倒序查最近询盘（后台/日报都会用到）
create index if not exists inquiries_created_at_idx on public.inquiries (created_at desc);

-- 便于按渠道统计 CAC
create index if not exists inquiries_utm_source_idx on public.inquiries (utm_source);

comment on column public.inquiries.gclid is 'Google Ads 点击 ID；非空 = 该询盘可归因到具体广告点击';
comment on column public.inquiries.product_slug is '提交表单时所在产品页 slug，用于按产品计算 CAC';
