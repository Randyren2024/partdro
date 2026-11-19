-- Initial alignment of the supplier catalogue schema with the normalized source dataset.
-- The next migration restores the internal-only access boundary after the first schema rollout.

ALTER TABLE public.supplier_profiles
  ALTER COLUMN website DROP NOT NULL,
  ALTER COLUMN address DROP NOT NULL,
  ALTER COLUMN verified_at DROP NOT NULL;

CREATE TABLE IF NOT EXISTS public.supplier_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id text NOT NULL REFERENCES public.suppliers(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  slug text,
  name text NOT NULL,
  name_en text,
  model text,
  brand text,
  category text,
  product_type text,
  summary text,
  description text,
  specifications jsonb NOT NULL DEFAULT '{}'::jsonb,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  applications text[] NOT NULL DEFAULT '{}'::text[],
  media jsonb NOT NULL DEFAULT '[]'::jsonb,
  documents jsonb NOT NULL DEFAULT '[]'::jsonb,
  source_url text,
  source_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  source_type text,
  verification_status text NOT NULL DEFAULT 'unverified'
    CHECK (verification_status IN ('unverified','partially_verified','verified','disputed','discontinued')),
  source_verified_at timestamptz,
  crawled_at timestamptz,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','published','archived')),
  language text NOT NULL DEFAULT 'zh-CN',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS supplier_products_supplier_id_idx ON public.supplier_products(supplier_id);
CREATE INDEX IF NOT EXISTS supplier_products_slug_idx ON public.supplier_products(slug);
CREATE INDEX IF NOT EXISTS supplier_products_status_idx ON public.supplier_products(status);
CREATE INDEX IF NOT EXISTS supplier_products_category_idx ON public.supplier_products(category);

COMMENT ON TABLE public.supplier_products IS
  'Normalized supplier product catalogue adapted from partdro_csv_suppliers. The legacy public.products table remains for the existing website catalogue and its bigint foreign keys. Product facts should be traceable to source_urls and source_verified_at.';
COMMENT ON COLUMN public.supplier_products.specifications IS
  'Structured technical specifications as JSON; retain source units and note test conditions.';
COMMENT ON COLUMN public.supplier_products.media IS
  'Array of sourced image/media objects with URL, type, alt text and attribution where available.';
COMMENT ON COLUMN public.supplier_products.documents IS
  'Array of official brochure/manual/certificate references.';
COMMENT ON COLUMN public.supplier_products.source_urls IS
  'Evidence URLs supporting this product record.';

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read listed suppliers" ON public.suppliers;
CREATE POLICY "Public can read listed suppliers" ON public.suppliers
  FOR SELECT TO anon, authenticated
  USING (status IN ('listed','verified'));

DROP POLICY IF EXISTS "Public can read profiles for listed suppliers" ON public.supplier_profiles;
CREATE POLICY "Public can read profiles for listed suppliers" ON public.supplier_profiles
  FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.suppliers s
    WHERE s.id = supplier_profiles.supplier_id
      AND s.status IN ('listed','verified')
  ));

DROP POLICY IF EXISTS "Public can read published supplier products" ON public.supplier_products;
CREATE POLICY "Public can read published supplier products" ON public.supplier_products
  FOR SELECT TO anon, authenticated
  USING (status = 'published');

GRANT SELECT ON public.suppliers, public.supplier_profiles, public.supplier_products TO anon, authenticated;
