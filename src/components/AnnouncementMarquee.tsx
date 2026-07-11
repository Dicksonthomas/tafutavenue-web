"use client";

import { useEffect, useState } from "react";
import { Megaphone } from "lucide-react";
import { fetchNotifications } from "@/lib/notifications";
import { Notification } from "@/lib/types";
import { useSettings } from "@/lib/settings";

/**
 * A scrolling ticker banner of recent announcements, shown at the top of
 * the CR/Staff dashboard. Reuses the existing /notifications endpoint
 * (type=announcement) rather than a new one - an announcement already fans
 * out as a Notification row per recipient. An Admin can turn this off
 * entirely (marquee_enabled) or set an expiry (marquee_until) from Settings.
 */
export default function AnnouncementMarquee() {
  const { marquee_enabled, marquee_until } = useSettings();
  const [items, setItems] = useState<Notification[]>([]);

  const expired = !!marquee_until && new Date(marquee_until).getTime() < Date.now();
  const visible = marquee_enabled && !expired;

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    fetchNotifications({ type: "announcement", per_page: 5 })
      .then((res) => {
        if (!cancelled) setItems(res.data);
      })
      .catch(() => {
        // Silently skip the marquee if this fails - it's a nice-to-have,
        // not something that should block the dashboard from rendering.
      });
    return () => {
      cancelled = true;
    };
  }, [visible]);

  if (!visible || items.length === 0) return null;

  // Duplicated once so the CSS scroll loop has no visible gap/jump at the
  // seam between the end of the content and it starting over.
  const text = items.map((n) => `${n.title}${n.body ? " — " + n.body : ""}`).join("    •    ");

  return (
    <div className="mb-4 flex items-center gap-2 overflow-hidden rounded-lg bg-accent-50 px-3 py-2 text-sm text-accent-800 ring-1 ring-inset ring-accent-200">
      <Megaphone size={16} className="shrink-0" />
      <div className="relative flex-1 overflow-hidden">
        <div className="marquee-track flex w-max gap-12 whitespace-nowrap">
          <span>{text}</span>
          <span>{text}</span>
        </div>
      </div>
      <style jsx>{`
        .marquee-track {
          animation: marquee-scroll 30s linear infinite;
        }
        @keyframes marquee-scroll {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}
