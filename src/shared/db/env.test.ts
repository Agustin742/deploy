import { describe, expect, it } from "vitest";
import { readDatabaseUrl } from "./env";

describe("readDatabaseUrl", () => {
  it("returns a valid mysql url", () => {
    expect(readDatabaseUrl({ DATABASE_URL: "mysql://u:p@localhost:3306/app" })).toBe(
      "mysql://u:p@localhost:3306/app",
    );
  });

  it("throws when DATABASE_URL is missing", () => {
    expect(() => readDatabaseUrl({})).toThrow(/DATABASE_URL/);
  });

  it("throws when DATABASE_URL is not a mysql url", () => {
    expect(() => readDatabaseUrl({ DATABASE_URL: "postgres://u:p@h/db" })).toThrow(/mysql/);
    expect(() => readDatabaseUrl({ DATABASE_URL: "not a url" })).toThrow(/DATABASE_URL/);
  });
});
