import "server-only";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { magicLink } from "better-auth/plugins";
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
}

/** Builds the Better Auth instance from explicit dependencies (tests pass a test DB and sender). */
export function createAuth({ db, secret, baseURL, google, sender }: AuthDeps) {
  return betterAuth({
    secret,
    baseURL,
    database: drizzleAdapter(db, { provider: "mysql", schema }),
    socialProviders: google ? { google } : {},
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
