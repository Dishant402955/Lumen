# Lumen handbook

Lumen is a **web-only** image editor and converter. There is no desktop app and no monorepo — one Next.js project under this folder.

**Taking over the codebase?** Start at **[docs/README.md](./README.md)** → [Developer guide](./developer-guide.md).

## What you can do

1. **Open** an image (button or drag-and-drop), including **HEIC/HEIF**. Files stay in the browser.
2. **Layers** — background, paint, and text; reorder, clone, opacity, visibility.
3. **Brush / Text (incl. rotation) / Adjust / Crop / Resize / Red-eye / Retouch** (marquee, heal, clone stamp) — see [Editing depth](./editing.md).
4. **Undo / Redo** — history stack with keyboard shortcuts.
5. **Export** — PNG, JPEG, WebP, AVIF, HEVC HEIC with optional EXIF keep (strongest on JPEG).
6. **Batch convert** — Convert panel: many files → one format → ZIP download. See [Format conversion](./conversion.md).
7. **Offline** — service worker caches the app; **Recent projects** store edits in IndexedDB on this device. See [Offline support](./offline.md).
8. **Mobile / PWA** — install icons, Install button, touch-friendly crop & rotate. See [Mobile & PWA](./mobile.md).
9. **Help** — Page Agent (heuristics + optional LLM). See [Page Agent](./page-agent.md).

## Mobile

On narrow screens, tool panels sit in a bottom sheet with tabs. The canvas stays above. Help FAB floats above the sheet.

## Privacy

Pixels are processed in your tab. The optional Page Agent sends only help-question text to an LLM if `PAGE_AGENT_API_KEY` is set — never image bytes.

## Out of scope

No accounts, no cloud sync, no image upload backend. See [Feature inventory](./feature-inventory.md).

## Docs index

- [Documentation home](./README.md)
- [Developer guide](./developer-guide.md)
- [Architecture](./architecture.md)
- [Code map](./code-map.md)
- [Feature inventory](./feature-inventory.md)
- [UI & design system](./ui-design-system.md)
- [Editing depth](./editing.md)
- [Format conversion](./conversion.md)
- [Offline support](./offline.md)
- [Mobile & PWA](./mobile.md)
- [Page Agent](./page-agent.md)
