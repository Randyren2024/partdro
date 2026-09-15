# AGENTS.md

This file documents the **landing-page-from-source workflow** used in this repo. Codex (Codex.ai/code) should follow these phases end-to-end when asked to build a product page from an external source.

## Workflow Overview

```
URL / Upload (image·text·PDF)
        │
        ▼
[1] Acquire & Extract ────► structured Product fields
        │
        ▼
[2] Map & Brand-decide ─── source terms → target brand
        │
        ▼
[3] Asset Pipeline ────── DOWNLOAD ONLY → save (no edits)
        │                          │
        │                          ▼
        │                  PENDING IMAGE-MOD LIST
        │
        ▼
[4] Code-gen ───────────── products.ts + hardcoded maps
        │
        ▼
[5] Build verify ───────── npm run build
        │
        ▼
[6] Render & Screenshot ── Playwright 1440×900 + 390×844
        │                          (uses ORIGINAL source images)
        │
        ▼
[7] Detail audit ───────── per-section inspection
        │                          │
        │       issues found ──────┘
        ▼
[8] Fix & Localize ──────── code/data fixes
        │                          │
        │                          ▼
        │                  IMAGE MODIFICATIONS LAST
        │                  (regenerate / redact per pending list)
        │
        └─► loop back to (6) ──── repeat until user says done
```

The loop in (7)→(8) is the most important part. Do **not** declare the task complete after one screenshot pass.

**Image modification ordering rule:** All image localization, redaction, and regeneration work belongs in Phase 8 (Fix & Localize), not Phase 3. Phase 3 is download-only. Build and screenshot the page with original source images first; once the layout is locked, then execute the pending image-mod list. This prevents wasted regeneration effort when the layout or content needs further changes, and isolates image-generation failures from blocking the build pipeline. See `feedback_image_modification_last.md` in memory.

---

## Phase 1 — Acquire & Extract

| Input | Tool | Notes |
|---|---|---|
| URL (live web page) | `WebFetch` with a detailed extraction prompt | Ask for: name, tagline, description, all image URLs (hero/feature/gallery/spec/faq/application/kit), specs, FAQs, learn-more card text, applications, hero/compare/bundle sections, price/SKU/CTA |
| Local image | `Read` (image is rendered) | Note visible third-party branding for phase 3 redaction |
| Local text/markdown | `Read` | Split into fields manually |
| Local PDF | `Read` with `pages` parameter for >10-page docs | Same extraction fields as WebFetch |

Prompt templates for WebFetch should request "保留完整 URL", "标注 hero/feature/gallery/spec/faq/application" so the downstream mapping has clear metadata.

## Phase 2 — Map & Brand-decide

Decide upfront:
- **Product id / code / name**: short alphanumeric id (e.g. `lumenfly-mini` / `LM-MINI`), human-readable name. Avoid double-stamping the same word (we shipped "Mini Camera Drone" then noticed "LM-MINI Mini Camera Drone" had "Mini" twice — fix to "Camera Drone").
- **Category**: pick from the 5 in `categories[]`. New categories need entries in `src/data/products.ts`.
- **Brand rewrite**: any third-party brand in the source (e.g. "SKYROVER") must be replaced with the target brand throughout the data, AND visually removed from images (see phase 3).
- **In-stock / best-seller / new** flags: default `inStock: true`, `isNew: true`, `isBestSeller: false` for new product launches.

## Phase 3 — Asset Pipeline (DOWNLOAD ONLY)

```bash
mkdir -p public/images/<product-id>
curl -L -o public/images/<product-id>/<semantic-name>.<ext> '<source-url>'
```

Naming convention: `hero`, `one-tap-takeoff`, `live-feed`, `sony-sensor`, `gimbal`, `wind-resistance`, `auto-track`, `battery-life`, `standard-kit`, `fly-more-combo` — semantic, not the source's UUID-based filenames.

**Download only in this phase.** Do not redact, regenerate, or modify images here.

After downloading, audit each image with `Read` (the model renders images) to:
- Note any third-party branding on the drone body or product (e.g. WALKERA, SKYROVER)
- Note any non-Latin text overlay (Chinese, etc.) that needs localization
- Note incidental third-party branding in the scene background (cars, buildings) — these are NOT product identity per `feedback_image_redaction_scope.md` and should be skipped

Build a **pending image-mod list** with one line per image that needs work, e.g.:
- `feature-p2-remote.jpg` → redact WALKERA on drone arm
- `feature-smart-follow.jpg` → regenerate (Chinese sub-feature labels → English)
- `feature-voice-control.jpg` → regenerate (语音气泡 → English)

Do NOT execute these modifications yet — they happen in Phase 8.

## Phase 4 — Code Generation

