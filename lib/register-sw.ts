export type SwStatus = {
  supported: boolean;
  controlling: boolean;
  waiting: boolean;
  version: string | null;
};

export function registerServiceWorker(
  onStatus?: (status: SwStatus) => void,
): () => void {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    onStatus?.({
      supported: false,
      controlling: false,
      waiting: false,
      version: null,
    });
    return () => undefined;
  }

  let cancelled = false;
  let version: string | null = null;

  const emit = async () => {
    if (cancelled) return;
    const reg = await navigator.serviceWorker.getRegistration();
    onStatus?.({
      supported: true,
      controlling: !!navigator.serviceWorker.controller,
      waiting: !!reg?.waiting,
      version,
    });
  };

  const onMessage = (event: MessageEvent) => {
    if (event.data?.type === "LUMEN_SW_ACTIVATED") {
      version = event.data.version ?? null;
      void emit();
    }
  };

  const onControllerChange = () => {
    void emit();
  };

  navigator.serviceWorker.addEventListener("message", onMessage);
  navigator.serviceWorker.addEventListener(
    "controllerchange",
    onControllerChange,
  );

  const register = () => {
    void navigator.serviceWorker
      .register("/sw.js")
      .then(async (reg) => {
        reg.addEventListener("updatefound", () => {
          const worker = reg.installing;
          if (!worker) return;
          worker.addEventListener("statechange", () => {
            void emit();
          });
        });
        await emit();
      })
      .catch((error) => {
        console.warn("Service worker registration failed", error);
        void emit();
      });
  };

  // Client effects often run after `load`; register immediately when already complete.
  if (document.readyState === "complete") {
    register();
  } else {
    window.addEventListener("load", register, { once: true });
  }

  void emit();

  return () => {
    cancelled = true;
    navigator.serviceWorker.removeEventListener("message", onMessage);
    navigator.serviceWorker.removeEventListener(
      "controllerchange",
      onControllerChange,
    );
  };
}

export async function activateWaitingWorker() {
  const reg = await navigator.serviceWorker.getRegistration();
  reg?.waiting?.postMessage({ type: "SKIP_WAITING" });
}
