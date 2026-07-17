"use client";

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
  return (
    <label className="block text-sm">
      <span className="mb-1 flex justify-between text-[var(--muted)]">
        <span>{label}</span>
        <span>{value}</span>
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
        className="w-full accent-[var(--accent)] disabled:opacity-40"
      />
    </label>
  );
}
