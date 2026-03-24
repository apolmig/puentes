# Puentes.info Development Plan

This plan assumes the current repo state already includes:
- visual landing page
- packet workspace
- Drizzle/libSQL data layer
- Cloudinary/Turso-ready hosted runtime
- Netlify rollout docs

## Goal

Turn the current strong prototype into a production-ready creator-and-educator civic-response platform.

## Phase 0: Launch the hosted app

### Objective

Get the current build safely live on Netlify.

### Tasks

1. Set production env vars in Netlify
   `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `PUENTES_ENABLE_SEED=false`, `NETLIFY_NEXT_SKEW_PROTECTION=true`
2. Run `pnpm db:push` against the production Turso database
3. Trigger a preview deploy
4. Run the smoke test from [netlify-rollout.md](./netlify-rollout.md)
5. Trigger production deploy
6. Validate domain, HTTPS, and rollback path

### Exit criteria

- live site serves from Netlify
- packet CRUD works
- upload/delete works
- studio/review/exports work
- no demo data in production

## Phase 1: Access and ownership

### Objective

Stop treating the workspace like a public anonymous prototype.

### Features

- authentication
- protected workspace routes
- user sessions
- packet ownership
- basic admin/editor roles

### Suggested approach

- add auth before deeper product logic
- keep `/` public
- protect `/inbox`, `/packets`, `/studio`, `/review`, `/exports`

### Exit criteria

- unauthenticated users cannot access workspace routes
- packets are scoped to a user or team context

## Phase 2: Intake intelligence

### Objective

Reduce manual entry friction in the packet intake flow.

### Features

- URL ingestion for posts/articles/videos
- OCR for screenshots
- audio/video transcription
- auto-generated intake summary
- normalized signal extraction

### Suggested outputs

- parsed claim
- detected platform/channel
- extracted source link
- rough transcript or screenshot text
- suggested urgency/confidence

### Exit criteria

- intake starts from a URL or file, not only manual form entry
- packet is pre-filled with useful structured evidence

## Phase 3: AI drafting in Studio

### Objective

Make the app generate usable response drafts from packet evidence.

### Features

- generate creator scripts
- generate educator prompts/slides
- generate collective/group-chat replies
- bilingual English/Spanish output
- style controls by audience and format

### Guardrails

- always cite packet sources
- preserve uncertainty labeling
- avoid repeating harmful rumor phrasing for reach
- require human review before export

### Exit criteria

- each packet can generate working drafts for all three audience lanes
- generated outputs stay tied to evidence and confidence state

## Phase 4: Review and collaboration

### Objective

Support an actual editorial workflow instead of solo use.

### Features

- reviewer identity
- comment threads
- packet history/audit trail
- assignments
- reviewer decisions
- richer approval states

### Exit criteria

- a second user can review, comment, and approve a packet
- decision history survives reloads and deploys

## Phase 5: Operations and insight

### Objective

Turn the workspace into a real response desk.

### Features

- trend clustering
- queue analytics
- packet reuse/templates
- export analytics
- regional/channel dashboards
- impact reporting

### Exit criteria

- operators can see what is rising, what shipped, and what is reusable

## Recommended implementation order

1. Launch the hosted app
2. Add auth
3. Add intake intelligence
4. Add AI drafting
5. Add collaboration
6. Add analytics/ops

## Suggested technical additions

### Near term

- auth provider
  Netlify Identity is no longer the obvious default choice, so use a modern auth layer that fits Next App Router cleanly
- database hardening
  add migrations discipline, staging DB, backup/restore notes
- storage hardening
  add file size/type policy, asset lifecycle rules

### Medium term

- server-side audit logging
- structured permissions
- background jobs for OCR/transcription/generation
- prompt versioning for AI outputs

## Product rules that should not regress

- source-linked corrections over vague "fact check" copy
- audience-specific outputs, not generic one-size-fits-all text
- visible uncertainty labels
- avoid replaying the most viral rumor wording unless necessary
- creator/educator/collective framing should remain central to the product

## Session-start checklist for future work

When returning to this repo later:

1. Read [handoff.md](./handoff.md)
2. Read [netlify-rollout.md](./netlify-rollout.md)
3. Check `git log --oneline -5`
4. Run `pnpm install`
5. Run `pnpm typecheck`
6. Run `pnpm lint`
7. Choose the next phase and work from there
