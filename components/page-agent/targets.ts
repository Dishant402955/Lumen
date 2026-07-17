export type LumenTargetId =
  | "open-image"
  | "save-project"
  | "projects"
  | "undo"
  | "redo"
  | "install"
  | "canvas"
  | "panel-adjust"
  | "panel-crop"
  | "panel-brush"
  | "panel-text"
  | "panel-layers"
  | "panel-resize"
  | "panel-redeye"
  | "panel-export"
  | "panel-convert"
  | "panel-projects"
  | "help-fab";

export type LumenTarget = {
  id: LumenTargetId;
  label: string;
  /** Short explanation for click-to-explain */
  explain: string;
  /** Optional tool panel to open when highlighting */
  panel?:
    | "adjust"
    | "crop"
    | "brush"
    | "text"
    | "layers"
    | "resize"
    | "redeye"
    | "export"
    | "convert"
    | "projects";
  keywords: RegExp[];
};

export const LUMEN_TARGETS: LumenTarget[] = [
  {
    id: "open-image",
    label: "Open image",
    explain:
      "Opens a file picker or accepts a drop. Supports common formats plus HEIC/HEIF. Files stay in this browser.",
    keywords: [/open|upload|import|drop|load|file/i],
  },
  {
    id: "save-project",
    label: "Save project",
    explain:
      "Writes the current edit to IndexedDB on this device (also auto-saves after edits). Reopen from Projects anytime, including offline.",
    keywords: [/save project|autosave|auto-save/i],
  },
  {
    id: "projects",
    label: "Projects",
    explain:
      "Lists recent projects saved on this device. Open, delete, or clear them — works offline.",
    panel: "projects",
    keywords: [/recent project|saved project|projects panel/i],
  },
  {
    id: "undo",
    label: "Undo",
    explain: "Steps back one history entry (Ctrl/Cmd+Z).",
    keywords: [/undo/i],
  },
  {
    id: "redo",
    label: "Redo",
    explain: "Steps forward in history (Ctrl/Cmd+Shift+Z or Ctrl+Y).",
    keywords: [/redo/i],
  },
  {
    id: "install",
    label: "Install app",
    explain:
      "Installs Lumen as a PWA when your browser supports it. On Safari use Add to Home Screen.",
    keywords: [/install|pwa|home screen/i],
  },
  {
    id: "canvas",
    label: "Canvas",
    explain:
      "Your image preview. Draw with Brush, drag Text, click for Red-eye, or reshape the crop box here.",
    keywords: [/canvas|preview|stage/i],
  },
  {
    id: "panel-adjust",
    label: "Adjust",
    explain:
      "Brightness, contrast, saturation, rotate 90°, and flip. Slider release commits to undo history.",
    panel: "adjust",
    keywords: [/adjust|bright|contrast|saturat|rotate|flip/i],
  },
  {
    id: "panel-crop",
    label: "Crop",
    explain:
      "Aspect locks and on-canvas handles. On mobile, use the sticky crop bar to Apply/Cancel/Rotate.",
    panel: "crop",
    keywords: [/crop|aspect/i],
  },
  {
    id: "panel-brush",
    label: "Brush",
    explain:
      "Paint on the active paint layer. Choose color, size, opacity, and soft tip.",
    panel: "brush",
    keywords: [/brush|paint|draw/i],
  },
  {
    id: "panel-text",
    label: "Text",
    explain: "Add text layers, edit content/size/color, and drag on the canvas to move.",
    panel: "text",
    keywords: [/text|caption|type|font/i],
  },
  {
    id: "panel-layers",
    label: "Layers",
    explain:
      "Background, paint, and text layers — visibility, opacity, add, and delete (not background).",
    panel: "layers",
    keywords: [/layer/i],
  },
  {
    id: "panel-resize",
    label: "Resize",
    explain:
      "Change document width/height in pixels (optional aspect lock). Resamples background and paint.",
    panel: "resize",
    keywords: [/resize|dimension|pixels|width|height/i],
  },
  {
    id: "panel-redeye",
    label: "Red-eye",
    explain: "Set radius, then click pupils on the canvas. Correction bakes into the background.",
    panel: "redeye",
    keywords: [/red[- ]?eye|redeye|pupil/i],
  },
  {
    id: "panel-export",
    label: "Export",
    explain:
      "Download the current edit as PNG, JPEG, WebP, AVIF, or HEIC. Optional Keep EXIF.",
    panel: "export",
    keywords: [/export|download(?! zip)/i],
  },
  {
    id: "panel-convert",
    label: "Convert",
    explain:
      "Batch-convert many files (including HEIC input) and download individually or as a ZIP.",
    panel: "convert",
    keywords: [/batch|convert|zip|bulk/i],
  },
  {
    id: "panel-projects",
    label: "Projects panel",
    explain: "Browse thumbnails of projects stored in IndexedDB on this device.",
    panel: "projects",
    keywords: [/projects tab|projects panel/i],
  },
  {
    id: "help-fab",
    label: "Help",
    explain:
      "Ask questions, or turn on Point at UI and click a control to explain it. Answers can highlight the matching UI.",
    keywords: [/help|page agent|chatbot/i],
  },
];

export function getTarget(id: string): LumenTarget | undefined {
  return LUMEN_TARGETS.find((t) => t.id === id);
}

export function targetsForQuestion(question: string): LumenTargetId[] {
  const q = question.trim();
  if (!q) return ["help-fab"];
  const hits: LumenTargetId[] = [];
  for (const target of LUMEN_TARGETS) {
    if (target.keywords.some((re) => re.test(q))) hits.push(target.id);
  }
  return hits.slice(0, 3);
}

export const DATA_ATTR = "data-lumen-id";
