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
        className="lumen-btn min-h-12"
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
        className={cn(
          "lumen-btn min-h-12",
          adjustments.flipH && "border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]",
        )}
        onClick={() => onAdjustments({ flipH: !adjustments.flipH }, true)}
      >
        Flip H
      </button>
      <button
        type="button"
        disabled={disabled}
        className={cn(
          "lumen-btn min-h-12",
          adjustments.flipV && "border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]",
        )}
        onClick={() => onAdjustments({ flipV: !adjustments.flipV }, true)}
      >
        Flip V
      </button>
    </div>
  );
}
