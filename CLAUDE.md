# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install
npm run dev        # Vite dev server, port 5173 (vite.config.ts)
npm run build      # production build; THIS is the type check
npm run preview
npm run netlify:dev # local Netlify Functions + SPA proxy (targetPort 5173)

# C500 EAVision static landing (independent of the 175-page main build)
npm run landing:c500:dev      # port 5174; /es|de|fr/products/c500-partdro-eavision
npm run landing:c500:build    # Vite + localized SEO + Playwright prerender (4 pages)
npm run landing:c500:test     # local E2E/SEO/inquiry/attribution checks
npm run landing:c500:serve    # serve dist-landing/c500/site with FC routing rules
```

- Copy `.env.example` → `.env` for local work. `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are required by the build and prerender step. Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client.
- The C500 EAVision landing source of truth is `landing/eavision-c500/` (see its README). It builds to `dist-landing/` and is merged into `dist/` by CI after the main build; do not expect `npm run build` alone to update that page.
- `npm run build` = `playwright install chromium` + Vite build + `scripts/inject-seo-links.mjs` + `scripts/prerender.mjs` + `scripts/generate-sitemap.mjs`. It needs network for Playwright and Supabase.
- `vue-tsc` is broken on the current Node version; the build is the type check. There is no lint script/config.
- Broken npm script: `optimize-images` (`scripts/optimize-images.js` does not exist). `generate-favicons` does exist (`scripts/generate-favicons.js`).

### Tests / verification

```bash
# FC route logic (build the bundle first)
node scripts/build-fc.mjs
node scripts/test-fc-handler.mjs

# Live production routing/SEO check (after deploy)
node scripts/verify-fc-deploy.mjs

# Per-function local harnesses
node fc/<function>/test-local.mjs
```

- `scripts/test-fc-handler.mjs` imports `dist-fc/index.js`; rebuild after changing `fc/index.ts`. Set `ALIYUN_OSS_BUCKET=partdro-site` for a production-like bundle. Without a bucket, static cases return 503; the suite accepts that locally.
- `node --test scripts/prerender.test.mjs` currently **fails on Node 24**: the test strips single-line `import` statements, but `scripts/prerender.mjs` uses multi-line imports. Fix the test harness before relying on it.
- Some `fc/*/test-local.mjs` harnesses need Aliyun/Google/Supabase env; read the file header first.

### Deploying

- Production deploys run through `.github/workflows/deploy-aliyun.yml` on push to `main`: build the site, build the four-locale C500 landing and merge it into `dist/` ( guarding `id="c500-quote"`, `GTM-KJ7GJ3V5`, `hreflang="x-default"` per locale), sync `dist/` to OSS, build/upload the FC bundle, update the `partdro-api` function, then deploy the report functions. Prefer this over manual deploys.
- `node scripts/build-fc.mjs` bundles `fc/index.ts` → `dist-fc/index.js` (handler `index.handler`). For production the bundle needs `ALIYUN_OSS_BUCKET=partdro-site` / `ALIYUN_OSS_REGION=cn-hongkong`; otherwise the static server has no bucket.
- For a manual FC update: back up the existing `oss://partdro-site/fc-code.zip`, build with the production bucket, zip `index.js` at the zip root, upload to `oss://partdro-site/fc-code.zip`, then update `partdro-api` code. Use only the Aliyun profile/account that can see that function.

## Production architecture: Aliyun OSS + FC (not Netlify)

`www.droneworld.tech` is served by the Aliyun FC function **`partdro-api`** (cn-hongkong), which reads static objects from OSS bucket `partdro-site`. `fc/index.ts` is the full site server:

- canonical host redirect (apex → www), legacy path 301s (e.g. `/products/c500` → `/products/c500-delivery-drone`, preserving `gclid`/UTM query), cache headers;
- `/api/*` reuses the Netlify handlers, `/sitemap.xml` reuses the dynamic sitemap handler, `/reply` proxies the `inquiry-reply` FC function;
- static routing: path with an extension → exact OSS object; extensionless path → `<path>/index.html`; otherwise a clean 404. **There is no SPA fallback**, so a legacy/new alias needs an explicit redirect in `fc/index.ts`.

