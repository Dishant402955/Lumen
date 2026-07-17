"use client";

import { cn } from "@/lib/cn";

export function Slider({
  label,
  value,
  min,
  max,
  disabled,
  onChange,
  onCommit,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  disabled?: boolean;
  onChange: (value: number) => void;
  onCommit?: () => void;
}) {
  const pct = max === min ? 0 : ((value - min) / (max - min)) * 100;

  return (
    <label className="block text-sm">
      <span className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="font-medium tracking-wide text-[var(--muted)]">
          {label}
        </span>
        <span className="rounded-md bg-[var(--panel-2)] px-1.5 py-0.5 font-mono text-[11px] tabular-nums text-[var(--ink)]">
          {value}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        onPointerUp={() => onCommit?.()}
        onKeyUp={() => onCommit?.()}
        className={cn("lumen-range")}
        style={{ ["--fill" as string]: `${pct}%` }}
      />
    </label>
  );
}
