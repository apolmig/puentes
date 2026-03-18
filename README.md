# Puentes

Puentes is a creator-first civic media workspace for trusted youth creators, educators, and community messengers. The app turns civic packets into source-linked captions, scripts, slide packs, and read-only share previews without dropping the evidence trail.

## Run locally

1. `npm start`
2. Open `http://127.0.0.1:4173`

## Netlify AI Backend Scaffold

This repo now includes a Netlify-native backend scaffold for OpenAI-powered text, image, and video generation.

### Config files

- `netlify.toml`: rewrites `/api/*` to Netlify Functions
- `netlify/functions/*`: serverless API routes
- `.env.example`: expected OpenAI and local store environment variables

### Workspace routes

- `GET /api/bootstrap`
- `POST /api/state`
- `POST /api/queue`

These routes are compatible with the existing frontend. In local development you can enable file-backed persistence with `PUENTES_STORE_BACKEND=file`. On deployed Netlify, the frontend can continue to use local demo mode until a real database is connected.

### AI routes

- `GET /api/ai-config`
- `POST /api/generate-text`
- `POST /api/review-draft`
- `POST /api/generate-image`
- `POST /api/generate-video`
- `GET /api/video-status?id=...`
- `GET /api/video-download?id=...&variant=video`

### Required environment variables

- `OPENAI_API_KEY`
- `PUENTES_TEXT_MODEL` default: `gpt-5`
- `PUENTES_REVIEW_MODEL` default: `gpt-5-mini`
- `PUENTES_IMAGE_MODEL` default: `gpt-image-1.5`
- `PUENTES_VIDEO_MODEL` default: `sora-2`

See [docs/ai-backend.md](/C:/Code/puentes/docs/ai-backend.md) for the route contracts and backend architecture notes.

## Current scope

- Creator-first intake -> verify -> draft -> export workflow
- Audience modes for `Student`, `Creator`, and `Educator`
- Packet-scoped workspace state with saved checklist, notes, approvals, exports, and history
- Structured output bundles for carousel, short-video, classroom, and creator-caption handoffs
- Read-only share preview links and downloadable creator handoff packages
- Netlify Functions scaffold for OpenAI text, image, and video generation

## Next build steps

- Replace demo/file workspace storage with Postgres or Supabase
- Add retrieval-backed evidence cards instead of demo packet data
- Add richer creator exports such as JSON bundles and image-ready slide layouts
- Persist video jobs and exports in a real database
- Layer in reviewer roles, comments, and collaborative packet assignments
