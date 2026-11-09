import type { Database } from "@/shared/db/client";
import type { DbTransaction } from "@/shared/db/rows";
import type { AppState } from "../domain/types";

/**
 * One feature's share of the persisted state. Each feature owns the mapping
 * between its part of `AppState` and its own tables; the state repository only
 * orchestrates the slices.
 */
export interface StateSlice {
  /** Raw (not yet hydrated) state keys read from this user's rows. Empty when the user has no rows. */
  read(db: Database, userId: string): Promise<Partial<Record<keyof AppState, unknown>>>;
  /** Deletes this user's rows from the slice's tables. */
  clear(tx: DbTransaction, userId: string): Promise<void>;
  /** Inserts this user's rows for the slice (runs after every slice was cleared). */
  write(tx: DbTransaction, userId: string, state: AppState): Promise<void>;
}
