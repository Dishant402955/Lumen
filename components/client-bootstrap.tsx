"use client";

import { useEffect } from "react";
import { armInstallPromptCapture } from "@/lib/install-prompt-capture";

/** Arms beforeinstallprompt capture as early as possible after hydration. */
export function ClientBootstrap() {
  useEffect(() => {
    armInstallPromptCapture();
  }, []);
  return null;
}
