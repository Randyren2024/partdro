---
name: landing-page-builder
description: Build a Partdro product landing page from user-supplied materials (images, text, PDF) or a source URL. Invoke when asked to create/generate a landing page or product page from a link or assets.
---

# Landing Page Builder (Partdro / droneworld.tech)

Turn a source (URL / PDF / images / plain text) into a live product landing page at
`/products/<slug>`. Work the phases in order; each phase gates the next.

**Do NOT use this skill for:** SEO-only passes (use `seo-agent`) or single-image edits (use `nano-banana`).

## Architecture you must know

| File / table | Role |
|---|---|
| `src/views/ProductDetailView.vue` | Renders `/products/<slug>`; `ns = route.params.slug`; mounts section components from `SECTION_COMPONENTS` |
| `src/components/product/sectionIds.ts` | The 15 canonical section ids + `SectionLayoutItem` |
| `src/components/product/sectionRegistry.ts` | id → Vue component mapping |
| `src/components/product/sections/*.vue` | One component per section; text uses `data-edit-key="<ns>.<path>"` |
| `src/i18n/landingTemplate.ts` | Default i18n tree for a NEW product (registered to `en` only; es/de/fr fall back) |
| `src/i18n/{en,es,de,fr}.json` | Static namespaces; only `d15r` lives here (legacy) |
| Supabase `products` + `product_langs` | Listing card data (name / short_desc / description), one `product_langs` row per lang |
| Supabase `landing_content` | Landing-page content as a **diff of changed leaves** vs `landingTemplate`; keyed `(namespace, lang)`; special keys `__images`, `__videos`, `__layout` |
| `netlify/functions/admin-products.ts` | `action: 'create'` → inserts `products` + `product_langs` rows |
| `public/images/<slug>/` | Landing-page images (local, lowercase names) |
| `src/composables/useLandingContent.ts` | Loads `landing_content`, deep-merges into vue-i18n, exposes `imgOverridesByLang` / `layoutByNs` |

### The 15 section ids (order = render order)

`hero, strip, why, designed, output, spray, intelligence, safety, multiangle, compare, applications, scenarios, video, specs, cta`

Section labels are in `SECTION_LABELS`. New products default to an **empty** layout
(`defaultSectionLayout()`); `d15r` falls back to `fullSectionLayout()`.

### Content key shape (from `defaultLandingTemplate`)

- Scalars: `hero.title1`, `cta.text`
- Arrays use **numeric-string keys**: `strip.0.value`, `why.cards.1.title`, `specs.items.3.label`
- In templates accessed as `t('<ns>.specs.items.${i}.label')`

## Phase 1 — Acquire & Extract

| Input | Tool | Notes |
|---|---|---|
| URL | `WebFetch` with a detailed extraction prompt | Ask for name, tagline, description, all image URLs (hero/feature/gallery/spec/faq/application/kit), specs, FAQs, applications, price/SKU/CTA |
| Image | `Read` (renders the image) | Note visible third-party branding + non-Latin overlay text for Phase 8 |
| Text / Markdown | `Read` | Split into fields |
| PDF | `Read` (`pages` for >10 pages) | Same fields as WebFetch |

## Phase 2 — Map & Decide

- **slug**: lowercase letters/digits/hyphens only (`/^[a-z0-9-]+$/`). e.g. `y160-delivery-drone`.
- **category**: one of `agricultural` | `cargo` | `cleaning` (the `products` table literal).
- **name**: avoid double-stamping a word (e.g. `LM-MINI` + "Mini Camera Drone" → drop the second "Mini").
- **brand rewrite**: replace any third-party brand (e.g. SKYROVER/WALKERA) with Partdro throughout data, and plan visual redaction in Phase 8.
- **flags**: new launches default `inStock: true`, `isNew: true`, `isBestSeller: false`.

## Phase 3 — Create the product row

Registers the dynamic namespace so `/products/<slug>` renders.

