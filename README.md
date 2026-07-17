# Lumen

In-browser image editor with layers, brush, text, crop (aspect locks), pixel resize, red-eye, adjustments, undo/redo, and PNG/JPEG/WebP export. Editing stays on your device. After the first visit, a service worker caches the app shell so the UI works offline.

This is a **single Next.js app** (not a monorepo).

## Setup

```bash
pnpm install
cp example.env .env.local   # optional — only needed for LLM-backed UI help
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

If pnpm asks about build scripts for `sharp` / `unrs-resolver`, approve them (or keep `allowBuilds` in `pnpm-workspace.yaml`). That YAML file is **not** a multi-package monorepo — it only configures dependency build scripts.

## Scripts

| Command        | Purpose              |
| -------------- | -------------------- |
| `pnpm dev`     | Local development    |
| `pnpm build`   | Production build     |
| `pnpm start`   | Run production build |
| `pnpm lint`    | ESLint               |

## Docs

- [Handbook](docs/handbook.md) — product overview and workflow
- [Editing depth](docs/editing.md) — layers, history, crop, resize, red-eye
- [Offline](docs/offline.md) — service worker behavior
- [Page Agent](docs/page-agent.md) — in-app UI help

## Stack

Next.js App Router, React 19, Tailwind CSS 4, TypeScript. Canvas API for edits and export. Optional OpenAI-compatible API for the help chatbot; heuristics work with no API key.
