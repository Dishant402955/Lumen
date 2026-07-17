const HEIC_TYPES = new Set([
  "image/heic",
  "image/heif",
  "image/heic-sequence",
  "image/heif-sequence",
]);

export function isHeicFile(file: File | Blob & { name?: string; type: string }) {
  if (HEIC_TYPES.has(file.type)) return true;
  const name = "name" in file && file.name ? file.name.toLowerCase() : "";
  return name.endsWith(".heic") || name.endsWith(".heif");
}

/** Decode any supported image (including HEIC) to an HTMLImageElement + object URL. */
export async function decodeToImage(file: File): Promise<{
  image: HTMLImageElement;
  objectUrl: string;
  width: number;
  height: number;
}> {
  let working: Blob = file;

  if (isHeicFile(file)) {
    const heic2any = (await import("heic2any")).default;
    const converted = await heic2any({
      blob: file,
      toType: "image/png",
      quality: 1,
    });
    working = Array.isArray(converted) ? converted[0] : converted;
  }

  const objectUrl = URL.createObjectURL(working);
  const image = await loadHtmlImage(objectUrl);
  return {
    image,
    objectUrl,
    width: image.naturalWidth,
    height: image.naturalHeight,
  };
}

export function loadHtmlImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not decode image."));
    img.src = src;
  });
}

export function imageToImageData(
  image: CanvasImageSource,
  width: number,
  height: number,
) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.drawImage(image, 0, 0, width, height);
  return { canvas, imageData: ctx.getImageData(0, 0, width, height) };
}
