import { describe, expect, it } from "vitest";
import {
  addDays,
  fmtDate,
  inRange,
  iso,
  MESES,
  minTxt,
  mondayOf,
  pad,
  parseD,
  todayIso,
} from "./dates";

describe("dates", () => {
  it("pads numbers to two digits", () => {
    expect(pad(3)).toBe("03");
    expect(pad(12)).toBe("12");
  });

  it("formats a local date as YYYY-MM-DD", () => {
    expect(iso(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(iso(new Date(2026, 11, 31))).toBe("2026-12-31");
  });

  it("todayIso matches iso(new Date())", () => {
    expect(todayIso()).toBe(iso(new Date()));
  });

  it("parses a YYYY-MM-DD string at local midnight", () => {
    const d = parseD("2026-03-09");
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()]).toEqual([2026, 2, 9, 0]);
  });

  it("adds days across month and year boundaries", () => {
    expect(addDays("2026-01-30", 5)).toBe("2026-02-04");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
    expect(addDays("2026-03-09", 0)).toBe("2026-03-09");
  });

  it("finds the Monday of the week", () => {
    expect(mondayOf("2026-03-09")).toBe("2026-03-09"); // Monday
    expect(mondayOf("2026-03-15")).toBe("2026-03-09"); // Sunday
    expect(mondayOf("2026-03-11")).toBe("2026-03-09"); // Wednesday
    expect(mondayOf("2026-03-01")).toBe("2026-02-23"); // Sunday across months
  });

  it("checks inclusive ranges with open ends", () => {
    expect(inRange("2026-03-10", "2026-03-10", "2026-03-12")).toBe(true);
    expect(inRange("2026-03-12", "2026-03-10", "2026-03-12")).toBe(true);
    expect(inRange("2026-03-13", "2026-03-10", "2026-03-12")).toBe(false);
    expect(inRange("2026-03-09", "2026-03-10", "2026-03-12")).toBe(false);
    expect(inRange("2026-03-09", "", "2026-03-12")).toBe(true);
    expect(inRange("2026-03-20", "2026-03-10", "")).toBe(true);
    expect(inRange("", "", "")).toBe(false);
    expect(inRange(undefined, "", "")).toBe(false);
  });

  it("formats dates as dd/mm/yy", () => {
    expect(fmtDate("2026-03-09")).toBe("09/03/26");
    expect(fmtDate("")).toBe("");
    expect(fmtDate(undefined)).toBe("");
  });

  it("formats minutes", () => {
    expect(minTxt(0)).toBe("0 min");
    expect(minTxt(45)).toBe("45 min");
    expect(minTxt(60)).toBe("1 h");
    expect(minTxt(135)).toBe("2 h 15 min");
    expect(minTxt(59.6)).toBe("1 h");
    expect(minTxt(undefined)).toBe("0 min");
  });

  it("lists the Spanish month names", () => {
    expect(MESES).toHaveLength(12);
    expect(MESES[0]).toBe("Enero");
    expect(MESES[11]).toBe("Diciembre");
  });
});
