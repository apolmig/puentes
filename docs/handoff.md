# Puentes.info Handoff

This document captures the current state of the repo so development can resume later without reconstructing context from chat history.

## Repo status

- Repository: `apolmig/puentes`
- Default branch: `main`
- Current product direction: replace the legacy static `puentes.info` site with a Next.js product/workspace
- Latest documentation checkpoint: Netlify rollout, hosted runtime migration, and product handoff are now committed to `main`

## What is built

### Public surface

- `/`
  Visual landing page for `Puentes.info`
- Brand direction
  Creator-first, editorial, Gen Z civic-response tone
- Visuals
  Western and LatAm-focused image direction pulled into the landing page

### Workspace product

- `/inbox`
  Intake flow for rumor packets
- `/packets`
  Queue view with filters and packet metrics
- `/packets/[id]`
  Packet editor for truth, signals, sources, uploads, and metadata
- `/studio/[id]`
  Audience remix for `Creator`, `Educator`, and `Collective`
- `/review/[id]`
  Checklist and approval gate
- `/exports/[id]`
  Copy/download handoff bundle after approval

## Core product model

The app revolves around a `PacketRecord` in [lib/bridgebeat.ts](../lib/bridgebeat.ts).

Each packet includes:
- packet metadata
  `title`, `pulse`, `intakeFormat`, `channel`, `region`, `urgency`, `confidence`, `leadAudience`
- truth fields
  `claim`, `truth`, `risk`
- operational state
  `status`, `reviewChecklist`, `reviewNotes`
- evidence
  `signals`, `assets`, `sources`
- output variants
  `creator`, `educator`, `collective`

## Data/storage architecture

### Current database path

- ORM: Drizzle
- SQL client: `@libsql/client`
- Local development fallback: SQLite file
- Hosted production target: Turso/libSQL

Important files:
- [db/schema.ts](../db/schema.ts)
- [drizzle.config.ts](../drizzle.config.ts)
- [lib/server/bridgebeat-db.ts](../lib/server/bridgebeat-db.ts)
- [drizzle/0003_left_sprite.sql](../drizzle/0003_left_sprite.sql)

### Current asset storage path

- Local development fallback: `public/uploads`
- Hosted production target: Cloudinary

Important files:
- [lib/server/packet-assets.ts](../lib/server/packet-assets.ts)
- [lib/server/cloudinary.ts](../lib/server/cloudinary.ts)
- [app/api/packets/[id]/assets/route.ts](../app/api/packets/[id]/assets/route.ts)
- [app/api/packets/[id]/assets/[assetId]/route.ts](../app/api/packets/[id]/assets/[assetId]/route.ts)

### Runtime behavior

- Local development can still use file-backed DB and uploads
- Hosted production no longer allows local SQLite fallback
- Hosted production no longer allows local disk uploads
- Demo seed packets are enabled by default in local development only

Important file:
- [lib/server/runtime-config.ts](../lib/server/runtime-config.ts)

## Environment variables

### Local dev

- `PUENTES_DATABASE_URL=file:./data/puentes.db`
- `PUENTES_ENABLE_SEED=true`

### Hosted runtime

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

Optional:
- `PUENTES_ENABLE_SEED=false`
- `NETLIFY_NEXT_SKEW_PROTECTION=true`

See also:
- [docs/netlify-rollout.md](./netlify-rollout.md)
- [.env.example](../.env.example)

## Netlify state

The repo is prepared for Netlify, but dashboard-side setup is still required.

Already done in repo:
- `.nvmrc` pins Node `22`
- `netlify.toml` sets `PNPM_FLAGS="--shamefully-hoist"`, `pnpm build`, and enables `@netlify/plugin-nextjs`
- client-side packet fetches send `x-deployment-id` when `NEXT_DEPLOYMENT_ID` is available
- production runtime requires hosted DB and hosted uploads

Not done from this machine:
- Netlify site env vars
- preview deploy validation
- final production cutover
- domain verification after deploy

Reason: this machine does not have Netlify auth, a linked `.netlify` folder, or deployment credentials.

## Validation already completed

The repo has been validated repeatedly during the migration.

Checks that passed:
- `pnpm install`
- `pnpm db:generate`
- `pnpm db:push`
- `pnpm typecheck`
- `pnpm lint`

Important local limitation:
- local machine Node was `20.7.0`
- Next requires `>=20.9.0`
- because of that, local `next build` was not used as the final validation gate here
- Netlify should build with Node `22` from `.nvmrc`

## Recent commit timeline

Recent commits on `main`:
- `f4272e5`
  Replace legacy app with Puentes.info Next workspace
- `fd881f5`
  Move Netlify runtime to Turso and Cloudinary
- `fd33c2b`
  Add Netlify rollout guide

## Key files to know first

If picking this project back up, read these first:
- [app/page.tsx](../app/page.tsx)
- [app/layout.tsx](../app/layout.tsx)
- [components/bridgebeat/packet-store-provider.tsx](../components/bridgebeat/packet-store-provider.tsx)
- [components/bridgebeat/workspace-shell.tsx](../components/bridgebeat/workspace-shell.tsx)
- [lib/bridgebeat.ts](../lib/bridgebeat.ts)
- [lib/server/bridgebeat-db.ts](../lib/server/bridgebeat-db.ts)
- [lib/server/packet-assets.ts](../lib/server/packet-assets.ts)
- [docs/netlify-rollout.md](./netlify-rollout.md)
- [docs/dev-plan.md](./dev-plan.md)

## Known gaps

These are still not built:
- authentication
- role-based access
- collaboration/comments
- OCR for screenshots
- transcription for audio/video
- AI-assisted draft generation
- real URL ingestion/scraping
- analytics and trend detection
- a finalized production deploy run on Netlify

## Recommended next move

If resuming development, do this in order:

1. Finish the real Netlify launch
   Add env vars, run preview deploy, smoke test, then cut over the live domain.
2. Add auth
   Keep `/` public and protect the workspace routes.
3. Add intake intelligence
   OCR, transcription, and URL parsing.
4. Add AI drafting in Studio
   Generate creator, educator, and collective variants from packet evidence.
5. Add operations layer
   comments, assignments, history, templates, analytics.

## Short resume command list

```bash
pnpm install
pnpm db:push
pnpm dev
```

If working locally with the file DB:

```bash
$env:PUENTES_DATABASE_URL="file:./data/puentes.db"
$env:PUENTES_ENABLE_SEED="true"
pnpm dev
```
