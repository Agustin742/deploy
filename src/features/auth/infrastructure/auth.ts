import "server-only";
import { isEmailAllowed } from "@/features/access/infrastructure/access";
import { getDb } from "@/shared/db/get-db";
import type { MagicLinkSender } from "../domain/magic-link-sender";
import { readAuthEnv } from "./auth-env";
import { consoleMagicLinkSender } from "./console-magic-link-sender";
import { createAuth, type Auth } from "./create-auth";
import { readSmtpEnv } from "./smtp-env";
import { createSmtpMagicLinkSender } from "./smtp-magic-link-sender";

/** SMTP when configured, otherwise the console sender (local dev and `next build` need no mail env). */
function selectSender(): MagicLinkSender {
  const smtp = readSmtpEnv();
  return smtp ? createSmtpMagicLinkSender(smtp) : consoleMagicLinkSender;
}

let instance: Auth | undefined;

/**
 * Lazy singleton: env is read and the DB pool opened on first use, so `next build` works
 * without DATABASE_URL / BETTER_AUTH_* (nothing touches them at import time).
 */
export function getAuth(): Auth {
  instance ??= createAuth({
    db: getDb(),
    ...readAuthEnv(),
    isEmailAllowed,
    sender: selectSender(),
  });
  return instance;
}

/** Whether Google sign-in is configured (read per request, not baked at build time). */
export function isGoogleEnabled(): boolean {
  return readAuthEnv().google !== null;
}
