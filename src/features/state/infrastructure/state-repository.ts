import { applicationsSlice } from "@/features/applications/infrastructure/state-slice";
import { modsSlice } from "@/features/app-shell/infrastructure/state-slice";
import { dailySearchSlice } from "@/features/daily-search/infrastructure/state-slice";
import { draftSlice } from "@/features/new-offer/infrastructure/state-slice";
import { planSlice } from "@/features/plan/infrastructure/state-slice";
import { profileSlice } from "@/features/profile/infrastructure/state-slice";
import { registriesSlice } from "@/features/registries/infrastructure/state-slice";
import { eq } from "drizzle-orm";
import { profiles } from "@/features/profile/infrastructure/schema";
import type { Database } from "@/shared/db/client";
import type { DbTransaction } from "@/shared/db/rows";
import { hydrate } from "../domain/state";
import type { AppState } from "../domain/types";
import { withSyncedName } from "../domain/with-synced-name";
import type { StateSlice } from "./state-slice";

/**
 * The state feature owns `AppState`, so it owns assembling and replacing the
 * whole of it; each feature maps its own tables through its slice.
 * Parent tables are written before their children inside a slice.
 */
const slices: StateSlice[] = [
  profileSlice,
  draftSlice,
  modsSlice,
  applicationsSlice,
  dailySearchSlice,
  planSlice,
  registriesSlice,
];

/**
 * Loads the user's state from its rows, through the same `hydrate` and name
 * sync the localStorage path applies. A user with no saved state gets the blank one.
 */
export async function loadState(db: Database, userId: string): Promise<AppState> {
  // The profile row is written on every replace, so its absence means "nothing saved yet".
  const profile = await profileSlice.read(db, userId);
  if (!("profile" in profile)) return withSyncedName(hydrate({}));
  const parts = await Promise.all(slices.filter((s) => s !== profileSlice).map((s) => s.read(db, userId)));
  return withSyncedName(hydrate(Object.assign({}, profile, ...parts)));
}

/**
 * Replaces everything saved for the user with `state`, atomically: on any
 * failure the previous state stays intact. Only rows of `userId` are touched.
 */
export async function replaceState(db: Database, userId: string, state: AppState): Promise<void> {
  await db.transaction((tx) => replaceStateIn(tx, userId, state));
}

/** `replaceState` inside a transaction the caller already owns (e.g. a command batch). */
export async function replaceStateIn(tx: DbTransaction, userId: string, state: AppState): Promise<void> {
  // Hydrating first fills defaults, so sparse backups (older shapes) never reach the row mappers.
  const full = hydrate(state);
  for (const slice of slices) await slice.clear(tx, userId);
  for (const slice of slices) await slice.write(tx, userId, full);
}

/**
 * Row-level writes need the singleton rows to exist, and `loadState` treats a missing profile row as
 * "nothing saved". So before a user's first change, the blank state is written out as rows.
 */
export async function ensureStateRows(tx: DbTransaction, userId: string): Promise<void> {
  const [saved] = await tx.select({ userId: profiles.userId }).from(profiles).where(eq(profiles.userId, userId));
  if (!saved) await replaceStateIn(tx, userId, withSyncedName(hydrate({})));
}
