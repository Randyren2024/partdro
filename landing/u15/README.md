# U15 landing (`/products/u15-multi-mission-drone`)

Independent Vue 3 + Vite landing page for the Partdro U15 multi-mission drone, served as
static HTML at:

`https://www.droneworld.tech/products/u15-multi-mission-drone` (English only)

It is **not** part of the main SPA build. `npm run landing:u15:build` produces one
prerendered document under `dist-landing/u15/site/`; CI merges that tree into `dist/`
after the main build. The main SPA has no U15 route — this directory is the only
implementation, in both development and production.

## Business rules

- Every quote request goes to **Partdro's Supabase `inquiries` table** with attribution
  (`product_slug=u15-multi-mission-drone`, gclid/UTM, landing page).
- No prices, offers, or fabricated certifications may be added to the page or JSON-LD.
- Only claims present in the source brochures (`product_files/Yuefei_U15`) may be stated.

## Requirements

- Root dependencies already include Vite, `@vitejs/plugin-vue`, `sharp`, and Playwright.
  There is no separate `npm install` for this folder.
- `.env` at the repository root with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- `npx playwright install chromium` once per machine (the main build already does this).

## Commands (run from the repository root)

```bash
npm run dev                 # main 5173 + this landing on 5175 (normal local workflow)
npm run landing:u15:dev     # standalone landing server on 5175 (debug only)
npm run landing:u15:build   # build + SEO head + Playwright prerender
npm run landing:u15:serve   # static server for the built output, http://127.0.0.1:4175
```

Use the main dev server for normal work; it starts this app automatically and proxies
`/products/u15-multi-mission-drone` (5173 → 5175). The standalone server only serves the
absolute base path.

The form in dev talks to the real Supabase project when `.env` is present. Use a clearly
marked test lead and mark/delete it afterwards.

## Build pipeline

1. `vite build --config landing/u15/vite.config.mjs`
   - `base=/products/u15-multi-mission-drone/`
   - output `dist-landing/u15/site/products/u15-multi-mission-drone/`
2. `scripts/postbuild.mjs` — reads `src/data/content/en.json` + `src/data/image-manifest.json`
   and writes title/description/canonical/OG/Twitter/robots/theme-color, the hero preload,
   and Product/Breadcrumb/FAQPage/Organization JSON-LD.
3. `scripts/prerender.mjs` — serves the tree with the production FC rules, blocks GTM,
   images and fonts, marks reveal elements visible, writes the rendered DOM back, then
   validates `html lang`, canonical, `id="u15-quote"`, hero heading lines, spec rows and
   FAQ/JSON-LD.

## Content and media

- Copy: `src/data/content/en.json` (single locale, no machine translations).
- Media: `src/data/media.js` + `src/data/image-manifest.json`; files in `public/images/`.
- Regenerating media: `npm run landing:u15:optimize` (sharp crops of the source brochure
  extractions), review `git diff` under `public/images/` and `image-manifest.json`.

## Deploy

Production deploy is the repository workflow `.github/workflows/deploy-aliyun.yml` on push
to `main`: main build → `npm run landing:u15:build` → `cp -R dist-landing/u15/site/. dist/`
→ guard `dist/products/u15-multi-mission-drone/index.html` for `id="u15-quote"`,
`GTM-KJ7GJ3V5` and the hero WebP → sync `dist/` to OSS and deploy the FC bundle.

`fc/index.ts` serves `/products/u15-multi-mission-drone` from
`products/u15-multi-mission-drone/index.html`; hashed `assets/` are immutable, `images/`
are cached for one day, and HTML for 60 seconds.

## Verification after deploy

```bash
curl -sI https://www.droneworld.tech/products/u15-multi-mission-drone
curl -s  https://www.droneworld.tech/products/u15-multi-mission-drone | grep -E 'canonical|GTM-|u15-quote|hero.webp'
```

Do not commit `dist-landing/` or `.env` files.
