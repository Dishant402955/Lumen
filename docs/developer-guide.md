# Developer guide

Practical handbook for continuing Lumen development manually.

## Prerequisites

- Node.js 20+ recommended  
- **pnpm** (project uses `pnpm-lock.yaml`)  
- Modern Chromium for AVIF encode testing; any current browser for most features  

## First-time setup

```bash
cd C:\dishant\Lumen   # or your clone path
pnpm install
cp example.env .env.local   # optional — only for LLM help
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### pnpm `allowBuilds`

`pnpm-workspace.yaml` only configures `allowBuilds` for native deps (`sharp`, `unrs-resolver`). It is **not** a multi-package monorepo. If pnpm prompts to approve build scripts, approve them.

## Everyday commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Dev server (Turbopack) |
| `pnpm build` | Production build (`next build`; turbopack may be used depending on Next config) |
| `pnpm start` | Serve production build |
| `pnpm lint` | ESLint |
| `pnpm exec tsc --noEmit` | Typecheck without emit |

## Project shape

```
app/                  # Next.js routes (page + optional API)
  layout.tsx          # fonts, metadata, ClientBootstrap
  page.tsx            # mounts EditorShell
  globals.css         # design tokens + UI utility classes
  api/page-agent/     # optional LLM help proxy
components/
  editor/             # entire editor UI
  page-agent/         # help FAB, heuristics, highlights
  client-bootstrap.tsx
lib/                  # pure-ish domain logic (canvas, convert, offline)
public/               # sw.js, icons, manifest
docs/                 # you are here
types/                # ambient typings (e.g. elheif)
```

## Environment variables

See `example.env`:

| Variable | Required? | Purpose |
| --- | --- | --- |
| `PAGE_AGENT_API_KEY` | No | Enables LLM answers for Help |
| `PAGE_AGENT_BASE_URL` | No | OpenAI-compatible base URL |
| `PAGE_AGENT_MODEL` | No | Model id (default `gpt-4o-mini`) |
| `NEXT_PUBLIC_APP_URL` | No | Public URL for metadata |

Without an API key, Help uses **local heuristics** only (works offline).

## Architecture rules (do not break casually)

1. **Pixels stay client-side** — never upload images to a server.  
2. **Background is index 0** — never reorder background below other layers.  
3. **Commit history after meaningful edits** — use `commitSnapshot(doc)` (via shell helpers). Live slider drags update React state; release commits.  
4. **Pointer tools must use `clientToDoc` / `pointer-math`** — preview can be rotated/flipped; raw CSS coords are wrong.  
5. **Destructive background edits** (red-eye, heal, clone, crop bake, resize) write into `backgroundCanvasRef` and bump `bgVersion`.  
6. **Paint lives in `PaintStore`**, not React state — capture into history as PNG data URLs.  
7. **Desktop and mobile each mount one `ToolPanel`** (matchMedia) — don’t reintroduce dual mounted panels with separate batch state.  

## How to add a tool panel

1. Add a `PanelId` and label in `components/editor/tool-panel.tsx` (`PANEL_IDS`, `PANEL_LABELS`).  
2. Add UI section under `{panel === "yourId" ? …}`.  
3. Wire props from `EditorShell` → `toolPanelProps`.  
4. If it needs a canvas tool, extend `EditorTool` in `lib/editor-types.ts` and handle pointers in `editor-shell.tsx`.  
5. Register Page Agent target in `components/page-agent/targets.ts` + heuristic rule in `heuristics.ts`.  
6. Add `"yourId"` to `PANEL_IDS` in `app/api/page-agent/route.ts` if the LLM may open that panel.  
7. Document in `docs/editing.md` or the relevant topic doc.

## How to add an export / convert format

1. Extend `ConvertFormat` + `CONVERT_FORMATS` in `lib/convert/types.ts`.  
2. Implement encode branch in `lib/convert/encode.ts` (`encodeImage`).  
3. Update EXIF support flag (`full` | `partial` | `none`).  
4. Update `docs/conversion.md` and Convert panel help text.  
5. Test: editor Export + batch Convert + ZIP.

## How to change undo behavior

- History lives in `lib/history.ts` (`HISTORY_LIMIT` is in `editor-types.ts`, currently **40**).  
- Snapshots are created by `captureSnapshot` in `editor-shell.tsx`.  
- Large images → large memory; if you raise the limit, watch heap usage.  
- After async restore (`undo`/`redo`), respect `historyOpRef` so overlapping restores don’t race.

## How to change UI look

- Tokens and shared classes: `app/globals.css` (`.lumen-btn`, `.lumen-panel`, `.lumen-tab`, …).  
- Prefer those classes over one-off Tailwind for buttons/panels.  
- Fonts: Fraunces (display) + Source Sans 3 (body) in `app/layout.tsx`.  
- Brand: warm stone paper + brass accent — avoid purple “AI slop” themes.  
- Details: [UI & design system](./ui-design-system.md).

## Debugging checklist

| Symptom | Likely cause | Where to look |
| --- | --- | --- |
| Brush/heal hits wrong place after rotate | Missing inverse pointer map | `lib/pointer-math.ts`, `clientToDoc` |
| Text snaps back after drag | `docRef` not updated during drag | `onPointerMove` text drag |
| Undo while typing text wipes draft | Shortcut not ignoring inputs | keydown handler in shell |
| Crop reordered layers | Mapping paints then texts separately | `applyCrop` must map in order |
| Offline never “Offline-ready” | SW registered only on `load` after it fired | `lib/register-sw.ts` |
| Duplicate projects in list | Save without reserved id | `saveProjectNow` mutex + pre-id |
| JPEG looks rotated after export | EXIF Orientation re-applied | `lib/convert/exif.ts` (force `1`) |
| HEIC export fails | WASM encoder not loaded / OOM | `lib/convert/heic-encode.ts`, `elheif` |
| AVIF export fails | Browser lacks `toBlob('image/avif')` | Chromium; see conversion.md |
| Install button missing | `beforeinstallprompt` before React | `lib/install-prompt-capture.ts` + `ClientBootstrap` |
| Help highlights wrong / duplicate | Two panels with same `data-lumen-id` | Only one ToolPanel mounted |

## Service worker notes

- Source: `public/sw.js` (version string inside — bump when changing cache strategy).  
- Registration: `lib/register-sw.ts`.  
- After changing `sw.js`, hard-refresh or use **Update app** when waiting.  
- Never cache `/api/*`.

## Testing manually (no automated suite)

1. Open JPEG + HEIC; drag-drop.  
2. Adjust → release slider → Undo.  
3. Rotate 90° → paint / heal — strokes must align.  
4. Add paint + text, reorder, clone, delete.  
5. Crop apply; confirm layer order preserved.  
6. Retouch: marquee, heal, Alt-click clone source, stamp.  
7. Export PNG/JPEG/WebP; try AVIF on Chrome; HEIC (first call loads WASM).  
8. Batch convert 3 files → ZIP.  
9. Save project, reload offline (DevTools → Network → Offline).  
10. Mobile width: bottom tabs, crop bar, help FAB above sheet.

## Git / release

- Commit when you choose; no CI is configured in-repo.  
- Bump SW version in `public/sw.js` when cache behavior changes.  
- Keep `docs/` updated when you ship a user-visible feature.

## Related

- [Architecture](./architecture.md)  
- [Code map](./code-map.md)  
- [Feature inventory](./feature-inventory.md)
