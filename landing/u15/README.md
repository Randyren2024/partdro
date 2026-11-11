# U15 landing: /products/u15-multi-mission-drone

Independent Vue 3 + Vite landing page for the Partdro U15 multi-mission drone. Production serves
four prerendered locales:

- https://www.droneworld.tech/products/u15-multi-mission-drone
- https://www.droneworld.tech/es/products/u15-multi-mission-drone
- https://www.droneworld.tech/de/products/u15-multi-mission-drone
- https://www.droneworld.tech/fr/products/u15-multi-mission-drone

It is not part of the main SPA build. The landing:u15:build script produces four
prerendered documents under dist-landing/u15/site/; CI merges that tree into dist/
after the main build. The main SPA has no U15 route — this directory is the only
implementation, in both development and production.

## Business rules

- Every quote request goes to Partdro's Supabase inquiries table with attribution
  (product_slug=u15-multi-mission-drone, gclid/UTM, landing page).
- No prices, offers, or fabricated certifications may be added to the page or JSON-LD.
- Only claims present in the source brochures (product_files/Yuefei_U15) may be stated.

## Requirements

- Root dependencies already include Vite, @vitejs/plugin-vue, sharp, and Playwright.
- Root .env requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
- Install Playwright Chromium once per machine; the main build already does this.

## Commands (run from the repository root)

```bash
npm run dev                 # main 5173 + this landing on 5175
npm run landing:u15:dev     # standalone landing server on 5175
npm run landing:u15:build   # build + localized SEO head + Playwright prerender
npm run landing:u15:serve   # static server on http://127.0.0.1:4175
```

The main dev server starts this app automatically and proxies the U15 route. The
standalone server only serves the absolute base path.

The form in dev talks to the real Supabase project when .env is present. Use a clearly
marked test lead and mark/delete it afterwards.

## Build pipeline

1. Vite builds the landing with base path /products/u15-multi-mission-drone/.
2. scripts/postbuild.mjs reads src/data/content/{en,es,de,fr}.json and the image manifest,
   then writes localized title, description, canonical, OG/Twitter, robots, theme color,
   hero preload, and Product/Breadcrumb/FAQPage/Organization JSON-LD.
3. scripts/prerender.mjs renders all four locales to static HTML and validates html lang,
   canonical, quote form, hero headings, specification rows and JSON-LD.

## Content and media

- Localized copy: src/data/content/{en,es,de,fr}.json.
- Media: src/data/media.js and src/data/image-manifest.json; files in public/images/.
- Regenerating media: npm run landing:u15:optimize. Review image changes before committing.

## Deploy

Production deploy runs through .github/workflows/deploy-aliyun.yml on push to main.
The workflow builds U15 in all four locales, merges dist-landing/u15/site/ into dist/,
checks each page for the quote form, GTM container, hero WebP and x-default hreflang,
then syncs dist/ to OSS and deploys the FC bundle.

fc/index.ts serves each localized URL from its corresponding static index.html.
Hashed assets are immutable, images are cached for one day, and HTML for 60 seconds.

## Verification after deploy

```bash
for path in \
  /products/u15-multi-mission-drone \
  /es/products/u15-multi-mission-drone \
  /de/products/u15-multi-mission-drone \
  /fr/products/u15-multi-mission-drone; do
  curl -sI "https://www.droneworld.tech$path"
done
```

Do not commit dist-landing/ or .env files.
