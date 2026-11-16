# Product source data model

## Business purpose

DroneWorld is the customer-facing product and sales platform. Supplier identity, upstream source URLs, original model names, source documents, and verification notes are internal procurement/sourcing records.

Public product content remains in the existing `public.products`, `public.product_langs`, and product landing-content flow. This change does not rewrite or delete any public product content.

## Relationship model

`private.product_sources` stores one evidence/source relationship per row:

- `product_id`: required link to the DroneWorld product.
- `supplier_id`: optional link to `public.suppliers`; nullable because some sources are not yet matched to the supplier register.
- `source_entity_name`: internal label for an upstream party when no supplier record is matched.
- `original_model`: model name used by the upstream source.
- `source_kind`: official product/company page, brochure, datasheet, media, internal file, customer-provided material, or other.
- `relationship_type`: manufacturer, brand owner, distributor, source publisher, document owner, or unknown.
- `verification_status`: pending, confirmed, conflict, or rejected.
- `source_url`, `source_file_path`, `evidence_note`, `extracted_facts`, `evidence_metadata`: internal evidence. Never serialize these fields into a public API or page payload.
- `verified_at`, `verified_by`: verification audit fields.

One product can have multiple source rows. A supplier can be linked to multiple products. A source row may have no supplier link until the identity is verified. This avoids forcing every source into the existing 249-company register.

## Intended workflow

1. **Capture** — create a source row when a product page, brochure, datasheet, image, or video is found. Default status is `pending`.
2. **Match** — link `supplier_id` only when the source entity is confidently matched to an internal supplier record. Otherwise retain the internal source label and leave `supplier_id` NULL.
3. **Compare** — record the original model and extract only facts that can be traced to the source.
4. **Verify** — resolve model identity, payload definitions, units, and conflicting specifications. Mark `confirmed` only when evidence supports the relationship; use `conflict` when model or parameter evidence disagrees.
5. **Publish** — separately edit DroneWorld-owned product copy and structured product facts. Publishing does not expose the source row.
6. **Maintain** — retain multiple source records and timestamps so later product updates can be traced.

## Access boundary

- `public.products` and its public language/content tables remain the customer-facing product layer.
- `public.suppliers` and `public.supplier_profiles` remain internal records but are retained in their existing schema for compatibility with foreign keys and server-side tools. Client-role table grants and public read policies are revoked.
- `private.product_sources` is in a non-public schema, has RLS enabled, and has no `anon` or `authenticated` grants or policies.
- Trusted server-side operations use the Supabase `service_role` key only in server runtime. Never place it in a browser bundle, static page payload, or public repository.
- Do not add the `private` schema to Supabase Data API exposed schemas.

## Deliberately not included in this migration

- No source mappings or supplier identities are inserted. Those records require a controlled, private data-entry/import step.
- No changes to product records, product translations, landing page copy, product images, or public product queries.
- No frontend cleanup yet. Existing statically generated supplier pages and public repository history require a separate frontend/release cleanup phase; revoking Data API access alone does not erase already generated HTML or public Git history.
- No production migration is applied by this PR. Review and merge the migration first, then apply it to the intended Supabase project with an approved deployment step.
