import { describe, expect, it } from "vitest";
import { blank } from "@/features/state/domain/state";
import type { AppState, Post } from "@/features/state/domain/types";
import { weeklyPosts } from "./weekly";

const TODAY = "2026-11-03"; // week of 2026-11-02

const post = (id: string, fecha: string): Post => ({
  id,
  fecha,
  tipo: "Publicación",
  tema: "",
  url: "",
  interacciones: "",
});

describe("weeklyPosts", () => {
  it("returns the last 8 weeks, oldest first, ending with the current one", () => {
    const w = weeklyPosts(blank(), TODAY);
    expect(w.weeks).toHaveLength(8);
    expect(w.weeks[7].monday).toBe("2026-11-02");
    expect(w.weeks[0].monday).toBe("2026-09-14");
  });

  it("counts posts per week and exposes the current week's count", () => {
    const state: AppState = {
      ...blank(),
      posts: [post("a", "2026-11-02"), post("b", "2026-11-08"), post("c", "2026-10-27"), post("d", "2026-01-01")],
    };
    const w = weeklyPosts(state, TODAY);
    expect(w.current).toBe(2);
    expect(w.weeks[6].count).toBe(1);
    expect(w.weeks.reduce((t, x) => t + x.count, 0)).toBe(3);
  });

  it("scales bars against the weekly minimum at least", () => {
    expect(weeklyPosts(blank(), TODAY).max).toBe(3);
    const many: AppState = { ...blank(), posts: Array.from({ length: 5 }, (_, i) => post(String(i), "2026-11-02")) };
    expect(weeklyPosts(many, TODAY).max).toBe(5);
  });

  it("flags weeks that reach the minimum", () => {
    const state: AppState = { ...blank(), posts: ["a", "b", "c"].map((id) => post(id, "2026-11-03")) };
    const w = weeklyPosts(state, TODAY);
    expect(w.weeks[7].meetsMinimum).toBe(true);
    expect(w.weeks[6].meetsMinimum).toBe(false);
  });
});
