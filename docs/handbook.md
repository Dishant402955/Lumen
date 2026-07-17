# Lumen handbook

Lumen is a web-only image editor. There is no desktop app and no monorepo — just this Next.js project.

## What you can do

1. **Open** an image (button or drag-and-drop). The file never leaves the browser for editing.
2. **Layers** — background, one or more paint layers, and text layers. Show/hide, opacity, add, delete.
3. **Brush** — draw on the active paint layer (size, color, opacity, soft tip).
4. **Text** — add editable text layers; drag to reposition.
5. **Adjust** — brightness, contrast, saturation; rotate 90°; flip H/V.
6. **Crop** — free or locked aspects (1:1, 4:3, 3:2, 16:9, 9:16); move + 8 reshape handles; Apply bakes the crop into the document (layers preserved).
7. **Resize** — set width/height in pixels (optional aspect lock); resamples background and paint; scales text.
8. **Red-eye** — click pupils; correction is baked into the background.
9. **Undo / Redo** — top-bar buttons or Ctrl/Cmd+Z / Ctrl/Cmd+Shift+Z (history stack, ~40 steps).
10. **Export / convert** — PNG, JPEG, or WebP (quality for JPEG/WebP).

## Mobile

On narrow screens, tool panels sit in a bottom sheet with tabs. The canvas stays above.

## Privacy

Pixels are processed with the Canvas API in your tab. The optional Page Agent sends only the text of your help question to an LLM if `PAGE_AGENT_API_KEY` is configured on the server.

## Related

- [Editing depth](./editing.md)
- [Offline support](./offline.md)
- [Page Agent](./page-agent.md)
