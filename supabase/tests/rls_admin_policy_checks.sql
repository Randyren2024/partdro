-- Read-only verification for the admin RLS hardening migration.
-- Run after applying the migration in a non-production Supabase branch/project.

-- Every authenticated SELECT/INSERT/UPDATE/DELETE policy below must contain
-- an admins membership check; public/anon read and inquiry INSERT policies
-- are intentionally not part of this assertion.
SELECT tablename, policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND policyname IN (
    'admins update cases product_id',
    'authenticated_select_cases',
    'authenticated_select_case_langs',
    'admins update documents product_id',
    'authenticated_select_documents',
    'authenticated_select_document_langs',
    'admins update inquiries product_id',
    'authenticated_select_landing_content',
    'admins delete landing_content',
    'authenticated_select_posts',
    'authenticated_select_post_langs',
    'admins select all products',
    'authenticated_select_products',
    'admins insert products',
    'admins update products',
    'admins delete products',
    'admins select all product_langs',
    'authenticated_select_product_langs',
    'admins insert product_langs',
    'admins update product_langs',
    'admins delete product_langs'
  )
ORDER BY tablename, policyname;

-- Expected: false for all three API roles; the event trigger itself remains enabled.
SELECT
  has_function_privilege('anon', 'public.rls_auto_enable()', 'EXECUTE') AS anon_can_execute,
  has_function_privilege('authenticated', 'public.rls_auto_enable()', 'EXECUTE') AS authenticated_can_execute,
  has_function_privilege('service_role', 'public.rls_auto_enable()', 'EXECUTE') AS service_role_can_execute;

SELECT evtname, evtenabled
FROM pg_event_trigger
WHERE evtfoid = 'public.rls_auto_enable()'::regprocedure;
