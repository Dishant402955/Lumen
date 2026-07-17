export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let captured: BeforeInstallPromptEvent | null = null;
const listeners = new Set<(event: BeforeInstallPromptEvent | null) => void>();

function notify() {
  for (const listener of listeners) listener(captured);
}

/** Call once from the app root so the event is not missed before React mounts. */
export function armInstallPromptCapture() {
  if (typeof window === "undefined") return;
  const w = window as Window & {
    __lumenInstallArmed?: boolean;
  };
  if (w.__lumenInstallArmed) return;
  w.__lumenInstallArmed = true;

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    captured = event as BeforeInstallPromptEvent;
    notify();
  });
}

export function getCapturedInstallPrompt() {
  return captured;
}

export function subscribeInstallPrompt(
  listener: (event: BeforeInstallPromptEvent | null) => void,
) {
  listeners.add(listener);
  listener(captured);
  return () => {
    listeners.delete(listener);
  };
}

export function clearCapturedInstallPrompt() {
  captured = null;
  notify();
}
