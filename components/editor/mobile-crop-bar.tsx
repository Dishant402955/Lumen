"use client";

import { cn } from "@/lib/cn";
import { CROP_ASPECTS, CropAspect } from "@/lib/editor-types";

/** Sticky crop controls shown above the mobile tab bar while cropping. */
export function MobileCropBar({
  cropAspect,
  setCropAspect,
  onApply,
  onCancel,
  onRotate,
}: {
  cropAspect: CropAspect;
  setCropAspect: (a: CropAspect) => void;
  onApply: () => void;
  onCancel: () => void;
  onRotate: () => void;
}) {
  return (
    <div className="border-b border-[var(--line)] bg-[rgba(250,247,240,0.96)] px-3 py-2.5 backdrop-blur-md">
      <div className="mb-2 flex gap-2">
        <button
          type="button"
          className="lumen-btn lumen-btn-accent min-h-11 flex-1"
          onClick={onApply}
        >
          Apply crop
        </button>
        <button
          type="button"
          className="lumen-btn min-h-11 flex-1"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="button"
          className="lumen-btn min-h-11"
          onClick={onRotate}
          title="Rotate 90°"
        >
          Rotate
        </button>
      </div>
      <div className="flex gap-1 overflow-x-auto pb-1">
        {CROP_ASPECTS.map((a) => (
          <button
            key={a.id}
            type="button"
            data-active={cropAspect === a.id}
            className={cn(
              "lumen-tab min-h-10 shrink-0 px-3 text-xs",
              cropAspect === a.id && "shadow-[0_8px_18px_rgba(20,18,15,0.16)]",
            )}
            onClick={() => setCropAspect(a.id)}
          >
            {a.label}
          </button>
        ))}
      </div>
      <p className="mt-1.5 text-[11px] leading-snug text-[var(--muted)]">
        Drag the box to move · pull corner/edge handles to reshape
      </p>
    </div>
  );
}
