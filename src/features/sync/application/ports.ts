import type { AppState } from "@/features/state/domain/types";
import type { ApplyResult, Command } from "../domain/commands";

export type LoadStateResult = { ok: true; state: AppState } | { ok: false; error: "unauthorized" | "failed" };

/** What the client needs from the server: the Server Functions in production, fakes in tests. */
export interface StatePorts {
  loadState: () => Promise<LoadStateResult>;
  applyCommands: (commands: Command[]) => Promise<ApplyResult>;
}
