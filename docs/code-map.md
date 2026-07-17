# Code map

Where to open files when you know what you want to change.

## App / routing

| File | Purpose |
| --- | --- |
| `app/page.tsx` | Home → `EditorShell` |
| `app/layout.tsx` | HTML shell, fonts, PWA metadata, `ClientBootstrap` |
| `app/globals.css` | Design tokens + shared UI classes |
| `app/api/page-agent/route.ts` | Optional LLM help endpoint |
| `next.config.ts` | Headers for SW; `serverExternalPackages: ['elheif']` |
| `example.env` | Env template |

## Editor UI

| File | Purpose |
| --- | --- |
| `components/editor/editor-shell.tsx` | **Main orchestrator** — state, pointers, history, save, layout |
| `components/editor/tool-panel.tsx` | All tool panels + `PANEL_IDS` / `PANEL_LABELS` |
| `components/editor/slider.tsx` | Labeled range control |
| `components/editor/crop-overlay.tsx` | On-canvas crop box + handles |
| `components/editor/selection-overlay.tsx` | Marquee + clone source marker |
| `components/editor/batch-convert-panel.tsx` | Batch convert UI |
| `components/editor/recent-projects.tsx` | Project list / delete / clear |
| `components/editor/install-prompt.tsx` | PWA install button |
| `components/editor/mobile-crop-bar.tsx` | Sticky crop actions (narrow) |
| `components/editor/mobile-rotate-bar.tsx` | Large rotate/flip (narrow) |

## Page Agent

| File | Purpose |
| --- | --- |
| `components/page-agent/page-agent.tsx` | Help FAB + chat UI |
| `components/page-agent/heuristics.ts` | Offline/default answers |
| `components/page-agent/targets.ts` | `data-lumen-id` catalog + explain text |
| `components/page-agent/highlight-layer.tsx` | Spotlight overlays |

## Domain logic (`lib/`)

| File | Purpose |
| --- | --- |
| `lib/editor-types.ts` | Types, defaults, `createInitialDoc`, history limit |
| `lib/compose.ts` | Flat draw + adjust/crop compose + export helper |
| `lib/paint-store.ts` | Offscreen paint canvases |
| `lib/history.ts` | Undo/redo stack helpers |
| `lib/pointer-math.ts` | Doc ↔ output coordinate transforms |
| `lib/crop-math.ts` | Clamp crop, aspect locks |
| `lib/retouch.ts` | Heal / clone / clear selection pixel ops |
| `lib/red-eye.ts` | Red-eye correction |
| `lib/cn.ts` | `clsx`-style class merger |
| `lib/register-sw.ts` | Service worker registration + status |
| `lib/install-prompt-capture.ts` | Early `beforeinstallprompt` capture |

### Convert

| File | Purpose |
| --- | --- |
| `lib/convert/types.ts` | Formats list + quality/EXIF flags |
| `lib/convert/decode.ts` | Decode any image incl. HEIC→PNG via `heic2any` |
| `lib/convert/encode.ts` | Encode + batch helpers + download/ZIP |
| `lib/convert/exif.ts` | Read/inject EXIF |
| `lib/convert/heic-encode.ts` | Lazy `elheif` HEVC encode |

### Offline

| File | Purpose |
| --- | --- |
| `lib/offline/idb.ts` | Tiny IndexedDB promise helpers |
| `lib/offline/projects.ts` | List/get/save/delete projects (max 16) |
| `lib/offline/project-io.ts` | Build blobs from live editor state |

## Public assets

| File | Purpose |
| --- | --- |
| `public/sw.js` | Service worker (bump version on strategy changes) |
| `public/manifest.webmanifest` | PWA manifest |
| `public/icons/*` | App icons |

## Types

| File | Purpose |
| --- | --- |
| `types/elheif.d.ts` | Module types for `elheif` |

## Docs

| File | Purpose |
| --- | --- |
| `docs/README.md` | Docs index |
| `docs/developer-guide.md` | Day-to-day development |
| `docs/architecture.md` | System design |
| `docs/code-map.md` | This file |
| `docs/feature-inventory.md` | Shipped features + gaps |
| `docs/ui-design-system.md` | Visual system |
| `docs/editing.md` | Editing tools depth |
| `docs/conversion.md` | Formats |
| `docs/offline.md` | SW + projects |
| `docs/mobile.md` | Mobile/PWA |
| `docs/page-agent.md` | Help system |
| `docs/handbook.md` | Short product overview |

## “I want to change X” quick index

| Goal | Open first |
| --- | --- |
| New panel / tool | `tool-panel.tsx` → `editor-shell.tsx` → `editor-types.ts` |
| Brush feel | `editor-shell.tsx` `paintAt` + brush state |
| Retouch algorithms | `lib/retouch.ts` |
| Crop math | `lib/crop-math.ts` + `crop-overlay.tsx` |
| Undo depth | `HISTORY_LIMIT` in `editor-types.ts` |
| Export format | `lib/convert/types.ts` + `encode.ts` |
| HEIC encode | `lib/convert/heic-encode.ts` |
| EXIF | `lib/convert/exif.ts` |
| Project save schema | `lib/offline/projects.ts` + `project-io.ts` |
| Offline caching | `public/sw.js` |
| Help answers | `heuristics.ts` + `targets.ts` |
| Colors / buttons | `app/globals.css` |
| Install prompt | `install-prompt-capture.ts` |
