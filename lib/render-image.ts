import type { Adjustments, CropRect, ExportFormat } from "@/lib/editor-types";

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

/** Draw the edited image into a canvas (caller owns the canvas element). */
export function drawEditedImage(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  sourceW: number,
  sourceH: number,
  adjustments: Adjustments,
  crop: CropRect | null,
): void {
  const { width, height } = outputSize(sourceW, sourceH, adjustments, crop);
  ctx.canvas.width = Math.max(1, Math.round(width));
  ctx.canvas.height = Math.max(1, Math.round(height));
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  const sx = crop?.x ?? 0;
  const sy = crop?.y ?? 0;
  const sw = crop?.w ?? sourceW;
  const sh = crop?.h ?? sourceH;

  ctx.save();
  ctx.filter = filterCss(adjustments);
  ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);
  ctx.rotate((adjustments.rotate * Math.PI) / 180);
  ctx.scale(adjustments.flipH ? -1 : 1, adjustments.flipV ? -1 : 1);
  ctx.drawImage(image, sx, sy, sw, sh, -sw / 2, -sh / 2, sw, sh);
  ctx.restore();
}

export async function exportBlob(
  image: CanvasImageSource,
  sourceW: number,
  sourceH: number,
  adjustments: Adjustments,
  crop: CropRect | null,
  format: ExportFormat,
  quality: number,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available in this browser.");

  drawEditedImage(ctx, image, sourceW, sourceH, adjustments, crop);

  const q =
    format === "image/png" ? undefined : Math.min(1, Math.max(0.05, quality));

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error("Export failed."));
        else resolve(blob);
      },
      format,
      q,
    );
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function stemFromName(name: string) {
  const i = name.lastIndexOf(".");
  return i > 0 ? name.slice(0, i) : name || "image";
}
