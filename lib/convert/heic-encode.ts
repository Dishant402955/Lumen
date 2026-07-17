/**
 * Encode RGBA pixels to HEIC using libheif + kvazaar (HEVC) via elheif WASM.
 * Loaded on demand so the ~1.5MB encoder stays out of the initial bundle path.
 */

type ElheifModule = {
  ensureInitialized: () => Promise<void>;
  jsEncodeImage: (
    buf: Uint8Array,
    width: number,
    height: number,
  ) => { err: string; data: Uint8Array };
};

let elheifPromise: Promise<ElheifModule> | null = null;

async function getElheif(): Promise<ElheifModule> {
  if (typeof window === "undefined") {
    throw new Error("HEIC encode runs in the browser only.");
  }
  if (!elheifPromise) {
    elheifPromise = (async () => {
      const mod = (await import("elheif")) as ElheifModule;
      await mod.ensureInitialized();
      return mod;
    })();
  }
  return elheifPromise;
}

/** Encode an RGBA8888 bitmap to a HEVC HEIC bitstream. */
export async function encodeRgbaAsHeic(
  rgba: Uint8Array,
  width: number,
  height: number,
): Promise<Uint8Array> {
  if (rgba.length < width * height * 4) {
    throw new Error("RGBA buffer is too small for the given dimensions.");
  }
  const elheif = await getElheif();
  const result = elheif.jsEncodeImage(rgba, width, height);
  if (result.err) {
    throw new Error(result.err || "HEVC HEIC encode failed.");
  }
  if (!result.data?.length) {
    throw new Error("HEVC HEIC encode returned empty data.");
  }
  return result.data;
}
