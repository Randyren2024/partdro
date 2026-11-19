# Drone World Catalogue

A lightweight B2B UAV catalogue and lead-generation website, aligned with [partdro_csv_suppliers](https://github.com/Randyren2024/partdro_csv_suppliers).

## Stack

- Nuxt 4 + Vue 3 + TypeScript
- Supabase PostgreSQL
- Cloudflare Pages
- GitHub source control; Cloudflare Pages Git integration owns builds and deployments

## Application

- Home
- Published product directory and product details
- Listed supplier directory and supplier profiles
- Contact / inquiry form

## Data and security

Supabase is the source of truth. Public catalogue reads use only the RLS-protected `catalogue_products` and `catalogue_suppliers` views through server API routes. Do not add static product/supplier fallbacks or expose internal supplier notes, contact details, source URLs, or verification metadata.

The public runtime uses only the Supabase URL and publishable/anon key. The service-role key is server-only and used by the inquiry endpoint. Never place it in client code or `NUXT_PUBLIC_*` variables.

## Local development

```bash
npm install
cp .env.example .env
npm run dev
```

Open http://localhost:3000.

## Cloudflare Pages

Use the existing `partdro-nuxt` Pages project. Production branch: `main`; non-main branches should create previews. Build command: `npm run build`; output directory: `dist`.

Configure the environment variables from `.env.example` in Cloudflare Pages. Verify Git integration and a preview deployment before merging. Do not change DNS, production domains, or Supabase schema as part of routine application cleanup.

## Development principles

- Keep the app small: Nuxt pages, server API routes, and one Supabase utility.
- Keep all product and supplier facts in Supabase.
- Do not add a second Vite/legacy build pipeline or GitHub Actions deployment workflow.
- Preserve inquiry validation, rate limiting, attribution capture, SEO metadata, and GTM support.
