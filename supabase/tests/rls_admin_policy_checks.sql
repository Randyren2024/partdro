-- Assertion-based, read-only verification for the admin RLS hardening migration.
-- Run only against a disposable/non-production Supabase branch after applying
-- the migration. This checks policy shape and grants; it does not replace
-- authenticated end-to-end CRUD tests using real admin/non-admin JWTs.

DO $$
DECLARE
  p record;
  expected_selects constant text[][] := ARRAY[
    ARRAY['cases', 'authenticated_select_cases'],
    ARRAY['case_langs', 'authenticated_select_case_langs'],
    ARRAY['documents', 'authenticated_select_documents'],
    ARRAY['document_langs', 'authenticated_select_document_langs'],
    ARRAY['inquiries', 'authenticated_select_inquiries'],
    ARRAY['landing_content', 'authenticated_select_landing_content'],
    ARRAY['posts', 'authenticated_select_posts'],
    ARRAY['post_langs', 'authenticated_select_post_langs'],
    ARRAY['products', 'admins select all products'],
    ARRAY['product_langs', 'admins select all product_langs']
  ];
  expected_updates constant text[][] := ARRAY[
    ARRAY['cases', 'admins update cases product_id'],
    ARRAY['documents', 'admins update documents product_id'],
    ARRAY['inquiries', 'admins update inquiries product_id'],
    ARRAY['products', 'admins update products'],
    ARRAY['product_langs', 'admins update product_langs']
  ];
  i integer;
BEGIN
  -- Every authenticated SELECT policy must be admin-gated.
  FOR i IN 1..array_length(expected_selects, 1) LOOP
    SELECT * INTO p
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = expected_selects[i][1]
      AND policyname = expected_selects[i][2]
      AND cmd = 'SELECT'
      AND roles = ARRAY['authenticated']::name[];

    IF NOT FOUND OR p.qual IS NULL
       OR position('admins' IN p.qual) = 0
       OR position('auth.uid' IN p.qual) = 0 THEN
      RAISE EXCEPTION 'Missing or unsafe admin SELECT policy: %.%',
        expected_selects[i][1], expected_selects[i][2];
    END IF;
  END LOOP;

  -- UPDATE policies must protect both existing rows and new row values.
  FOR i IN 1..array_length(expected_updates, 1) LOOP
    SELECT * INTO p
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = expected_updates[i][1]
      AND policyname = expected_updates[i][2]
      AND cmd = 'UPDATE'
      AND roles = ARRAY['authenticated']::name[];

    IF NOT FOUND OR p.qual IS NULL OR p.with_check IS NULL
       OR position('admins' IN p.qual) = 0
       OR position('auth.uid' IN p.qual) = 0
       OR position('admins' IN p.with_check) = 0
       OR position('auth.uid' IN p.with_check) = 0 THEN
      RAISE EXCEPTION 'Missing or unsafe admin UPDATE policy: %.%',
        expected_updates[i][1], expected_updates[i][2];
    END IF;
  END LOOP;

  -- Catch any additional permissive policy that applies to authenticated users
  -- through either PUBLIC or authenticated and is not admin-gated. This prevents
  -- a duplicate USING (true) policy from silently bypassing the named policies.
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'cases', 'case_langs',
        'documents', 'document_langs',
        'inquiries', 'landing_content',
        'posts', 'post_langs',
        'products', 'product_langs'
      )
      AND roles && ARRAY['public', 'authenticated']::name[]
      AND (
        position(
          'admins' IN coalesce(qual, '') || ' ' || coalesce(with_check, '')
        ) = 0
        OR position(
          'auth.uid' IN coalesce(qual, '') || ' ' || coalesce(with_check, '')
        ) = 0
      )
  ) THEN
    RAISE EXCEPTION
      'A policy applying to authenticated users is missing an admin membership predicate';
  END IF;

  -- The broad PUBLIC landing-content read must be gone. Anonymous reads remain.
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'landing_content'
      AND policyname = 'public read landing_content'
      AND roles = ARRAY['public']::name[]
  ) THEN
    RAISE EXCEPTION 'landing_content still has a PUBLIC read policy';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'landing_content'
      AND policyname = 'public read landing_content'
      AND cmd = 'SELECT'
      AND roles = ARRAY['anon']::name[]
  ) THEN
    RAISE EXCEPTION 'Anonymous landing_content read policy was not preserved';
  END IF;

  -- Anonymous inquiry submissions must remain available.
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'inquiries'
      AND policyname = 'allow anon insert'
      AND cmd = 'INSERT'
      AND roles = ARRAY['anon']::name[]
      AND with_check = 'true'
  ) THEN
    RAISE EXCEPTION 'Anonymous inquiry INSERT policy is missing or changed';
  END IF;

  -- Product SELECT policies must not be duplicated.
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('products', 'product_langs')
      AND cmd = 'SELECT'
      AND roles = ARRAY['authenticated']::name[]
      AND policyname IN ('authenticated_select_products', 'authenticated_select_product_langs')
  ) THEN
    RAISE EXCEPTION 'Duplicate authenticated product SELECT policy remains';
  END IF;

  -- Event trigger remains installed/enabled; its callback is not an API RPC.
  IF NOT EXISTS (
    SELECT 1
    FROM pg_event_trigger e
    WHERE e.evtfoid = 'public.rls_auto_enable()'::regprocedure
      AND e.evtenabled <> 'D'
  ) THEN
    RAISE EXCEPTION 'rls_auto_enable event trigger is missing or disabled';
  END IF;

  IF has_function_privilege('anon', 'public.rls_auto_enable()', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.rls_auto_enable()', 'EXECUTE')
     OR has_function_privilege('service_role', 'public.rls_auto_enable()', 'EXECUTE') THEN
    RAISE EXCEPTION 'An API role can still execute rls_auto_enable()';
  END IF;

  IF NOT has_function_privilege('service_role',
      'public.consume_inquiry_rate_limit(text,integer,integer)', 'EXECUTE') THEN
    RAISE EXCEPTION 'service_role lost consume_inquiry_rate_limit() EXECUTE';
  END IF;

  RAISE NOTICE 'Admin RLS policy assertions passed.';
END
$$;

-- Still required after these static assertions:
-- 1. Sign in as the real admin and verify expected dashboard reads/writes.
-- 2. Sign in as a non-admin and verify private editorial/CRM rows are denied.
-- 3. Verify anonymous published-content reads and inquiry submissions.
-- 4. Verify the event trigger fires on a newly-created test table in the
--    disposable branch, then remove that test table.
