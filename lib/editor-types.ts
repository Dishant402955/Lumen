export type Adjustments = {
  brightness: number;
  contrast: number;
  saturation: number;
  rotate: 0 | 90 | 180 | 270;
  flipH: boolean;
  flipV: boolean;
};

export type CropRect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type CropAspect = "free" | "1:1" | "4:3" | "3:2" | "16:9" | "9:16";

export type {
  ConvertFormat as ExportFormat,
  ConvertFormat,
} from "@/lib/convert/types";
export { CONVERT_FORMATS, EXPORT_FORMATS } from "@/lib/convert/types";

export type LoadedImage = {
  name: string;
  objectUrl: string;
  width: number;
  height: number;
  fileType: string;
};

export type LayerBase = {
  id: string;
  name: string;
  visible: boolean;
  /** 0–100 */
  opacity: number;
};

export type BackgroundLayer = LayerBase & { kind: "background" };

export type PaintLayer = LayerBase & { kind: "paint" };

export type TextLayer = LayerBase & {
  kind: "text";
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  align: "left" | "center" | "right";
  /** Degrees, clockwise */
  rotation: number;
};

export type EditorLayer = BackgroundLayer | PaintLayer | TextLayer;

export type EditorDoc = {
  width: number;
  height: number;
  adjustments: Adjustments;
  crop: CropRect | null;
  layers: EditorLayer[];
  activeLayerId: string;
};

/** Serializable history entry (paint pixels as PNG data URLs). */
export type EditorSnapshot = {
  doc: EditorDoc;
  paintData: Record<string, string>;
  /** When set, background was destructively edited (red-eye, baked resize/crop). */
  backgroundDataUrl: string | null;
};

export type EditorTool =
  | "select"
  | "brush"
  | "text"
  | "crop"
  | "redeye"
  | "resize"
  | "marquee"
  | "heal"
  | "clone";

export type BrushSettings = {
  size: number;
  color: string;
  opacity: number;
  soft: boolean;
};

export type RetouchSettings = {
  size: number;
  /** 0–100 */
  strength: number;
};

export const DEFAULT_ADJUSTMENTS: Adjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  rotate: 0,
  flipH: false,
  flipV: false,
};

export const DEFAULT_BRUSH: BrushSettings = {
  size: 24,
  color: "#c4a46a",
  opacity: 100,
  soft: true,
};

export const DEFAULT_RETOUCH: RetouchSettings = {
  size: 28,
  strength: 85,
};

export const CROP_ASPECTS: Array<{ id: CropAspect; label: string; ratio: number | null }> =
  [
    { id: "free", label: "Free", ratio: null },
    { id: "1:1", label: "1:1", ratio: 1 },
    { id: "4:3", label: "4:3", ratio: 4 / 3 },
    { id: "3:2", label: "3:2", ratio: 3 / 2 },
    { id: "16:9", label: "16:9", ratio: 16 / 9 },
    { id: "9:16", label: "9:16", ratio: 9 / 16 },
  ];

export const HISTORY_LIMIT = 40;

export function createId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function createInitialDoc(width: number, height: number): EditorDoc {
  const bgId = createId("bg");
  const paintId = createId("paint");
  return {
    width,
    height,
    adjustments: { ...DEFAULT_ADJUSTMENTS },
    crop: null,
    activeLayerId: paintId,
    layers: [
      {
        id: bgId,
        name: "Background",
        kind: "background",
        visible: true,
        opacity: 100,
      },
      {
        id: paintId,
        name: "Paint 1",
        kind: "paint",
        visible: true,
        opacity: 100,
      },
    ],
  };
}

export function createTextLayer(
  width: number,
  height: number,
  index: number,
): TextLayer {
  return {
    id: createId("text"),
    name: `Text ${index}`,
    kind: "text",
    visible: true,
    opacity: 100,
    text: "Double-click to edit",
    x: Math.round(width * 0.5),
    y: Math.round(height * 0.5),
    fontSize: Math.max(24, Math.round(Math.min(width, height) * 0.06)),
    fontFamily: "Georgia, serif",
    color: "#1a1814",
    align: "center",
    rotation: 0,
  };
}

export function createPaintLayer(index: number): PaintLayer {
  return {
    id: createId("paint"),
    name: `Paint ${index}`,
    kind: "paint",
    visible: true,
    opacity: 100,
  };
}
