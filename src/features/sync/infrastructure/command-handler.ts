import type { DbTransaction } from "@/shared/db/rows";
import { affectedRows } from "@/shared/db/rows";
import type { CommandOf, CommandType } from "../domain/commands";

/** Thrown by a handler to refuse its command; the batch is rolled back and the code reported. */
export class CommandFailure extends Error {
  constructor(readonly code: "not_found" | "conflict") {
    super(code);
  }
}

/** Applies one command at row level for `userId`. Every query it runs must be scoped by `userId`. */
export type CommandHandler<T extends CommandType> = (tx: DbTransaction, userId: string, command: CommandOf<T>) => Promise<void>;

/** The handlers one feature owns; the dispatcher checks that all of them together cover every command. */
export type CommandHandlers = { [T in CommandType]?: CommandHandler<T> };

/** An UPDATE or DELETE that matched no row of this user means the target does not exist for them. */
export function requireMatch(result: unknown): void {
  if (affectedRows(result) === 0) throw new CommandFailure("not_found");
}