`netlify.toml` and `netlify/functions/*` are for local `netlify dev` and are imported by FC; they do **not** describe production routing. A redirect added only to `netlify.toml` will not work on the live site.

`scripts/prerender.mjs` prerenders routes to `dist/<path>/index.html`; `scripts/inject-seo-links.mjs` injects product links into `dist/index.html`; the sitemap exists both as a build artifact and as the dynamic FC handler.

## Frontend architecture

Vue 3 + TypeScript + Ant Design Vue + Pinia + vue-i18n SPA, with Supabase as the content source. Locales are `en/es/de/fr`; English is unprefixed, and `/en/...` redirects to the unprefixed path. The URL prefix drives the active locale.

Router (`src/router/index.ts`):

- A `/:locale?` wrapper contains the site routes; `/products/:slug` uses `ProductDetailView.vue`; `/products/c500-partdro-eavision` uses the dedicated `C500EavisionView.vue` (declared before the dynamic slug). **In production that route is served by the static landing page in `landing/eavision-c500/`; the Vue view is only a local-dev fallback.**
- Admin routes: `/admin/login`, `/admin/products`; `/admin/editor` redirects to `/products/d15r`.
- `ProductDetailView.vue` is a **parameterized landing renderer**, not D15R-only: the i18n namespace is `route.params.slug` (default `d15r`), text comes from `<ns>.*`, images from `/images/<ns>/` (D15R has its own `/d15r/images/` sets). The C500 EAVision page is separate (`src/data/c500eavision.ts`, `src/components/c500eavision/*`, `c500.css`).
- Direct requests for `/products/c500` are 301'd by FC; the Vue router also has a client-side redirect for in-app navigation.

Content model: `products`, `posts`, `cases`, `documents` each have a `<table>_langs` child table with one row per language. `src/composables/useSupabase.ts` fetches `*, *_langs(...)`, merges the current locale row (fallback `en`), and refetches on locale change. `useProduct` is exported but unused; listing/home views use `useProducts`, `usePosts`, etc. Product categories are the literal strings `'agricultural' | 'cargo' | 'cleaning'`.

## CMS and admin

- `landing_content` stores per-`(namespace, lang)` JSON **diffs** over the static i18n messages. Namespaces include `d15r`, `c15`, `c500eavision`, `d50r`, `about`, `contact`, `footer`, `topBar`. `useLandingContent` deep-merges diffs into vue-i18n and exposes `__images` / `__videos` overrides.
- The admin `InlineEditor` hooks elements with `data-edit-key` (text) or `data-edit-img` (image); saves go through `/api/landing-content` (service_role upsert). `saveEditableD15r` is a compatibility wrapper.
- Admin auth: Supabase Auth + the `admins` table (the real gate); login maps username → `<username>@admin.partdro.com`; client-side 5-fail/60s lock. A Supabase user without an `admins` row is signed out.
- `/api/admin-products` handles product CRUD; delete goes through the `admin_delete_product` RPC (`scripts/admin-functions.sql` must be run once in Supabase).

## Inquiry / lead pipeline

- `InquiryForm.vue` inserts directly into Supabase `inquiries`. `useAttribution.ts` keeps first landing/referrer plus latest UTM/gclid in `localStorage` for 90 days and writes attribution fields on submit (product slug, page path, landing page, referrer, UTM, gclid).
- Supabase DB webhook → FC `inquiry-webhook` → DirectMail notification + Feishu + async `inquiry-analysis` (writes `lead_profile`). The webhook requires `x-webhook-secret` matching the FC env.
- `inquiry-reply` renders a signed, human-approval page at `/reply`; it never sends without approval and Bcc/Reply-To archives replies.
- `inquiries` now has a sales pipeline: `lead_status` (`new/contacted/qualified/quoted/negotiation/won/lost/spam`), `owner`, `company`, `country`, `first_responded_at`, `qualified_at`, `quote_sent_at`, `quote_value/currency`, `won_at/lost_at/lost_reason`, `next_follow_up_at`, `notes` (`scripts/inquiries-sales-pipeline.sql`). Keep these updated; CAC/qualified-lead metrics depend on them.

