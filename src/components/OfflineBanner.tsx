"use client";

import { useEffect, useRef, useState } from "react";
import { Wifi, WifiOff } from "lucide-react";

const BACK_ONLINE_DISPLAY_MS = 3000;

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [showBackOnline, setShowBackOnline] = useState(false);
  const wasOfflineRef = useRef(false);
  const backOnlineTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const offlineNow = !navigator.onLine;
    setIsOffline(offlineNow);
    wasOfflineRef.current = offlineNow;

    function handleOnline() {
      setIsOffline(false);
      if (wasOfflineRef.current) {
        setShowBackOnline(true);
        if (backOnlineTimerRef.current) clearTimeout(backOnlineTimerRef.current);
        backOnlineTimerRef.current = setTimeout(() => setShowBackOnline(false), BACK_ONLINE_DISPLAY_MS);
      }
      wasOfflineRef.current = false;
    }
    function handleOffline() {
      setIsOffline(true);
      setShowBackOnline(false);
      wasOfflineRef.current = true;
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (backOnlineTimerRef.current) clearTimeout(backOnlineTimerRef.current);
    };
  }, []);

  if (isOffline) {
    return (
      <div className="flex items-center justify-center gap-2 bg-amber-500 px-4 py-1.5 text-xs font-medium text-white">
        <WifiOff size={14} />
        You&apos;re offline - showing previously loaded data. Some actions won&apos;t work until you&apos;re back online.
      </div>
    );
  }

  if (showBackOnline) {
    return (
      <div className="flex items-center justify-center gap-2 bg-emerald-500 px-4 py-1.5 text-xs font-medium text-white">
        <Wifi size={14} />
        Back online
      </div>
    );
  }

  return null;
}
