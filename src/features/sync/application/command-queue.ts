import type { ApplyResult, Command } from "../domain/commands";
import { coalesceKey, mergeCommands } from "../domain/coalesce";
import { MAX_BATCH } from "../domain/parse-command";

/** Quiet time after the last keystroke before a text edit is sent. */
export const DEBOUNCE_MS = 600;

export type SyncFailure = "invalid" | "not_found" | "conflict" | "failed" | "network";

export interface CommandQueueOptions {
  /** Sends one batch to the server. A rejected promise counts as a network error. */
  send: (commands: Command[]) => Promise<ApplyResult>;
  /** A batch was not applied: the optimistic state is no longer trustworthy. */
  onFailure: (reason: SyncFailure) => void;
  /** The session is gone. */
  onUnauthorized: () => void;
  debounceMs?: number;
}

export interface CommandQueue {
  /**
   * Queues commands in order. With `debounce`, edits of the same row are merged and sent after a quiet
   * period; everything else is sent now, after any edit still waiting (so the order is never changed).
   */
  enqueue: (commands: Command[], options?: { debounce?: boolean }) => void;
  /** Sends what is waiting and resolves when nothing is in flight; false if a batch failed meanwhile. */
  flush: () => Promise<boolean>;
  /** True while edits wait for their quiet period. */
  hasPending: () => boolean;
  /** Forgets everything not yet sent (the caller is about to replace the state from the server). */
  discard: () => void;
}

/**
 * Ordered, one-batch-at-a-time command sender. Order matters because commands build on each other
 * (create, then edit, then remove), so a batch is never sent while another is in flight and
 * a failure drops whatever was queued behind it: the caller reloads the real state instead.
 */
export function createCommandQueue(options: CommandQueueOptions): CommandQueue {
  const debounceMs = options.debounceMs ?? DEBOUNCE_MS;
  const pending = new Map<string, Command>();
  const timers = new Map<string, ReturnType<typeof setTimeout>>();
  let outbox: Command[] = [];
  let sending: Promise<void> | null = null;
  let failures = 0;

  const clearTimers = () => {
    for (const timer of timers.values()) clearTimeout(timer);
    timers.clear();
  };

  const movePendingToOutbox = () => {
    clearTimers();
    outbox.push(...pending.values());
    pending.clear();
  };

  const discard = () => {
    clearTimers();
    pending.clear();
    outbox = [];
  };

  const run = async (batch: Command[]) => {
    let result: ApplyResult;
    try {
      result = await options.send(batch);
    } catch {
      failures++;
      discard();
      options.onFailure("network");
      return;
    }
    if (result.ok) return;
    failures++;
    discard();
    if (result.error === "unauthorized") options.onUnauthorized();
    else options.onFailure(result.error);
  };

  const pump = () => {
    if (sending || outbox.length === 0) return;
    const batch = outbox.splice(0, MAX_BATCH);
    sending = run(batch).then(() => {
      sending = null;
      pump();
    });
  };

  return {
    enqueue(commands, { debounce = false } = {}) {
      let queuedNow = false;
      for (const command of commands) {
        const key = debounce ? coalesceKey(command) : null;
        if (key === null) {
          movePendingToOutbox();
          outbox.push(command);
          queuedNow = true;
          continue;
        }
        const earlier = pending.get(key);
        pending.set(key, earlier ? mergeCommands(earlier, command) : command);
        clearTimeout(timers.get(key));
        timers.set(
          key,
          setTimeout(() => {
            movePendingToOutbox();
            pump();
          }, debounceMs),
        );
      }
      if (queuedNow) pump();
    },

    async flush() {
      const before = failures;
      movePendingToOutbox();
      pump();
      while (sending) await sending;
      return failures === before;
    },

    hasPending: () => pending.size > 0,
    discard,
  };
}
