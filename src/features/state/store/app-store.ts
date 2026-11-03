import { createStore } from "zustand/vanilla";
import { debounce } from "@/shared/lib/debounce";
import { todayIso } from "@/shared/lib/dates";
import { blank, hydrate } from "../domain/state";
import type { AppState } from "../domain/types";
import {
  browserStorage,
  loadState,
  saveState,
  withSyncedName,
  type StorageLike,
} from "./persistence";

export const SAVE_DEBOUNCE_MS = 250;

export interface AppStoreOptions {
  /** Resolved lazily so the store can be created on the server and used in the browser. */
  storage?: () => StorageLike | null;
  today?: () => string;
  debounceMs?: number;
}

export interface UpdateOptions {
  /** Save now instead of after the debounce (for discrete actions, as opposed to typing). */
  immediate?: boolean;
}

export interface AppStoreState {
  state: AppState;
  /** True once the saved state was read from storage. */
  loaded: boolean;
  load(): void;
  update(recipe: (state: AppState) => AppState, options?: UpdateOptions): void;
  saveNow(): void;
  /** Restores a backup; returns false when the data is not a valid backup. */
  importBackup(raw: unknown): boolean;
}

export function createAppStore(options: AppStoreOptions = {}) {
  const getStorage = options.storage ?? browserStorage;
  const today = options.today ?? todayIso;

  return createStore<AppStoreState>()((set, get) => {
    // Idempotent: once loaded, the in-memory state is the source of truth.
    // Re-reading storage would drop edits still waiting on the debounce.
    const load = () => {
      if (get().loaded) return;
      set({ state: loadState(getStorage(), today()), loaded: true });
    };
    const writeNow = () => {
      // Never persist the initial blank state over data that was not read yet.
      load();
      saveState(getStorage(), get().state);
    };
    const writeDebounced = debounce(writeNow, options.debounceMs ?? SAVE_DEBOUNCE_MS);
    const saveNow = () => {
      writeDebounced.cancel();
      writeNow();
    };

    return {
      state: withSyncedName(blank()),
      loaded: false,
      load,
      update: (recipe, opts) => {
        load();
        set({ state: recipe(get().state) });
        if (opts?.immediate) saveNow();
        else writeDebounced();
      },
      saveNow,
      importBackup: (raw) => {
        const candidate = raw as { apps?: unknown } | null;
        if (!candidate || !Array.isArray(candidate.apps)) return false;
        set({ state: withSyncedName(hydrate(candidate, today())), loaded: true });
        saveNow();
        return true;
      },
    };
  });
}
