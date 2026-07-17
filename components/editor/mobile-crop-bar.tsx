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
    <div className="border-b border-[var(--line)] bg-[var(--panel)]/95 px-3 py-2 backdrop-blur-md lg:hidden">
      <div className="mb-2 flex gap-2">
        <button
          type="button"
          className="min-h-11 flex-1 rounded-xl bg-[var(--accent)] px-3 text-sm font-semibold text-[var(--accent-ink)]"
          onClick={onApply}
        >
          Apply crop
        </button>
        <button
          type="button"
          className="min-h-11 flex-1 rounded-xl border border-[var(--line)] px-3 text-sm"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="button"
          className="min-h-11 rounded-xl border border-[var(--line)] px-3 text-sm"
          onClick={onRotate}
          title="Rotate 90° (preview resets during crop; rotation applies after)"
        >
          Rotate
        </button>
      </div>
      <div className="flex gap-1 overflow-x-auto pb-1">
        {CROP_ASPECTS.map((a) => (
          <button
            key={a.id}
            type="button"
            className={cn(
              "min-h-10 shrink-0 rounded-lg border px-3 text-xs",
              cropAspect === a.id
                ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]"
                : "border-[var(--line)]",
            )}
            onClick={() => setCropAspect(a.id)}
          >
            {a.label}
          </button>
        ))}
      </div>
      <p className="mt-1 text-[11px] text-[var(--muted)]">
        Drag the box to move · pull corner/edge handles to reshape
      </p>
    </div>
  );
}
