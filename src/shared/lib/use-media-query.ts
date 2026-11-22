"use client";

import { useSyncExternalStore } from "react";

/**
 * Tracks a CSS media query. `serverValue` is used for the server render and hydration
 * (and when `matchMedia` is missing), so markup always matches the server.
 */
export function useMediaQuery(query: string, serverValue = true): boolean {
  const subscribe = (notify: () => void) => {
    if (typeof window.matchMedia !== "function") return () => {};
    const media = window.matchMedia(query);
    media.addEventListener("change", notify);
    return () => media.removeEventListener("change", notify);
  };
  const getSnapshot = () => (typeof window.matchMedia === "function" ? window.matchMedia(query).matches : serverValue);
  return useSyncExternalStore(subscribe, getSnapshot, () => serverValue);
}
