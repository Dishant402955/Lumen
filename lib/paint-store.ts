/** Offscreen canvases for paint layers (not React state). */
export class PaintStore {
  private canvases = new Map<string, HTMLCanvasElement>();

  ensure(id: string, width: number, height: number): HTMLCanvasElement {
    let canvas = this.canvases.get(id);
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.width = Math.max(1, width);
      canvas.height = Math.max(1, height);
      this.canvases.set(id, canvas);
      return canvas;
    }
    if (canvas.width !== width || canvas.height !== height) {
      const next = document.createElement("canvas");
      next.width = Math.max(1, width);
      next.height = Math.max(1, height);
      const ctx = next.getContext("2d");
      ctx?.drawImage(canvas, 0, 0, next.width, next.height);
      this.canvases.set(id, next);
      return next;
    }
    return canvas;
  }

  get(id: string): HTMLCanvasElement | undefined {
    return this.canvases.get(id);
  }

  delete(id: string) {
    this.canvases.delete(id);
  }

  clear() {
    this.canvases.clear();
  }

  toDataUrl(id: string): string {
    const canvas = this.canvases.get(id);
    return canvas ? canvas.toDataURL("image/png") : "";
  }

  async fromDataUrl(
    id: string,
    dataUrl: string,
    width: number,
    height: number,
  ): Promise<void> {
    const canvas = this.ensure(id, width, height);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    if (!dataUrl) return;
    const img = await loadImage(dataUrl);
    ctx.drawImage(img, 0, 0, width, height);
  }

  async restoreAll(
    paintData: Record<string, string>,
    width: number,
    height: number,
  ): Promise<void> {
    const keep = new Set(Object.keys(paintData));
    for (const id of [...this.canvases.keys()]) {
      if (!keep.has(id)) this.canvases.delete(id);
    }
    await Promise.all(
      Object.entries(paintData).map(([id, url]) =>
        this.fromDataUrl(id, url, width, height),
      ),
    );
  }

  capture(ids: string[]): Record<string, string> {
    const out: Record<string, string> = {};
    for (const id of ids) {
      out[id] = this.toDataUrl(id);
    }
    return out;
  }

  resizeAll(width: number, height: number) {
    for (const id of [...this.canvases.keys()]) {
      this.ensure(id, width, height);
    }
  }
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image data."));
    img.src = src;
  });
}
