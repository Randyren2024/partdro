-- Recovered verbatim from supabase_migrations.schema_migrations on 2026-11-15.
-- Preserve this historical migration; do not edit or reapply to production.

SET local check_function_bodies = off;

CREATE EXTENSION "pg_net" SCHEMA "extensions";

CREATE EXTENSION "vector" SCHEMA "extensions";

CREATE SEQUENCE "public"."cases_id_seq" AS bigint INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1 NO CYCLE;

CREATE SEQUENCE "public"."documents_id_seq" AS bigint INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1 NO CYCLE;

CREATE SEQUENCE "public"."inquiries_id_seq" AS bigint INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1 NO CYCLE;

CREATE SEQUENCE "public"."posts_id_seq" AS bigint INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1 NO CYCLE;

CREATE SEQUENCE "public"."products_id_seq" AS bigint INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1 NO CYCLE;

CREATE TABLE "public"."admins" (
  "user_id"    uuid                     NOT NULL,
  "username"   text                     NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "admins_pkey" PRIMARY KEY (user_id),
  CONSTRAINT "admins_username_key" UNIQUE (username)
);

ALTER TABLE "public"."admins"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."app_secrets" (
  "key"   text NOT NULL,
  "value" text NOT NULL,
  CONSTRAINT "app_secrets_pkey" PRIMARY KEY (key)
);

ALTER TABLE "public"."app_secrets"
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "public"."app_secrets" FROM "anon", "authenticated";

CREATE TABLE "public"."case_langs" (
  "case_id"     bigint NOT NULL,
  "lang"        text   NOT NULL,
  "title"       text   NOT NULL,
  "description" text,
  "location"    text,
  CONSTRAINT "case_langs_lang_check" CHECK ((lang = ANY (ARRAY['en'::text, 'es'::text, 'de'::text, 'fr'::text]))),
  CONSTRAINT "case_langs_pkey" PRIMARY KEY (case_id, lang)
);

ALTER TABLE "public"."case_langs"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."cases" (
  "id"         bigint                   NOT NULL DEFAULT nextval('public.cases_id_seq'::regclass),
  "slug"       text                     NOT NULL,
  "image_url"  text,
  "product_id" bigint,
  "published"  boolean                  DEFAULT true,
  "created_at" timestamp with time zone DEFAULT now(),
  CONSTRAINT "cases_pkey" PRIMARY KEY (id),
  CONSTRAINT "cases_slug_key" UNIQUE (slug)
);

ALTER TABLE "public"."cases"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."document_langs" (
  "document_id" bigint NOT NULL,
  "lang"        text   NOT NULL,
  "title"       text   NOT NULL,
  "description" text,
  CONSTRAINT "document_langs_lang_check" CHECK ((lang = ANY (ARRAY['en'::text, 'es'::text, 'de'::text, 'fr'::text]))),
  CONSTRAINT "document_langs_pkey" PRIMARY KEY (document_id, lang)
);

ALTER TABLE "public"."document_langs"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."documents" (
  "id"         bigint                   NOT NULL DEFAULT nextval('public.documents_id_seq'::regclass),
  "file_url"   text,
  "file_size"  integer,
  "product_id" bigint,
  "published"  boolean                  DEFAULT true,
  "created_at" timestamp with time zone DEFAULT now(),
  CONSTRAINT "documents_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."documents"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."inquiries" (
  "id"           bigint                   NOT NULL DEFAULT nextval('public.inquiries_id_seq'::regclass),
  "name"         text                     NOT NULL,
  "email"        text                     NOT NULL,
  "phone"        text,
  "type"         text                     NOT NULL DEFAULT 'contact'::text,
  "message"      text,
  "created_at"   timestamp with time zone DEFAULT now(),
  "lead_profile" jsonb,
  CONSTRAINT "inquiries_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."inquiries"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."landing_content" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "namespace"  text                     NOT NULL DEFAULT 'd15r'::text,
  "lang"       text                     NOT NULL,
  "content"    jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "landing_content_namespace_lang_key" UNIQUE (namespace, lang),
  CONSTRAINT "landing_content_pkey" PRIMARY KEY (id),
  "updated_by" uuid                     DEFAULT auth.uid()
);

ALTER TABLE "public"."landing_content"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."post_langs" (
  "post_id" bigint NOT NULL,
  "lang"    text   NOT NULL,
  "title"   text   NOT NULL,
  "summary" text,
  "content" text,
  CONSTRAINT "post_langs_lang_check" CHECK ((lang = ANY (ARRAY['en'::text, 'es'::text, 'de'::text, 'fr'::text]))),
  CONSTRAINT "post_langs_pkey" PRIMARY KEY (post_id, lang)
);

