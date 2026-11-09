import { syncProfileName } from "@/features/profile/domain/name";
import type { AppState } from "./types";

/** Applies the name sync rule the artifact ran right after loading or importing a state. */
export function withSyncedName(state: AppState): AppState {
  return { ...state, profile: syncProfileName(state.profile) };
}
