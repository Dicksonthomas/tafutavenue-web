"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Kimya - PWA install itakosekana tu, app inaendelea kufanya kazi kawaida.
      });
    }
  }, []);

  return null;
}
