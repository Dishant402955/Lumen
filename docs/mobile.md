# Mobile & PWA

Lumen is installable and usable on phones.

## Install / icons

- Web app manifest: `/manifest.webmanifest`
- Icons under `/public/icons/`:
  - `icon-192.png`, `icon-512.png` (any)
  - `icon-512-maskable.png` (Android maskable)
  - `apple-touch-icon.png` (iOS home screen)
  - `icon.svg`
- Layout sets `appleWebApp`, theme color, and `viewport-fit=cover`
- Service worker precaches icons (cache `lumen-shell-v4`)
- **Install app** appears when the browser fires `beforeinstallprompt` (Chromium)

## Small-screen editor UX

- Bottom tab bar with safe-area padding
- **Crop mode**: sticky **Mobile crop bar** (Apply / Cancel / Rotate + aspect chips) above the tabs; larger touch handles (44×44); rule-of-thirds guides; canvas height shrinks so controls stay reachable
- **Adjust**: large **Rotate / Flip** buttons on mobile (`MobileRotateBar`)
- Header actions wrap; canvas uses `touch-none` where needed so crop drags don’t scroll the page

## Tips

1. Visit once online so the SW + icons install
2. Use browser “Add to Home Screen” / Install if the in-app button doesn’t appear (Safari)
3. Crop on mobile: start Crop tab → reshape with handles → Apply in the crop bar

## See also

- [UI & design system](./ui-design-system.md)
- [Offline support](./offline.md) — SW install for PWA
