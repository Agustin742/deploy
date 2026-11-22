import { parseEmailList } from "../domain/email";

/**
 * Owner emails from `OWNER_EMAILS` (comma-separated, optional). Read per call, never at import time,
 * so `next build` needs no env. Owners are always allowed and can manage the allowlist.
 */
export function readOwnerEmails(env: Record<string, string | undefined> = process.env): string[] {
  return parseEmailList(env.OWNER_EMAILS);
}
