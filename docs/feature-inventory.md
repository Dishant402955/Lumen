# Feature inventory

What Lumen ships today, what is intentionally out of scope, and what is still limited.

Use this when planning work or checking whether something is “missing” vs “never planned.”

## Shipped (complete for the product vision)

### Core editor

- [x] Open / drag-drop images (incl. HEIC/HEIF decode via `heic2any`)
- [x] Adjustments: brightness, contrast, saturation, rotate 90°, flip H/V
- [x] Crop with aspects + handles; Apply bakes; layer order preserved
- [x] Resize document (1–8000 px) with resample + text scale
- [x] Brush on paint layers (color, size, opacity, soft)
- [x] Text layers: content, size, color, **rotation**, drag move
- [x] Layers: visibility, opacity, add paint/text, delete, **Up/Down**, **Clone**
- [x] Red-eye (background bake)
- [x] Retouch: marquee, heal brush, clone stamp (Alt/Option source), heal/clear selection
- [x] Undo / redo (~40 steps), keyboard shortcuts (skipped in text fields)
- [x] Pointer mapping through rotate/flip

### Export & convert

- [x] Export PNG, JPEG, WebP, AVIF, HEVC HEIC
- [x] Batch convert + per-file download + ZIP
- [x] Keep EXIF on JPEG (Orientation normalized); partial PNG/WebP
- [x] HEIC output via `elheif` (libheif + kvazaar WASM)

### Offline / PWA

- [x] Service worker shell/static/runtime caches
- [x] IndexedDB recent projects (auto-save ~1.8s + manual Save)
- [x] Install prompt + icons + manifest
- [x] Mobile bottom sheet, crop bar, large rotate/flip

### Help

- [x] Page Agent heuristics + optional LLM
- [x] Highlight targets + Point-at-UI
- [x] `lumen:goto-panel` navigation

### UX / polish

- [x] Design system tokens + shared button/panel classes
- [x] Status chips, empty-state drop zone, sticky desktop panel
- [x] Single ToolPanel mount (desktop XOR mobile)

## Intentionally out of scope

Do **not** treat these as incomplete work unless product goals change:

- User accounts / cloud sync / multi-device projects  
- Automated test suite / CI pipelines  
- Native desktop/mobile apps (this is web-only)  
- Server-side image processing  

## Known limits (honest backlog if you choose to extend)

| Area | Limit | Notes if you extend |
| --- | --- | --- |
| AVIF encode | Needs Chromium `canvas.toBlob('image/avif')` | Consider WASM AVIF encoder later |
| AVIF EXIF | Not injected | Would need format-specific metadata writing |
| HEIC EXIF | Not injected on HEVC output | Would need HEIF Exif item support |
| HEIC quality | Encoder defaults (no quality slider) | `elheif` API has no Q param today |
| HEIC sequences | Decode uses first frame only | Warn or pick frame |
| History memory | Full PNG snapshots × 40 | Cap resolution, delta paint, or IDB-backed history |
| Retouch | RGB heal/clone on background | Not content-aware fill; no paint-layer heal |
| Clone on touch | Alt-click for source | Add long-press source UX for mobile |
| Non-destructive crop | Apply bakes immediately | True `doc.crop` until export would be a redesign |

## Extension ideas (optional)

Prioritize only if users need them:

1. Mobile-friendly clone-source gesture  
2. Layer blend modes  
3. HEIC EXIF inject  
4. WASM AVIF for Firefox/Safari  
5. Lighter history storage  
6. Multi-frame HEIC picker  

## Verification matrix (manual)

| Feature | Quick check |
| --- | --- |
| Open HEIC | Drop `.heic`, see canvas |
| Rotate + brush | Rotate 90°, paint — stroke matches cursor |
| Layer clone | Clone paint, both visible |
| Text rotation | Slider −45°, export, confirm |
| Retouch clone | Alt-click source, stamp elsewhere |
| Crop order | paint→text→paint stack survives Apply |
| Export HEIC | First export may pause (WASM load) |
| Offline | Save → DevTools Offline → reopen project |
| Help | Ask “how do I crop?” → highlight Crop |

## Related

- [Developer guide](./developer-guide.md)  
- [Editing depth](./editing.md)  
- [Format conversion](./conversion.md)
