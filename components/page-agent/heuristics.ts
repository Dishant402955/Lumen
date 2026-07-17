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
    patterns: [/export|download|save|convert|webp|jpeg|jpg|png|format/i],
    answer:
      "Open Export on the right (or the Export tab on mobile). Pick PNG, JPEG, or WebP, set quality for JPEG/WebP, then tap Download. That’s how you convert formats too.",
  },
  {
    patterns: [/crop/i],
    answer:
      "Tap Crop, drag the handles on the image, then Apply crop. Reset crop clears the crop box without changing brightness or rotation.",
  },
  {
    patterns: [/rotate|flip|turn/i],
    answer:
      "In Adjust, use Rotate 90° or Flip horizontal / Flip vertical. Rotation and flips apply when you export.",
  },
  {
    patterns: [/bright|contrast|saturat|adjust|filter/i],
    answer:
      "Open Adjust and drag Brightness, Contrast, or Saturation. Values are previewed live and baked into the export.",
  },
  {
    patterns: [/offline|service worker|no internet|airplane/i],
    answer:
      "After the first visit, Lumen’s app shell is cached by a service worker. You can open the editor offline and keep editing images already loaded in the tab. Opening a new file from disk still works offline; AI help needs the network only if an API key is configured.",
  },
  {
    patterns: [/reset|undo|clear|start over/i],
    answer:
      "Use Reset adjustments to clear brightness/contrast/saturation/rotation/flips. Reset crop only clears the crop. Open a new image to replace the current one.",
  },
  {
    patterns: [/mobile|phone|touch|small screen/i],
    answer:
      "On small screens the side panels become bottom tabs: Adjust, Crop, and Export. The canvas stays full width above the controls.",
  },
  {
    patterns: [/privacy|upload|server|cloud|data/i],
    answer:
      "Editing runs entirely in your browser with the Canvas API. Images are not sent to Lumen servers. The optional Page Agent chat only sends your question text to an LLM if PAGE_AGENT_API_KEY is set on the server.",
  },
  {
    patterns: [/help|what can|how does lumen|features/i],
    answer:
      "Lumen is an offline-friendly image editor: open or drop an image, adjust light and color, crop, rotate/flip, then export as PNG, JPEG, or WebP. Ask me about any of those steps.",
  },
];

export function answerWithHeuristics(question: string): HeuristicReply {
  const q = question.trim();
  if (!q) {
    return {
      matched: true,
      answer: "Ask how to open, crop, adjust, export, or use Lumen offline.",
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
      "I can help with opening images, adjustments, crop, rotate/flip, export/convert, offline use, and privacy. Try asking about one of those.",
  };
}
