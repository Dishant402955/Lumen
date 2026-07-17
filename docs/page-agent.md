# Page Agent (UI help)

Floating **Need help?** control. Supports chat Q&A, **UI highlighting**, and **Point at UI** (click-to-explain).

## Modes

1. **Heuristics (default)** — pattern rules in `components/page-agent/heuristics.ts` return `answer`, `targets`, and optional `panel`.
2. **LLM** — with `PAGE_AGENT_API_KEY`, `POST /api/page-agent` asks for JSON `{ answer, targets, panel }` (OpenAI-compatible). Invalid/failed responses fall back to heuristics.
3. **Offline** — client uses heuristics directly (no network).

## Highlight

Answers may include `targets` (see `components/page-agent/targets.ts`). The agent:

- Spotlights matching `[data-lumen-id="…"]` nodes
- Optionally opens a tool `panel` via `lumen:goto-panel`
- Offers **Show on UI** on past answers
- Auto-dismisses the spotlight after ~8s (or **Dismiss highlight**)

## Point at UI (click-to-explain)

1. Open Help → **Point at UI**
2. Tap a tagged control (header actions, tabs, canvas, install, help)
3. Help explains that control and highlights it

Tagged elements use `data-lumen-id` / `data-lumen-label`.

## Env

Copy `example.env` to `.env.local`:

```bash
PAGE_AGENT_API_KEY=
PAGE_AGENT_BASE_URL=https://api.openai.com/v1
PAGE_AGENT_MODEL=gpt-4o-mini
```

No key is required. Images are never sent to the LLM — only the question text.
