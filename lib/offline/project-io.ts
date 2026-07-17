import type { EditorDoc } from "@/lib/editor-types";
import type { PaintStore } from "@/lib/paint-store";
import { composeEdited, drawDocumentFlat } from "@/lib/compose";
import {
  saveProject,
  type StoredProject,
} from "@/lib/offline/projects";
import { createId } from "@/lib/editor-types";

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error("Could not encode project bitmap."));
        else resolve(blob);
      },
      type,
      quality,
    );
  });
}

/** Build a StoredProject snapshot from the live editor. */
export async function captureProject(args: {
  id?: string;
  name: string;
  doc: EditorDoc;
  background: CanvasImageSource;
  paintStore: PaintStore;
}): Promise<StoredProject> {
  const { doc, background, paintStore } = args;
  const id = args.id ?? createId("project");

  // Background only
  const bgCanvas = document.createElement("canvas");
  const bgCtx = bgCanvas.getContext("2d");
  if (!bgCtx) throw new Error("Canvas unavailable");
  drawDocumentFlat(
    bgCtx,
    {
      ...doc,
      layers: doc.layers.filter((l) => l.kind === "background"),
      adjustments: {
        ...doc.adjustments,
        brightness: 0,
        contrast: 0,
        saturation: 0,
        rotate: 0,
        flipH: false,
        flipV: false,
      },
      crop: null,
    },
    background,
    paintStore,
  );
  const backgroundBlob = await canvasToBlob(bgCanvas, "image/png");

  const paints: Record<string, Blob> = {};
  for (const layer of doc.layers) {
    if (layer.kind !== "paint") continue;
    const paint =
      paintStore.get(layer.id) ??
      paintStore.ensure(layer.id, doc.width, doc.height);
    paints[layer.id] = await canvasToBlob(paint, "image/png");
  }

  // Thumbnail from full compose
  const thumbCanvas = document.createElement("canvas");
  const thumbCtx = thumbCanvas.getContext("2d");
  if (!thumbCtx) throw new Error("Canvas unavailable");
  composeEdited(thumbCtx, doc, background, paintStore);
  const maxEdge = 240;
  const scale = Math.min(1, maxEdge / Math.max(thumbCanvas.width, thumbCanvas.height));
  const small = document.createElement("canvas");
  small.width = Math.max(1, Math.round(thumbCanvas.width * scale));
  small.height = Math.max(1, Math.round(thumbCanvas.height * scale));
  const sctx = small.getContext("2d");
  if (!sctx) throw new Error("Canvas unavailable");
  sctx.drawImage(thumbCanvas, 0, 0, small.width, small.height);
  const thumbnail = await canvasToBlob(small, "image/jpeg", 0.72);

  return {
    id,
    name: args.name || "Untitled",
    updatedAt: Date.now(),
    width: doc.width,
    height: doc.height,
    doc: structuredClone(doc),
    background: backgroundBlob,
    paints,
    thumbnail,
  };
}

export async function persistProject(args: {
  id?: string;
  name: string;
  doc: EditorDoc;
  background: CanvasImageSource;
  paintStore: PaintStore;
}): Promise<StoredProject> {
  const project = await captureProject(args);
  await saveProject(project);
  return project;
}

export async function blobToImage(blob: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.decoding = "async";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Could not restore project image."));
      img.src = url;
    });
    // Keep object URL on the image via a property for later revoke by caller
    (img as HTMLImageElement & { __objectUrl?: string }).__objectUrl = url;
    return img;
  } catch (err) {
    URL.revokeObjectURL(url);
    throw err;
  }
}
