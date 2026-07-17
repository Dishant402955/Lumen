export type ConvertFormat =
  | "image/png"
  | "image/jpeg"
  | "image/webp"
  | "image/avif"
  | "image/heic";

/** @deprecated use ConvertFormat — kept for editor export compatibility */
export type ExportFormat = ConvertFormat;

export type ConvertFormatOption = {
  id: ConvertFormat;
  label: string;
  extension: string;
  /** Lossy quality slider applies */
  hasQuality: boolean;
  /** EXIF can be re-injected reliably */
  exifSupport: "full" | "partial" | "none";
};

export const CONVERT_FORMATS: ConvertFormatOption[] = [
  {
    id: "image/png",
    label: "PNG",
    extension: "png",
    hasQuality: false,
    exifSupport: "partial",
  },
  {
    id: "image/jpeg",
    label: "JPEG",
    extension: "jpg",
    hasQuality: true,
    exifSupport: "full",
  },
  {
    id: "image/webp",
    label: "WebP",
    extension: "webp",
    hasQuality: true,
    exifSupport: "partial",
  },
  {
    id: "image/avif",
    label: "AVIF",
    extension: "avif",
    hasQuality: true,
    exifSupport: "none",
  },
  {
    id: "image/heic",
    label: "HEIC",
    extension: "heic",
    hasQuality: false,
    exifSupport: "none",
  },
];

/** Alias used by the editor export panel */
export const EXPORT_FORMATS = CONVERT_FORMATS;

export type BatchItemStatus = "queued" | "working" | "done" | "error";

export type BatchItem = {
  id: string;
  file: File;
  status: BatchItemStatus;
  error?: string;
  resultName?: string;
  resultBlob?: Blob;
};

export type ConvertOptions = {
  format: ConvertFormat;
  /** 0.05–1 */
  quality: number;
  keepExif: boolean;
};
