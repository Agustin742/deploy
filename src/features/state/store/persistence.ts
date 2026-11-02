import { syncProfileName } from "@/features/profile/domain/name";
import { blank, hydrate, STORAGE_KEY } from "../domain/state";
import type { AppState } from "../domain/types";

/** The subset of the Web Storage API the app needs. */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/** Browser localStorage, or null when it is unavailable or blocked (SSR, private mode, etc.). */
export function browserStorage(): StorageLike | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

/** Applies the name sync rule the artifact ran right after loading or importing a state. */
export function withSyncedName(state: AppState): AppState {
  return { ...state, profile: syncProfileName(state.profile) };
}

/**
 * Reads the saved state. Any failure (no storage, blocked, corrupted JSON) yields
 * the blank state, like the original artifact.
 */
export function loadState(storage: StorageLike | null, today?: string): AppState {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (raw) return withSyncedName(hydrate(JSON.parse(raw), today));
  } catch {
    // fall through to the blank state
  }
  return withSyncedName(blank());
}

/** Writes the state; returns false (and never throws) when saving is not possible. */
export function saveState(storage: StorageLike | null, state: AppState): boolean {
  try {
    if (!storage) return false;
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}
