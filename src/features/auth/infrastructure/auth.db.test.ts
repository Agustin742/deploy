import { eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createDb, type DbHandle } from "@/shared/db/client";
import * as schema from "@/shared/db/schema";
import { testDatabaseUrl, truncateAllTables } from "@/shared/db/testing/test-db";
import type { MagicLinkSender } from "../domain/magic-link-sender";
import { createAuth } from "./create-auth";

const SECRET = "test-secret-test-secret-test-secret-1234";

let handle: DbHandle;
let sent: Array<{ email: string; url: string }>;

const sender: MagicLinkSender = {
  async send(message) {
    sent.push(message);
  },
};

const makeAuth = (google: { clientId: string; clientSecret: string } | null = null) =>
  createAuth({ db: handle.db, secret: SECRET, baseURL: "http://localhost:3000", google, sender });

/** Turns Set-Cookie headers into a Cookie request header. */
const cookieHeader = (res: Response) =>
  res.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");

/** Requests a magic link and verifies it, returning the Cookie header of the new session. */
async function signIn(auth: ReturnType<typeof makeAuth>, email: string): Promise<string> {
  await auth.api.signInMagicLink({ body: { email }, headers: new Headers() });
  const token = new URL(sent[sent.length - 1].url).searchParams.get("token")!;
  const verify = await auth.api.magicLinkVerify({ query: { token }, headers: new Headers(), asResponse: true });
  return cookieHeader(verify);
}

describe("Better Auth on MySQL (hand-written schema smoke test)", () => {
  beforeAll(() => {
    handle = createDb(testDatabaseUrl());
  });
  afterAll(() => handle.close());
  beforeEach(async () => {
    sent = [];
    await truncateAllTables(handle.db);
  });

  it("signs in through a magic link, creating the user and a session", async () => {
    const auth = makeAuth();
    const cookie = await signIn(auth, "Ana@Example.com");

    expect(sent).toHaveLength(1);
    expect(sent[0].email.toLowerCase()).toBe("ana@example.com");
    expect(cookie).toContain("session_token");

    const users = await handle.db.select().from(schema.user);
    expect(users).toHaveLength(1);
    expect(users[0].email).toBe("ana@example.com");
    expect(users[0].emailVerified).toBe(true);
    const sessions = await handle.db.select().from(schema.session).where(eq(schema.session.userId, users[0].id));
    expect(sessions).toHaveLength(1);

    const session = await auth.api.getSession({ headers: new Headers({ cookie }) });
    expect(session?.user.id).toBe(users[0].id);
    expect(session?.user.email).toBe("ana@example.com");
  });

  it("returns no session without a cookie or with a forged one", async () => {
    const auth = makeAuth();
    expect(await auth.api.getSession({ headers: new Headers() })).toBeNull();
    const forged = new Headers({ cookie: "better-auth.session_token=forged.value" });
    expect(await auth.api.getSession({ headers: forged })).toBeNull();
  });

  it("consumes the token: a second verification does not create another session", async () => {
    const auth = makeAuth();
    await signIn(auth, "ana@example.com");
    const token = new URL(sent[0].url).searchParams.get("token")!;
    await auth.api.magicLinkVerify({ query: { token }, headers: new Headers(), asResponse: true }).catch(() => undefined);
    expect(await handle.db.select().from(schema.session)).toHaveLength(1);
  });

  it("signs out: the session row is removed and the cookie stops working", async () => {
    const auth = makeAuth();
    const headers = new Headers({ cookie: await signIn(auth, "ana@example.com") });
    await auth.api.signOut({ headers });
    expect(await handle.db.select().from(schema.session)).toHaveLength(0);
    expect(await auth.api.getSession({ headers })).toBeNull();
  });

  it("only registers Google when credentials are given", () => {
    expect(Object.keys(makeAuth().options.socialProviders ?? {})).toEqual([]);
    const withGoogle = makeAuth({ clientId: "id", clientSecret: "secret" });
    expect(Object.keys(withGoogle.options.socialProviders ?? {})).toEqual(["google"]);
  });
});
