---
name: seo-agent
description: Run the Partdro product-page SEO workflow - head/OG tags, sitemap, GSC indexing checks and submission. Use when asked to SEO-optimize, index, or verify droneworld.tech product pages. Do not use for building landing pages.
---

# SEO Agent (Partdro / droneworld.tech)

End-to-end SEO pass for product pages on the Vue3 SPA + Netlify site www.droneworld.tech. Work the phases in order; each phase has a hard verification gate before the next.

## Key files

| File | Role |
|---|---|
| `src/views/ProductDetailView.vue` | Per-product SEO head tags (SEO watch block, ~L113-145) |
| `netlify/functions/sitemap.ts` | sitemap.xml generator |
| `src/i18n/*.json` + Supabase `landing_content` | Page text the title/description pull from |
| `src/data/products.ts` | Generic product data (landing pages use i18n keys instead) |

## Phase 1 — Head tags in ProductDetailView.vue

The SEO watch sets document head per product. Rules that were learned the hard way:

- **Ordering constraint**: the SEO watch must be defined AFTER `imgEdit` / `currentImgOverrides` in the setup body — placing it earlier throws TDZ ReferenceError and white-screens the page.
- Title formula: `` `${productLabel} - ${hero.title1} | Partdro` `` (e.g. "Y160 Delivery Drone - Cargo in Control | Partdro").
- Description: product label + hero `lead`, truncated to 160 chars.
- `productLabel`: lowercase slug matching `/^[a-z]+\d+[a-z]*$/` gets its model segment upper-cased (y160 → Y160, d15r → D15R).
- Tags to emit: `title`, `meta[description]`, `og:title`, `og:description`, `og:url`, `og:image`, `og:type=website`, `twitter:card=summary_large_image`, `twitter:title`, `twitter:description`, `twitter:image`.
- `og:image` resolves from the `__images.hero.mainImg` landing_content override (→ `/images/<ns>/hero.png|jpg`), not a hardcoded path.
- d15r namespace formats differently (`D15R - Multi-functional Washing UAV | Partdro`) — do not "unify" it.

## Phase 2 — Sitemap

Confirm every new product URL is emitted by `netlify/functions/sitemap.ts` (URLs like `/products/y160-delivery-drone`). If a new namespace was added, add it there too.

## Phase 3 — Build & deploy

```bash
npm run build                                    # this IS the type check (vue-tsc broken)
npx --no-install netlify deploy --prod --no-build --dir dist
```

The Netlify CLI often reports `422` / `ERR_STREAM_PREMATURE_CLOSE` **while actually succeeding**. Verify deployment by fetching the live site and checking the bundled JS hash changed, not by CLI exit code.

## Phase 4 — Browser verification of head

Use kimi-webbridge (see `references/gsc-automation.md` for daemon and request mechanics). For each product URL run an `evaluate` that reads `document.title`, `meta[name=description]`, `meta[property^=og:]`, `meta[name^=twitter:]`. All four product pages must show correct tags before touching GSC.

## Phase 5 — GSC indexing check & submission

Automated check recipe and troubleshooting live in `references/gsc-automation.md`. Summary:

1. URL inspection per product URL → parse status text.
2. Status glossary:
   - `URL is on Google` / `Page is indexed` — done.
   - `Discovered - currently not indexed` — in queue; REQUEST INDEXING speeds it up; recheck in 1-7 days.
   - `Crawled - currently not indexed` — crawled but judged low priority; improve content/internal links, then re-request.
   - `URL is not on Google` without a "Discovered/Crawled" reason — submit sitemap + REQUEST INDEXING.
3. **REQUEST INDEXING: let the user click it manually.** Agent-driven clicks on it are unreliable (Wiz ignores synthetic events) and Google risk-controls automated submission on the account. The agent's job is: run inspections, read statuses, hand the user a URL list.
4. Page indexing report URL is `/search-console/index` (NOT `/index/pages` — 404). Fresh submissions show "Processing data, please check again in a day or so".
5. Sitemap page: `/search-console/sitemaps` — resubmit only when the sitemap content changed.

## Pitfalls

- Do not deep-link inspection with `?id=<full-url>` — GSC 404s; the `id` param takes an internal hash only.
- CDP `Input.dispatchKeyEvent` Enter (keyDown/char/keyUp variants) does **not** submit the inspect input; the daemon `click` action on `button[aria-label="Search"]` does.
- `evaluate` hanging → `navigate` the same tab to any GSC URL to recover, then retry.
- Daemon dead after reboot → stale `daemon.pid` lockfile; delete it and `start` (never `stop`/`restart`).
- Every webbridge request on Windows must be a Write-tool-written JSON file + `curl.exe --data-binary @file` (inline non-ASCII gets mangled).
- GSC rate-limits repeated REQUEST INDEXING on the same URL — once per meaningful content change.
