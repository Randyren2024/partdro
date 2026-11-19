-- Minimal inquiry storage and atomic rate limiting for the Catalogue Lite contact form.
-- Public visitors cannot read or write these tables directly; writes use the server-only service role.

create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  phone text,
  company text,
  country text,
  type text not null default 'contact'
    check (type in ('contact', 'booking', 'franchise')),
  product_slug text,
  gclid text,
  gbraid text,
  wbraid text,
  dclid text,
  fbclid text,
  gclid_captured_at timestamptz,
  first_visit_at timestamptz,
  first_referrer text,
  first_landing_page text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  page_path text,
  landing_page text,
  referrer text,
  created_at timestamptz not null default now()
);

create index if not exists inquiries_created_at_idx
  on public.inquiries (created_at desc);
create index if not exists inquiries_email_created_at_idx
  on public.inquiries (email, created_at desc);

alter table public.inquiries enable row level security;
revoke all on public.inquiries from public, anon, authenticated;
grant insert on public.inquiries to service_role;
grant select (id) on public.inquiries to service_role;

create table if not exists public.inquiry_rate_limits (
  key_hash text primary key,
  window_started_at timestamptz not null,
  hits integer not null check (hits >= 0),
  updated_at timestamptz not null default now()
);

alter table public.inquiry_rate_limits enable row level security;
revoke all on public.inquiry_rate_limits from public, anon, authenticated;
grant select, insert, update, delete on public.inquiry_rate_limits to service_role;

create or replace function public.consume_inquiry_rate_limit(
  p_key_hash text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_hits integer;
begin
  if p_key_hash is null or length(p_key_hash) <> 64 or p_limit < 1 or p_window_seconds < 1 then
    raise exception 'Invalid rate limit parameters';
  end if;

  insert into public.inquiry_rate_limits as current_limit
    (key_hash, window_started_at, hits, updated_at)
  values
    (p_key_hash, now(), 1, now())
  on conflict (key_hash) do update
    set window_started_at = case
          when current_limit.window_started_at <= now() - make_interval(secs => p_window_seconds)
          then now() else current_limit.window_started_at end,
        hits = case
          when current_limit.window_started_at <= now() - make_interval(secs => p_window_seconds)
          then 1 else current_limit.hits + 1 end,
        updated_at = now()
  returning hits into current_hits;

  return current_hits <= p_limit;
end;
$$;

revoke all on function public.consume_inquiry_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_inquiry_rate_limit(text, integer, integer) to service_role;
