begin;

select plan(10);

select ok(
  exists (
    select 1 from information_schema.schemata where schema_name = 'private'
  ),
  'private schema exists'
);

select ok(
  exists (
    select 1 from information_schema.tables
    where table_schema = 'private' and table_name = 'product_sources'
  ),
  'private product_sources table exists'
);

select ok(
  (select relrowsecurity from pg_class where oid = 'private.product_sources'::regclass),
  'RLS is enabled on private.product_sources'
);

select ok(
  not has_schema_privilege('anon', 'private', 'USAGE'),
  'anon cannot access the private schema'
);

select ok(
  not has_schema_privilege('authenticated', 'private', 'USAGE'),
  'authenticated cannot access the private schema'
);

select ok(
  not has_table_privilege('anon', 'private.product_sources', 'SELECT'),
  'anon cannot read product source evidence'
);

select ok(
  not has_table_privilege('authenticated', 'private.product_sources', 'SELECT'),
  'authenticated cannot read product source evidence'
);

select ok(
  not has_table_privilege('anon', 'public.suppliers', 'SELECT'),
  'anon cannot read suppliers'
);

select ok(
  not has_table_privilege('authenticated', 'public.suppliers', 'SELECT'),
  'authenticated cannot read suppliers'
);

select ok(
  not has_table_privilege('anon', 'public.supplier_profiles', 'SELECT')
  and not has_table_privilege('authenticated', 'public.supplier_profiles', 'SELECT'),
  'neither client role can read supplier profiles'
);

select * from finish();
rollback;
