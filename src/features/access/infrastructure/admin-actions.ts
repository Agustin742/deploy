"use server";

import { requireOwnerSession } from "@/features/auth/infrastructure/session";
import type { Database } from "@/shared/db/client";
import { getDb } from "@/shared/db/get-db";
import type { AdminResult } from "../domain/allowed-email-view";
import { isValidEmail, normalizeEmail } from "../domain/email";
import { addAllowed, listAllowed, removeAllowed } from "./allowlist-repository";

/**
 * Server actions are public endpoints: every one re-checks that the caller is an owner from the session
 * cookie (never from arguments) and treats its input as untrusted. Each returns the fresh list.
 */
async function asOwner(run: (db: Database, ownerEmail: string) => Promise<void>): Promise<AdminResult> {
  const session = await requireOwnerSession();
  if (!session) return { ok: false, error: "forbidden" };
  try {
    const db = getDb();
    await run(db, session.user.email);
    const rows = await listAllowed(db);
    return { ok: true, emails: rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })) };
  } catch (error) {
    console.error("Allowlist admin action failed", error);
    return { ok: false, error: "failed" };
  }
}

export async function listAllowedEmails(): Promise<AdminResult> {
  return asOwner(async () => {});
}

export async function addAllowedEmail(email: string): Promise<AdminResult> {
  // Authorization first: a non-owner learns nothing about validation.
  if (!(await requireOwnerSession())) return { ok: false, error: "forbidden" };
  if (typeof email !== "string" || !isValidEmail(email)) return { ok: false, error: "invalid_email" };
  return asOwner((db, owner) => addAllowed(db, normalizeEmail(email), owner));
}

export async function removeAllowedEmail(email: string): Promise<AdminResult> {
  if (!(await requireOwnerSession())) return { ok: false, error: "forbidden" };
  if (typeof email !== "string") return { ok: false, error: "invalid_email" };
  return asOwner((db) => removeAllowed(db, email));
}
