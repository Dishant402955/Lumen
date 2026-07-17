# UI & design system

Visual and interaction conventions for Lumen. Keep new UI consistent with these so the app stays cohesive.

## Brand direction

- **Atmosphere:** warm stone / parchment workspace (not flat white, not purple dark-mode)
- **Accent:** brass / olive-gold (`--accent`)
- **Ink:** near-black charcoal (`--ink`)
- **Type:** Fraunces for display (“Lumen”), Source Sans 3 for UI body
- **Avoid:** purple gradients, generic Inter/Roboto-only look, emoji decoration, heavy glow stacks

## Tokens (`app/globals.css`)

| Token | Role |
| --- | --- |
| `--paper` / `--paper-deep` | Page surfaces |
| `--ink` / `--ink-soft` | Primary text / primary buttons |
| `--muted` / `--muted-2` | Secondary text |
| `--line` / `--line-strong` | Borders |
| `--panel` / `--panel-2` / `--panel-solid` | Cards / wells |
| `--accent` / `--accent-bright` / `--accent-ink` | CTAs / highlights |
| `--danger` / `--danger-soft` | Destructive actions / errors |
| `--success` | Positive status chips |
| `--shadow-sm/md/lg` | Elevation |
| `--radius` / `--radius-sm` | Corner radii |
| `--ease-out` / `--ease-spring` | Motion |

## Shared classes

Prefer these over inventing new button styles:

| Class | Use |
| --- | --- |
| `.lumen-btn` | Default control |
| `.lumen-btn-primary` | Primary (Open image) |
| `.lumen-btn-accent` | Emphasized CTA (Install, Apply, Export) |
| `.lumen-btn-ghost` | Quiet actions |
| `.lumen-btn-danger` | Delete |
| `.lumen-chip` | Status pills |
| `.lumen-chip-live` / `.lumen-chip-warn` | Online/saved vs caution |
| `.lumen-panel` | Side / card chrome |
| `.lumen-stage` | Canvas well |
| `.lumen-tab` | Panel tabs (`data-active="true"`) |
| `.lumen-input` / `.lumen-select` / `.lumen-textarea` | Forms |
| `.lumen-range` | Sliders (set `--fill` %) |
| `.lumen-animate-in` / `.lumen-animate-scale` | Enter motion |
| `.lumen-drop-orb` | Empty-state glow |

## Layout rules

1. **Desktop:** canvas left, tools sticky right (~340px).  
2. **Mobile:** canvas above; bottom sheet with horizontal tabs + compact panel.  
3. **Help FAB:** sits above the mobile sheet (`max-lg` bottom offset).  
4. **Touch:** min ~44px height on primary mobile controls; `touch-action: manipulation` on buttons.  
5. **Motion:** use opacity/transform; honor `prefers-reduced-motion`.  
6. **Performance:** panels use CSS `contain`; lighter blur on small screens.

## Accessibility

- Keep `:focus-visible` rings (defined globally).  
- Don’t remove `data-lumen-id` / `data-lumen-label` — Page Agent depends on them.  
- Errors use `--danger` text on soft danger background, not color alone without text.

## Adding a new control

1. Use `.lumen-btn` variants when possible.  
2. Add `data-lumen-id` + `data-lumen-label` if Help should explain it.  
3. Register in `components/page-agent/targets.ts` if it is a first-class target.  
4. Match existing radius/spacing; don’t introduce a second visual language.

## Related

- `app/globals.css`  
- `components/editor/slider.tsx`  
- [Developer guide](./developer-guide.md)
