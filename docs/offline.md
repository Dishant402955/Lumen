# Offline support

Lumen registers `/sw.js` on first load.

## What is cached

- App shell navigation (`/`)
- Same-origin static assets fetched after install
- `manifest.webmanifest` and favicon (precache)

## What is not cached

- `/api/*` (including Page Agent)
- Cross-origin requests

## What works offline

- Opening the editor UI after it was visited online once
- Opening images from disk and editing/exporting in that tab

## Limits

- A hard refresh with no network may still need the cached shell; if the SW never installed, offline won’t work until an online visit succeeds.
- LLM-backed help needs the network and a configured API key; heuristics still answer common questions when the API route is reachable (or you can rely on the handbook).
