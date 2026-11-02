import { describe, expect, it } from "vitest";
import { uid } from "./ids";

describe("uid", () => {
  it("returns a short alphanumeric id", () => {
    expect(uid()).toMatch(/^[a-z0-9]{1,8}$/);
  });

  it("returns different ids", () => {
    const ids = new Set(Array.from({ length: 50 }, () => uid()));
    expect(ids.size).toBe(50);
  });
});
