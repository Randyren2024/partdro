# Supplier product catalogue workflow

## Data boundary

- `public.products` and `public.product_langs` remain DroneWorld's customer-facing product catalogue.
- `public.suppliers`, `public.supplier_profiles`, and `public.supplier_products` are internal procurement and research data.
- The supplier catalogue is not published automatically. A supplier product record is not a DroneWorld offer, endorsement, or verified manufacturer relationship.
- Browser roles (`anon` and `authenticated`) have no table privileges or read policies for the supplier tables. Trusted Nitro server routes use the service-role client only after validating the user's Supabase session and membership in `public.admins`.

## Admin workflow (first increment)

The `/admin/supplier-products` screen provides a paginated, searchable read-only view of the 755 imported supplier product records. It joins supplier identity on the server and shows source/verification metadata only to authenticated administrators.

## Relationship to the sales catalogue

Do not copy the 755 upstream products into `public.products`. When a supplier product is selected for DroneWorld's own sales catalogue, create or update a separate public product record and its language rows. Preserve the upstream supplier product UUID and evidence as internal provenance; do not expose source URLs or supplier identity in public product payloads unless explicitly approved.

Future work may add a reviewed mapping between `supplier_products.id` and `products.id` (bigint). This mapping must be explicit and many-to-many capable; model-name similarity alone must never publish or merge records.
