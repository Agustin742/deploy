import "server-only";
import { getDb } from "@/shared/db/get-db";
import { normalizeEmail } from "../domain/email";
import { isListed } from "./allowlist-repository";
import { readOwnerEmails } from "./owner-env";

/** Whether the email belongs to an owner (OWNER_EMAILS). */
export function isOwnerEmail(email: string): boolean {
  return readOwnerEmails().includes(normalizeEmail(email));
}

/** The single access rule: owners are always allowed, everyone else must be on the list. */
export async function isEmailAllowed(email: string): Promise<boolean> {
  return isOwnerEmail(email) || isListed(getDb(), email);
}
