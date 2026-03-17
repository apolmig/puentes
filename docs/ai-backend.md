# AI Backend Notes

## Goal

Use Netlify Functions as the server-side orchestration layer for OpenAI text, image, and video generation while the frontend remains a static site.

## Route overview

### Workspace compatibility

- `GET /api/bootstrap`
  Returns the current packet/audience/workspace snapshot.
- `POST /api/state`
  Accepts `appPatch`, `packetId`, `workspacePatch`, `action`, and `detail`.
- `POST /api/queue`
  Accepts `{ "question": "..." }`.

These endpoints support `PUENTES_STORE_BACKEND=file` for local development. Without a persistent adapter, the frontend should stay in local demo mode.

### OpenAI generation routes

- `POST /api/generate-text`
  Input: packet context, claim context, citations, audience, and optional instructions.
  Output: structured creator package with title, hook, caption, script, slides, citations, visual brief, video brief, and safety notes.
- `POST /api/generate-image`
  Input: `{ prompt, size?, quality?, background?, outputFormat? }`
  Output: base64 image payload and data URL.
- `POST /api/generate-video`
  Input: `{ prompt, size?, seconds? }`
  Output: OpenAI video job plus poll/download URLs.
- `GET /api/video-status?id=video_...`
  Returns OpenAI video job status plus download URLs.
- `GET /api/video-download?id=video_...&variant=video`
  Proxies the rendered asset.

## Environment variables

- `OPENAI_API_KEY`: required for AI routes.
- `OPENAI_TEXT_MODEL`: defaults to `gpt-5`.
- `OPENAI_IMAGE_MODEL`: defaults to `gpt-image-1.5`.
- `OPENAI_VIDEO_MODEL`: defaults to `sora-2`.
- `PUENTES_STORE_BACKEND`: optional; set to `file` for local file-backed workspace persistence.

## Recommended production upgrade path

1. Keep the current Netlify Functions shape.
2. Replace the workspace store adapter with Postgres.
3. Store prompts, outputs, citations, and job history per packet.
4. Use background jobs for long-running video or batch generation work.
5. Add auth and organization scoping before enabling real multi-user editing.
