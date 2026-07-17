# Lumen

In-browser image editor and converter: layers (reorder/clone), brush, text rotation, crop, resize, red-eye, retouch (marquee/heal/clone), undo/redo, batch convert, offline projects, and **installable PWA**. Editing stays on your device.

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

## Documentation (start here to take over)

**[docs/README.md](docs/README.md)** — index and reading order for humans continuing the project without AI.

| Doc | Purpose |
| --- | --- |
| [Developer guide](docs/developer-guide.md) | Run, conventions, how to add features, debug table |
| [Architecture](docs/architecture.md) | Document model, compose, history, offline |
| [Code map](docs/code-map.md) | File → responsibility |
| [Feature inventory](docs/feature-inventory.md) | Shipped vs limits vs out of scope |
| [UI & design system](docs/ui-design-system.md) | Tokens and shared CSS classes |
| [Handbook](docs/handbook.md) | Product overview |
| [Editing depth](docs/editing.md) | Layers, tools, retouch |
| [Format conversion](docs/conversion.md) | Export / batch / HEIC / EXIF |
| [Offline](docs/offline.md) | Service worker + projects |
| [Mobile & PWA](docs/mobile.md) | Install, touch UX |
| [Page Agent](docs/page-agent.md) | In-app help |

## Stack

Next.js App Router, React 19, Tailwind CSS 4, TypeScript, Canvas API, `heic2any`, `elheif` (HEVC HEIC), `exifr`, `piexifjs`, `jszip`.
