# Puentes.info

`Puentes.info` is a Next.js product prototype for creator-led civic response. It combines a visual landing page with a packet workspace for intake, verification, remixing, review, and exports.

## Local development

Run the app with Node `>=20.9.0`.

```bash
pnpm install
pnpm dev
```

The current local prototype stores packet data in SQLite and uploaded files on disk.

## Netlify note

This repo is prepared for Netlify with pnpm and Next.js, but the current persistence layer is still local-only:

- SQLite writes go to `data/puentes.db`
- file uploads go to `public/uploads`

That works locally, but it is not a production-safe persistence model for Netlify. Before replacing the live `puentes.info` site, move packet data and uploads to hosted services such as Postgres plus object storage.
