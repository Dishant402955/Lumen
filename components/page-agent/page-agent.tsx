"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  answerWithHeuristics,
  explainTargetId,
} from "@/components/page-agent/heuristics";
import { HighlightLayer } from "@/components/page-agent/highlight-layer";
import { DATA_ATTR, getTarget } from "@/components/page-agent/targets";
import { cn } from "@/lib/cn";

type Message = {
  role: "user" | "assistant";
  text: string;
  targets?: string[];
};

type AgentResponse = {
  answer?: string;
  error?: string;
  targets?: string[];
  panel?: string;
  source?: string;
};

function gotoPanel(panel?: string) {
  if (!panel || typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("lumen:goto-panel", { detail: { panel } }),
  );
}

export function PageAgent() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [inspect, setInspect] = useState(false);
  const [highlightIds, setHighlightIds] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Ask a question, or turn on Point at UI and click a control — I’ll explain and highlight it.",
      targets: ["help-fab"],
    },
  ]);

  const applyGuidance = useCallback((reply: {
    answer: string;
    targets?: string[];
    panel?: string;
  }) => {
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        text: reply.answer,
        targets: reply.targets,
      },
    ]);
    if (reply.panel) gotoPanel(reply.panel);
    if (reply.targets?.length) setHighlightIds(reply.targets);
    setBusy(false);
  }, []);

  async function ask(question: string, asUser = true) {
    if (!question || busy) return;
    if (asUser) {
      setMessages((prev) => [...prev, { role: "user", text: question }]);
    }
    setBusy(true);

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      applyGuidance(answerWithHeuristics(question));
      return;
    }

    try {
      const res = await fetch("/api/page-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          context: "Lumen image editor — return UI targets when relevant",
        }),
      });
      const data = (await res.json()) as AgentResponse;
      if (data.answer) {
        applyGuidance({
          answer: data.answer,
          targets: data.targets,
          panel: data.panel,
        });
        return;
      }
      applyGuidance(answerWithHeuristics(question));
    } catch {
      applyGuidance(answerWithHeuristics(question));
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const question = input.trim();
    if (!question) return;
    setInput("");
    await ask(question);
  }

  useEffect(() => {
    if (!inspect) return;

    function onClick(event: MouseEvent) {
      const el = (event.target as HTMLElement | null)?.closest(
        `[${DATA_ATTR}]`,
      ) as HTMLElement | null;
      if (!el) return;
      event.preventDefault();
      event.stopPropagation();
      const id = el.getAttribute(DATA_ATTR);
      if (!id) return;
      const target = getTarget(id);
      setOpen(true);
      setInspect(false);
      setMessages((prev) => [
        ...prev,
        {
          role: "user",
          text: `What is “${target?.label ?? id}”?`,
        },
      ]);
      setBusy(true);
      applyGuidance(explainTargetId(id));
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [inspect, applyGuidance]);

  return (
    <>
      <HighlightLayer
        targetIds={highlightIds}
        onDismiss={() => setHighlightIds([])}
      />

      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
        {open ? (
          <div
            data-lumen-id="help-fab"
            data-lumen-label="Help"
            className="pointer-events-auto flex h-[min(460px,72vh)] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--panel)] shadow-[0_24px_60px_rgba(0,0,0,0.35)]"
          >
            <header className="flex items-start justify-between gap-2 border-b border-[var(--line)] px-4 py-3">
              <div>
                <p className="font-[family-name:var(--font-display)] text-lg tracking-tight text-[var(--ink)]">
                  Lumen help
                </p>
                <p className="text-xs text-[var(--muted)]">
                  Ask · highlight · click to explain
                </p>
              </div>
              <button
                type="button"
                className="rounded-lg px-2 py-1 text-sm text-[var(--muted)] hover:bg-[var(--panel-2)] hover:text-[var(--ink)]"
                onClick={() => {
                  setOpen(false);
                  setInspect(false);
                }}
              >
                Close
              </button>
            </header>

            <div className="flex gap-2 border-b border-[var(--line)] px-3 py-2">
              <button
                type="button"
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium",
                  inspect
                    ? "bg-[var(--accent)] text-[var(--accent-ink)]"
                    : "bg-[var(--panel-2)] text-[var(--ink)]",
                )}
                onClick={() => setInspect((v) => !v)}
              >
                {inspect ? "Pointing… tap a control" : "Point at UI"}
              </button>
              {highlightIds.length ? (
                <button
                  type="button"
                  className="rounded-lg bg-[var(--panel-2)] px-3 py-1.5 text-xs"
                  onClick={() => setHighlightIds([])}
                >
                  Clear highlight
                </button>
              ) : null}
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
              {messages.map((message, index) => (
                <div key={`${message.role}-${index}`} className="space-y-1">
                  <div
                    className={cn(
                      "max-w-[92%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
                      message.role === "user"
                        ? "ml-auto bg-[var(--accent)] text-[var(--accent-ink)]"
                        : "bg-[var(--panel-2)] text-[var(--ink)]",
                    )}
                  >
                    {message.text}
                  </div>
                  {message.role === "assistant" && message.targets?.length ? (
                    <button
                      type="button"
                      className="text-xs text-[var(--muted)] underline"
                      onClick={() => setHighlightIds(message.targets ?? [])}
                    >
                      Show on UI
                    </button>
                  ) : null}
                </div>
              ))}
            </div>

            <form
              onSubmit={onSubmit}
              className="flex gap-2 border-t border-[var(--line)] p-3"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="How do I crop on mobile?"
                className="min-w-0 flex-1 rounded-xl border border-[var(--line)] bg-[var(--panel-2)] px-3 py-2 text-sm text-[var(--ink)] outline-none ring-[var(--accent)] placeholder:text-[var(--muted)] focus:ring-2"
              />
              <button
                type="submit"
                disabled={busy}
                className="rounded-xl bg-[var(--ink)] px-3 py-2 text-sm font-medium text-[var(--paper)] disabled:opacity-50"
              >
                Ask
              </button>
            </form>
          </div>
        ) : null}

        <button
          type="button"
          data-lumen-id="help-fab"
          data-lumen-label="Help"
          onClick={() => {
            setOpen((v) => !v);
            if (open) setInspect(false);
          }}
          className={cn(
            "pointer-events-auto rounded-full px-4 py-3 text-sm font-semibold shadow-[0_12px_30px_rgba(0,0,0,0.28)] transition hover:brightness-105",
            inspect
              ? "bg-[var(--ink)] text-[var(--paper)]"
              : "bg-[var(--accent)] text-[var(--accent-ink)]",
          )}
        >
          {open ? "Hide help" : inspect ? "Tap a control…" : "Need help?"}
        </button>
      </div>

      {inspect ? (
        <div className="pointer-events-none fixed inset-x-0 top-0 z-[55] flex justify-center p-3">
          <p className="rounded-full bg-[var(--ink)] px-4 py-2 text-sm text-[var(--paper)] shadow">
            Point mode: tap any control with a help target
          </p>
        </div>
      ) : null}
    </>
  );
}
