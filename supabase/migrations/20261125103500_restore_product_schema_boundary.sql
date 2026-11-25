begin;

-- Restore the schema boundary documented by the supplier-admin migrations:
--   public.products          = customer-facing website catalogue (bigint id)
--   public.supplier_products = internal supplier catalogue (uuid id)
-- The hosted database had these two tables renamed manually, with no migration.

alter table public.products rename to supplier_products;
alter table public.supplier_products
  rename constraint products_supplier_id_fkey to supplier_products_supplier_id_fkey;

alter table public.legacy_products rename to products;

-- Internal supplier data must not be readable by browser roles.
revoke all on public.supplier_products from anon, authenticated;
revoke all on public.suppliers from anon, authenticated;
revoke all on public.supplier_profiles from anon, authenticated;

-- Table-level REVOKE does not remove column-level grants. Remove those too.
do $$
declare
  r record;
begin
  for r in
    select table_name, column_name
    from information_schema.columns
    where table_schema = 'public'
      and table_name in ('supplier_products', 'suppliers', 'supplier_profiles')
  loop
    execute format(
      'revoke select (%I) on public.%I from anon, authenticated',
      r.column_name,
      r.table_name
    );
  end loop;
end $$;

drop policy if exists "Public can read published products" on public.supplier_products;
drop policy if exists "Public can read listed suppliers" on public.suppliers;
drop policy if exists "Public can read profiles for listed suppliers" on public.supplier_profiles;

alter table public.supplier_products enable row level security;
alter table public.suppliers enable row level security;
alter table public.supplier_profiles enable row level security;

grant all on public.supplier_products to service_role;
grant all on public.suppliers to service_role;
grant all on public.supplier_profiles to service_role;

-- The public website catalogue is read-only for browser roles. Admin writes go
-- through the service-role Nitro/Netlify endpoints.
revoke all on public.products from anon, authenticated;
grant select on public.products to anon, authenticated;

-- This function targeted the old uuid-keyed internal products table and is not
-- used by main. The admin branch must rework it against the restored schema.
drop function if exists public.admin_delete_product(uuid);

comment on table public.supplier_products is 'Internal supplier product catalogue. Not customer-facing. Public website catalogue is public.products.';
comment on table public.products is 'Customer-facing website product catalogue.';

notify pgrst, 'reload schema';

commit;