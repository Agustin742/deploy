"use server";

import { getSession } from "@/features/auth/infrastructure/session";
import { loadState } from "@/features/state/infrastructure/state-repository";
import type { AppState } from "@/features/state/domain/types";
import { getDb } from "@/shared/db/get-db";
import type { ApplyResult, Command } from "../domain/commands";
import { applyCommandBatch } from "./apply-commands";

export type LoadResult = { ok: true; state: AppState } | { ok: false; error: "unauthorized" | "failed" };

/**
 * Applies a batch of state commands for the signed-in user. The user id comes from the session cookie,
 * never from the arguments: server actions are public endpoints, so `commands` is untrusted and validated.
 */
export async function applyCommands(commands: Command[]): Promise<ApplyResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "unauthorized" };
  return applyCommandBatch(getDb(), session.user.id, commands);
}

/** The signed-in user's whole state, assembled from their rows. */
export async function loadMyState(): Promise<LoadResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "unauthorized" };
  try {
    return { ok: true, state: await loadState(getDb(), session.user.id) };
  } catch (error) {
    console.error("Loading state failed", error);
    return { ok: false, error: "failed" };
  }
}
