"use client";

import { useSyncExternalStore } from "react";
import { menuItemClass } from "@/shared/ui/menu";
import { buttonClass } from "@/shared/ui/styles";
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

export interface ThemeToggleProps {
  /** "button" is a standalone secondary button, "menuitem" a row of a menu, "icon" a compact icon button. */
  variant?: "button" | "menuitem" | "icon";
  className?: string;
}

export function ThemeToggle({ variant = "button", className }: ThemeToggleProps) {
  const current = useSyncExternalStore<Theme | null>(subscribe, getSnapshot, getServerSnapshot);

  const toggle = () => {
    const next = nextTheme(current ?? getSnapshot());
    document.documentElement.dataset.theme = next;
    writeStoredTheme(window.localStorage, next);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  };

  const label = themeToggleLabel(current);

  if (variant === "icon") {
    const name = label.replace(/^\S+\s*/, "");
    return (
      <button
        type="button"
        onClick={toggle}
        aria-label={name}
        title={name}
        className={`btn btn-ghost size-10 p-0 ${className ?? ""}`.trim()}
      >
        <span aria-hidden="true" className="text-lg leading-none">
          {label.charAt(0)}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      role={variant === "menuitem" ? "menuitem" : undefined}
      tabIndex={variant === "menuitem" ? -1 : undefined}
      onClick={toggle}
      className={className ?? (variant === "menuitem" ? menuItemClass : buttonClass("secondary"))}
    >
      {label}
    </button>
  );
}
