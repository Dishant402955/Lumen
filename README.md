# Lumen

In-browser image editor and converter: layers (reorder/clone), brush, text rotation, crop, resize, red-eye, retouch (marquee/heal/clone), undo/redo, batch convert, offline projects, and **installable PWA** (icons + touch-friendly crop/rotate). Editing stays on your device.

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
- [Editing depth](docs/editing.md) — layers, history, retouch, tools
- [Format conversion](docs/conversion.md) — batch, AVIF/HEIC, EXIF
- [Offline](docs/offline.md) — service worker + recent projects
- [Mobile & PWA](docs/mobile.md) — icons, install, touch crop/rotate
- [Page Agent](docs/page-agent.md) — in-app UI help

## Stack

Next.js App Router, React 19, Tailwind CSS 4, TypeScript, Canvas API, `heic2any`, `elheif` (HEVC HEIC), `exifr`, `piexifjs`, `jszip`.
