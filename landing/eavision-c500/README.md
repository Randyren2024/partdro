# C500 EAVision landing (`/products/c500-partdro-eavision`)

Independent Vue 3 + Vite landing page for the EAVision C500, served as static HTML at:

| Locale | URL |
|---|---|
| English | `https://www.droneworld.tech/products/c500-partdro-eavision` |
| Spanish | `https://www.droneworld.tech/es/products/c500-partdro-eavision` |
| German | `https://www.droneworld.tech/de/products/c500-partdro-eavision` |
| French | `https://www.droneworld.tech/fr/products/c500-partdro-eavision` |

It is **not** part of the main SPA build. `npm run landing:c500:build` produces four
prerendered documents under `dist-landing/c500/site/`; CI merges that tree into `dist/`
after the main build. The main SPA has no C500 EAVision route — this directory is the only
implementation, in both development and production.

## Business rules

- Every quote request goes to **Partdro's Supabase `inquiries` table** with attribution
  (`product_slug=c500-partdro-eavision`, gclid/UTM, landing page). It must never fall back
  to an EAVision sales mailbox.
- EAVision is the product brand/manufacturer. Partdro is the page owner and seller.
- `contact_form_submission` fires **only** after a successful insert. WhatsApp clicks fire
  `whatsapp_chat_initiated`.
- No prices, offers, or fabricated certifications may be added to the page or JSON-LD.

## Requirements

- Root dependencies already include Vite, `@vitejs/plugin-vue`, `sharp`, and Playwright.
  There is no separate `npm install` for this folder.
- `.env` at the repository root with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- `npx playwright install chromium` once per machine (the main build already does this).

## Commands (run from the repository root)

```bash
npm run dev                   # main 5173 + this landing on 5174 (normal local workflow)
npm run landing:c500:dev      # standalone landing server on 5174 (debug only)
npm run landing:c500:build    # build + localized SEO + Playwright prerender (4 pages)
npm run landing:c500:test     # 80 local E2E/SEO/form/attribution checks
npm run landing:c500:serve    # static server for the built output, http://127.0.0.1:4174
npm run landing:c500:optimize # re-create WebP/OG assets from the original source images
```

Use the main dev server for normal work; it starts this app automatically and proxies all
four URLs, e.g. `http://localhost:5173/es/products/c500-partdro-eavision`. The standalone
server only serves the absolute base path: `http://localhost:5174/products/c500-partdro-eavision/`
(localized document paths are handled by the 5173 proxy).

The form in dev talks to the real Supabase project when `.env` is present. Use a clearly
marked test lead and mark/delete it afterwards. The test command mocks Supabase and never
creates inquiries.

## Build pipeline

1. `vite build --config landing/eavision-c500/vite.config.mjs`
   - `base=/products/c500-partdro-eavision/`
   - output `dist-landing/c500/site/products/c500-partdro-eavision/`
2. `scripts/postbuild.mjs`
   - reads `src/data/content/{en,es,de,fr}.json` + `src/data/image-manifest.json`
   - writes localized `<title>`, description, canonical, hreflang/x-default, OG/Twitter,
     robots, theme-color, hero preload, and Product/Breadcrumb/Organization JSON-LD
   - writes `en` in place and `es/de/fr` under `dist-landing/c500/site/<locale>/…`
3. `scripts/prerender.mjs`
   - serves the tree with the production FC rules (extensionless → `<path>/index.html`)
   - blocks GTM/YouTube and all images/video/fonts, renders each locale, marks reveal
     elements visible, removes GTM's runtime-injected loader, writes the DOM back
   - validates `html lang`, localized title/description, canonical, five hreflang links,
     one `#c500-quote`, four package CTAs, Partdro email, WhatsApp, JSON-LD, no legacy
     EAVision email or CNY prices

Outputs (ignored by Git):

```text
dist-landing/c500/site/
  products/c500-partdro-eavision/index.html
  products/c500-partdro-eavision/{assets,images,packages}/…
  es/products/c500-partdro-eavision/index.html
  de/products/c500-partdro-eavision/index.html
  fr/products/c500-partdro-eavision/index.html
```