- Preferred: admin UI at `/admin/products` → `+ New product` (fills slug, category, per-lang name/short_desc).
- Or call the function directly (payload mirrors `submitCreate`):
  `POST /api/admin-products` `{ action:'create', slug, category, sort_order, published, langs:[{lang,name,short_desc,description}] }`
- Requires Netlify Dev (`npm run netlify:dev`, port 8888) for `/api/*`; plain Vite (5173) has no functions.

## Phase 4 — Assets (DOWNLOAD ONLY)

```powershell
New-Item -ItemType Directory -Force -Path "public\images\<slug>"
curl.exe -L -o "public\images\<slug>\hero.jpg" "<source-url>"
```

Semantic names: `hero`, `design`, `cargo-box`, `battery`, `control`, `applications`, ...
**Download only here.** Redaction/regeneration happens in Phase 8.
After download, `Read` each image and build a **pending image-mod list** (one line per image).

## Phase 5 — Content

Two equivalent paths:

1. **Admin editor (recommended)**: open `/products/<slug>` while logged in, click-to-edit text
   (`data-edit-key`) and images (`data-edit-img`), pick the per-lang tab, then Save.
   Saves a diff vs `landingTemplate` into `landing_content` and applies locally.
2. **Script upsert** into `landing_content` (columns `namespace, lang, content`), `onConflict: 'namespace,lang'`.
   `content` is the diff tree plus special keys:
   - `__layout`: **MUST be `[{ id:'hero', visible:true }, ...]`** — a bare string array renders a blank page.
   - `__images`: `{ 'hero.mainImg': 'hero.jpg', ... }` (filename relative to `/images/<slug>/`).
   - `__videos`: `{ 'video.url': '<mp4|youtube|bilibili url>' }`.

Order the layout to match the source narrative; only include sections the source had content for.

## Phase 6 — Build Verify

```bash
npm run build
```

`vue-tsc --noEmit` is broken on this Node version — **the build IS the type check**. Fix failures before screenshotting.

## Phase 7 — Render & Screenshot

```bash
npm run dev            # port from vite.config.ts (5173); use netlify:dev 8888 if you need /api
node scripts/screenshot-full.mjs
```

Then `Read` every section screenshot and audit:

| Section | Check |
|---|---|
| Hero | title redundancy (slug vs name), badge chips match product type, carousel slide 1 |
| Gallery / hero | third-party logos still visible |
| Why / Designed | each card image matches its topic |
| Applications | real photos, not the generic icon |
| Specs | every row populated, correct units (km vs mi), no `NaN`/empty |
| FAQs | 5–10 mixed topics |
| CTA / Footer | brand name, working mailto/links |

## Phase 8 — Fix & Localize

**8a — code/data fixes:** edit `landing_content` / `landingTemplate.ts` / section component → `npm run build` → re-screenshot → re-audit. Incremental ("循序渐进"), not big-bang.

**8b — image mods (LAST):**
- Redact third-party brand on the product body/labels with PIL (paint over, optionally re-draw "PARTDRO" in white); verify with a white-pixel row scan.
- Localize non-Latin infographic overlays via `nano-banana` (`python C:/Users/81102/.claude/skills/nano-banana/scripts/generate.py "<prompt>" -i <in> -o <out>`); if it fails, fall back to `bailian-image-video`.
- **`Read` every regenerated image** to verify spelling, preserved specs, no hallucinated/missing parts.

## Hard constraints (from project memory)

- `SUPABASE_SERVICE_ROLE_KEY` (sb_secret_*) must NEVER appear in frontend code or `VITE_*` vars.
- Content tables (`products`, `product_langs`, `landing_content`, ...) need SELECT policies for **both** `anon` AND `authenticated` — anon-only policies silently return `[]` for logged-in users.
- Public static assets must use **lowercase** folder/file names matching code paths (Vite serving is case-sensitive).
- Escape vue-i18n special chars in messages: use `info{'@'}partdro.com` for `@`.
- Admin edits live only in Supabase; static defaults live in `landingTemplate.ts` / `src/i18n/*.json`.
