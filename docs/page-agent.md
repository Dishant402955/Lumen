# Page Agent (UI help)

Floating **Need help?** control on the editor. Questions go to `POST /api/page-agent`.

## Modes

1. **Heuristics (default)** — if `PAGE_AGENT_API_KEY` is unset, answers come from pattern rules in `components/page-agent/heuristics.ts`.
2. **LLM** — with `PAGE_AGENT_API_KEY`, the route calls an OpenAI-compatible chat API (`PAGE_AGENT_BASE_URL`, `PAGE_AGENT_MODEL`). Failures fall back to heuristics.

## Env

Copy `example.env` to `.env.local`:

```bash
PAGE_AGENT_API_KEY=
PAGE_AGENT_BASE_URL=https://api.openai.com/v1
PAGE_AGENT_MODEL=gpt-4o-mini
```

No key is required to ship or use Lumen.
