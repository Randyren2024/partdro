-- Restrict authenticated editorial access to users explicitly listed in public.admins.
-- Public read policies and the anonymous inquiry INSERT policy remain unchanged.
-- Apply through the reviewed migration workflow; do not run this against production ad hoc.

-- Cases and localized case content.
DROP POLICY IF EXISTS "admins update cases product_id" ON public.cases;
CREATE POLICY "admins update cases product_id" ON public.cases
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.admins a
    WHERE a.user_id = (SELECT auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.admins a
    WHERE a.user_id = (SELECT auth.uid())
  ));

DROP POLICY IF EXISTS "authenticated_select_cases" ON public.cases;
CREATE POLICY "authenticated_select_cases" ON public.cases
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.admins a
    WHERE a.user_id = (SELECT auth.uid())
  ));

DROP POLICY IF EXISTS "authenticated_select_case_langs" ON public.case_langs;
CREATE POLICY "authenticated_select_case_langs" ON public.case_langs
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.admins a
    WHERE a.user_id = (SELECT auth.uid())
  ));

-- Documents and localized document content.
DROP POLICY IF EXISTS "admins update documents product_id" ON public.documents;
CREATE POLICY "admins update documents product_id" ON public.documents
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.admins a
    WHERE a.user_id = (SELECT auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.admins a
    WHERE a.user_id = (SELECT auth.uid())
  ));

DROP POLICY IF EXISTS "authenticated_select_documents" ON public.documents;
CREATE POLICY "authenticated_select_documents" ON public.documents
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.admins a
    WHERE a.user_id = (SELECT auth.uid())
  ));

DROP POLICY IF EXISTS "authenticated_select_document_langs" ON public.document_langs;
CREATE POLICY "authenticated_select_document_langs" ON public.document_langs
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.admins a
    WHERE a.user_id = (SELECT auth.uid())
  ));

-- Inquiry CRM: anonymous visitors may still submit; only admins may read/update CRM rows.
-- UPDATE also requires SELECT visibility for rows being updated.
DROP POLICY IF EXISTS "authenticated_select_inquiries" ON public.inquiries;
CREATE POLICY "authenticated_select_inquiries" ON public.inquiries
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.admins a
    WHERE a.user_id = (SELECT auth.uid())
  ));

DROP POLICY IF EXISTS "admins update inquiries product_id" ON public.inquiries;
CREATE POLICY "admins update inquiries product_id" ON public.inquiries
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.admins a
    WHERE a.user_id = (SELECT auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.admins a
    WHERE a.user_id = (SELECT auth.uid())
  ));

-- Editorial content.
-- The public read policy must not target PUBLIC: that role also includes
-- authenticated users and would bypass the admin-only SELECT policy.
DROP POLICY IF EXISTS "public read landing_content" ON public.landing_content;
CREATE POLICY "public read landing_content" ON public.landing_content
  FOR SELECT TO anon
  USING (true);

-- The previous ALL policy already checked admins but targeted PUBLIC.
-- Narrow its role to authenticated as defense in depth.
DROP POLICY IF EXISTS "admin write landing_content" ON public.landing_content;
CREATE POLICY "admin write landing_content" ON public.landing_content
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.admins a
    WHERE a.user_id = (SELECT auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.admins a
    WHERE a.user_id = (SELECT auth.uid())
  ));

DROP POLICY IF EXISTS "authenticated_select_landing_content" ON public.landing_content;
CREATE POLICY "authenticated_select_landing_content" ON public.landing_content
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.admins a
    WHERE a.user_id = (SELECT auth.uid())
  ));

DROP POLICY IF EXISTS "admins delete landing_content" ON public.landing_content;
CREATE POLICY "admins delete landing_content" ON public.landing_content
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.admins a
    WHERE a.user_id = (SELECT auth.uid())
  ));

DROP POLICY IF EXISTS "authenticated_select_posts" ON public.posts;
CREATE POLICY "authenticated_select_posts" ON public.posts
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.admins a
    WHERE a.user_id = (SELECT auth.uid())
  ));

DROP POLICY IF EXISTS "authenticated_select_post_langs" ON public.post_langs;
CREATE POLICY "authenticated_select_post_langs" ON public.post_langs
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.admins a
    WHERE a.user_id = (SELECT auth.uid())
  ));

-- Product catalogue and translations: keep public published-product reads intact.
DROP POLICY IF EXISTS "admins select all products" ON public.products;
CREATE POLICY "admins select all products" ON public.products
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.admins a
    WHERE a.user_id = (SELECT auth.uid())
  ));

-- Keep one authenticated SELECT policy; the admins_select policy above
-- already supplies the required membership check.
DROP POLICY IF EXISTS "authenticated_select_products" ON public.products;

DROP POLICY IF EXISTS "admins insert products" ON public.products;
CREATE POLICY "admins insert products" ON public.products
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.admins a
    WHERE a.user_id = (SELECT auth.uid())
  ));

DROP POLICY IF EXISTS "admins update products" ON public.products;
CREATE POLICY "admins update products" ON public.products
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.admins a
    WHERE a.user_id = (SELECT auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.admins a
    WHERE a.user_id = (SELECT auth.uid())
  ));

DROP POLICY IF EXISTS "admins delete products" ON public.products;
CREATE POLICY "admins delete products" ON public.products
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.admins a
    WHERE a.user_id = (SELECT auth.uid())
  ));

DROP POLICY IF EXISTS "admins select all product_langs" ON public.product_langs;
CREATE POLICY "admins select all product_langs" ON public.product_langs
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.admins a
    WHERE a.user_id = (SELECT auth.uid())
  ));

-- Keep one authenticated SELECT policy; the admins_select policy above
-- already supplies the required membership check.
DROP POLICY IF EXISTS "authenticated_select_product_langs" ON public.product_langs;

DROP POLICY IF EXISTS "admins insert product_langs" ON public.product_langs;
CREATE POLICY "admins insert product_langs" ON public.product_langs
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.admins a
    WHERE a.user_id = (SELECT auth.uid())
  ));

DROP POLICY IF EXISTS "admins update product_langs" ON public.product_langs;
CREATE POLICY "admins update product_langs" ON public.product_langs
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.admins a
    WHERE a.user_id = (SELECT auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.admins a
    WHERE a.user_id = (SELECT auth.uid())
  ));

DROP POLICY IF EXISTS "admins delete product_langs" ON public.product_langs;
CREATE POLICY "admins delete product_langs" ON public.product_langs
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.admins a
    WHERE a.user_id = (SELECT auth.uid())
  ));

-- This is an event-trigger callback, not an application RPC endpoint.
-- The event trigger remains installed and owned by postgres; ordinary API roles
-- must not be able to invoke its SECURITY DEFINER function.
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon, authenticated, service_role;
