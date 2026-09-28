# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install        # install dependencies
npm run dev        # Vite dev server on port 5173 (vite.config.ts)
npm run build      # production build — this IS the type check (vue-tsc is broken on this Node version)
npm run preview    # preview the production build
npm run netlify:dev # Netlify dev (SPA redirects + headers from netlify.toml; proxies vite on targetPort 5173, serves /.netlify/functions + /api/*)
```

- No test framework is set up. Playwright is installed as a devDependency (`@playwright/test`).
- **Broken npm scripts** (their `scripts/` files don't exist — do not use): `optimize-images`, `generate-favicons`.
- **Stale docs**: `README.md` describes an old `partdro_vue` structure (port 3001, no Supabase/i18n). `AGENTS.md` documents the prior "landing-page-from-source" workflow (d15r PDF → screenshots via `scripts/screenshot-full.mjs`, image redaction with PIL) and references a `CLAUDE.md`/`scripts/` from the old `~/Desktop/partdro_final` repo — none of that exists here. Trust the code, not these docs.

## Netlify Functions (admin / secrets)

Privileged writes and third-party keys do **not** run in the browser:

| Endpoint | File | Purpose |
|---|---|---|
| `POST /api/landing-content` | `netlify/functions/landing-content.ts` | service_role upsert of `landing_content` |
| `POST /api/admin-products` | `netlify/functions/admin-products.ts` | product list/create/update/delete (delete → RPC `admin_delete_product`) |

- Shared auth: `netlify/shared/verifyAdmin.ts` — Bearer access_token → `auth.getUser` → `admins` table via service_role. Requires env `SUPABASE_SERVICE_ROLE_KEY` at runtime; `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` for client construction.
- Image editing in the admin editor is **local-network, not Netlify**: IOPaint (`VITE_IOPAINT_URL`, WSL2 :8080; venv at WSL `~/partdro/iopaint/.venv`, service writes into the Windows repo via `/mnt/c/.../partdro/public/d15r/images/inpainted`) for lama/cv2/AnyText inpainting, and the in-repo Flask service (`iopaint/app.py`, `VITE_FLUX_EDIT_URL` default `http://localhost:5000`) for FLUX Fill / wanx mask-based edits — browser calls both directly (CORS-opened).
- Frontend helper: `src/lib/netlifyApi.ts` (`callFunction`). Public content reads and Supabase Auth still use the anon client directly.
- `scripts/admin-functions.sql` must be run once in Supabase Dashboard (defines `admin_delete_product`).
- `/api/*` redirect is declared **before** the SPA `/*` catch-all in `netlify.toml`.
- `ws` is a runtime dependency: Node 20 has no global WebSocket; functions pass it into supabase-js `realtime.transport`.

## Architecture

**Vue 3 + TypeScript + Ant Design Vue + Pinia + vue-i18n SPA**, data from Supabase, deployed to Netlify. The site content is fully multilingual (en/es/de/fr, fallback `en`; locale persisted in `localStorage.lang`).

### Content model (Supabase, client-side join)

Tables `products`, `posts`, `cases`, `documents` each have a `<table>_langs` child table (one row per language). `src/composables/useSupabase.ts` exposes per-entity composables (`useProducts`, `useProduct`, `usePosts`/`usePost`, `useCases`, `useDocuments`) that:

- fetch the joined `*` + `*_langs(lang, ...)` data,
- merge the row matching the current i18n locale (falling back to the `en` row),
- re-fetch on locale change (wrapped in `bindLocale`, `flush: 'post'`),
- return `{ data, loading, error, reload }` refs.

Product categories are the literal strings `'window' | 'solar'` (`src/types/index.ts`).

### The D15R landing page (`/products/d15r`)

`src/views/ProductDetailView.vue` is **not** a generic detail view — it is a hardcoded single-product landing page for the D15R cleaning drone. It renders i18n keys under the `d15r.*` namespace (`src/i18n/*.json`) and images from `public/d15r/images/` using filenames derived from the source PDF (`page001_img001.png`, `page003_img002.png`, ... — also exposed as `nozzleImages` etc.). The generic `useProduct` composable exists but is not used by any view; all home/listing views use the generic composables instead.

### CMS overlay for the landing page (`landing_content` table)

Static content lives in `src/i18n/*.json`; admin edits live in Supabase `landing_content` (columns: `namespace` (currently `d15r`), `lang`, `content`) as a **JSON diff of only the changed leaves** versus the static JSON (see `diffAgainst` in `src/composables/useLandingContent.ts`).

- Public site: `useLandingContent()` watches the locale and deep-merges the stored diff into vue-i18n messages via `setLocaleMessage`. Image overrides are stored separately under the special `__images` key and exposed through the shared reactive `imgOverridesByLang`.
- Admin: `saveEditableD15r(lang, editedText, images)` diffs, upserts with `onConflict: 'namespace,lang'`, then applies locally.
- In `ProductDetailView.vue`, `imgEdit(filename, key)` resolves the `__images` override (fallback: `public/d15r/images/<filename>`).

### Admin visual editor

- Auth: Supabase Auth (`src/stores/auth.ts`). Login at `/admin/login`; username is mapped to `<username>@admin.partdro.com`; the `admins` table maps `user_id → username` (the real gate — a Supabase account without an `admins` row is signed out). Client-side rate limit: 5 fails → 60s lock via `sessionStorage`.
- Editing: when logged in, `ProductDetailView` mounts the `InlineEditor` overlay (`src/components/admin/InlineEditor.vue`). It hooks into elements carrying `data-edit-key="d15r.<...>"` (click-to-edit text) or `data-edit-img="d15r.<...>"` (image URL/filename) attributes, plus a per-lang selector and save bar. `src/components/admin/JsonField.vue` is a generic JSON editor (currently unused).
- `/admin/editor` redirects to `/products/d15r`.

### Other

- `src/components/home/*` (HeroBanner, CompanyStats, ProductSolutions, LatestNews) form `HomeView`; all text is i18n-driven; the generic composables power the home/products/cases/news/documents pages.
- `vite.config.ts` splits vendor/antd chunks; `netlify.toml` serves `/images/*` and `/assets/*` with immutable caching and SPA-redirects `/* → /index.html`.
- Env vars (`.env`, see `.env.example`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` are client-visible; `SUPABASE_SERVICE_ROLE_KEY` is server-side only.
