-- Recovered verbatim from supabase_migrations.schema_migrations on 2026-11-15.
-- Preserve this historical migration; do not edit or reapply to production.

ALTER TABLE public.inquiries
  ADD COLUMN IF NOT EXISTS gbraid text,
  ADD COLUMN IF NOT EXISTS wbraid text,
  ADD COLUMN IF NOT EXISTS dclid text,
  ADD COLUMN IF NOT EXISTS fbclid text,
  ADD COLUMN IF NOT EXISTS first_referrer text,
  ADD COLUMN IF NOT EXISTS first_landing_page text,
  ADD COLUMN IF NOT EXISTS first_visit_at timestamptz,
  ADD COLUMN IF NOT EXISTS gclid_captured_at timestamptz,
  ADD COLUMN IF NOT EXISTS lead_status text,
  ADD COLUMN IF NOT EXISTS owner text,
  ADD COLUMN IF NOT EXISTS company text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS first_responded_at timestamptz,
  ADD COLUMN IF NOT EXISTS qualified_at timestamptz,
  ADD COLUMN IF NOT EXISTS quote_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS quote_value numeric,
  ADD COLUMN IF NOT EXISTS quote_currency text,
  ADD COLUMN IF NOT EXISTS won_at timestamptz,
  ADD COLUMN IF NOT EXISTS lost_at timestamptz,
  ADD COLUMN IF NOT EXISTS lost_reason text,
  ADD COLUMN IF NOT EXISTS next_follow_up_at timestamptz,
  ADD COLUMN IF NOT EXISTS notes text;