## Acquisition and analytics

- Before ads/SEO/CRO/lead-gen work, read `.claude/skills/be-more-ambitious/SKILL.md` and `references/partdro-acquisition.md`, plus the live state in `docs/acquisition/` (`baseline-2026-10-25.md`, `scorecard.md`).
- North star: **sales-confirmed qualified inquiries**, not raw clicks/inquiries. Never grade your own work: reconcile BigQuery vs Ads/GSC/GA4, treat Supabase inquiries as ground truth, and use pre-registered tests or real sales confirmation.
- Google Ads: service account is read-only; write operations use a local, gitignored OAuth refresh-token env (never commit it). `ad.final_urls` is immutable in v25 — to change a landing page, create new RSAs and pause the old ads. Always verify current account state before mutating.
- `fc/bq-etl` pulls GSC/Ads/GA4 into BigQuery dataset `dw_analytics` (default; `asia-east2`; Sandbox 60-day expiry). Tables: `gsc_page_daily`, `gsc_query_page`, `ads_campaign_daily`, `ads_keyword_daily`, `ads_search_term_daily`, `ga4_traffic_daily`, `ga4_leads_daily`, `inquiries_attribution`, plus `v_daily_overview`. Modes: `daily`, `backfill`, `bootstrap`, `inquiries`, `sql`, `adsaudit`, `adsconv`, `adsnetwork`, `terms`, `leads`, `ga4keys`, `verify`.
- Use `gsc_page_daily` for organic totals (query rows are suppressed by GSC privacy limits). Do **not** use raw GA4 `keyEvents` as leads — click/scroll are registered as key events; use `ga4_leads_daily` or Supabase.
- Report/utility functions: `fc/daily-report` (GSC), `fc/ads-daily-report` (Ads + GA4), `fc/deep-analysis`, `fc/gcfg` (GA4/Ads config read/write), `fc/inquiry-analysis`, `fc/inquiry-reply`.

## Server-side endpoints

| Endpoint | Handler | Auth |
|---|---|---|
| `POST /api/landing-content` | `netlify/functions/landing-content.ts` | Admin Bearer token + `admins` table; service_role |
| `POST /api/admin-products` | `netlify/functions/admin-products.ts` | Same admin gate; service_role |
| `POST /api/inquiry-webhook` | `netlify/functions/inquiry-webhook.ts` | `x-webhook-secret` |
| `GET /sitemap.xml` | `netlify/functions/sitemap.ts` | public |
| `GET /reply` | proxy to `inquiry-reply` FC function | signed query token |

`netlify/shared/verifyAdmin.ts`: Bearer access token → `auth.getUser` → `admins` row via service_role. `ws` is a runtime dependency because Node 20 functions have no global WebSocket for Supabase realtime.

## Known issues / stale docs

- `README.md` describes the old `partdro_vue` (port 3001, no Supabase/i18n).
- `AGENTS.md` documents a previous "landing-page-from-source" workflow and references a `CLAUDE.md`/`scripts/` from the old `~/Desktop/partdro_final` repo. Trust the code and this file; use AGENTS.md only for its image-audit/ordering lessons.
- `node scripts/build-fc.mjs` + `node scripts/test-fc-handler.mjs` is the reliable local routing test. `scripts/prerender.test.mjs` is broken on Node 24 (see Tests).
- Image editing in the admin editor is local-only: IOPaint (`VITE_IOPAINT_URL`, default `:8080`) and the Flux/wanx Flask service (`VITE_FLUX_EDIT_URL`, default `:5000`); browsers call them directly, not through production.
