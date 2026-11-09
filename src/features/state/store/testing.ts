import { vi } from "vitest";
import { applyCommands, loadMyState } from "@/features/sync/infrastructure/actions";
import { blank, hydrate } from "../domain/state";
import type { AppState } from "../domain/types";
import { withSyncedName } from "../domain/with-synced-name";
import { appStore } from "./use-app-store";

/**
 * Test helper: puts the app store in the "loaded from the server" state with `patch` on top of the
 * blank state, forgets anything a previous test left queued and clears the Server Function fakes.
 */
export function resetAppStore(patch: Partial<AppState> = {}) {
  void appStore.getState().flush();
  appStore.setState(appStore.getInitialState(), true);
  appStore.setState({ state: withSyncedName(hydrate({ ...blank(), ...patch })), loaded: true, status: "ready" });
  vi.mocked(applyCommands).mockClear();
  vi.mocked(loadMyState).mockClear();
}

/** Forgets the commands sent so far (e.g. those of a test's own setup). */
export const clearSentCommands = () => vi.mocked(applyCommands).mockClear();

/** The command batches sent to the server (fake) since the last reset, flattened. */
export const sentCommands = () => vi.mocked(applyCommands).mock.calls.flatMap(([batch]) => batch);
