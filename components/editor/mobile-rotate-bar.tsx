"use client";

import { cn } from "@/lib/cn";
import type { Adjustments } from "@/lib/editor-types";

/** Large touch targets for rotate/flip on small screens. */
export function MobileRotateBar({
  disabled,
  adjustments,
  onAdjustments,
}: {
  disabled?: boolean;
  adjustments: Adjustments;
  onAdjustments: (patch: Partial<Adjustments>, commit?: boolean) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 lg:hidden">
      <button
        type="button"
        disabled={disabled}
        className={cn(
          "min-h-12 rounded-xl border border-[var(--line)] text-sm font-medium disabled:opacity-40",
        )}
        onClick={() =>
          onAdjustments(
            {
              rotate: (((adjustments.rotate + 90) % 360) as Adjustments["rotate"]),
            },
            true,
          )
        }
      >
        Rotate 90°
      </button>
      <button
        type="button"
        disabled={disabled}
        className="min-h-12 rounded-xl border border-[var(--line)] text-sm font-medium disabled:opacity-40"
        onClick={() => onAdjustments({ flipH: !adjustments.flipH }, true)}
      >
        Flip H
      </button>
      <button
        type="button"
        disabled={disabled}
        className="min-h-12 rounded-xl border border-[var(--line)] text-sm font-medium disabled:opacity-40"
        onClick={() => onAdjustments({ flipV: !adjustments.flipV }, true)}
      >
        Flip V
      </button>
    </div>
  );
}
