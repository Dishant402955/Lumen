# Lumen handbook

Lumen is a web-only image editor. There is no desktop app and no monorepo — just this Next.js project.

## What you can do

1. **Open** an image (button or drag-and-drop). The file never leaves the browser for editing.
2. **Adjust** brightness, contrast, and saturation; rotate 90°; flip horizontal/vertical.
3. **Crop** with an on-canvas box, then apply.
4. **Export / convert** to PNG, JPEG, or WebP (with quality for JPEG/WebP).

## Mobile

On narrow screens, Adjust / Crop / Export sit in a bottom sheet with tabs. The canvas stays above.

## Privacy

Pixels are processed with the Canvas API in your tab. The optional Page Agent sends only the text of your help question to an LLM if `PAGE_AGENT_API_KEY` is configured on the server.

## Related

- [Offline support](./offline.md)
- [Page Agent](./page-agent.md)
