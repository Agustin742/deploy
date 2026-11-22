import { desc, eq, inArray } from "drizzle-orm";
import type { Database } from "@/shared/db/client";
import { session, user } from "@/shared/db/schema";
import { normalizeEmail } from "../domain/email";
import { allowedEmails } from "./schema";

export interface AllowedEmail {
  email: string;
  addedBy: string | null;
  createdAt: Date;
}

/** Whether the email has a row in the allowlist (owners are checked separately, they are not stored). */
export async function isListed(db: Database, email: string): Promise<boolean> {
  const rows = await db
    .select({ email: allowedEmails.email })
    .from(allowedEmails)
    .where(eq(allowedEmails.email, normalizeEmail(email)))
    .limit(1);
  return rows.length > 0;
}

/** Newest first. */
export async function listAllowed(db: Database): Promise<AllowedEmail[]> {
  return db
    .select({ email: allowedEmails.email, addedBy: allowedEmails.addedBy, createdAt: allowedEmails.createdAt })
    .from(allowedEmails)
    .orderBy(desc(allowedEmails.createdAt), allowedEmails.email);
}

/** Adds the email; adding one that is already listed is a no-op. */
export async function addAllowed(db: Database, email: string, addedBy: string | null): Promise<void> {
  await db
    .insert(allowedEmails)
    .values({ email: normalizeEmail(email), addedBy: addedBy ? normalizeEmail(addedBy) : null })
    .onDuplicateKeyUpdate({ set: { email: normalizeEmail(email) } });
}

/** Removes the email and revokes the matching user's sessions, so a later re-add does not revive them. */
export async function removeAllowed(db: Database, email: string): Promise<void> {
  const normalized = normalizeEmail(email);
  await db.transaction(async (tx) => {
    await tx.delete(allowedEmails).where(eq(allowedEmails.email, normalized));
    const users = await tx.select({ id: user.id }).from(user).where(eq(user.email, normalized));
    if (users.length > 0) {
      await tx.delete(session).where(inArray(session.userId, users.map((u) => u.id)));
    }
  });
}
