"use client";

import { FormEvent, useState } from "react";
import { answerWithHeuristics } from "@/components/page-agent/heuristics";
import { cn } from "@/lib/cn";

type Message = { role: "user" | "assistant"; text: string };

export function PageAgent() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Ask about layers, projects, offline, convert, crop, or export.",
    },
  ]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const question = input.trim();
    if (!question || busy) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setBusy(true);

    const finish = (text: string) => {
      setMessages((prev) => [...prev, { role: "assistant", text }]);
      setBusy(false);
    };

    // Offline or failing network → local heuristics (no API needed)
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      finish(answerWithHeuristics(question).answer);
      return;
    }

    try {
      const res = await fetch("/api/page-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          context: "Lumen image editor home",
        }),
      });
      const data = (await res.json()) as { answer?: string; error?: string };
      finish(data.answer ?? data.error ?? "Something went wrong.");
    } catch {
      finish(answerWithHeuristics(question).answer);
    }
  }

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {open ? (
        <div className="pointer-events-auto flex h-[min(420px,70vh)] w-[min(360px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--panel)] shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
          <header className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
            <div>
              <p className="font-[family-name:var(--font-display)] text-lg tracking-tight text-[var(--ink)]">
                Lumen help
              </p>
              <p className="text-xs text-[var(--muted)]">UI guide for this editor</p>
            </div>
            <button
              type="button"
              className="rounded-lg px-2 py-1 text-sm text-[var(--muted)] hover:bg-[var(--panel-2)] hover:text-[var(--ink)]"
              onClick={() => setOpen(false)}
            >
              Close
            </button>
          </header>
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={cn(
                  "max-w-[90%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
                  message.role === "user"
                    ? "ml-auto bg-[var(--accent)] text-[var(--accent-ink)]"
                    : "bg-[var(--panel-2)] text-[var(--ink)]",
                )}
              >
                {message.text}
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
              placeholder="How do I save offline?"
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
        onClick={() => setOpen((v) => !v)}
        className="pointer-events-auto rounded-full bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-[var(--accent-ink)] shadow-[0_12px_30px_rgba(0,0,0,0.28)] transition hover:brightness-105"
      >
        {open ? "Hide help" : "Need help?"}
      </button>
    </div>
  );
}
