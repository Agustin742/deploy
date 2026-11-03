"use client";

import { useSyncExternalStore } from "react";
import {
  nextTheme,
  parseTheme,
  resolveTheme,
  themeToggleLabel,
  writeStoredTheme,
  type Theme,
} from "../domain/theme";

const CHANGE_EVENT = "radar-theme-change";
const DARK_QUERY = "(prefers-color-scheme: dark)";

const systemMedia = () => (typeof window.matchMedia === "function" ? window.matchMedia(DARK_QUERY) : null);

function subscribe(notify: () => void) {
  const media = systemMedia();
  window.addEventListener(CHANGE_EVENT, notify);
  media?.addEventListener("change", notify);
  return () => {
    window.removeEventListener(CHANGE_EVENT, notify);
    media?.removeEventListener("change", notify);
  };
}

const getSnapshot = (): Theme =>
  resolveTheme(parseTheme(document.documentElement.dataset.theme), systemMedia()?.matches ?? false);

// `null` on the server and during hydration, so markup matches the server render.
const getServerSnapshot = (): Theme | null => null;

export function ThemeToggle() {
  const current = useSyncExternalStore<Theme | null>(subscribe, getSnapshot, getServerSnapshot);

  const toggle = () => {
    const next = nextTheme(current ?? getSnapshot());
    document.documentElement.dataset.theme = next;
    writeStoredTheme(window.localStorage, next);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="cursor-pointer rounded-lg border border-line bg-surface px-3.5 py-2 font-medium hover:border-muted"
    >
      {themeToggleLabel(current)}
    </button>
  );
}
