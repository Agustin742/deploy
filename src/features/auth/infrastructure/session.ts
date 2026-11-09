import "server-only";
import { headers } from "next/headers";
import { getAuth } from "./auth";

/** The current session (user + session) from the request cookies, or null. Validated against the DB. */
export async function getSession() {
  // Await headers() first: it marks the render as dynamic before any env is read, so `next build` never needs the env.
  const requestHeaders = await headers();
  return getAuth().api.getSession({ headers: requestHeaders });
}
