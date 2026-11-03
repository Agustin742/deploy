import { describe, expect, it } from "vitest";
import { blank } from "@/features/state/domain/state";
import type { AppState } from "@/features/state/domain/types";
import {
  addPlatform,
  markAllToday,
  monthView,
  removePlatform,
  resetPlatforms,
  shiftMonth,
  toggleCheck,
  updatePlatform,
} from "./daily-search";

const month = "2026-11";
const base = (): AppState => blank();

describe("toggleCheck", () => {
  it("checks and unchecks a day for a platform, creating the month on demand", () => {
    const on = toggleCheck(base(), month, "linkedin", 3);
    expect(on.checks[month].linkedin).toEqual([3]);
    const off = toggleCheck(on, month, "linkedin", 3);
    expect(off.checks[month].linkedin).toEqual([]);
  });

  it("does not mutate the previous state", () => {
    const s = base();
    toggleCheck(s, month, "linkedin", 3);
    expect(s.checks).toEqual({});
  });
});

describe("markAllToday", () => {
  it("checks the day on every platform without duplicating", () => {
    let s = toggleCheck(base(), month, "linkedin", 3);
    s = markAllToday(s, month, 3);
    expect(s.checks[month].linkedin).toEqual([3]);
    for (const p of s.platforms) expect(s.checks[month][p.id]).toContain(3);
  });
});

describe("shiftMonth", () => {
  it("moves across year boundaries", () => {
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2026-05", 1)).toBe("2026-06");
  });
});

describe("monthView", () => {
  it("computes days, totals and today's count for the current month", () => {
    let s = toggleCheck(base(), month, "linkedin", 3);
    s = toggleCheck(s, month, "indeed", 3);
    s = toggleCheck(s, month, "indeed", 10);
    const v = monthView(s, month, "2026-11-03");
    expect(v.daysInMonth).toBe(30);
    expect(v.isCurrent).toBe(true);
    expect(v.today).toBe(3);
    expect(v.total).toBe(3);
    expect(v.doneToday).toBe(2);
    expect(v.rows.find((r) => r.platform.id === "indeed")?.days).toEqual([3, 10]);
  });

  it("has no today data for another month and handles leap years", () => {
    const v = monthView(base(), "2028-02", "2026-11-03");
    expect(v.daysInMonth).toBe(29);
    expect(v.isCurrent).toBe(false);
    expect(v.doneToday).toBeNull();
  });
});

describe("addPlatform", () => {
  it("adds a custom platform with a normalized link", () => {
    const r = addPlatform(base(), " Mi Sitio ", "misitio.com");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.platforms.at(-1)).toEqual({ id: "mi-sitio", name: "Mi Sitio", url: "https://misitio.com", custom: true });
    expect(r.message).toBe("Página agregada");
  });

  it("uses # when there is no link and keeps http(s) links", () => {
    const r = addPlatform(base(), "Otra", "");
    if (!r.ok) throw new Error("expected ok");
    expect(r.state.platforms.at(-1)?.url).toBe("#");
    const r2 = addPlatform(base(), "Otra", "http://a.com");
    if (!r2.ok) throw new Error("expected ok");
    expect(r2.state.platforms.at(-1)?.url).toBe("http://a.com");
  });

  it("ignores an empty name silently and rejects duplicates", () => {
    expect(addPlatform(base(), "  ", "x")).toEqual({ ok: false, message: null });
    expect(addPlatform(base(), "linkedin", "")).toEqual({ ok: false, message: "Esa página ya está en la lista" });
  });
});

describe("updatePlatform", () => {
  it("renames and relinks, normalizing the link", () => {
    const r = updatePlatform(base(), "linkedin", "LI", "linkedin.com/jobs");
    if (!r.ok) throw new Error("expected ok");
    expect(r.state.platforms.find((p) => p.id === "linkedin")).toMatchObject({ name: "LI", url: "https://linkedin.com/jobs" });
    expect(r.message).toBe("Página actualizada");
  });

  it("stores # for an empty link and requires a name", () => {
    const r = updatePlatform(base(), "linkedin", "LinkedIn", "");
    if (!r.ok) throw new Error("expected ok");
    expect(r.state.platforms.find((p) => p.id === "linkedin")?.url).toBe("#");
    expect(updatePlatform(base(), "linkedin", " ", "x")).toEqual({ ok: false, message: "Poné un nombre" });
    expect(updatePlatform(base(), "nope", "x", "")).toEqual({ ok: false, message: "Poné un nombre" });
  });
});

describe("removePlatform / resetPlatforms", () => {
  it("removes a platform and its checks in every month", () => {
    let s = toggleCheck(base(), "2026-10", "linkedin", 1);
    s = toggleCheck(s, "2026-11", "linkedin", 2);
    const next = removePlatform(s, "linkedin");
    expect(next.platforms.some((p) => p.id === "linkedin")).toBe(false);
    expect(next.checks["2026-10"].linkedin).toBeUndefined();
    expect(next.checks["2026-11"].linkedin).toBeUndefined();
  });

  it("restores only the missing initial platforms", () => {
    const removed = removePlatform(removePlatform(base(), "linkedin"), "indeed");
    const r = resetPlatforms(removed);
    expect(r.message).toBe("2 páginas restauradas");
    expect(r.state.platforms.some((p) => p.id === "linkedin")).toBe(true);
    const one = resetPlatforms(removePlatform(base(), "indeed"));
    expect(one.message).toBe("1 página restaurada");
    expect(resetPlatforms(base()).message).toBe("Ya están todas las páginas iniciales");
  });
});
