/**
 * Reduce red-dominant pixels in a circular region (classic red-eye fix).
 * Mutates the given ImageData in place.
 */
export function removeRedEye(
  imageData: ImageData,
  cx: number,
  cy: number,
  radius: number,
): void {
  const { data, width, height } = imageData;
  const r2 = radius * radius;
  const x0 = Math.max(0, Math.floor(cx - radius));
  const y0 = Math.max(0, Math.floor(cy - radius));
  const x1 = Math.min(width - 1, Math.ceil(cx + radius));
  const y1 = Math.min(height - 1, Math.ceil(cy + radius));

  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist2 = dx * dx + dy * dy;
      if (dist2 > r2) continue;

      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Red-eye: red channel dominates green/blue
      const intensity = (g + b) / 2;
      const isRed = r > 60 && r > g * 1.35 && r > b * 1.35;
      if (!isRed) continue;

      const edge = 1 - Math.sqrt(dist2) / radius;
      const strength = Math.max(0, Math.min(1, edge));
      data[i] = Math.round(r * (1 - strength) + intensity * strength);
      data[i + 1] = Math.round(g * (1 - strength * 0.15) + intensity * strength * 0.15);
      data[i + 2] = Math.round(b * (1 - strength * 0.15) + intensity * strength * 0.15);
    }
  }
}
