import type { CropAspect, CropRect } from "@/lib/editor-types";
import { CROP_ASPECTS } from "@/lib/editor-types";

export function aspectRatio(aspect: CropAspect): number | null {
  return CROP_ASPECTS.find((a) => a.id === aspect)?.ratio ?? null;
}

export function clampCrop(
  crop: CropRect,
  imageWidth: number,
  imageHeight: number,
): CropRect {
  const w = Math.max(8, Math.min(imageWidth, Math.round(crop.w)));
  const h = Math.max(8, Math.min(imageHeight, Math.round(crop.h)));
  const x = Math.max(0, Math.min(imageWidth - w, Math.round(crop.x)));
  const y = Math.max(0, Math.min(imageHeight - h, Math.round(crop.y)));
  return { x, y, w, h };
}

export function applyAspectToCrop(
  crop: CropRect,
  aspect: CropAspect,
  imageWidth: number,
  imageHeight: number,
  anchor: "center" | "tl" = "center",
): CropRect {
  const ratio = aspectRatio(aspect);
  if (!ratio) return clampCrop(crop, imageWidth, imageHeight);

  let w = crop.w;
  let h = w / ratio;
  if (h > imageHeight) {
    h = imageHeight;
    w = h * ratio;
  }
  if (w > imageWidth) {
    w = imageWidth;
    h = w / ratio;
  }

  let x = crop.x;
  let y = crop.y;
  if (anchor === "center") {
    x = crop.x + (crop.w - w) / 2;
    y = crop.y + (crop.h - h) / 2;
  }

  return clampCrop({ x, y, w, h }, imageWidth, imageHeight);
}

export type CropHandle =
  | "move"
  | "n"
  | "s"
  | "e"
  | "w"
  | "ne"
  | "nw"
  | "se"
  | "sw";

export function resizeCropFromHandle(
  origin: CropRect,
  handle: CropHandle,
  pointer: { x: number; y: number },
  imageWidth: number,
  imageHeight: number,
  aspect: CropAspect,
): CropRect {
  const ratio = aspectRatio(aspect);
  let { x, y, w, h } = origin;

  if (handle === "move") {
    return clampCrop(
      { x: pointer.x, y: pointer.y, w, h },
      imageWidth,
      imageHeight,
    );
  }

  const right = origin.x + origin.w;
  const bottom = origin.y + origin.h;

  if (handle.includes("e")) w = pointer.x - origin.x;
  if (handle.includes("s")) h = pointer.y - origin.y;
  if (handle.includes("w")) {
    x = pointer.x;
    w = right - pointer.x;
  }
  if (handle.includes("n")) {
    y = pointer.y;
    h = bottom - pointer.y;
  }

  if (ratio) {
    const fromCorner = handle.length === 2;
    const fromEdge = handle.length === 1;
    if (fromCorner || handle === "e" || handle === "w") {
      h = w / ratio;
      if (handle.includes("n")) y = bottom - h;
    } else if (fromEdge) {
      w = h * ratio;
      if (handle.includes("w")) x = right - w;
    }
  }

  if (w < 8) {
    w = 8;
    if (handle.includes("w")) x = right - 8;
  }
  if (h < 8) {
    h = 8;
    if (handle.includes("n")) y = bottom - 8;
  }

  return clampCrop({ x, y, w, h }, imageWidth, imageHeight);
}
