export type HeuristicReply = {
  answer: string;
  matched: boolean;
};

const RULES: Array<{ patterns: RegExp[]; answer: string }> = [
  {
    patterns: [/how (do i |to )?open|upload|import|add (an )?image|load/i],
    answer:
      "Use Open image in the top bar, or drag and drop a file onto the canvas. Your image stays in this browser — nothing is uploaded to a server.",
  },
  {
    patterns: [/undo|redo|history|ctrl\+z|cmd\+z/i],
    answer:
      "Use Undo / Redo in the top bar, or Ctrl/Cmd+Z and Ctrl/Cmd+Shift+Z (or Ctrl+Y). Brush strokes, crops, resize, red-eye, layer changes, and committed adjustments are all in the history stack.",
  },
  {
    patterns: [/layer/i],
    answer:
      "Open the Layers panel to show/hide layers, change opacity, add paint or text layers, or delete the active non-background layer. Brush draws on the active paint layer.",
  },
  {
    patterns: [/brush|paint|draw/i],
    answer:
      "Open Brush, pick color/size/opacity (soft optional), select a paint layer, then draw on the canvas. Each stroke is one undo step.",
  },
  {
    patterns: [/text|type|caption|label/i],
    answer:
      "Open Text → Add text layer. Edit content, size, and color in the panel; drag on the canvas to move. Text lives on its own layer.",
  },
  {
    patterns: [/resize|dimension|pixels|width|height/i],
    answer:
      "Open Resize, set width and height in pixels (optionally lock aspect), then Apply resize. Background and paint layers are resampled; text positions scale too.",
  },
  {
    patterns: [/red[- ]?eye|redeye|pupil/i],
    answer:
      "Open Redeye, set the radius, then click the red pupil on the image. The fix is baked into the background and can be undone.",
  },
  {
    patterns: [/batch|convert many|bulk|zip|multiple files/i],
    answer:
      "Open the Convert panel, add multiple images (HEIC works too), pick PNG/JPEG/WebP/AVIF/HEIC, optionally keep EXIF, then Convert all. Download ZIP packs every successful file.",
  },
  {
    patterns: [/avif|heic|heif|exif|metadata|format conversion/i],
    answer:
      "Export and Convert support PNG, JPEG, WebP, AVIF, and HEIC. Keep EXIF is full for JPEG and best-effort for PNG/WebP/HEIC. AVIF uses the browser or a WASM encoder. HEIC input is decoded; HEIC output is a JPEG-in-HEIF file.",
  },
  {
    patterns: [/export|download|save|convert|webp|jpeg|jpg|png|format/i],
    answer:
      "Use Export for the current edit, or Convert for batch. Pick a format, set quality, toggle Keep EXIF, then Download (or ZIP in Convert).",
  },
  {
    patterns: [/crop|aspect/i],
    answer:
      "Open Crop, pick an aspect (Free, 1:1, 4:3, 3:2, 16:9, 9:16), drag the box or reshape with corner/edge handles, then Apply crop to bake it into the document.",
  },
  {
    patterns: [/rotate|flip|turn/i],
    answer:
      "In Adjust, use Rotate 90° or Flip H / Flip V. Changes go into undo history.",
  },
  {
    patterns: [/bright|contrast|saturat|adjust|filter/i],
    answer:
      "Open Adjust and drag Brightness, Contrast, or Saturation. Releasing a slider commits that change to undo history.",
  },
  {
    patterns: [/offline|service worker|no internet|airplane/i],
    answer:
      "After the first visit, Lumen’s app shell is cached by a service worker. You can open the editor offline and keep editing images already loaded in the tab.",
  },
  {
    patterns: [/reset|clear|start over/i],
    answer:
      "Reset adjustments clears color/rotate/flip. Clear crop removes an unapplied crop. Open a new image to replace the project. Prefer Undo for stepping back.",
  },
  {
    patterns: [/mobile|phone|touch|small screen/i],
    answer:
      "On small screens the tool panels become bottom tabs (Adjust, Crop, Brush, Text, Layers, Resize, Redeye, Export). The canvas stays above.",
  },
  {
    patterns: [/privacy|upload|server|cloud|data/i],
    answer:
      "Editing runs entirely in your browser with the Canvas API. Images are not sent to Lumen servers. The optional Page Agent chat only sends your question text to an LLM if PAGE_AGENT_API_KEY is set on the server.",
  },
  {
    patterns: [/help|what can|how does lumen|features/i],
    answer:
      "Lumen is an offline-friendly image editor and converter: layers, brush, text, crop, resize, red-eye, undo/redo, export/batch convert (PNG/JPEG/WebP/AVIF/HEIC + EXIF), and offline shell. Ask about any of those.",
  },
];

export function answerWithHeuristics(question: string): HeuristicReply {
  const q = question.trim();
  if (!q) {
    return {
      matched: true,
      answer:
        "Ask about layers, brush, text, crop, resize, red-eye, undo/redo, export, or offline use.",
    };
  }

  for (const rule of RULES) {
    if (rule.patterns.some((p) => p.test(q))) {
      return { matched: true, answer: rule.answer };
    }
  }

  return {
    matched: false,
    answer:
      "I can help with layers, brush, text, crop, resize, red-eye, adjustments, undo/redo, export/convert, offline use, and privacy. Try asking about one of those.",
  };
}
