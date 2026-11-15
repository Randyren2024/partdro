-- Recovered verbatim from supabase_migrations.schema_migrations on 2026-11-15.
-- Preserve this historical migration; do not edit or reapply to production.


create table if not exists public.inquiry_rate_limits (
  key_hash text primary key check (key_hash ~ '^[a-f0-9]{64}$'),
  window_started_at timestamptz not null,
  request_count integer not null check (request_count > 0),
  updated_at timestamptz not null default now()
);

alter table public.inquiry_rate_limits enable row level security;
revoke all on table public.inquiry_rate_limits from anon, authenticated;
grant select, insert, update, delete on table public.inquiry_rate_limits to service_role;

create or replace function public.consume_inquiry_rate_limit(
  p_key_hash text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_count integer;
  v_now timestamptz := clock_timestamp();
begin
  if p_key_hash is null or p_key_hash !~ '^[a-f0-9]{64}$'
     or p_limit is null or p_limit < 1
     or p_window_seconds is null or p_window_seconds < 1 or p_window_seconds > 86400 then
    raise exception 'Invalid rate limit arguments';
  end if;

  insert into public.inquiry_rate_limits (key_hash, window_started_at, request_count, updated_at)
  values (p_key_hash, v_now, 1, v_now)
  on conflict (key_hash) do update
    set window_started_at = case
          when public.inquiry_rate_limits.window_started_at <= v_now - make_interval(secs => p_window_seconds)
          then v_now
          else public.inquiry_rate_limits.window_started_at
        end,
        request_count = case
          when public.inquiry_rate_limits.window_started_at <= v_now - make_interval(secs => p_window_seconds)
          then 1
          else public.inquiry_rate_limits.request_count + 1
        end,
        updated_at = v_now
  returning request_count into v_count;

  if mod(extract(epoch from v_now)::bigint, 100) = 0 then
    delete from public.inquiry_rate_limits
    where updated_at < v_now - interval '2 days';
  end if;

  return v_count <= p_limit;
end;
$function$;

revoke all on function public.consume_inquiry_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_inquiry_rate_limit(text, integer, integer) to service_role;
