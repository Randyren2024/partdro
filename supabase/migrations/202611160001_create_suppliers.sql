-- Supplier directory schema
create table if not exists public.suppliers (
 id text primary key, name text not null, name_en text, region text not null,
 province text, city text, district text, segment text, category text not null,
 category_label text, note text, product_models text[] not null default '{}',
 website text, contact_email text, status text not null default 'listed',
 source_file text not null default 'product_files/*.xlsx',
 imported_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists suppliers_region_idx on public.suppliers(region);
create index if not exists suppliers_category_idx on public.suppliers(category);
create index if not exists suppliers_name_idx on public.suppliers using gin (to_tsvector('simple', name));
alter table public.suppliers enable row level security;
drop policy if exists "Public can read supplier directory" on public.suppliers;
create policy "Public can read supplier directory" on public.suppliers for select to anon, authenticated using (true);
grant select on public.suppliers to anon, authenticated;