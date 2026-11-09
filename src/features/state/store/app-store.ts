import { createStore } from "zustand/vanilla";
import { createCommandQueue } from "@/features/sync/application/command-queue";
import type { StatePorts } from "@/features/sync/application/ports";
import { diffState } from "@/features/sync/domain/diff-state";
import { todayIso } from "@/shared/lib/dates";
import { blank, hydrate } from "../domain/state";
import type { AppState } from "../domain/types";
import { withSyncedName } from "../domain/with-synced-name";

export const SAVE_FAILED_MESSAGE = "No se pudo guardar el último cambio. Volvimos a cargar tus datos.";
export const RELOAD_FAILED_MESSAGE = "No pudimos actualizar tus datos. Recargá la página.";

/** Reloads that are retried because the person kept editing while the server state was on its way. */
const MAX_RELOAD_ATTEMPTS = 3;

export interface AppStoreOptions {
  ports: StatePorts;
  /** Tells the person something (a toast). */
  onNotice?: (message: string) => void;
  /** The session is gone: go to the sign-in page. */
  onUnauthorized?: () => void;
  today?: () => string;
  debounceMs?: number;
}

export interface UpdateOptions {
  /** Send now instead of after the debounce (for discrete actions, as opposed to typing). */
  immediate?: boolean;
}

export type LoadStatus = "idle" | "loading" | "ready" | "error";

export interface AppStoreState {
  state: AppState;
  /** True once the state was read from the server. */
  loaded: boolean;
  status: LoadStatus;
  /** Reads the state from the server (once; later calls keep the in-memory state). */
  load(): Promise<void>;
  /** Applies the change to the screen now and sends the matching commands to the server. */
  update(recipe: (state: AppState) => AppState, options?: UpdateOptions): void;
  /** Sends whatever is waiting (leaving the page, importing); false if a batch failed. */
  flush(): Promise<boolean>;
  /** Restores a backup through the server; returns false when the data is not a valid backup. */
  importBackup(raw: unknown): boolean;
}

/**
 * The client copy of the user's state. The server is the source of truth: every change is applied
 * here first (so the screen reacts at once), turned into commands and sent in order. When the server
 * refuses something, the copy is thrown away and reloaded, so what is shown is always what is saved.
 */
export function createAppStore(options: AppStoreOptions) {
  const { ports } = options;
  const today = options.today ?? todayIso;
  const notice = (message: string) => options.onNotice?.(message);

  return createStore<AppStoreState>()((set, get) => {
    let inflightLoad: Promise<void> | null = null;
    /** Counts local edits, so a reload can tell whether the server state it fetched is already outdated. */
    let edits = 0;

    const fetchFresh = async (): Promise<AppState | "unauthorized" | null> => {
      try {
        const result = await ports.loadState();
        if (result.ok) return result.state;
        return result.error === "unauthorized" ? "unauthorized" : null;
      } catch {
        return null;
      }
    };

    /** Replaces the local copy with the server's, discarding changes that were never saved. */
    const reload = async (): Promise<void> => {
      queue.discard();
      for (let attempt = 0; attempt < MAX_RELOAD_ATTEMPTS; attempt++) {
        const seen = edits;
        const fresh = await fetchFresh();
        if (fresh === "unauthorized") return options.onUnauthorized?.();
        if (fresh === null) return notice(RELOAD_FAILED_MESSAGE);
        if (edits === seen) {
          set({ state: fresh, loaded: true, status: "ready" });
          return;
        }
        // Edits made meanwhile reach the server first, then the fetch is repeated.
        await queue.flush();
      }
    };

    const onFailure = () => {
      notice(SAVE_FAILED_MESSAGE);
      void reload();
    };

    const queue = createCommandQueue({
      send: ports.applyCommands,
      onFailure,
      onUnauthorized: () => options.onUnauthorized?.(),
      debounceMs: options.debounceMs,
    });

    const load = (): Promise<void> => {
      if (get().loaded) return Promise.resolve();
      if (get().status === "loading" && inflightLoad) return inflightLoad;
      set({ status: "loading" });
      inflightLoad = (async () => {
        const fresh = await fetchFresh();
        inflightLoad = null;
        if (fresh === "unauthorized") return options.onUnauthorized?.();
        if (fresh === null) return set({ status: "error" });
        set({ state: fresh, loaded: true, status: "ready" });
      })();
      return inflightLoad;
    };

    return {
      state: withSyncedName(blank()),
      loaded: false,
      status: "idle",
      load,
      update: (recipe, opts) => {
        // Until the server state is here, "the current state" is just the blank placeholder.
        if (!get().loaded) return;
        const prev = get().state;
        const next = recipe(prev);
        if (next === prev) return;
        edits++;
        set({ state: next });
        queue.enqueue(diffState(prev, next), { debounce: !opts?.immediate });
      },
      flush: () => queue.flush(),
      importBackup: (raw) => {
        const candidate = raw as { apps?: unknown } | null;
        if (!candidate || !Array.isArray(candidate.apps)) return false;
        const next = withSyncedName(hydrate(candidate, today()));
        edits++;
        set({ state: next, loaded: true, status: "ready" });
        queue.enqueue([{ type: "state.replace", state: next }]);
        // On success, show what was actually saved. On failure the queue already reloaded.
        void queue.flush().then((ok) => (ok ? reload() : undefined));
        return true;
      },
    };
  });
}
