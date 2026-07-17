"use client";

import { useEffect, useState } from "react";
import {
  armInstallPromptCapture,
  clearCapturedInstallPrompt,
  subscribeInstallPrompt,
  type BeforeInstallPromptEvent,
} from "@/lib/install-prompt-capture";

/** Shows an Install button when the browser fires beforeinstallprompt. */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    armInstallPromptCapture();
    return subscribeInstallPrompt(setDeferred);
  }, []);

  if (!deferred || hidden) return null;

  return (
    <button
      type="button"
      data-lumen-id="install"
      data-lumen-label="Install app"
      className="lumen-btn lumen-btn-accent"
      onClick={async () => {
        await deferred.prompt();
        const choice = await deferred.userChoice;
        if (choice.outcome === "accepted") setHidden(true);
        clearCapturedInstallPrompt();
        setDeferred(null);
      }}
    >
      Install app
    </button>
  );
}
