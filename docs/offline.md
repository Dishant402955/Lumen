# Offline support

Lumen is designed to keep working without a network after the first successful visit.

## Service worker (`/sw.js`)

Versioned caches:

| Cache | Role |
|-------|------|
| `lumen-shell-v*` | App navigations + precached shell (`/`, manifest, favicon, **PWA icons**) |
| `lumen-static-v*` | `/_next/static/*`, fonts, images, CSS/JS (cache-first) |
| `lumen-runtime-v*` | Other same-origin GETs (stale-while-revalidate, capped) |

Rules:

- **Never caches** `/api/*` (Page Agent / LLM proxy)
- **Navigations**: network first, fall back to cached `/`, then a tiny offline HTML page if the shell was never installed
- Posts `LUMEN_SW_ACTIVATED` to clients; UI shows **Offline-ready** when controlling, and **Update app** when a waiting worker is present

## Recent projects (IndexedDB)

Database: `lumen-offline` → store `projects` (max **16**).

Each project stores:

- Editor document JSON (layers, adjustments, crop, size)
- Background PNG blob
- Paint-layer PNG blobs
- JPEG thumbnail for the list

### How to use

1. Open or edit an image
2. **Save project** (or wait ~1.8s after an undoable edit — auto-save)
3. Reopen from the empty-state list, the **Projects** panel, or the Projects header button — **works offline**

Delete individual projects or **Clear all** from the Projects panel.

## What works fully offline

- Editor UI (after SW install)
- Opening files from disk
- Editing, convert/export (client-side)
- Recent projects save/load
- Page Agent **heuristics** (local). LLM answers need network + API key

## Limits

- First visit must succeed online so the service worker can install and precache the shell
- Very large projects are limited by browser IndexedDB quota
- Cross-origin assets are not cached
