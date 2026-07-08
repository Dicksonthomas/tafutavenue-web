"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Silent - PWA install will just be unavailable, the app keeps working normally.
      });
    }
  }, []);

  return null;
}
