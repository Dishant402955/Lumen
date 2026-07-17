import type { CropRect } from "@/lib/editor-types";

/** Soft circular heal: blend toward nearby outside samples. Mutates ImageData. */
export function healBrush(
  imageData: ImageData,
  cx: number,
  cy: number,
  radius: number,
  strength: number,
): void {
  const { data, width, height } = imageData;
  const r = Math.max(2, radius);
  const r2 = r * r;
  const sampleR = Math.round(r * 1.6);
  const s = Math.max(0, Math.min(1, strength / 100));

  const x0 = Math.max(0, Math.floor(cx - r));
  const y0 = Math.max(0, Math.floor(cy - r));
  const x1 = Math.min(width - 1, Math.ceil(cx + r));
  const y1 = Math.min(height - 1, Math.ceil(cy + r));

  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist2 = dx * dx + dy * dy;
      if (dist2 > r2) continue;

      // Sample a ring outside the brush
      const angle = Math.atan2(dy, dx);
      const sx = Math.round(cx + Math.cos(angle) * sampleR);
      const sy = Math.round(cy + Math.sin(angle) * sampleR);
      const sample = samplePixel(data, width, height, sx, sy);
      if (!sample) continue;

      const i = (y * width + x) * 4;
      const edge = 1 - Math.sqrt(dist2) / r;
      const t = s * Math.max(0, edge);
      data[i] = Math.round(data[i] * (1 - t) + sample[0] * t);
      data[i + 1] = Math.round(data[i + 1] * (1 - t) + sample[1] * t);
      data[i + 2] = Math.round(data[i + 2] * (1 - t) + sample[2] * t);
    }
  }
}

/** Heal every pixel inside a rectangular selection. */
export function healSelection(
  imageData: ImageData,
  selection: CropRect,
  strength: number,
): void {
  const step = Math.max(4, Math.round(Math.min(selection.w, selection.h) / 8));
  for (let y = selection.y; y < selection.y + selection.h; y += step) {
    for (let x = selection.x; x < selection.x + selection.w; x += step) {
      healBrush(
        imageData,
        x + step / 2,
        y + step / 2,
        step * 0.9,
        strength,
      );
    }
  }
}

/** Clone stamp dab: copy from source offset with soft mask. */
export function cloneBrush(
  dest: ImageData,
  source: ImageData,
  cx: number,
  cy: number,
  radius: number,
  offsetX: number,
  offsetY: number,
  strength: number,
): void {
  const { data, width, height } = dest;
  const src = source.data;
  const r = Math.max(2, radius);
  const r2 = r * r;
  const s = Math.max(0, Math.min(1, strength / 100));

  const x0 = Math.max(0, Math.floor(cx - r));
  const y0 = Math.max(0, Math.floor(cy - r));
  const x1 = Math.min(width - 1, Math.ceil(cx + r));
  const y1 = Math.min(height - 1, Math.ceil(cy + r));

  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist2 = dx * dx + dy * dy;
      if (dist2 > r2) continue;

      const sx = Math.round(x + offsetX);
      const sy = Math.round(y + offsetY);
      if (sx < 0 || sy < 0 || sx >= width || sy >= height) continue;

      const i = (y * width + x) * 4;
      const si = (sy * width + sx) * 4;
      const edge = 1 - Math.sqrt(dist2) / r;
      const t = s * Math.max(0, edge);
      data[i] = Math.round(data[i] * (1 - t) + src[si] * t);
      data[i + 1] = Math.round(data[i + 1] * (1 - t) + src[si + 1] * t);
      data[i + 2] = Math.round(data[i + 2] * (1 - t) + src[si + 2] * t);
    }
  }
}

/** Clear (transparent) a rectangle on a paint layer ImageData. */
export function clearSelection(imageData: ImageData, selection: CropRect): void {
  const { data, width, height } = imageData;
  const x0 = Math.max(0, Math.floor(selection.x));
  const y0 = Math.max(0, Math.floor(selection.y));
  const x1 = Math.min(width, Math.ceil(selection.x + selection.w));
  const y1 = Math.min(height, Math.ceil(selection.y + selection.h));
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * width + x) * 4;
      data[i + 3] = 0;
    }
  }
}

function samplePixel(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  x: number,
  y: number,
): [number, number, number] | null {
  if (x < 0 || y < 0 || x >= width || y >= height) {
    // clamp to edge
    x = Math.max(0, Math.min(width - 1, x));
    y = Math.max(0, Math.min(height - 1, y));
  }
  const i = (y * width + x) * 4;
  return [data[i], data[i + 1], data[i + 2]];
}
