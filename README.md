# Droneworld.tech / Partdro

Droneworld.tech is built with **Nuxt 4 + Vue 3 + TypeScript + Ant Design Vue**. The Nuxt application lives at the repository root and is the only primary website framework.

## Primary application

- `app/` — Nuxt pages, components, layouts, composables, i18n and styles.
- `server/` — Nitro API routes and server-only integrations.
- `public/` — Nuxt static assets.
- `nuxt.config.ts` — Nuxt 4 configuration.
- `wrangler.toml` — Cloudflare Pages / Workers configuration.

## Transitional compatibility code

- `legacy-vite/` contains the former Vite SPA source and its original public assets. It is retained temporarily as a rollback/build source for the current Aliyun OSS production chain; do not add new product or site features here. It can be removed only after Nuxt has taken over the production domain and the rollback window is complete.
- `landing/eavision-c500/`, `landing/vf50p/`, and `landing/u15/` remain separate Vite builds for now. Their design, content, media, SEO, forms and tracking will be migrated into Nuxt in the next phase. Do not delete these directories before their Nuxt replacements pass route-by-route validation.
- `scripts/` and `fc/` retain existing build and Function Compute automation during the migration.

## Local development

```bash
npm install
npm run dev
```

Nuxt build and validation:

```bash
npm run build
npm run generate
npm run typecheck
```

Temporary legacy compatibility build (not the primary app):

```bash
npm run dev:legacy
npm run build:legacy
```

Product landing builds (temporary until Nuxt migration):

```bash
npm run landing:c500:build
npm run landing:vf50p:build
npm run landing:u15:build
```

Copy `.env.example` to `.env` for local development. Keep service-role keys, webhook secrets, API keys and cloud credentials server-side. Do not commit real credentials.

## Deployment

- **Cloudflare Pages project:** `partdro-nuxt`; production branch `main`; repository root directory `.`; build command `NITRO_PRESET=cloudflare_pages npm run build`; output directory `dist`.
- `.github/workflows/deploy-cloudflare.yml` builds the root Nuxt application, temporarily merges the three standalone product pages, runs route/API checks, and deploys to Cloudflare Pages.
- `.github/workflows/deploy-aliyun.yml` temporarily continues building `legacy-vite/` plus the three standalone pages and syncing the static snapshot to OSS, then deploys the existing FC functions. This compatibility chain must remain until the Nuxt production cutover is verified; it is not the target architecture.

## Migration safety

Moving Nuxt to the root does not switch `www.droneworld.tech` or modify Aliyun resources. The current production FC/OSS chain remains available for rollback. Do not delete the legacy app, OSS objects, FC functions, or change DNS until the Nuxt Pages deployment, APIs, SEO, media, inquiry flow and analytics have been verified on the production domain.

See the Notion page **Droneworld.tech(partdro)** for the phased architecture plan and operational checklist.