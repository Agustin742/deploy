import { describe, expect, it } from "vitest";
import { blank } from "@/features/state/domain/state";
import { backupFile } from "./backup";

describe("backupFile", () => {
  it("names the file with the legacy prefix and today's date", () => {
    expect(backupFile(blank(), "2026-11-03").filename).toBe("radar-postulaciones-2026-11-03.json");
  });

  it("serializes the whole state as JSON with one-space indentation, like the legacy export", () => {
    const state = { ...blank(), goal: 7, goalSet: true };
    const { data } = backupFile(state, "2026-11-03");
    expect(data).toBe(JSON.stringify(state, null, 1));
    expect(JSON.parse(data)).toEqual(state);
  });
});
