# Editing depth

How Lumen’s deeper editing tools work.

## Document model

Each open image becomes an **editor document**:

- Fixed pixel size (`width` × `height`)
- Ordered **layers**: `background` | `paint` | `text` (index 0 = bottom; background stays at the bottom)
- Non-destructive **adjustments** (brightness / contrast / saturation / rotate / flip) applied at compose time
- Optional draft **crop** until you Apply (then the crop is baked)

Paint pixels live in offscreen canvases (`PaintStore`). History snapshots store paint PNG data URLs plus an optional baked background.

## Undo / redo

- Stack limit: 40 snapshots (`HISTORY_LIMIT`)
- Commits on: brush stroke end, text drag end / text blur / text rotation commit, crop apply, resize apply, red-eye click, retouch stroke end, heal selection, clear selection on paint, layer add/delete/visibility/reorder/clone, adjustment slider release, rotate/flip
- Shortcuts: Ctrl/Cmd+Z undo, Ctrl/Cmd+Shift+Z or Ctrl+Y redo

## Crop

- Aspects: Free, 1:1, 4:3, 3:2, 16:9, 9:16
- Interior drag moves; corner and edge handles reshape (respecting aspect when locked)
- **Apply crop** extracts the region from background and each paint layer, shifts text, and **preserves layer order**
- Crop preview uses identity rotate/flip so the box matches pixels; mobile Rotate exits crop then applies 90° so the change is visible
- Pointer tools (brush, retouch, red-eye, text drag) inverse-map through rotate/flip so strokes land on the correct document pixels

## Resize

Sets document size in pixels (1–8000). Resamples background and paint with high-quality smoothing; scales text position and font size.

## Red-eye

Click near a pupil. In a circular radius, red-dominant pixels are desaturated toward the green/blue average. Result is written to the background bitmap.

## Brush & text

- Brush draws only on the **active paint layer**
- Text is vector-like metadata (string, font, color, position, **rotation** in degrees) composited each frame
- Drag text on the canvas to move; use the Text panel Rotation slider (−180…180)

## Layers

- **Up / Down** — reorder in the stack (background cannot move or leave index 0)
- **Clone** — duplicates a paint layer (pixels copied) or text layer (offset +24px)
- Visibility, opacity, add paint/text, delete active (not background)

## Retouch

Panel tools:

| Tool | Behavior |
| ---- | -------- |
| **Marquee** | Drag a rectangle selection (dashed overlay) |
| **Heal** | Soft brush blends toward samples outside the tip; bakes into the background |
| **Clone** | Alt/Option-click to set source (marker on canvas), then paint to stamp with classic offset; source pixels are frozen for the stroke |

Also:

- **Heal selection** — runs heal dabs across the marquee on the background
- **Clear selection** — clears alpha inside the marquee on the **active paint layer**
- **Deselect** — clears the marquee without editing pixels
- Size and strength sliders apply to heal/clone brushes

## See also

- [Architecture](./architecture.md) — compose + pointer mapping
- [Code map](./code-map.md) — editor files
- [Developer guide](./developer-guide.md) — how to add a tool