ALTER TABLE "public"."post_langs"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."posts" (
  "id"           bigint                   NOT NULL DEFAULT nextval('public.posts_id_seq'::regclass),
  "slug"         text                     NOT NULL,
  "category"     text,
  "image_url"    text,
  "published"    boolean                  DEFAULT true,
  "published_at" timestamp with time zone,
  "created_at"   timestamp with time zone DEFAULT now(),
  CONSTRAINT "posts_pkey" PRIMARY KEY (id),
  CONSTRAINT "posts_slug_key" UNIQUE (slug)
);

ALTER TABLE "public"."posts"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."product_langs" (
  "product_id"  bigint NOT NULL,
  "lang"        text   NOT NULL,
  "name"        text   NOT NULL,
  "description" text,
  "short_desc"  text,
  CONSTRAINT "product_langs_lang_check" CHECK ((lang = ANY (ARRAY['en'::text, 'es'::text, 'de'::text, 'fr'::text]))),
  CONSTRAINT "product_langs_pkey" PRIMARY KEY (product_id, lang)
);

ALTER TABLE "public"."product_langs"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."products" (
  "id"         bigint                   NOT NULL DEFAULT nextval('public.products_id_seq'::regclass),
  "slug"       text                     NOT NULL,
  "category"   text                     NOT NULL,
  "image_url"  text,
  "gallery"    text[]                   DEFAULT '{}'::text[],
  "specs"      jsonb                    DEFAULT '{}'::jsonb,
  "features"   jsonb                    DEFAULT '[]'::jsonb,
  "sort_order" integer                  DEFAULT 0,
  "published"  boolean                  DEFAULT true,
  "created_at" timestamp with time zone DEFAULT now(),
  CONSTRAINT "products_category_check" CHECK ((category = ANY (ARRAY['agricultural'::text, 'cargo'::text, 'cleaning'::text]))),
  CONSTRAINT "products_pkey" PRIMARY KEY (id),
  CONSTRAINT "products_slug_key" UNIQUE (slug)
);

ALTER TABLE "public"."products"
  ENABLE ROW LEVEL SECURITY;

ALTER SEQUENCE "public"."cases_id_seq" OWNED BY "public"."cases"."id";

ALTER SEQUENCE "public"."documents_id_seq" OWNED BY "public"."documents"."id";

ALTER SEQUENCE "public"."inquiries_id_seq" OWNED BY "public"."inquiries"."id";

ALTER SEQUENCE "public"."posts_id_seq" OWNED BY "public"."posts"."id";

ALTER SEQUENCE "public"."products_id_seq" OWNED BY "public"."products"."id";

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

REVOKE ALL ON FUNCTION "public"."admin_delete_product"(uuid) FROM PUBLIC, "anon", "authenticated";

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

CREATE OR REPLACE FUNCTION public.notify_inquiry_webhook()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'extensions', 'net'
  AS $function$
declare
  secret text;
begin
  select value into secret from public.app_secrets where key = 'inquiry_webhook_secret';
  perform net.http_post(
    url := 'https://www.droneworld.tech/api/inquiry-webhook',
    headers := jsonb_build_object('Content-Type','application/json','x-webhook-secret',coalesce(secret,'')),
    body := jsonb_build_object('type','INSERT','table',TG_TABLE_NAME,'schema',TG_TABLE_SCHEMA,'record',to_jsonb(NEW),'old_record',null),
    timeout_milliseconds := 5000
  );
  return NEW;
end;
$function$;

REVOKE ALL ON FUNCTION "public"."notify_inquiry_webhook"() FROM PUBLIC, "anon", "authenticated";

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

ALTER TABLE "public"."admins"
  ADD CONSTRAINT "admins_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."case_langs"
  ADD CONSTRAINT "case_langs_case_id_fkey" FOREIGN KEY (case_id) REFERENCES public.cases(id) ON DELETE CASCADE;

ALTER TABLE "public"."document_langs"
  ADD CONSTRAINT "document_langs_document_id_fkey" FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;

ALTER TABLE "public"."post_langs"
  ADD CONSTRAINT "post_langs_post_id_fkey" FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;

ALTER TABLE "public"."cases"
  ADD CONSTRAINT "cases_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;

ALTER TABLE "public"."documents"
  ADD CONSTRAINT "documents_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;

