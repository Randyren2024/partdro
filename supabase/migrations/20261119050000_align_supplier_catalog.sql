-- Align the DroneWorld supplier catalogue with the normalized Partdro supplier product model.
-- Supplier identities and upstream product records remain internal procurement data.
-- The customer-facing public.products / product_langs model is intentionally unchanged.

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
  'Internal supplier product catalogue. Not customer-facing. Public product pages remain in public.products and public.product_langs.';
COMMENT ON COLUMN public.supplier_products.source_urls IS
  'Internal evidence URLs supporting this supplier product record.';
COMMENT ON COLUMN public.supplier_products.specifications IS
  'Structured upstream technical specifications. Preserve source units and test conditions.';

ALTER TABLE public.suppliers
  ALTER COLUMN name_en DROP NOT NULL;
ALTER TABLE public.supplier_profiles
  ALTER COLUMN website DROP NOT NULL,
  ALTER COLUMN address DROP NOT NULL,
  ALTER COLUMN verified_at DROP NOT NULL;

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read listed suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Public can read profiles for listed suppliers" ON public.supplier_profiles;
DROP POLICY IF EXISTS "Public can read published supplier products" ON public.supplier_products;

REVOKE ALL ON TABLE public.suppliers FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.supplier_profiles FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.supplier_products FROM PUBLIC, anon, authenticated;

GRANT ALL ON TABLE public.suppliers TO service_role;
GRANT ALL ON TABLE public.supplier_profiles TO service_role;
GRANT ALL ON TABLE public.supplier_products TO service_role;
