import { PLATS } from "@/features/applications/domain/platforms";
import type { AppState, Platform } from "@/features/state/domain/types";
import { pad } from "@/shared/lib/dates";
import { slug } from "@/shared/lib/text";

type Checks = AppState["checks"];

/** Toggles one day of one platform in a month (YYYY-MM). */
export function toggleCheck(state: AppState, month: string, platformId: string, day: number): AppState {
  const days = state.checks[month]?.[platformId] ?? [];
  const next = days.includes(day) ? days.filter((d) => d !== day) : [...days, day];
  return { ...state, checks: { ...state.checks, [month]: { ...state.checks[month], [platformId]: next } } };
}

/** Checks the given day on every platform. */
export function markAllToday(state: AppState, month: string, day: number): AppState {
  const current = state.checks[month] ?? {};
  const monthChecks = { ...current };
  state.platforms.forEach((p) => {
    const days = monthChecks[p.id] ?? [];
    monthChecks[p.id] = days.includes(day) ? days : [...days, day];
  });
  return { ...state, checks: { ...state.checks, [month]: monthChecks } };
}

/** Moves a YYYY-MM month by `delta` months. */
export function shiftMonth(month: string, delta: number): string {
  let [y, m] = month.split("-").map(Number);
  m += delta;
  if (m < 1) {
    m = 12;
    y--;
  }
  if (m > 12) {
    m = 1;
    y++;
  }
  return `${y}-${pad(m)}`;
}

export interface MonthView {
  daysInMonth: number;
  isCurrent: boolean;
  /** Day of the month of `today`. */
  today: number;
  rows: Array<{ platform: Platform; days: number[] }>;
  /** Reviews in the month, over every platform. */
  total: number;
  /** Platforms reviewed today; null when the month is not the current one. */
  doneToday: number | null;
}

export function monthView(state: AppState, month: string, today: string): MonthView {
  const [y, m] = month.split("-").map(Number);
  const isCurrent = month === today.slice(0, 7);
  const td = Number(today.slice(8));
  const checks = state.checks[month] ?? {};
  const rows = state.platforms.map((platform) => ({ platform, days: checks[platform.id] ?? [] }));
  return {
    daysInMonth: new Date(y, m, 0).getDate(),
    isCurrent,
    today: td,
    rows,
    total: rows.reduce((t, r) => t + r.days.length, 0),
    doneToday: isCurrent ? rows.filter((r) => r.days.includes(td)).length : null,
  };
}

export type PlatformResult =
  | { ok: true; state: AppState; message: string }
  /** `message` null: nothing to say (an empty name is ignored when adding). */
  | { ok: false; message: string | null };

const withScheme = (url: string): string => (url && !/^https?:\/\//.test(url) ? `https://${url}` : url);

export function addPlatform(state: AppState, rawName: string, rawUrl: string): PlatformResult {
  const name = rawName.trim();
  if (!name) return { ok: false, message: null };
  const id = slug(name);
  if (state.platforms.some((p) => p.id === id)) return { ok: false, message: "Esa página ya está en la lista" };
  const url = withScheme(rawUrl.trim()) || "#";
  return { ok: true, message: "Página agregada", state: { ...state, platforms: [...state.platforms, { id, name, url, custom: true }] } };
}

export function updatePlatform(state: AppState, id: string, rawName: string, rawUrl: string): PlatformResult {
  const name = rawName.trim();
  if (!name || !state.platforms.some((p) => p.id === id)) return { ok: false, message: "Poné un nombre" };
  const url = withScheme(rawUrl.trim()) || "#";
  return {
    ok: true,
    message: "Página actualizada",
    state: { ...state, platforms: state.platforms.map((p) => (p.id === id ? { ...p, name, url } : p)) },
  };
}

/** Removes a platform and every check recorded for it. */
export function removePlatform(state: AppState, id: string): AppState {
  const checks: Checks = {};
  for (const [month, byPlatform] of Object.entries(state.checks)) {
    checks[month] = Object.fromEntries(Object.entries(byPlatform).filter(([pid]) => pid !== id));
  }
  return { ...state, platforms: state.platforms.filter((p) => p.id !== id), checks };
}

/** Brings back the initial platforms that were removed. */
export function resetPlatforms(state: AppState): { state: AppState; message: string } {
  const missing = PLATS.filter((d) => !state.platforms.some((p) => p.id === d.id));
  const k = missing.length;
  return {
    state: { ...state, platforms: [...state.platforms, ...missing.map((p) => ({ ...p }))] },
    message: k ? `${k} página${k > 1 ? "s" : ""} restaurada${k > 1 ? "s" : ""}` : "Ya están todas las páginas iniciales",
  };
}
