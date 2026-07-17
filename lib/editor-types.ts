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

export type ExportFormat = "image/png" | "image/jpeg" | "image/webp";

export type LoadedImage = {
  name: string;
  objectUrl: string;
  width: number;
  height: number;
  fileType: string;
};

export const DEFAULT_ADJUSTMENTS: Adjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  rotate: 0,
  flipH: false,
  flipV: false,
};

export const EXPORT_FORMATS: Array<{
  id: ExportFormat;
  label: string;
  extension: string;
}> = [
  { id: "image/png", label: "PNG", extension: "png" },
  { id: "image/jpeg", label: "JPEG", extension: "jpg" },
  { id: "image/webp", label: "WebP", extension: "webp" },
];
