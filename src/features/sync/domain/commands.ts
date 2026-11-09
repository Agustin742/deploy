import type { RegistryItems, RegistryKey } from "@/features/registries/domain/registries";
import type {
  AppState,
  Application,
  Base,
  CompanyProfile,
  Draft,
  Interview,
  Marca,
  MatchSuccess,
  ModKey,
  Platform,
  Profile,
} from "@/features/state/domain/types";

/** Field patches carry the resulting values, never instructions, so the server stays free of UI rules. */
type Patch<T> = Partial<T>;
type ApplicationFields = Patch<Omit<Application, "id" | "match" | "ficha" | "entrevistas" | "pre">>;
type RegistryFields<K extends RegistryKey> = Patch<Omit<RegistryItems[K], "id">>;

/**
 * Every write the UI performs, one typed command per row-level change. The client applies the
 * existing pure domain function optimistically and sends the values that result (derived data
 * such as `match`, `plazo`, `doneAt`, a guessed `fuente` or a synced name is computed client-side).
 * Commands are untrusted input: `parseCommand` validates them before a handler runs.
 */
export type Command =
  // Profile feature
  | { type: "profile.setFields"; fields: Patch<Profile> }
  | { type: "goal.set"; goal: number; goalSet: boolean }
  | { type: "base.setFields"; fields: Patch<Base> }
  | { type: "brand.setFields"; fields: Patch<Marca> }
  // App shell
  | { type: "module.set"; mod: ModKey; enabled: boolean }
  // New offer
  | { type: "draft.setFields"; fields: Patch<Draft> }
  | { type: "draft.clear" }
  // Applications
  | { type: "app.create"; app: Application }
  | { type: "app.setFields"; id: string; fields?: ApplicationFields; ficha?: Patch<CompanyProfile>; match?: MatchSuccess | null }
  | { type: "app.remove"; id: string }
  | { type: "interview.add"; appId: string; interview: Interview }
  | { type: "interview.setFields"; appId: string; id: string; fields: Patch<Omit<Interview, "id">> }
  | { type: "interview.remove"; appId: string; id: string }
  | { type: "checklist.set"; appId: string; key: string; ok?: boolean; txt?: string }
  // Daily search
  | { type: "platform.add"; platform: Platform }
  | { type: "platform.update"; id: string; name: string; url: string }
  | { type: "platform.remove"; id: string }
  | { type: "platform.restoreDefaults" }
  | { type: "check.set"; month: string; platformId: string; day: number; checked: boolean }
  | { type: "check.markDay"; month: string; day: number }
  // Plan
  | { type: "plan.setWeekVars"; week: string; varIds: string[] }
  | { type: "plan.setTarget"; key: string; value: string }
  // Registries (objectives included)
  | { [K in RegistryKey]: { type: "registry.add"; kind: K; item: { id: string } & RegistryFields<K> } }[RegistryKey]
  | { [K in RegistryKey]: { type: "registry.setFields"; kind: K; id: string; fields: RegistryFields<K> } }[RegistryKey]
  | { type: "registry.remove"; kind: RegistryKey; id: string }
  // Whole state (backup import)
  | { type: "state.replace"; state: AppState };

export type CommandType = Command["type"];
export type CommandOf<T extends CommandType> = Extract<Command, { type: T }>;

/** Why a command or batch was not applied. `unauthorized` is added by the server action layer. */
export type CommandErrorCode = "invalid" | "not_found" | "conflict" | "failed";

export type ApplyResult =
  | { ok: true }
  | { ok: false; error: "unauthorized" }
  | { ok: false; error: CommandErrorCode; /** Position of the failing command in the batch, when known. */ index?: number };
