# Puentes.info

`Puentes.info` is a Next.js product prototype for creator-led civic response. It combines a visual landing page with a packet workspace for intake, verification, remixing, review, and exports.

## Local development

Run the app with Node `>=20.9.0`.

```bash
pnpm install
pnpm dev
```

Local development still supports a file-backed workflow:

- SQLite writes can use `PUENTES_DATABASE_URL=file:./data/puentes.db`
- uploaded evidence can fall back to `public/uploads`
- demo packets seed automatically unless `PUENTES_ENABLE_SEED=false`

## Netlify production setup

This repo is now prepared to run safely on Netlify, but production must use hosted services:

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

In production, the app refuses to use local SQLite or local disk uploads. Packet data is expected to live in Turso/libSQL, and uploads are expected to go through Cloudinary. That keeps Netlify deploys stateless while preserving the same workspace flows.

For the exact Netlify rollout checklist, see [docs/netlify-rollout.md](/C:/code/Nueva%20carpeta/puentes/docs/netlify-rollout.md).
