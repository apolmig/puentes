# Puentes.info Netlify Rollout

This repo is configured for a Netlify-hosted Next.js deployment. Use this checklist to replace the live `puentes.info` site safely.

## 1. Netlify site settings

- Site repo: `apolmig/puentes`
- Production branch: `main`
- Node version: leave [.nvmrc](/C:/code/Nueva%20carpeta/puentes/.nvmrc) in place so Netlify builds with Node `22`
- pnpm: leave [netlify.toml](/C:/code/Nueva%20carpeta/puentes/netlify.toml) in place so `PNPM_FLAGS="--shamefully-hoist"` is applied
- Build settings: remove any legacy publish directory, functions directory, or old plugin overrides from the previous static site if they still exist in the Netlify UI

## 2. Environment variables

Create these as **site environment variables** in Netlify.

For `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`:
- Scope: `Builds` and `Functions`
- Contexts: set values for `Production`
- Optional: set separate non-production values for `Deploy Previews`

Recommended additional variables:
- `PUENTES_ENABLE_SEED=false`
  Scope: `Builds` and `Functions`
  Context: `Production`
- `NETLIFY_NEXT_SKEW_PROTECTION=true`
  Scope: `Builds`
  Context: `Production`

## 3. Service setup

### Turso

Create or choose the production database, then copy:
- database URL into `TURSO_DATABASE_URL`
- auth token into `TURSO_AUTH_TOKEN`

Run the schema migration from a machine that has the env vars available:

```bash
pnpm install
pnpm db:push
```

### Cloudinary

Collect the product environment credentials from Cloudinary and set:
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

The app uploads packet evidence to Cloudinary at runtime and stores the delivery URL plus public ID in the database.

## 4. Preview deploy gate

Before touching the live domain:

1. Trigger a Deploy Preview from a branch or a manual preview deploy from `main`.
2. Open `/`
3. Open `/inbox`
4. Create a packet
5. Upload an image and a PDF
6. Confirm the packet appears in `/packets`
7. Open `/studio/[id]`, `/review/[id]`, and `/exports/[id]`
8. Delete one uploaded asset and confirm removal works

Do not cut over production until all eight checks pass on Netlify.

## 5. Production rollout

1. Confirm the Netlify site points to `main`
2. Confirm all production env vars are saved
3. Trigger a fresh production deploy
4. Wait for the deploy to finish and open the production deploy URL first
5. Smoke test `/`, `/inbox`, packet creation, upload, review, and export
6. In Netlify Domain management, keep `puentes.info` as the primary domain for the new deploy
7. Verify HTTPS and DNS are healthy after the deploy is live

## 6. Rollback plan

If production fails:

1. Roll back to the previous successful Netlify deploy from the Deploys tab
2. Leave the new env vars in place unless the issue is credential-related
3. Check Netlify function logs and deploy logs before retrying

## 7. Notes for this repo

- Production no longer allows local SQLite fallback
- Production no longer allows local disk uploads
- Demo seed packets are disabled unless `PUENTES_ENABLE_SEED=true`
- Client-side packet fetches now send `x-deployment-id` when Netlify provides `NEXT_DEPLOYMENT_ID`, which aligns with Netlify’s skew-protection guidance for explicit `fetch` calls
