import "server-only";
import { getDb } from "@/shared/db/get-db";
import { readAuthEnv } from "./auth-env";
import { consoleMagicLinkSender } from "./console-magic-link-sender";
import { createAuth, type Auth } from "./create-auth";

let instance: Auth | undefined;

/**
 * Lazy singleton: env is read and the DB pool opened on first use, so `next build` works
 * without DATABASE_URL / BETTER_AUTH_* (nothing touches them at import time).
 */
export function getAuth(): Auth {
  instance ??= createAuth({
    db: getDb(),
    ...readAuthEnv(),
    // TODO(deploy): swap for the Resend adapter in production.
    sender: consoleMagicLinkSender,
  });
  return instance;
}

/** Whether Google sign-in is configured (read per request, not baked at build time). */
export function isGoogleEnabled(): boolean {
  return readAuthEnv().google !== null;
}
