import { describe, expect, it } from "vitest";
import { newApp } from "@/features/applications/domain/applications";
import { blank } from "@/features/state/domain/state";
import type { AppState, MatchSuccess } from "@/features/state/domain/types";
import { computeSummary } from "./summary";

const TODAY = "2026-11-03"; // Tuesday; the week starts on 2026-11-02

const match = (pct: number): MatchSuccess => ({
  pct,
  comps: [],
  hardM: [],
  hardX: [],
  softM: [],
  softX: [],
  kwX: [],
  eng: { req: 0, cv: 0, status: "No requerido" },
  yr: null,
  yc: null,
  cumple: "Sí",
  at: TODAY,
});

const withApps = (apps: Parameters<typeof newApp>[0][]): AppState => ({
  ...blank(),
  apps: apps.map((a) => newApp(a, TODAY)),
});

describe("computeSummary", () => {
  it("has empty-friendly defaults for a blank state", () => {
    const s = computeSummary(blank(), TODAY);
    expect(s.monthLabel).toBe("Noviembre");
    expect(s.year).toBe("2026");
    expect(s.totalApps).toBe(0);
    expect(s.sentThisMonth).toBe(0);
    expect(s.latestConnections).toBeNull();
    expect(s.responseRate).toBeNull();
    expect(s.avgMatch).toBeNull();
    expect(s.goal).toBe(0);
    expect(s.goalPct).toBe(0);
    expect(s.week).toEqual({ posts: 0, sent: 0, network: 0 });
    expect(s.sources).toEqual([]);
    expect(s.monthly.counts).toHaveLength(12);
    expect(s.monthly.max).toBe(1);
    expect(s.monthly.currentIndex).toBe(10);
  });

  it("counts sent applications, excluding 'Por postular'", () => {
    const s = computeSummary(
      withApps([
        { estado: "Por postular", fecha: TODAY },
        { estado: "Postulado", fecha: TODAY },
        { estado: "Entrevista", fecha: "2026-10-20", fuente: "LinkedIn" },
        { estado: "Rechazado", fecha: "2026-11-01", fuente: "LinkedIn" },
      ]),
      TODAY,
    );
    expect(s.totalApps).toBe(4);
    expect(s.sentThisMonth).toBe(2);
    expect(s.inProgress).toBe(1);
    // answered: Entrevista + Rechazado out of 3 sent
    expect(s.responseRate).toBe(67);
    expect(s.monthly.counts[9]).toBe(1);
    expect(s.monthly.counts[10]).toBe(2);
    expect(s.monthly.max).toBe(2);
    expect(s.sources).toEqual([
      { name: "LinkedIn", count: 2, pct: 100 },
      { name: "Sin fuente", count: 1, pct: 50 },
    ]);
  });

  it("lists every state with its share of all applications", () => {
    const s = computeSummary(withApps([{ estado: "Oferta" }, { estado: "Oferta" }, { estado: "Postulado" }]), TODAY);
    expect(s.states).toHaveLength(8);
    const oferta = s.states.find((x) => x.estado === "Oferta");
    expect(oferta).toEqual({ estado: "Oferta", count: 2, tone: "ok", pct: (2 / 3) * 100 });
  });

  it("averages the match of analysed applications", () => {
    const apps = withApps([{}, {}, {}]);
    apps.apps[0].match = match(80);
    apps.apps[1].match = match(51);
    expect(computeSummary(apps, TODAY).avgMatch).toBe(66);
  });

  it("computes the goal progress capped at 100", () => {
    const s = withApps([{ fecha: TODAY }, { fecha: TODAY }, { fecha: TODAY }]);
    expect(computeSummary({ ...s, goal: 2, goalSet: true }, TODAY).goalPct).toBe(100);
    expect(computeSummary({ ...s, goal: 4, goalSet: true }, TODAY).goalPct).toBe(75);
    expect(computeSummary({ ...s, goal: -1, goalSet: true }, TODAY).goal).toBe(0);
  });

  it("reads the latest network connections and this week's activity", () => {
    const state: AppState = {
      ...withApps([{ fecha: "2026-11-02" }, { fecha: "2026-10-30" }]),
      red: [
        { id: "a", fecha: "2026-10-01", conexiones: "100", paginas: "", nota: "" },
        { id: "b", fecha: "2026-11-03", conexiones: "120", paginas: "", nota: "" },
      ],
      posts: [
        { id: "p1", fecha: "2026-11-02", tipo: "Publicación", tema: "", url: "", interacciones: "" },
        { id: "p2", fecha: "2026-10-20", tipo: "Publicación", tema: "", url: "", interacciones: "" },
      ],
    };
    const s = computeSummary(state, TODAY);
    expect(s.latestConnections).toBe("120");
    expect(s.week).toEqual({ posts: 1, sent: 1, network: 1 });
  });

  it("measures today's platform checks and guards against an empty platform list", () => {
    const state = blank();
    const first = state.platforms[0].id;
    const second = state.platforms[1].id;
    const checked: AppState = { ...state, checks: { "2026-11": { [first]: [3, 4], [second]: [4] } } };
    const s = computeSummary(checked, TODAY);
    expect(s.platformsToday.done).toBe(1);
    expect(s.platformsToday.total).toBe(state.platforms.length);
    expect(computeSummary({ ...state, platforms: [] }, TODAY).platformsToday.pct).toBe(0);
  });
});
