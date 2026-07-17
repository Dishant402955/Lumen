import type { Adjustments, CropRect } from "@/lib/editor-types";
import { outputSize } from "@/lib/compose";

export type PointerMapOptions = {
  docWidth: number;
  docHeight: number;
  adjustments: Adjustments;
  crop: CropRect | null;
  /** Match composeEdited preview flags */
  ignoreCrop?: boolean;
  forceIdentityTransform?: boolean;
};

function activeCrop(options: PointerMapOptions): CropRect {
  if (options.ignoreCrop) {
    return { x: 0, y: 0, w: options.docWidth, h: options.docHeight };
  }
  return (
    options.crop ?? {
      x: 0,
      y: 0,
      w: options.docWidth,
      h: options.docHeight,
    }
  );
}

function activeAdjustments(options: PointerMapOptions): Adjustments {
  if (options.forceIdentityTransform) {
    return {
      ...options.adjustments,
      rotate: 0,
      flipH: false,
      flipV: false,
    };
  }
  return options.adjustments;
}

/** Map a point on the preview canvas (output / CSS space) into document space. */
export function outputPointToDoc(
  outX: number,
  outY: number,
  options: PointerMapOptions,
): { x: number; y: number } {
  const adj = activeAdjustments(options);
  const crop = activeCrop(options);
  const { width: outW, height: outH } = outputSize(
    options.docWidth,
    options.docHeight,
    adj,
    options.ignoreCrop ? null : options.crop,
  );

  const ox = outX - outW / 2;
  const oy = outY - outH / 2;

  const rad = (-adj.rotate * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const rx = ox * cos - oy * sin;
  const ry = ox * sin + oy * cos;

  const localX = adj.flipH ? -rx : rx;
  const localY = adj.flipV ? -ry : ry;

  return {
    x: localX + crop.w / 2 + crop.x,
    y: localY + crop.h / 2 + crop.y,
  };
}

/** Map a document-space point into preview canvas (output) space. */
export function docPointToOutput(
  docX: number,
  docY: number,
  options: PointerMapOptions,
): { x: number; y: number } {
  const adj = activeAdjustments(options);
  const crop = activeCrop(options);
  const { width: outW, height: outH } = outputSize(
    options.docWidth,
    options.docHeight,
    adj,
    options.ignoreCrop ? null : options.crop,
  );

  let localX = docX - crop.x - crop.w / 2;
  let localY = docY - crop.y - crop.h / 2;
  if (adj.flipH) localX = -localX;
  if (adj.flipV) localY = -localY;

  const rad = (adj.rotate * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const ox = localX * cos - localY * sin;
  const oy = localX * sin + localY * cos;

  return { x: ox + outW / 2, y: oy + outH / 2 };
}

/** Axis-aligned bounds in output space for a doc-space rectangle. */
export function docRectToOutputBounds(
  rect: CropRect,
  options: PointerMapOptions,
): CropRect {
  const corners = [
    docPointToOutput(rect.x, rect.y, options),
    docPointToOutput(rect.x + rect.w, rect.y, options),
    docPointToOutput(rect.x, rect.y + rect.h, options),
    docPointToOutput(rect.x + rect.w, rect.y + rect.h, options),
  ];
  const xs = corners.map((c) => c.x);
  const ys = corners.map((c) => c.y);
  const x0 = Math.min(...xs);
  const y0 = Math.min(...ys);
  return {
    x: x0,
    y: y0,
    w: Math.max(...xs) - x0,
    h: Math.max(...ys) - y0,
  };
}
