# AGENTS.md

## Current architecture
- Nuxt 4 app at the repository root: `app/` (pages/components/composables/i18n), `server/` (Nitro APIs), `public/`, `nuxt.config.ts`.
- Production is Cloudflare Pages project `partdro-nuxt`, production branch `main`, custom domain `www.droneworld.tech` (CNAME to `partdro-nuxt.pages.dev`).
- `legacy-vite/`, `landing/*`, `fc/`, and the Aliyun OSS compatibility chain are transitional/rollback only. Do not add new site features there.
- `roadready-auto` is a different Cloudflare Pages project (VAKTRA). Never deploy to or modify it.
- `README.md` and `CLAUDE.md` still describe older Aliyun/Netlify setups. When they conflict with `package.json`, `nuxt.config.ts`, or `wrangler.toml`, trust the executable config.

## Commands
- Install: `npm install`. `npm ci` currently fails because the lockfile is out of sync; `npm install --no-package-lock` is the fallback.
- Dev: `npm run dev` (port 3000). Set `NUXT_PUBLIC_SUPABASE_URL` and `NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for local Supabase.
- Build: `npm run build` is the practical type-check. `postbuild` runs `scripts/fix-pages-dist.mjs`.
- Cloudflare Pages build: `$env:NITRO_PRESET='cloudflare_pages'; npm run build` → `dist`.
- Deploy: `npm run deploy` (`wrangler pages deploy dist`). For `partdro-nuxt`, set `CLOUDFLARE_ACCOUNT_ID=f7baff0f09564f34ec470d7f7d0ce474` and remove `CLOUDFLARE_API_TOKEN` so Wrangler uses the partdro2023 OAuth login.
- `npm run typecheck` exists but is optional. There is no repo-wide test runner; `npm run test:premium-landings` is the product-page check. `node --test scripts/prerender.test.mjs` fails on Node 24.
- `npm run sitemap` and `npm run build:legacy` currently fail: `scripts/generate-sitemap.mjs` is absent. Do not rely on them.

## Supabase
- Local WSL project: `~/supabase`, project `user1102`; REST `http://127.0.0.1:54321`, DB `postgresql://postgres:postgres@127.0.0.1:54322/postgres`; local publishable key `sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH`.
- Query local DB with `docker exec -i supabase_db_user1102 psql -U postgres -d postgres` (use a PowerShell here-string; nested quoting breaks).
- Hosted project is `npxpxlosubxgkgsbyfnv`; `uphfcvquglafkszqqxiq` is dead. `nuxt.config.ts` defaults to the new URL but the key defaults to empty; set `NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or Cloudflare `NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`).
- Schema: `public.products` is the website catalogue (`bigint` id, `published`, `product_langs`); `public.supplier_products` is the internal supplier catalogue (`uuid` id, `status`); `suppliers` and `supplier_profiles` are internal. Anon has SELECT only on `products`; internal tables are locked. Do not rename back to `legacy_products`.
- Restore migration: `supabase/migrations/20261125103500_restore_product_schema_boundary.sql`.
- Product detail pages render from `landing_content` + i18n, not from DB product rows. Dynamic namespaces without `__layout` render blank; the CW-15 page is self-contained.
- `server/api/supabase-config.ts` exposes the public URL/key to the client. The server uses `NUXT_SUPABASE_SERVICE_ROLE_KEY`; never expose the service-role/secret key to the client.

## Cloudflare build gotchas
- The `cloudflare_pages` `dist` output can omit `_nuxt` chunks and `_nuxt/builds`; this causes a blank root with a missing `_nuxt/*.js` 404. `postbuild` copies missing files from `.output/public/_nuxt`. If root is blank, verify `dist/_nuxt/` and `dist/_nuxt/builds/meta/` or deploy `.output/public`.
- `nuxt.config.ts` fetches only product slugs at build time (posts use the 2-item preset) to keep the build under memory limits. Restoring the 97-post fetch creates ~900 routes and can OOM; use `NODE_OPTIONS=--max-old-space-size=4096` if needed.
- Cloudflare project secrets are runtime values; a local build needs the key in the build environment for prerender. The `partdro-nuxt` project has `NUXT_SUPABASE_URL`, `NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and an old `NUXT_SUPABASE_SERVICE_ROLE_KEY` that should be updated.
- `wrangler pages secret put` targets production. The Wrangler OAuth account can change; `CLOUDFLARE_ACCOUNT_ID` overrides the account.

## Workflow
- Branch from `main`, push the feature branch, and open a PR. Do not commit `.env`, keys, `supabase/.temp/`, or build output.
- For new product landing pages, use the `product-page-from-source` skill. Image localization/redaction is the last step, after layout and copy are locked.
- Run `npm run build` and a Playwright pass (1440×900 and 390×844) before declaring a page done; audit section by section and fix, then re-screenshot.