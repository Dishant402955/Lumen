"use client";

import type { CropRect } from "@/lib/editor-types";

export function SelectionOverlay({
  imageWidth,
  imageHeight,
  selection,
  draft,
  cloneSource,
}: {
  imageWidth: number;
  imageHeight: number;
  selection: CropRect | null;
  draft: CropRect | null;
  cloneSource?: { x: number; y: number } | null;
}) {
  const rect = draft ?? selection;

  return (
    <div className="pointer-events-none absolute inset-0">
      {rect && imageWidth > 0 && imageHeight > 0 ? (
        <div
          className="absolute border border-dashed border-white/90 bg-[rgba(196,164,106,0.15)] shadow-[0_0_0_9999px_rgba(0,0,0,0.25)]"
          style={{
            left: `${(rect.x / imageWidth) * 100}%`,
            top: `${(rect.y / imageHeight) * 100}%`,
            width: `${(rect.w / imageWidth) * 100}%`,
            height: `${(rect.h / imageHeight) * 100}%`,
          }}
        />
      ) : null}
      {cloneSource && imageWidth > 0 && imageHeight > 0 ? (
        <div
          className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[var(--accent)]"
          style={{
            left: `${(cloneSource.x / imageWidth) * 100}%`,
            top: `${(cloneSource.y / imageHeight) * 100}%`,
          }}
        />
      ) : null}
    </div>
  );
}
