import exifr from "exifr";
import piexif from "piexifjs";

export type ExifPayload = {
  /** piexif dump string ("Exif\\0\\0...") or null */
  binary: string | null;
};

/** Read EXIF from a source image (JPEG, HEIC, TIFF, PNG, …). */
export async function readExif(file: Blob): Promise<ExifPayload> {
  try {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    if (isJpeg(bytes)) {
      const dataUrl = await blobToDataUrl(new Blob([buffer], { type: "image/jpeg" }));
      const loaded = piexif.load(dataUrl);
      const dumped = piexif.dump(loaded);
      if (dumped && dumped.length > 0) return { binary: dumped };
    }

    const parsed = await exifr.parse(buffer, {
      tiff: true,
      exif: true,
      gps: true,
      translateKeys: false,
      reviveValues: false,
      mergeOutput: true,
    });
    if (!parsed || typeof parsed !== "object") return { binary: null };

    const binary = buildPiexifFromParsed(parsed as Record<string, unknown>);
    return { binary };
  } catch {
    return { binary: null };
  }
}

function buildPiexifFromParsed(parsed: Record<string, unknown>): string | null {
  try {
    const zeroth: Record<number, unknown> = {};
    const exif: Record<number, unknown> = {};
    const gps: Record<number, unknown> = {};

    const assign = (
      key: string,
      tag: number,
      target: Record<number, unknown>,
    ) => {
      const value = parsed[key];
      if (value === undefined || value === null) return;
      target[tag] = value;
    };

    assign("Make", piexif.ImageIFD.Make, zeroth);
    assign("Model", piexif.ImageIFD.Model, zeroth);
    assign("Orientation", piexif.ImageIFD.Orientation, zeroth);
    assign("Software", piexif.ImageIFD.Software, zeroth);
    assign("DateTime", piexif.ImageIFD.DateTime, zeroth);
    assign("Artist", piexif.ImageIFD.Artist, zeroth);
    assign("Copyright", piexif.ImageIFD.Copyright, zeroth);
    assign("DateTimeOriginal", piexif.ExifIFD.DateTimeOriginal, exif);
    assign("DateTimeDigitized", piexif.ExifIFD.DateTimeDigitized, exif);
    assign("LensModel", piexif.ExifIFD.LensModel, exif);
    assign("FNumber", piexif.ExifIFD.FNumber, exif);
    assign("ExposureTime", piexif.ExifIFD.ExposureTime, exif);
    assign("ISOSpeedRatings", piexif.ExifIFD.ISOSpeedRatings, exif);
    assign("FocalLength", piexif.ExifIFD.FocalLength, exif);
    assign("GPSLatitude", piexif.GPSIFD.GPSLatitude, gps);
    assign("GPSLongitude", piexif.GPSIFD.GPSLongitude, gps);
    assign("GPSLatitudeRef", piexif.GPSIFD.GPSLatitudeRef, gps);
    assign("GPSLongitudeRef", piexif.GPSIFD.GPSLongitudeRef, gps);

    if (
      Object.keys(zeroth).length === 0 &&
      Object.keys(exif).length === 0 &&
      Object.keys(gps).length === 0
    ) {
      return null;
    }

    return piexif.dump({ "0th": zeroth, Exif: exif, GPS: gps }) || null;
  } catch {
    return null;
  }
}

export async function injectJpegExif(
  jpegBlob: Blob,
  exifBinary: string | null,
): Promise<Blob> {
  if (!exifBinary) return jpegBlob;
  try {
    const dataUrl = await blobToDataUrl(jpegBlob);
    const withExif = piexif.insert(exifBinary, dataUrl);
    return await (await fetch(withExif)).blob();
  } catch {
    return jpegBlob;
  }
}

export async function injectPngExif(
  pngBlob: Blob,
  exifBinary: string | null,
): Promise<Blob> {
  if (!exifBinary) return pngBlob;
  try {
    const png = new Uint8Array(await pngBlob.arrayBuffer());
    if (png.length < 8 || png[0] !== 0x89) return pngBlob;

    const exifBytes = binaryStringToUint8(exifBinary);
    const chunkType = strToBytes("eXIf");
    const crc = crc32(concat(chunkType, exifBytes));
    const chunk = concat(u32(exifBytes.length), chunkType, exifBytes, u32(crc));
    const ihdrEnd = 8 + 4 + 4 + 13 + 4;
    const out = concat(png.subarray(0, ihdrEnd), chunk, png.subarray(ihdrEnd));
    return new Blob([uint8ToArrayBuffer(out)], { type: "image/png" });
  } catch {
    return pngBlob;
  }
}

export async function injectWebpExif(
  webpBlob: Blob,
  exifBinary: string | null,
): Promise<Blob> {
  if (!exifBinary) return webpBlob;
  try {
    const bytes = new Uint8Array(await webpBlob.arrayBuffer());
    if (bytes.length < 12) return webpBlob;
    if (ascii(bytes, 0, 4) !== "RIFF" || ascii(bytes, 8, 4) !== "WEBP") {
      return webpBlob;
    }

    const exifBytes = binaryStringToUint8(exifBinary);
    const pad =
      exifBytes.length % 2 === 1 ? new Uint8Array([0]) : new Uint8Array(0);
    const chunk = concat(
      strToBytes("EXIF"),
      u32LE(exifBytes.length),
      exifBytes,
      pad,
    );
    const payload = concat(bytes.subarray(12), chunk);
    const out = concat(
      strToBytes("RIFF"),
      u32LE(4 + payload.length),
      strToBytes("WEBP"),
      payload,
    );
    return new Blob([uint8ToArrayBuffer(out)], { type: "image/webp" });
  } catch {
    return webpBlob;
  }
}

function uint8ToArrayBuffer(u8: Uint8Array): ArrayBuffer {
  return u8.buffer.slice(
    u8.byteOffset,
    u8.byteOffset + u8.byteLength,
  ) as ArrayBuffer;
}

function isJpeg(bytes: Uint8Array) {
  return bytes.length > 2 && bytes[0] === 0xff && bytes[1] === 0xd8;
}

function ascii(bytes: Uint8Array, start: number, len: number) {
  return String.fromCharCode(...bytes.subarray(start, start + len));
}

export function binaryStringToUint8(s: string): Uint8Array {
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i) & 0xff;
  return out;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function strToBytes(s: string): Uint8Array {
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

function u32(n: number): Uint8Array {
  const b = new Uint8Array(4);
  const v = n >>> 0;
  b[0] = (v >>> 24) & 0xff;
  b[1] = (v >>> 16) & 0xff;
  b[2] = (v >>> 8) & 0xff;
  b[3] = v & 0xff;
  return b;
}

function u32LE(n: number): Uint8Array {
  const b = new Uint8Array(4);
  const v = n >>> 0;
  b[0] = v & 0xff;
  b[1] = (v >>> 8) & 0xff;
  b[2] = (v >>> 16) & 0xff;
  b[3] = (v >>> 24) & 0xff;
  return b;
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const len = parts.reduce((a, p) => a + p.length, 0);
  const out = new Uint8Array(len);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

function crc32(data: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    c ^= data[i];
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}
