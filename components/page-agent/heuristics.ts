import { getTarget, targetsForQuestion } from "@/components/page-agent/targets";

export type HeuristicReply = {
  answer: string;
  matched: boolean;
  targets: string[];
  panel?: string;
};

const RULES: Array<{
  patterns: RegExp[];
  answer: string;
  targets?: string[];
  panel?: string;
}> = [
  {
    patterns: [/how (do i |to )?open|upload|import|add (an )?image|load|drop/i],
    answer:
      "Use Open image in the top bar, or drag and drop onto the canvas. HEIC works too — files stay in this browser.",
    targets: ["open-image", "canvas"],
  },
  {
    patterns: [/undo|redo|history|ctrl\+z|cmd\+z/i],
    answer:
      "Use Undo / Redo in the top bar, or Ctrl/Cmd+Z and Ctrl/Cmd+Shift+Z (or Ctrl+Y).",
    targets: ["undo", "redo"],
  },
  {
    patterns: [/layer/i],
    answer:
      "Open Layers to show/hide, change opacity, reorder (Up/Down), clone paint or text, add layers, or delete the active non-background layer.",
    targets: ["panel-layers"],
    panel: "layers",
  },
  {
    patterns: [/brush|paint|draw/i],
    answer:
      "Open Brush, pick color/size/opacity, select a paint layer, then draw on the canvas.",
    targets: ["panel-brush", "canvas"],
    panel: "brush",
  },
  {
    patterns: [/text|type|caption|label/i],
    answer:
      "Open Text → Add text layer. Edit content, size, color, and rotation; drag on the canvas to move.",
    targets: ["panel-text", "canvas"],
    panel: "text",
  },
  {
    patterns: [/marquee|select(ion)?|heal|clone stamp|retouch|spot heal|healing brush/i],
    answer:
      "Open Retouch: Marquee to select, Heal to blend from surroundings, Clone stamp after Alt-clicking a source. Heal selection / Clear selection act on the box.",
    targets: ["panel-retouch", "canvas"],
    panel: "retouch",
  },
  {
    patterns: [/resize|dimension|pixels|width|height/i],
    answer:
      "Open Resize, set width/height (optional aspect lock), then Apply resize.",
    targets: ["panel-resize"],
    panel: "resize",
  },
  {
    patterns: [/red[- ]?eye|redeye|pupil/i],
    answer:
      "Open Red-eye, set the radius, then click the pupil on the canvas.",
    targets: ["panel-redeye", "canvas"],
    panel: "redeye",
  },
  {
    patterns: [/batch|convert many|bulk|zip|multiple files/i],
    answer:
      "Open Convert, add images, pick a format, Convert all, then Download ZIP if you want.",
    targets: ["panel-convert"],
    panel: "convert",
  },
  {
    patterns: [/avif|heic|heif|exif|metadata|format conversion/i],
    answer:
      "Export and Convert support PNG, JPEG, WebP, AVIF, and HEIC. HEIC output is real HEVC (WASM). Keep EXIF is strongest on JPEG; AVIF/HEIC are pixels only.",
    targets: ["panel-export", "panel-convert"],
    panel: "export",
  },
  {
    patterns: [/export|download|save as|format/i],
    answer:
      "Open Export for the current edit — pick format, quality, Keep EXIF, then Download.",
    targets: ["panel-export"],
    panel: "export",
  },
  {
    patterns: [/crop|aspect/i],
    answer:
      "Open Crop, pick an aspect, drag/reshape the box, then Apply. On mobile use the sticky crop bar.",
    targets: ["panel-crop", "canvas"],
    panel: "crop",
  },
  {
    patterns: [/rotate|flip|turn/i],
    answer:
      "In Adjust, use Rotate 90° or Flip H / Flip V (large buttons on mobile).",
    targets: ["panel-adjust"],
    panel: "adjust",
  },
  {
    patterns: [/bright|contrast|saturat|adjust|filter/i],
    answer:
      "Open Adjust and drag Brightness, Contrast, or Saturation. Releasing a slider commits undo history.",
    targets: ["panel-adjust"],
    panel: "adjust",
  },
  {
    patterns: [
      /offline|service worker|no internet|airplane|indexeddb|recent project|save project|saved project/i,
    ],
    answer:
      "After the first visit you’re Offline-ready. Save project (or auto-save) stores edits in IndexedDB — reopen from Projects offline. Help still works with local heuristics when offline.",
    targets: ["save-project", "projects", "panel-projects"],
    panel: "projects",
  },
  {
    patterns: [/reset|clear|start over/i],
    answer:
      "Reset adjustments clears color/rotate/flip. Prefer Undo to step back. Open a new image to replace the project.",
    targets: ["panel-adjust", "undo"],
  },
  {
    patterns: [/mobile|phone|touch|small screen|install|pwa|home screen|icon/i],
    answer:
      "Bottom tabs + safe-area padding. Crop has a sticky bar and large handles. Use Install app (Chromium) or Add to Home Screen.",
    targets: ["install", "panel-crop"],
  },
  {
    patterns: [/privacy|upload|server|cloud|data/i],
    answer:
      "Editing stays in your tab. Page Agent only sends question text to an LLM if PAGE_AGENT_API_KEY is set — never your image pixels.",
    targets: ["help-fab"],
  },
  {
    patterns: [/point|click to explain|inspect|highlight|what is this/i],
    answer:
      "Turn on Point at UI in Help, then tap any highlighted control. I’ll explain it and spotlight it.",
    targets: ["help-fab"],
  },
  {
    patterns: [/help|what can|how does lumen|features/i],
    answer:
      "Lumen edits and converts images offline-first: layers (reorder/clone), brush, text rotation, crop, resize, red-eye, retouch (marquee/heal/clone), projects, batch convert, and PWA install. Ask about a tool, or use Point at UI.",
    targets: ["help-fab", "open-image"],
  },
];

export function answerWithHeuristics(question: string): HeuristicReply {
  const q = question.trim();
  if (!q) {
    return {
      matched: true,
      answer:
        "Ask about a tool, or enable Point at UI and click a control. I can also highlight the matching UI.",
      targets: ["help-fab"],
    };
  }

  for (const rule of RULES) {
    if (rule.patterns.some((p) => p.test(q))) {
      const targets = rule.targets?.length
        ? rule.targets
        : targetsForQuestion(q);
      return {
        matched: true,
        answer: rule.answer,
        targets,
        panel: rule.panel,
      };
    }
  }

  const targets = targetsForQuestion(q);
  const labeled = targets
    .map((id) => getTarget(id)?.label)
    .filter(Boolean)
    .join(", ");

  return {
    matched: false,
    answer: labeled
      ? `I’m not sure — try asking about ${labeled}, or use Point at UI and click a control.`
      : "Try asking about crop, export, projects, or enable Point at UI and click a control.",
    targets,
  };
}

export function explainTargetId(id: string): HeuristicReply {
  const target = getTarget(id);
  if (!target) {
    return {
      matched: false,
      answer: "That control isn’t in the help map yet. Try asking in the chat.",
      targets: [],
    };
  }
  return {
    matched: true,
    answer: `${target.label}: ${target.explain}`,
    targets: [target.id],
    panel: target.panel,
  };
}
