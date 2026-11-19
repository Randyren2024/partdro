-- Restore the supplier data boundary: supplier identity and upstream catalogue data are internal.
DROP POLICY IF EXISTS "Public can read listed suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Public can read profiles for listed suppliers" ON public.supplier_profiles;
DROP POLICY IF EXISTS "Public can read published supplier products" ON public.supplier_products;
REVOKE ALL ON TABLE public.suppliers FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.supplier_profiles FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.supplier_products FROM PUBLIC, anon, authenticated;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_products ENABLE ROW LEVEL SECURITY;
