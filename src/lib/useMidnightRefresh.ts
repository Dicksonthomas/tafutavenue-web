"use client";

import { useEffect } from "react";

/**
 * Inaita `callback` mara moja kila siku inapofika usiku wa manane (00:00) wakati
 * ukurasa umefunguliwa, ili "leo/today" isibaki tarehe ya jana kama mtumiaji
 * ameacha tab wazi ikivuka usiku wa manane bila kupakia upya (refresh).
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
