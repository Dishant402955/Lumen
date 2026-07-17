import { NextResponse } from "next/server";
import { answerWithHeuristics } from "@/components/page-agent/heuristics";
import { LUMEN_TARGETS } from "@/components/page-agent/targets";

type Body = {
  question?: string;
  context?: string;
};

type LlmPayload = {
  answer?: string;
  targets?: string[];
  panel?: string;
};

const TARGET_IDS = LUMEN_TARGETS.map((t) => t.id);
const PANEL_IDS = [
  "adjust",
  "crop",
  "brush",
  "text",
  "layers",
  "resize",
  "redeye",
  "retouch",
  "export",
  "convert",
  "projects",
];

function parseLlmJson(raw: string): LlmPayload | null {
  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed) as LlmPayload;
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]) as LlmPayload;
    } catch {
      return null;
    }
  }
}

function sanitize(payload: LlmPayload, fallbackQuestion: string): LlmPayload {
  const heuristic = answerWithHeuristics(fallbackQuestion);
  const targets = (payload.targets ?? [])
    .filter((id) => TARGET_IDS.includes(id as (typeof TARGET_IDS)[number]))
    .slice(0, 3);
  const panel =
    payload.panel && PANEL_IDS.includes(payload.panel)
      ? payload.panel
      : heuristic.panel;
  return {
    answer: payload.answer?.trim() || heuristic.answer,
    targets: targets.length ? targets : heuristic.targets,
    panel,
  };
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const question = (body.question ?? "").trim();
  if (!question) {
    return NextResponse.json({ error: "question is required." }, { status: 400 });
  }

  const apiKey = process.env.PAGE_AGENT_API_KEY?.trim();
  if (!apiKey) {
    const heuristic = answerWithHeuristics(question);
    return NextResponse.json({
      answer: heuristic.answer,
      targets: heuristic.targets,
      panel: heuristic.panel,
      source: "heuristics" as const,
    });
  }

  const baseUrl = (
    process.env.PAGE_AGENT_BASE_URL ?? "https://api.openai.com/v1"
  ).replace(/\/$/, "");
  const model = process.env.PAGE_AGENT_MODEL ?? "gpt-4o-mini";

  const system = [
    "You are Lumen’s in-app UI guide for an offline-first browser image editor.",
    "Reply with ONLY compact JSON: {\"answer\":\"...\",\"targets\":[\"id\"],\"panel\":\"optional\"}.",
    "answer: 2–5 sentences, plain text, no markdown.",
    `targets: zero or more of: ${TARGET_IDS.join(", ")}.`,
    `panel: optional one of: ${PANEL_IDS.join(", ")}.`,
    "Only describe real features: layers (reorder/clone), brush, text rotation, adjust, crop, resize, red-eye, retouch (marquee/heal/clone stamp), export/convert (PNG/JPEG/WebP/AVIF/HEIC+EXIF), projects/IndexedDB, offline SW, PWA install, Point-at-UI help.",
    "Never invent menus. If unsure, say so and suggest Point at UI.",
    body.context ? `Page context: ${body.context}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const upstream = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: question },
        ],
      }),
    });

    if (!upstream.ok) {
      const heuristic = answerWithHeuristics(question);
      return NextResponse.json({
        answer: heuristic.answer,
        targets: heuristic.targets,
        panel: heuristic.panel,
        source: "heuristics" as const,
        warning: `LLM request failed (${upstream.status}); used built-in help.`,
      });
    }

    const data = (await upstream.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = data.choices?.[0]?.message?.content?.trim() ?? "";
    const parsed = parseLlmJson(raw);
    if (!parsed) {
      const heuristic = answerWithHeuristics(question);
      return NextResponse.json({
        answer: raw || heuristic.answer,
        targets: heuristic.targets,
        panel: heuristic.panel,
        source: "llm" as const,
      });
    }

    const clean = sanitize(parsed, question);
    return NextResponse.json({
      ...clean,
      source: "llm" as const,
    });
  } catch {
    const heuristic = answerWithHeuristics(question);
    return NextResponse.json({
      answer: heuristic.answer,
      targets: heuristic.targets,
      panel: heuristic.panel,
      source: "heuristics" as const,
      warning: "LLM unreachable; used built-in help.",
    });
  }
}
