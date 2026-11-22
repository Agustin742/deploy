import "server-only";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { magicLink } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import { EMAIL_NOT_ALLOWED, NO_ACCESS_MESSAGE } from "@/features/access/domain/access-error";
import type { Database } from "@/shared/db/client";
import * as schema from "@/shared/db/schema";
import type { MagicLinkSender } from "../domain/magic-link-sender";
import type { GoogleCredentials } from "./auth-env";

export interface AuthDeps {
  db: Database;
  secret: string;
  baseURL: string;
  google: GoogleCredentials | null;
  sender: MagicLinkSender;
  /** The access rule (allowlist + owners). Required: every sign-in path is gated by it. */
  isEmailAllowed: (email: string) => Promise<boolean>;
}

const accessDenied = () => new APIError("FORBIDDEN", { code: EMAIL_NOT_ALLOWED, message: NO_ACCESS_MESSAGE });

/**
 * Builds the Better Auth instance from explicit dependencies (tests pass a test DB and sender).
 *
 * Access gate (nobody gets a user or session unless `isEmailAllowed`):
 * - magic link: a `hooks.before` on `/sign-in/magic-link` rejects before the token is created or the mail is sent.
 * - any path that creates a user (Google included): `databaseHooks.user.create.before`.
 * - any path that creates a session (existing users, Google or magic link): `databaseHooks.session.create.before`.
 * Errors carry `code: email_not_allowed`; the OAuth callback redirects it to the error URL as `?error=email_not_allowed`.
 */
export function createAuth({ db, secret, baseURL, google, sender, isEmailAllowed }: AuthDeps) {
  return betterAuth({
    secret,
    baseURL,
    database: drizzleAdapter(db, { provider: "mysql", schema }),
    socialProviders: google ? { google } : {},
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        if (ctx.path !== "/sign-in/magic-link") return;
        const email = (ctx.body as { email?: unknown } | undefined)?.email;
        if (typeof email !== "string" || !(await isEmailAllowed(email))) throw accessDenied();
      }),
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            // Magic link users are created verified; an unverified provider email must not claim a listed address.
            if (!user.emailVerified || !(await isEmailAllowed(user.email))) throw accessDenied();
          },
        },
      },
      session: {
        create: {
          before: async (session) => {
            const [owner] = await db
              .select({ email: schema.user.email })
              .from(schema.user)
              .where(eq(schema.user.id, session.userId))
              .limit(1);
            if (!owner || !(await isEmailAllowed(owner.email))) throw accessDenied();
          },
        },
      },
    },
    plugins: [
      magicLink({
        sendMagicLink: async ({ email, url }) => {
          await sender.send({ email, url });
        },
      }),
      // Must be the last plugin: it sets cookies from Server Actions.
      nextCookies(),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;