ALTER TABLE "public"."product_langs"
  ADD CONSTRAINT "product_langs_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

CREATE INDEX idx_cases_slug ON public.cases USING btree (slug);

CREATE INDEX idx_posts_published_at ON public.posts USING btree (published_at DESC);

CREATE INDEX idx_posts_slug ON public.posts USING btree (slug);

CREATE INDEX idx_product_langs_lang ON public.product_langs USING btree (lang);

CREATE INDEX idx_products_category ON public.products USING btree (category);

CREATE INDEX idx_products_slug ON public.products USING btree (slug);

CREATE TRIGGER inquiries_notify_webhook
  AFTER INSERT ON public.inquiries
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_inquiry_webhook();

CREATE TRIGGER trg_landing_content_updated
  BEFORE UPDATE ON public.landing_content
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "admins self read" ON "public"."admins"
  FOR SELECT
  TO PUBLIC
  USING ((user_id = auth.uid()));

CREATE POLICY "anon can read case_langs" ON "public"."case_langs"
  FOR SELECT
  TO "anon"
  USING (true);

CREATE POLICY "authenticated_select_case_langs" ON "public"."case_langs"
  FOR SELECT
  TO "authenticated"
  USING (true);

CREATE POLICY "admins update cases product_id" ON "public"."cases"
  FOR UPDATE
  TO "authenticated"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "anon can read cases" ON "public"."cases"
  FOR SELECT
  TO "anon"
  USING ((published = true));

CREATE POLICY "authenticated_select_cases" ON "public"."cases"
  FOR SELECT
  TO "authenticated"
  USING (true);

CREATE POLICY "anon can read document_langs" ON "public"."document_langs"
  FOR SELECT
  TO "anon"
  USING (true);

CREATE POLICY "authenticated_select_document_langs" ON "public"."document_langs"
  FOR SELECT
  TO "authenticated"
  USING (true);

CREATE POLICY "admins update documents product_id" ON "public"."documents"
  FOR UPDATE
  TO "authenticated"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "anon can read documents" ON "public"."documents"
  FOR SELECT
  TO "anon"
  USING ((published = true));

CREATE POLICY "authenticated_select_documents" ON "public"."documents"
  FOR SELECT
  TO "authenticated"
  USING (true);

CREATE POLICY "admins update inquiries product_id" ON "public"."inquiries"
  FOR UPDATE
  TO "authenticated"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "allow anon insert" ON "public"."inquiries"
  FOR INSERT
  TO "anon"
  WITH CHECK (true);

CREATE POLICY "admin write landing_content" ON "public"."landing_content"
  FOR ALL
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM public.admins a
  WHERE (a.user_id = auth.uid()))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.admins a
  WHERE (a.user_id = auth.uid()))));

CREATE POLICY "admins delete landing_content" ON "public"."landing_content"
  FOR DELETE
  TO "authenticated"
  USING (true);

CREATE POLICY "public read landing_content" ON "public"."landing_content"
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "authenticated_select_landing_content" ON "public"."landing_content"
  FOR SELECT
  TO "authenticated"
  USING (true);

CREATE POLICY "anon can read post_langs" ON "public"."post_langs"
  FOR SELECT
  TO "anon"
  USING (true);

CREATE POLICY "authenticated_select_post_langs" ON "public"."post_langs"
  FOR SELECT
  TO "authenticated"
  USING (true);

CREATE POLICY "anon can read posts" ON "public"."posts"
  FOR SELECT
  TO "anon"
  USING ((published = true));

CREATE POLICY "authenticated_select_posts" ON "public"."posts"
  FOR SELECT
  TO "authenticated"
  USING (true);

CREATE POLICY "admins delete product_langs" ON "public"."product_langs"
  FOR DELETE
  TO "authenticated"
  USING (true);

CREATE POLICY "admins insert product_langs" ON "public"."product_langs"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (true);

CREATE POLICY "admins select all product_langs" ON "public"."product_langs"
  FOR SELECT
  TO "authenticated"
  USING (true);

CREATE POLICY "admins update product_langs" ON "public"."product_langs"
  FOR UPDATE
  TO "authenticated"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "anon can read product_langs" ON "public"."product_langs"
  FOR SELECT
  TO "anon"
  USING (true);

CREATE POLICY "authenticated_select_product_langs" ON "public"."product_langs"
  FOR SELECT
  TO "authenticated"
  USING (true);

CREATE POLICY "admins delete products" ON "public"."products"
  FOR DELETE
  TO "authenticated"
  USING (true);

