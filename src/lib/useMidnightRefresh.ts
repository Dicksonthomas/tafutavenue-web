"use client";

import { useEffect } from "react";

/**
 * Calls `callback` once each day when it reaches midnight (00:00) while the
 * page is open, so "today" doesn't stay stuck on yesterday's date if the
 * user leaves the tab open across midnight without reloading (refresh).
 */
export function useMidnightRefresh(callback: () => void) {
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    function scheduleNext() {
      const now = new Date();
      const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 5);
      const msUntilMidnight = nextMidnight.getTime() - now.getTime();

      timeoutId = setTimeout(() => {
        callback();
        scheduleNext();
      }, msUntilMidnight);
    }

    scheduleNext();

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
