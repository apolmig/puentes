# Puentes

Puentes is a creator-first civic media workspace for trusted youth creators, educators, and community messengers. The app turns civic packets into source-linked captions, scripts, slide packs, and read-only share previews without dropping the evidence trail.

## Run locally

1. `npm start`
2. Open `http://127.0.0.1:4173`

No external dependencies are required.

## Current scope

- Creator-first intake -> verify -> draft -> export workflow
- Audience modes for `Student`, `Creator`, and `Educator`
- Packet-scoped workspace state with saved checklist, notes, approvals, exports, and history
- Structured output bundles for carousel, short-video, classroom, and creator-caption handoffs
- Read-only share preview links and downloadable creator handoff packages
- Lightweight backend validation for queue inputs and workspace mutations

## Next build steps

- Add retrieval-backed evidence cards instead of demo packet data
- Add richer creator exports such as JSON bundles and image-ready slide layouts
- Layer in reviewer roles, comments, and collaborative packet assignments
- Add analytics around queue usage, export actions, and share-preview opens
