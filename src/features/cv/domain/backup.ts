import type { AppState } from "@/features/state/domain/types";

export interface BackupFile {
  filename: string;
  data: string;
}

/** Builds the backup export with the same file name and JSON layout as the legacy artifact. */
export function backupFile(state: AppState, today: string): BackupFile {
  return { filename: `radar-postulaciones-${today}.json`, data: JSON.stringify(state, null, 1) };
}
