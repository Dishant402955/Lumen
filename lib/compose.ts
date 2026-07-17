import type {
  Adjustments,
  CropRect,
  EditorDoc,
  ExportFormat,
  TextLayer,
} from "@/lib/editor-types";
import type { PaintStore } from "@/lib/paint-store";
import { encodeImage } from "@/lib/convert/encode";
import type { ExifPayload } from "@/lib/convert/exif";
import { downloadBlob as downloadBlobConvert, stemFromName as stemConvert } from "@/lib/convert/encode";

export function filterCss(adjustments: Adjustments): string {
  const brightness = 1 + adjustments.brightness / 100;
  const contrast = 1 + adjustments.contrast / 100;
  const saturation = 1 + adjustments.saturation / 100;
  return `brightness(${brightness}) contrast(${contrast}) saturate(${saturation})`;
}

export function outputSize(
  sourceW: number,
  sourceH: number,
  adjustments: Adjustments,
  crop: CropRect | null,
): { width: number; height: number } {
  const baseW = crop?.w ?? sourceW;
  const baseH = crop?.h ?? sourceH;
  const quarter = adjustments.rotate % 180 !== 0;
  return {
    width: quarter ? baseH : baseW,
    height: quarter ? baseW : baseH,
  };
}

function drawText(ctx: CanvasRenderingContext2D, layer: TextLayer) {
  ctx.save();
  ctx.globalAlpha = layer.opacity / 100;
  ctx.fillStyle = layer.color;
  ctx.font = `${layer.fontSize}px ${layer.fontFamily}`;
  ctx.textAlign = layer.align;
  ctx.textBaseline = "middle";
  ctx.fillText(layer.text, layer.x, layer.y);
  ctx.restore();
}

/** Flat composite in document space (no crop/adjust yet). */
export function drawDocumentFlat(
  ctx: CanvasRenderingContext2D,
  doc: EditorDoc,
  background: CanvasImageSource,
  paintStore: PaintStore,
): void {
  ctx.canvas.width = Math.max(1, doc.width);
  ctx.canvas.height = Math.max(1, doc.height);
  ctx.clearRect(0, 0, doc.width, doc.height);

  for (const layer of doc.layers) {
    if (!layer.visible) continue;
    ctx.save();
    ctx.globalAlpha = layer.opacity / 100;
    if (layer.kind === "background") {
      ctx.drawImage(background, 0, 0, doc.width, doc.height);
    } else if (layer.kind === "paint") {
      const paint = paintStore.get(layer.id) ?? paintStore.ensure(layer.id, doc.width, doc.height);
      ctx.drawImage(paint, 0, 0);
    } else if (layer.kind === "text") {
      drawText(ctx, layer);
    }
    ctx.restore();
  }
}

/** Full preview/export pipeline: flat → crop → color/rotate/flip. */
export function composeEdited(
  ctx: CanvasRenderingContext2D,
  doc: EditorDoc,
  background: CanvasImageSource,
  paintStore: PaintStore,
  options?: { ignoreCrop?: boolean; forceIdentityTransform?: boolean },
): void {
  const flat = document.createElement("canvas");
  const flatCtx = flat.getContext("2d");
  if (!flatCtx) return;
  drawDocumentFlat(flatCtx, doc, background, paintStore);

  const crop = options?.ignoreCrop ? null : doc.crop;
  const adjustments = options?.forceIdentityTransform
    ? {
        ...doc.adjustments,
        rotate: 0 as const,
        flipH: false,
        flipV: false,
      }
    : doc.adjustments;

  const { width, height } = outputSize(doc.width, doc.height, adjustments, crop);
  ctx.canvas.width = Math.max(1, Math.round(width));
  ctx.canvas.height = Math.max(1, Math.round(height));
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  const sx = crop?.x ?? 0;
  const sy = crop?.y ?? 0;
  const sw = crop?.w ?? doc.width;
  const sh = crop?.h ?? doc.height;

  ctx.save();
  ctx.filter = filterCss(adjustments);
  ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);
  ctx.rotate((adjustments.rotate * Math.PI) / 180);
  ctx.scale(adjustments.flipH ? -1 : 1, adjustments.flipV ? -1 : 1);
  ctx.drawImage(flat, sx, sy, sw, sh, -sw / 2, -sh / 2, sw, sh);
  ctx.restore();
}

export async function exportDocument(
  doc: EditorDoc,
  background: CanvasImageSource,
  paintStore: PaintStore,
  format: ExportFormat,
  quality: number,
  exif: ExifPayload | null = null,
  keepExif = true,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available in this browser.");
  composeEdited(ctx, doc, background, paintStore);

  return encodeImage(
    canvas,
    canvas.width,
    canvas.height,
    { format, quality, keepExif },
    exif,
  );
}

export function downloadBlob(blob: Blob, filename: string) {
  downloadBlobConvert(blob, filename);
}

export function stemFromName(name: string) {
  return stemConvert(name);
}

/** Bake current flat pixels into a background canvas of given size. */
export function bakeToCanvas(
  doc: EditorDoc,
  background: CanvasImageSource,
  paintStore: PaintStore,
  region?: CropRect | null,
): HTMLCanvasElement {
  const flat = document.createElement("canvas");
  const flatCtx = flat.getContext("2d");
  if (!flatCtx) throw new Error("Canvas unavailable");
  drawDocumentFlat(flatCtx, doc, background, paintStore);

  const sx = region?.x ?? 0;
  const sy = region?.y ?? 0;
  const sw = region?.w ?? doc.width;
  const sh = region?.h ?? doc.height;

  const out = document.createElement("canvas");
  out.width = Math.max(1, Math.round(sw));
  out.height = Math.max(1, Math.round(sh));
  const ctx = out.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.drawImage(flat, sx, sy, sw, sh, 0, 0, out.width, out.height);
  return out;
}

export function resizeCanvas(
  source: CanvasImageSource,
  width: number,
  height: number,
): HTMLCanvasElement {
  const out = document.createElement("canvas");
  out.width = Math.max(1, Math.round(width));
  out.height = Math.max(1, Math.round(height));
  const ctx = out.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, out.width, out.height);
  return out;
}
