# Lumen documentation

Start here if you are taking over the project and will work **without AI assistance**.

## Read in this order

1. **[Developer guide](./developer-guide.md)** — run, build, conventions, how to add features safely  
2. **[Architecture](./architecture.md)** — data flow, document model, compose/history/offline  
3. **[Code map](./code-map.md)** — where every important file lives  
4. **[Feature inventory](./feature-inventory.md)** — what ships today, known limits, extension points  

Then dive into topic docs as needed:

| Doc | When you need it |
| --- | ---------------- |
| [Handbook](./handbook.md) | Product overview / pitch |
| [Editing depth](./editing.md) | Layers, tools, crop, retouch, history |
| [Format conversion](./conversion.md) | Export + batch convert, HEIC/AVIF/EXIF |
| [Offline support](./offline.md) | Service worker + IndexedDB projects |
| [Mobile & PWA](./mobile.md) | Install, touch crop, safe areas |
| [Page Agent](./page-agent.md) | In-app help, heuristics, LLM API |
| [UI & design system](./ui-design-system.md) | CSS tokens, button/panel classes, motion |

## Mental model (30 seconds)

Lumen is a **single Next.js App Router app**. One image becomes an `EditorDoc` in React state. Paint pixels live in an offscreen `PaintStore`. The preview canvas is redrawn by `composeEdited`. Undo stores PNG snapshots. Export/batch convert encode canvas pixels in the browser. Projects save to IndexedDB; a service worker caches the shell for offline use.

There is **no backend for images**, **no auth**, **no monorepo packages**. The only optional server route is `/api/page-agent` for help text.