CREATE POLICY "admins insert products" ON "public"."products"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (true);

CREATE POLICY "admins select all products" ON "public"."products"
  FOR SELECT
  TO "authenticated"
  USING (true);

CREATE POLICY "admins update products" ON "public"."products"
  FOR UPDATE
  TO "authenticated"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "anon can read products" ON "public"."products"
  FOR SELECT
  TO "anon"
  USING ((published = true));

CREATE POLICY "authenticated_select_products" ON "public"."products"
  FOR SELECT
  TO "authenticated"
  USING (true);

CREATE POLICY "Allow public read access 1qcqrtz_0" ON "storage"."objects"
  FOR SELECT
  TO PUBLIC
  USING ((bucket_id = 'public-assets'::text));

COMMENT ON EXTENSION "pg_net" IS 'Async HTTP';

COMMENT ON EXTENSION "vector" IS 'vector data type and ivfflat and hnsw access methods';

REVOKE ALL ON FUNCTION "public"."admin_delete_product"(uuid) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."admin_delete_product"(uuid) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."admin_delete_product"(uuid) TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."generate_order_number"() TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."generate_order_number"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."generate_order_number"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."generate_order_number"() TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."match_document_chunks"(extensions.vector, double precision, integer) TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."match_document_chunks"(extensions.vector, double precision, integer) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."match_document_chunks"(extensions.vector, double precision, integer) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."match_document_chunks"(extensions.vector, double precision, integer) TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."match_knowledge"(extensions.vector, double precision, integer) TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."match_knowledge"(extensions.vector, double precision, integer) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."match_knowledge"(extensions.vector, double precision, integer) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."match_knowledge"(extensions.vector, double precision, integer) TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."match_search_terms"(extensions.vector, double precision, integer) TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."match_search_terms"(extensions.vector, double precision, integer) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."match_search_terms"(extensions.vector, double precision, integer) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."match_search_terms"(extensions.vector, double precision, integer) TO "service_role";

REVOKE ALL ON FUNCTION "public"."notify_inquiry_webhook"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."notify_inquiry_webhook"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."notify_inquiry_webhook"() TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."set_order_number"() TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."set_order_number"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."set_order_number"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."set_order_number"() TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."set_updated_at"() TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."set_updated_at"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."set_updated_at"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."set_updated_at"() TO "service_role";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."cases_id_seq" TO "anon", "authenticated";

REVOKE ALL ON SEQUENCE "public"."cases_id_seq" FROM "postgres";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."cases_id_seq" TO "postgres";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."cases_id_seq" TO "service_role";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."documents_id_seq" TO "anon", "authenticated";

REVOKE ALL ON SEQUENCE "public"."documents_id_seq" FROM "postgres";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."documents_id_seq" TO "postgres";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."documents_id_seq" TO "service_role";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."inquiries_id_seq" TO "anon", "authenticated";

REVOKE ALL ON SEQUENCE "public"."inquiries_id_seq" FROM "postgres";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."inquiries_id_seq" TO "postgres";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."inquiries_id_seq" TO "service_role";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."posts_id_seq" TO "anon", "authenticated";

REVOKE ALL ON SEQUENCE "public"."posts_id_seq" FROM "postgres";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."posts_id_seq" TO "postgres";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."posts_id_seq" TO "service_role";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."products_id_seq" TO "anon", "authenticated";

REVOKE ALL ON SEQUENCE "public"."products_id_seq" FROM "postgres";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."products_id_seq" TO "postgres";

GRANT SELECT, UPDATE, USAGE ON SEQUENCE "public"."products_id_seq" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."admins" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."admins" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."admins" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."admins" TO "service_role";

REVOKE ALL ON TABLE "public"."app_secrets" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."app_secrets" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."app_secrets" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."case_langs" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."case_langs" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."case_langs" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."case_langs" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."cases" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."cases" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."cases" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."cases" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."document_langs" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."document_langs" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."document_langs" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."document_langs" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."documents" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."documents" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."documents" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."documents" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."inquiries" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."inquiries" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."inquiries" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."inquiries" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."landing_content" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."landing_content" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."landing_content" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."landing_content" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."post_langs" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."post_langs" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."post_langs" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."post_langs" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."posts" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."posts" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."posts" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."posts" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."product_langs" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."product_langs" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."product_langs" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."product_langs" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."products" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."products" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."products" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."products" TO "service_role";

ALTER TABLE "public"."landing_content"
  ADD CONSTRAINT "landing_content_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES auth.users(id);