1. **`src/data/products.ts`** — append a new `Product` entry. Fill every field that has a corresponding source extraction. Don't leave empty arrays for sections the source had content for.
2. **`src/views/ProductDetailView.vue`** has TWO hardcoded maps that need updating when adding a product:
   - `badgeStyleProducts` (line ~914) — product codes whose `features` render as badge chips. Add if your features are short labels (≤30 chars).
   - `appImageMap` (line ~895) — application-name → image-path. Add one entry per unique `applications[]` string so the carousel shows real photos instead of generic icons.

## Phase 5 — Build Verify

```bash
npm run build
```

`vue-tsc --noEmit` is broken (Node version incompatibility, per CLAUDE.md) — the build is the type-check. Fail = fix before screenshotting.

## Phase 6 — Render & Screenshot

```bash
npm run dev          # may fall back to 3001/3002 if 3000 is taken by ~/Desktop/partdro_final
node scripts/screenshot-full.mjs
```

Output PNGs in `screenshots/`. The script:
- Forces v-motion opacity to 1 (fullPage screenshot doesn't trigger IntersectionObserver)
- Captures: desktop hero + full, learn-more, applications, specs, faqs, cta, plus mobile hero + full

**Always tell the user the actual port** — `npm run dev` output reveals it; the README's "3000" is stale.

## Phase 7 — Detail Audit

Read every section screenshot. Common issues found in practice:

| Section | Things to check |
|---|---|
| Hero | Title redundancy (id+name overlap), tagline length, badge chip text matches the product type (camera drone ≠ COLLABORATIVE/EFFICIENT/STABLE), carousel first-slide content |
| Gallery / hero carousel | Third-party logos still visible, image ordering |
| Learn-more cards | Image matches card topic (a runner-comparison shot is not a gimbal close-up), title and description match the visual |
| Core Applications | Each app should have a real image, not the generic AppstoreOutlined icon |
| Specifications | All spec rows populated, values in correct units (km vs mi), no NaN/empty strings |
| FAQs | At least 5–10 questions, mix of registration/usage/spec/warranty topics |
| CTA section | Brand name + Request-a-Demo / Get-a-Quote buttons |
| Footer | No broken links, contact info current |

## Phase 8 — Fix & Localize

This phase has two sub-tasks, run in order:

### 8a — Fix code/data issues from the audit

For each code/data issue found in Phase 7:
1. Update the data/code (`products.ts` or `ProductDetailView.vue`)
2. Re-run `npm run build` if code changed
3. Re-run `screenshot-full.mjs`
4. Re-read the affected section screenshots

### 8b — Execute the pending image-mod list (last!)

Once layout is locked from 8a, work through the pending image-mod list built in Phase 3:

1. **WALKERA / SKYROVER redaction** on drone body / labels / packaging:
   - Identify the row range using `scripts/verify-image.py`
   - Paint over with PIL (`scripts/redact-skyrover.py` reference)
   - Optionally draw replacement brand text in white
   - Verify with `verify-image.py`

2. **Chinese → English localization** on infographic overlays:
   - For each image, use the nano-banana skill (`python C:/Users/81102/.claude/skills/nano-banana/scripts/generate.py "<prompt>" -i <in.png> -o <out.png>`)
   - If nano-banana fails/times out, fall back to the bailian-image-video skill (Alibaba qwen-image) per `feedback_image_localization_fallback.md`
   - **After every regeneration, Read the output image** to verify: text spelling, font/style match, specs preserved, no hallucinated/missing elements — per `feedback_deep_image_audit.md`

3. Re-run `screenshot-full.mjs` and re-read affected sections to confirm.

The user's directive: **"循序渐进式的改进"** — incremental, not big-bang. Ship a working v1 first, then improve section by section. Don't try to fix everything in one edit pass.

Repeat 8a → screenshot → audit → 8b until the user signals done ("好了" / "满意" / etc.) OR two consecutive passes have no new issues.

---

## Reference: scripts/

| Script | Purpose |
|---|---|
| `scripts/screenshot-full.mjs` | Desktop + mobile Playwright capture with motion-opacity workaround |
| `scripts/screenshot-lumenfly-mini.mjs` | One-off variant for a single product (debug) |
| `scripts/debug-lumenfly-mini.mjs` | DOM dump — section heights, opacities, counts |
| `scripts/redact-skyrover.py` | PIL gradient-mask + text replacement for source-image branding |
| `scripts/verify-image.py` | White-pixel row scan to confirm redaction actually removed the text |
| `scripts/optimize-images.js` | npm run optimize-images — sharp-based batch resize |
| `scripts/scrape-allynav-images.js` | AllyNav-specific image scraper (industrial products) |
| `scripts/convert-logos.js` | Logo variant generation |
| `scripts/generate-favicons.js` / `generate-mstiles.js` | Favicon + MSTILE generation |

## Reference: shared with CLAUDE.md

Build commands, routing, image strategy, git-push, and the AllyNav / Skyrover image-source notes are in `CLAUDE.md`. Read both files at the start of any task.