-- Verified, source-backed supplier profiles; descriptive content remains JSONB to preserve multilingual structure.
create table if not exists public.supplier_profiles (
  supplier_id text primary key references public.suppliers(id) on delete cascade,
  slug text not null unique,
  website text not null,
  address text not null,
  founded_year integer,
  verified_at date not null,
  profile_data jsonb not null,
  imported_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists supplier_profiles_slug_idx on public.supplier_profiles(slug);
create index if not exists supplier_profiles_data_gin_idx on public.supplier_profiles using gin (profile_data);
alter table public.supplier_profiles enable row level security;
drop policy if exists "Public can read supplier profiles" on public.supplier_profiles;
create policy "Public can read supplier profiles" on public.supplier_profiles for select to anon, authenticated using (true);
grant select on public.supplier_profiles to anon, authenticated;
