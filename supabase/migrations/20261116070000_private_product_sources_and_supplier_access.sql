-- Keep supplier identity and upstream source evidence private.
-- This migration intentionally does not alter public product tables or product content.

create schema if not exists private;

revoke all on schema private from public, anon, authenticated;
grant usage on schema private to service_role;

create table if not exists private.product_sources (
  id uuid primary key default gen_random_uuid(),
  product_id bigint not null references public.products(id) on delete cascade,
  supplier_id text references public.suppliers(id) on delete set null,

  -- Preserve upstream identity even when the entity is not yet in public.suppliers.
  source_entity_name text,
  original_model text,

  source_kind text not null default 'official_product'
    check (source_kind in (
      'official_product',
      'official_company',
      'brochure',
      'datasheet',
      'image',
      'video',
      'internal_file',
      'customer_provided',
      'other'
    )),
  relationship_type text not null default 'unknown'
    check (relationship_type in (
      'manufacturer',
      'brand_owner',
      'distributor',
      'source_publisher',
      'document_owner',
      'unknown'
    )),
  verification_status text not null default 'pending'
    check (verification_status in ('pending', 'confirmed', 'conflict', 'rejected')),

  -- Internal evidence only. These fields must never be selected into public product APIs.
  source_url text,
  source_file_path text,
  source_label text,
  evidence_note text,
  extracted_facts jsonb not null default '{}'::jsonb,
  evidence_metadata jsonb not null default '{}'::jsonb,
  source_content_hash text,

  captured_at timestamptz,
  verified_at timestamptz,
  verified_by uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint product_sources_source_url_scheme
    check (source_url is null or source_url ~* '^https?://')
);


-- Keep updated_at reliable for the internal source-review workflow.
create or replace function private.set_product_source_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $
begin
  new.updated_at = now();
  return new;
end;
$;

revoke all on function private.set_product_source_updated_at() from public, anon, authenticated;
grant execute on function private.set_product_source_updated_at() to service_role;

create trigger product_sources_set_updated_at
before update on private.product_sources
for each row
execute function private.set_product_source_updated_at();

create index if not exists product_sources_product_id_idx
  on private.product_sources(product_id);
create index if not exists product_sources_supplier_id_idx
  on private.product_sources(supplier_id)
  where supplier_id is not null;
create index if not exists product_sources_status_idx
  on private.product_sources(verification_status);
create index if not exists product_sources_pending_idx
  on private.product_sources(product_id, created_at desc)
  where verification_status in ('pending', 'conflict');

comment on schema private is
  'Non-public operational data. Do not add this schema to Supabase Data API exposed schemas.';
comment on table private.product_sources is
  'Private evidence and upstream supplier relationships for DroneWorld products. Never expose through public product APIs.';
comment on column private.product_sources.supplier_id is
  'Optional link to the internal supplier register. NULL is valid when the source entity is not yet matched.';
comment on column private.product_sources.source_entity_name is
  'Internal source-party label, retained even when supplier_id is NULL.';
comment on column private.product_sources.source_url is
  'Internal source URL. Must not be rendered or serialized to public clients.';
comment on column private.product_sources.source_file_path is
  'Internal reference to a source document or asset; not a public URL.';

alter table private.product_sources enable row level security;

-- No client-role policies are intentionally created for the private evidence table.
revoke all on table private.product_sources from public, anon, authenticated;
grant all on table private.product_sources to service_role;

-- The existing supplier register was mistakenly exposed as a public directory.
-- Remove both row policies and SQL privileges; service_role remains available to trusted server jobs.
drop policy if exists "Public can read supplier directory" on public.suppliers;
drop policy if exists "Public can read supplier profiles" on public.supplier_profiles;

alter table public.suppliers enable row level security;
alter table public.supplier_profiles enable row level security;

revoke all on table public.suppliers from public, anon, authenticated;
revoke all on table public.supplier_profiles from public, anon, authenticated;

grant all on table public.suppliers to service_role;
grant all on table public.supplier_profiles to service_role;
