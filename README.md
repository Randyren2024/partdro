# Partdro

Partdro is a lightweight B2B UAV catalogue and lead-generation website.

## Architecture

The target architecture follows [partdro_csv_suppliers](https://github.com/Randyren2024/partdro_csv_suppliers):

- Nuxt 4, Vue 3 and TypeScript for the website.
- Supabase PostgreSQL as the source of truth for products and suppliers.
- Public, RLS-protected catalogue views for anonymous website reads.
- Cloudflare Pages for hosting and deployment.
- GitHub as the source repository; Cloudflare Pages Git integration handles builds and deployments.

The production application remains in this repository. This alignment is incremental: existing product, supplier, landing-page, inquiry, SEO and analytics capabilities must be audited before legacy code or dependencies are removed.

## Deployment

The intended deployment flow is Cloudflare Pages Git integration, with `main` as the production branch and non-main branches as previews.

**Migration prerequisite:** configure and verify the Cloudflare Pages Git integration for this repository before merging the workflow-removal change into `main`. Until that is done, do not assume pushes will trigger Cloudflare builds.

The current Cloudflare Pages project/build settings must be confirmed against the target app before changing its production project, domain, build command or output directory. Do not change DNS or production domains as part of this cleanup.

## Data and security

- Supabase is the source of truth; do not reintroduce hardcoded product or supplier catalogues in frontend code.
- Public pages must read only published/listed records through approved public catalogue views or equivalent RLS-protected access.
- Supplier private notes, contact details, source URLs and verification metadata must never be exposed to anonymous visitors.
- Never place a Supabase service-role key in client code or public runtime configuration.

## Local development

```bash
npm install
cp .env.example .env
npm run dev
```

Use the public Supabase URL and publishable/anon key for public catalogue reads. Keep all privileged operations server-side and protected.
