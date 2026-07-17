import { NextResponse } from "next/server";
import { answerWithHeuristics } from "@/components/page-agent/heuristics";

type Body = {
  question?: string;
  context?: string;
};

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
      source: "heuristics" as const,
    });
  }

  const baseUrl = (
    process.env.PAGE_AGENT_BASE_URL ?? "https://api.openai.com/v1"
  ).replace(/\/$/, "");
  const model = process.env.PAGE_AGENT_MODEL ?? "gpt-4o-mini";

  const system = [
    "You are Lumen’s in-app UI guide for an offline-first browser image editor.",
    "Answer briefly (2–5 sentences). Only describe features that exist: open/drop image, brightness/contrast/saturation, crop, rotate/flip, export PNG/JPEG/WebP, service-worker offline shell, privacy (images stay local).",
    "If unsure, say so and point the user to Adjust, Crop, or Export.",
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
        source: "heuristics" as const,
        warning: `LLM request failed (${upstream.status}); used built-in help.`,
      });
    }

    const data = (await upstream.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const answer =
      data.choices?.[0]?.message?.content?.trim() ||
      answerWithHeuristics(question).answer;

    return NextResponse.json({ answer, source: "llm" as const });
  } catch {
    const heuristic = answerWithHeuristics(question);
    return NextResponse.json({
      answer: heuristic.answer,
      source: "heuristics" as const,
      warning: "LLM unreachable; used built-in help.",
    });
  }
}
