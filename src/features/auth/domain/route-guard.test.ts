import { describe, expect, it } from "vitest";
import { isProtectedPath, proxyRedirect } from "./route-guard";

describe("isProtectedPath", () => {
  it("protects /app and everything below it", () => {
    expect(isProtectedPath("/app")).toBe(true);
    expect(isProtectedPath("/app/")).toBe(true);
    expect(isProtectedPath("/app/anything")).toBe(true);
  });

  it("leaves other paths public, including lookalikes", () => {
    expect(isProtectedPath("/")).toBe(false);
    expect(isProtectedPath("/ingresar")).toBe(false);
    expect(isProtectedPath("/application")).toBe(false);
    expect(isProtectedPath("/api/auth/session")).toBe(false);
  });
});

describe("proxyRedirect", () => {
  it("sends cookie-less visitors of /app to the sign-in page", () => {
    expect(proxyRedirect("/app", false)).toBe("/ingresar");
    expect(proxyRedirect("/app/x", false)).toBe("/ingresar");
  });

  it("lets visitors with a session cookie through (the real check happens on the server)", () => {
    expect(proxyRedirect("/app", true)).toBeNull();
  });

  it("never redirects public paths", () => {
    expect(proxyRedirect("/", false)).toBeNull();
    expect(proxyRedirect("/ingresar", false)).toBeNull();
  });
});
