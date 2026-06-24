"use client";

import { useEffect } from "react";
import { logEvent } from "@/lib/analytics/log-event";

const STORAGE_KEY = "geekstack_last_seen";
const RETURN_THRESHOLD_MS = 60 * 60 * 1000; // 1h

export function SessionTracker() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const last = Number(window.localStorage.getItem(STORAGE_KEY) ?? "0");
      const now = Date.now();
      if (last && now - last > RETURN_THRESHOLD_MS) {
        void logEvent("session_return", { gap_minutes: Math.round((now - last) / 60000) });
      }
      window.localStorage.setItem(STORAGE_KEY, String(now));
    } catch {
      // localStorage indisponible (mode privé strict) → on ignore
    }
  }, []);

  return null;
}
