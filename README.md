# Lumen

In-browser image editor and converter: layers, brush, text, crop, resize, red-eye, undo/redo, plus **batch convert** to PNG/JPEG/WebP/AVIF/HEIC with EXIF keep. Editing stays on your device. A service worker caches the app shell for offline use after the first visit.

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

- [Handbook](docs/handbook.md) — product overview
- [Editing depth](docs/editing.md) — layers, history, tools
- [Format conversion](docs/conversion.md) — batch, AVIF/HEIC, EXIF
- [Offline](docs/offline.md) — service worker
- [Page Agent](docs/page-agent.md) — in-app UI help

## Stack

Next.js App Router, React 19, Tailwind CSS 4, TypeScript, Canvas API, `heic2any`, `exifr`, `piexifjs`, `jszip`.
