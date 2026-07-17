# Lumen handbook

Lumen is a web-only image editor. There is no desktop app and no monorepo — just this Next.js project.

## What you can do

1. **Open** an image (button or drag-and-drop), including **HEIC/HEIF**. Files stay in the browser.
2. **Layers** — background, paint, and text layers.
3. **Brush / Text / Adjust / Crop / Resize / Red-eye** — see [Editing depth](./editing.md).
4. **Undo / Redo** — history stack with keyboard shortcuts.
5. **Export** — PNG, JPEG, WebP, AVIF, HEIC with optional EXIF keep.
6. **Batch convert** — Convert panel: many files → one format → ZIP download. See [Format conversion](./conversion.md).
7. **Offline** — service worker caches the app; **Recent projects** store edits in IndexedDB on this device. See [Offline support](./offline.md).
8. **Mobile / PWA** — install icons, Install button, touch-friendly crop & rotate. See [Mobile & PWA](./mobile.md).

## Mobile

On narrow screens, tool panels sit in a bottom sheet with tabs. The canvas stays above.

## Privacy

Pixels are processed in your tab. The optional Page Agent sends only help-question text to an LLM if `PAGE_AGENT_API_KEY` is set.

## Related

- [Editing depth](./editing.md)
- [Format conversion](./conversion.md)
- [Offline support](./offline.md)
- [Mobile & PWA](./mobile.md)
- [Page Agent](./page-agent.md) — highlight + click-to-explain help
