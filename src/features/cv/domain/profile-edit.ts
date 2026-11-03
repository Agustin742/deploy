import { syncProfileName } from "@/features/profile/domain/name";
import type { AppState, Profile } from "@/features/state/domain/types";

/** Sets one profile field. Typing a name makes it manual; a CV edit re-detects an automatic name. */
export function setProfileField<K extends keyof Profile>(state: AppState, key: K, value: Profile[K]): AppState {
  const next: AppState = { ...state, profile: { ...state.profile, [key]: value } };
  if (key === "name") next.profile.nameAuto = !String(value).trim();
  if (key === "cv") next.profile = syncProfileName(next.profile);
  return next;
}

/** Replaces the CV text (loaded from a file) and re-detects the name. */
export const setCvText = (state: AppState, text: string): AppState => setProfileField(state, "cv", text);

/** Parses a backup file; null when it is not JSON. */
export function parseBackupText(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
