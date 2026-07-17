"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

export type HighlightRect = {
  id: string;
  top: number;
  left: number;
  width: number;
  height: number;
  label?: string;
};

export function HighlightLayer({
  targetIds,
  onDismiss,
}: {
  targetIds: string[];
  onDismiss?: () => void;
}) {
  const [rects, setRects] = useState<HighlightRect[]>([]);

  useEffect(() => {
    if (!targetIds.length) {
      setRects([]);
      return;
    }

    function measure() {
      const next: HighlightRect[] = [];
      for (const id of targetIds) {
        const nodes = document.querySelectorAll(`[data-lumen-id="${id}"]`);
        nodes.forEach((node, index) => {
          const el = node as HTMLElement;
          // Prefer visible elements
          const rect = el.getBoundingClientRect();
          if (rect.width < 2 || rect.height < 2) return;
          if (rect.bottom < 0 || rect.top > window.innerHeight) return;
          next.push({
            id: `${id}-${index}`,
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            label: el.getAttribute("data-lumen-label") ?? undefined,
          });
        });
      }
      setRects(next);
    }

    measure();
    const onScroll = () => measure();
    window.addEventListener("resize", onScroll);
    window.addEventListener("scroll", onScroll, true);
    const timer = window.setInterval(measure, 500);
    const autoClear = window.setTimeout(() => onDismiss?.(), 8000);

    return () => {
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("scroll", onScroll, true);
      window.clearInterval(timer);
      window.clearTimeout(autoClear);
    };
  }, [targetIds, onDismiss]);

  if (!targetIds.length || !rects.length) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/25" />
      {rects.map((rect) => (
        <div
          key={rect.id}
          className={cn(
            "absolute rounded-xl ring-4 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--paper)]",
            "animate-pulse bg-[rgba(196,164,106,0.12)]",
          )}
          style={{
            top: rect.top - 4,
            left: rect.left - 4,
            width: rect.width + 8,
            height: rect.height + 8,
          }}
        >
          {rect.label ? (
            <span className="absolute -top-7 left-0 whitespace-nowrap rounded-md bg-[var(--ink)] px-2 py-0.5 text-[11px] text-[var(--paper)]">
              {rect.label}
            </span>
          ) : null}
        </div>
      ))}
      <button
        type="button"
        className="pointer-events-auto absolute right-4 top-4 rounded-xl bg-[var(--panel)] px-3 py-2 text-sm shadow lg:right-6"
        onClick={onDismiss}
      >
        Dismiss highlight
      </button>
    </div>
  );
}