All four pages share the English path's `assets/`, `images/`, and `packages/` directories.

## Content and media

- Copy: `src/data/content/<locale>.json`. English is the source of truth; es/de/fr reuse
  the approved main-site `c500eavision` translations plus translated UI strings.
- Media: `src/data/media.js` + `src/data/image-manifest.json`. Media is language-neutral.
- Image files: `public/images/` and `public/packages/` (hashed WebP; OG is JPEG).
- Video: `C500Media` lazy-loads on intersection, respects reduced motion and data-saver,
  and uses poster images. Videos stay on the EAVision OSS host with `preconnect`.
- Regenerating media: run `npm run landing:c500:optimize`, review `git diff` under
  `public/` and `image-manifest.json`, then rebuild.

## Deploy

Production deploy is the repository workflow `.github/workflows/deploy-aliyun.yml` on push
to `main`:

1. main `npm run build` (Vue site + 175-page prerender + sitemap)
2. `npm run landing:c500:build`
3. `cp -R dist-landing/c500/site/. dist/`
4. guard each of the four `dist/<locale>/products/c500-partdro-eavision/index.html` for
   `id="c500-quote"`, `GTM-KJ7GJ3V5`, and `hreflang="x-default"`
5. sync `dist/` to OSS and deploy the FC bundle

Do not deploy only `dist-landing/` unless you explicitly intend to skip the rest of the
site. FC serves `/products/c500-partdro-eavision` from
`products/c500-partdro-eavision/index.html` and the three locale directories from
`<locale>/products/c500-partdro-eavision/index.html`.

Before the first overwrite, back up the four live objects:

```bash
DATE=$(date +%F)
mkdir -p ".tmp/backups/c500-landing-$DATE"
for p in products/c500-partdro-eavision es/products/c500-partdro-eavision \
         de/products/c500-partdro-eavision fr/products/c500-partdro-eavision; do
  mkdir -p ".tmp/backups/c500-landing-$DATE/$p"
  aliyun oss cp "oss://<bucket>/$p/index.html" \
    ".tmp/backups/c500-landing-$DATE/$p/index.html" \
    -e oss-cn-hongkong.aliyuncs.com -f
done
```

Never print or commit Aliyun credentials.

## Rollback

- Fastest: restore the four backed-up `index.html` objects to OSS.
- Git rollback: revert the landing commit and redeploy. The main build's prerendered Vue
  C500 page will take over again; the URLs never 404.
- Cache: landing HTML uses `Cache-Control: public, max-age=60`; assets/images/packages use
  one-year immutable / one-day caching. Allow up to 60 seconds after rollback.

## Verification after deploy

```bash
curl -sI https://www.droneworld.tech/products/c500-partdro-eavision
curl -s  https://www.droneworld.tech/products/c500-partdro-eavision | grep -E 'canonical|hreflang|GTM-|c500-quote'
curl -sI https://www.droneworld.tech/es/products/c500-partdro-eavision
curl -sI https://www.droneworld.tech/de/products/c500-partdro-eavision
curl -sI https://www.droneworld.tech/fr/products/c500-partdro-eavision
```

- All four return 200 `text/html`, `Cache-Control: public, max-age=60`.
- Landing JS/CSS return `immutable`; WebP returns `image/webp` + one day.
- Submit one clearly marked test inquiry; verify Supabase row, `product_slug`, gclid/UTM,
  GTM `contact_form_submission` in preview, then remove/mark it spam.
- Confirm the C500 campaign's final URL still points to this path. Do not change Ads
  budgets, creatives, or final URLs as part of a landing-page deploy.

## Known constraints

- FC has no SPA fallback: adding a new alias requires a static object or an explicit
  redirect in `fc/index.ts`.
- The standalone source project at `~/Desktop/eavision_c500_landing_page_vue` is no longer
  the source of truth; make changes here.
- Do not commit `dist-landing/` or `.env` files.
