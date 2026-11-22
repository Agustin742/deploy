import "server-only";
import { headers } from "next/headers";
import { isEmailAllowed, isOwnerEmail } from "@/features/access/infrastructure/access";
import { getAuth } from "./auth";

type RawSession = NonNullable<Awaited<ReturnType<ReturnType<typeof getAuth>["api"]["getSession"]>>>;

export type AccessState =
  | { state: "anonymous" }
  /** Signed in, but the email is no longer on the allowlist (removed after signing in). */
  | { state: "denied" }
  | { state: "allowed"; session: RawSession; isOwner: boolean };

/**
 * The one place a session is turned into authorization: a valid session whose email is still allowed.
 * Better Auth only gates new sign-ins, so a removed email keeps a live session until this check rejects it.
 */
export async function getAccess(): Promise<AccessState> {
  // Await headers() first: it marks the render as dynamic before any env is read, so `next build` never needs the env.
  const requestHeaders = await headers();
  const session = await getAuth().api.getSession({ headers: requestHeaders });
  if (!session) return { state: "anonymous" };
  if (!(await isEmailAllowed(session.user.email))) return { state: "denied" };
  return { state: "allowed", session, isOwner: isOwnerEmail(session.user.email) };
}

/** The current session if its user may use the app, else null. Use this for every authorization decision. */
export async function requireAllowedSession(): Promise<RawSession | null> {
  const access = await getAccess();
  return access.state === "allowed" ? access.session : null;
}
