import { describe, expect, it } from "vitest";
import { readAuthEnv } from "./auth-env";

const base = {
  BETTER_AUTH_SECRET: "x".repeat(32),
  BETTER_AUTH_URL: "http://localhost:3000",
};

describe("readAuthEnv", () => {
  it("reads the required variables and reports Google as not configured", () => {
    expect(readAuthEnv(base)).toEqual({
      secret: base.BETTER_AUTH_SECRET,
      baseURL: "http://localhost:3000",
      google: null,
    });
  });

  it("returns Google credentials when both variables are set", () => {
    const env = { ...base, GOOGLE_CLIENT_ID: " id ", GOOGLE_CLIENT_SECRET: "secret" };
    expect(readAuthEnv(env).google).toEqual({ clientId: "id", clientSecret: "secret" });
  });

  it("treats blank Google variables as not configured", () => {
    const env = { ...base, GOOGLE_CLIENT_ID: "", GOOGLE_CLIENT_SECRET: "  " };
    expect(readAuthEnv(env).google).toBeNull();
  });

  it("rejects a half-configured Google provider", () => {
    expect(() => readAuthEnv({ ...base, GOOGLE_CLIENT_ID: "id" })).toThrow(/GOOGLE_CLIENT_SECRET/);
    expect(() => readAuthEnv({ ...base, GOOGLE_CLIENT_SECRET: "s" })).toThrow(/GOOGLE_CLIENT_ID/);
  });

  it("requires a secret of at least 32 characters", () => {
    expect(() => readAuthEnv({ ...base, BETTER_AUTH_SECRET: undefined })).toThrow(/BETTER_AUTH_SECRET/);
    expect(() => readAuthEnv({ ...base, BETTER_AUTH_SECRET: "short" })).toThrow(/BETTER_AUTH_SECRET/);
  });

  it("requires a valid http(s) base URL", () => {
    expect(() => readAuthEnv({ ...base, BETTER_AUTH_URL: undefined })).toThrow(/BETTER_AUTH_URL/);
    expect(() => readAuthEnv({ ...base, BETTER_AUTH_URL: "not a url" })).toThrow(/BETTER_AUTH_URL/);
    expect(() => readAuthEnv({ ...base, BETTER_AUTH_URL: "ftp://x.com" })).toThrow(/BETTER_AUTH_URL/);
  });
});
