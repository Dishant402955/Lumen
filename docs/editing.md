# Editing depth

How Lumen’s deeper editing tools work.

## Document model

Each open image becomes an **editor document**:

- Fixed pixel size (`width` × `height`)
- Ordered **layers**: `background` | `paint` | `text`
- Non-destructive **adjustments** (brightness / contrast / saturation / rotate / flip) applied at compose time
- Optional draft **crop** until you Apply (then the crop is baked)

Paint pixels live in offscreen canvases (`PaintStore`). History snapshots store paint PNG data URLs plus an optional baked background.

## Undo / redo

- Stack limit: 40 snapshots (`HISTORY_LIMIT`)
- Commits on: brush stroke end, text drag end / text blur, crop apply, resize apply, red-eye click, layer add/delete/visibility, adjustment slider release, rotate/flip
- Shortcuts: Ctrl/Cmd+Z undo, Ctrl/Cmd+Shift+Z or Ctrl+Y redo

## Crop

- Aspects: Free, 1:1, 4:3, 3:2, 16:9, 9:16
- Interior drag moves; corner and edge handles reshape (respecting aspect when locked)
- **Apply crop** extracts the region from background and each paint layer and shifts text coordinates

## Resize

Sets document size in pixels (1–8000). Resamples background and paint with high-quality smoothing; scales text position and font size.

## Red-eye

Click near a pupil. In a circular radius, red-dominant pixels are desaturated toward the green/blue average. Result is written to the background bitmap.

## Brush & text

- Brush draws only on the **active paint layer**
- Text is vector-like metadata (string, font, color, position) composited each frame
