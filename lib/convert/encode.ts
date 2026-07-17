import { decodeToImage } from "@/lib/convert/decode";
import {
  injectJpegExif,
  injectPngExif,
  injectWebpExif,
  readExif,
  type ExifPayload,
} from "@/lib/convert/exif";
import { wrapJpegAsHeic } from "@/lib/convert/heic-encode";
import { imageToImageData } from "@/lib/convert/decode";
import type { ConvertFormat, ConvertOptions } from "@/lib/convert/types";
import { CONVERT_FORMATS } from "@/lib/convert/types";

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error(`Browser could not encode ${type}.`));
        else resolve(blob);
      },
      type,
      quality,
    );
  });
}

function uint8ToArrayBuffer(u8: Uint8Array): ArrayBuffer {
  return u8.buffer.slice(
    u8.byteOffset,
    u8.byteOffset + u8.byteLength,
  ) as ArrayBuffer;
}

/** Encode canvas pixels to the requested format (client-side). */
export async function encodeImage(
  source: CanvasImageSource,
  width: number,
  height: number,
  options: ConvertOptions,
  exif: ExifPayload | null,
): Promise<Blob> {
  const { canvas } = imageToImageData(source, width, height);
  const q = Math.min(1, Math.max(0.05, options.quality));
  const keep = options.keepExif ? exif?.binary ?? null : null;

  switch (options.format) {
    case "image/png": {
      const blob = await canvasToBlob(canvas, "image/png");
      return keep ? injectPngExif(blob, keep) : blob;
    }
    case "image/jpeg": {
      const blob = await canvasToBlob(canvas, "image/jpeg", q);
      return keep ? injectJpegExif(blob, keep) : blob;
    }
    case "image/webp": {
      const blob = await canvasToBlob(canvas, "image/webp", q);
      return keep ? injectWebpExif(blob, keep) : blob;
    }
    case "image/avif": {
      try {
        const blob = await canvasToBlob(canvas, "image/avif", q);
        if (blob.size > 0) return blob;
      } catch {
        // fall through
      }
      throw new Error(
        "AVIF encode is not supported in this browser. Use Chrome/Edge, or pick JPEG/WebP.",
      );
    }
    case "image/heic": {
      let jpeg = await canvasToBlob(canvas, "image/jpeg", Math.max(q, 0.85));
      if (keep) jpeg = await injectJpegExif(jpeg, keep);
      const jpegBytes = new Uint8Array(await jpeg.arrayBuffer());
      const heic = wrapJpegAsHeic(jpegBytes, width, height);
      return new Blob([uint8ToArrayBuffer(heic)], { type: "image/heic" });
    }
    default:
      throw new Error("Unsupported format");
  }
}

export async function convertFile(
  file: File,
  options: ConvertOptions,
): Promise<{ blob: Blob; extension: string }> {
  const exif = options.keepExif ? await readExif(file) : { binary: null };
  const decoded = await decodeToImage(file);
  try {
    const blob = await encodeImage(
      decoded.image,
      decoded.width,
      decoded.height,
      options,
      exif,
    );
    const extension =
      CONVERT_FORMATS.find((f) => f.id === options.format)?.extension ?? "bin";
    return { blob, extension };
  } finally {
    URL.revokeObjectURL(decoded.objectUrl);
  }
}

export function stemFromName(name: string) {
  const i = name.lastIndexOf(".");
  return i > 0 ? name.slice(0, i) : name || "image";
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function downloadZip(
  files: Array<{ name: string; blob: Blob }>,
  zipName: string,
) {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  for (const f of files) zip.file(f.name, f.blob);
  const blob = await zip.generateAsync({ type: "blob" });
  downloadBlob(blob, zipName);
}

export type { ConvertFormat };
