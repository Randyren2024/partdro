-- Recovered verbatim from supabase_migrations.schema_migrations on 2026-11-15.
-- Preserve this historical migration; do not edit or reapply to production.

SET local check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.admin_delete_product (
  product_id uuid
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
begin
  delete from product_langs where product_langs.product_id = admin_delete_product.product_id;
  update cases set product_id = null where cases.product_id = admin_delete_product.product_id;
  update documents set product_id = null where documents.product_id = admin_delete_product.product_id;
  update inquiries set product_id = null where inquiries.product_id = admin_delete_product.product_id;
  delete from landing_content where namespace = (
    select slug from products where products.id = admin_delete_product.product_id
  );
  delete from products where products.id = admin_delete_product.product_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.generate_order_number()
  RETURNS text
  LANGUAGE plpgsql
  AS $function$
DECLARE
  order_num TEXT;
  date_part TEXT;
  random_part TEXT;
BEGIN
  -- Format: PD-YYYYMMDD-XXXX (e.g., PD-20260623-A3F9)
  date_part := TO_CHAR(NOW(), 'YYYYMMDD');
  random_part := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4));
  order_num := 'PD-' || date_part || '-' || random_part;

  RETURN order_num;
END;
$function$;

CREATE OR REPLACE FUNCTION public.match_document_chunks (
  query_embedding extensions.vector,
  match_threshold double precision,
  match_count     integer
)
  RETURNS TABLE (
    id          uuid,
    document_id uuid,
    content     text,
    metadata    jsonb,
    similarity  double precision
  )
  LANGUAGE plpgsql
  AS $function$
  begin
    return query
    select
      dc.id,
      dc.document_id,
      dc.content,
      dc.metadata,
      1 - (dc.embedding <=> query_embedding) as similarity
    from document_chunks dc
    where 1 - (dc.embedding <=> query_embedding) > match_threshold
    order by similarity desc
    limit match_count;
  end;
  $function$;

CREATE OR REPLACE FUNCTION public.match_knowledge (
  query_embedding extensions.vector,
  match_threshold double precision,
  match_count     integer
)
  RETURNS TABLE (
    id         uuid,
    content    text,
    metadata   jsonb,
    similarity double precision
  )
  LANGUAGE plpgsql
  AS $function$
BEGIN
  RETURN QUERY
  SELECT
    product_knowledge.id,
    product_knowledge.content,
    product_knowledge.metadata,
    1 - (product_knowledge.embedding <=> query_embedding) AS similarity
  FROM product_knowledge
  WHERE 1 - (product_knowledge.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.match_search_terms (
  query_embedding extensions.vector,
  match_threshold double precision,
  match_count     integer
)
  RETURNS TABLE (
    id          integer,
    search_term text,
    similarity  double precision
  )
  LANGUAGE plpgsql
  AS $function$
begin
  return query
  select
    search_term_embeddings.id,
    search_term_embeddings.search_term,
    1 - (search_term_embeddings.embedding <=> query_embedding) as similarity
  from search_term_embeddings
  where 1 - (search_term_embeddings.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
end;
$function$;

CREATE OR REPLACE FUNCTION public.set_order_number()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
begin new.updated_at = now(); return new; end;
$function$;
