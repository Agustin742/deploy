import { applicationsHandlers } from "@/features/applications/infrastructure/command-handlers";
import { modulesHandlers } from "@/features/app-shell/infrastructure/command-handlers";
import { dailySearchHandlers } from "@/features/daily-search/infrastructure/command-handlers";
import { draftHandlers } from "@/features/new-offer/infrastructure/command-handlers";
import { planHandlers } from "@/features/plan/infrastructure/command-handlers";
import { profileHandlers } from "@/features/profile/infrastructure/command-handlers";
import { registryHandlers } from "@/features/registries/infrastructure/command-handlers";
import { ensureStateRows, replaceStateIn } from "@/features/state/infrastructure/state-repository";
import type { Database } from "@/shared/db/client";
import type { DbTransaction } from "@/shared/db/rows";
import type { ApplyResult, Command, CommandType } from "../domain/commands";
import { parseCommands } from "../domain/parse-command";
import { CommandFailure, type CommandHandler } from "./command-handler";

/** Every command type has exactly one handler; a missing one is a compile error. */
const handlers: { [T in CommandType]: CommandHandler<T> } = {
  ...profileHandlers,
  ...modulesHandlers,
  ...draftHandlers,
  ...applicationsHandlers,
  ...dailySearchHandlers,
  ...planHandlers,
  ...registryHandlers,
  "state.replace": (tx, userId, { state }) => replaceStateIn(tx, userId, state),
};

function run(tx: DbTransaction, userId: string, command: Command): Promise<void> {
  const handler = handlers[command.type] as (tx: DbTransaction, userId: string, command: Command) => Promise<void>;
  return handler(tx, userId, command);
}

/** Stops the transaction (rolling it back) and says which command failed and why. */
class BatchFailure extends Error {
  constructor(
    readonly code: "not_found" | "conflict" | "failed",
    readonly index: number,
    cause?: unknown,
  ) {
    super(code, { cause });
  }
}

/**
 * Validates an untrusted batch and applies it for `userId` in one transaction: either every command
 * is applied or none is. `userId` always comes from the session, never from the client.
 */
export async function applyCommandBatch(db: Database, userId: string, input: unknown): Promise<ApplyResult> {
  const commands = parseCommands(input);
  if (!commands) return { ok: false, error: "invalid" };
  if (commands.length === 0) return { ok: true };

  try {
    await db.transaction(async (tx) => {
      await ensureStateRows(tx, userId);
      for (const [index, command] of commands.entries()) {
        try {
          await run(tx, userId, command);
        } catch (error) {
          throw new BatchFailure(error instanceof CommandFailure ? error.code : "failed", index, error);
        }
      }
    });
    return { ok: true };
  } catch (error) {
    if (error instanceof BatchFailure) {
      if (error.code === "failed") console.error("Command batch failed", { index: error.index }, error.cause);
      return { ok: false, error: error.code, index: error.index };
    }
    console.error("Command batch failed", error);
    return { ok: false, error: "failed" };
  }
}
