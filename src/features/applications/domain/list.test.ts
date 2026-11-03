import { describe, expect, it } from "vitest";
import type { Application, MatchSuccess } from "@/features/state/domain/types";
import { newApp } from "./applications";
import { coincidence, missingSkills, pctBand, visibleApps } from "./list";

const match = (patch: Partial<MatchSuccess>): MatchSuccess => ({
  pct: 60,
  comps: [],
  hardM: [],
  hardX: [],
  softM: [],
  softX: [],
  kwX: [],
  eng: { req: 0, cv: 0, status: "No requerido" },
  yr: null,
  yc: null,
  cumple: "Parcial",
  at: "2026-11-03",
  ...patch,
});

const app = (patch: Partial<Application>) => newApp(patch, "2026-11-03");

const apps = [
  app({ id: "a", empresa: "Acme", puesto: "Frontend", fecha: "2026-10-01", estado: "Postulado", match: match({ pct: 40, hardX: ["Docker"] }) }),
  app({ id: "b", empresa: "Beta", puesto: "Backend", fecha: "2026-10-20", estado: "Entrevista", match: match({ pct: 90, hardM: ["React"] }) }),
  app({ id: "c", empresa: "Gamma", puesto: "QA", fecha: "2026-10-10", estado: "Postulado" }),
];

const ids = (list: Application[]) => list.map((a) => a.id);

describe("visibleApps", () => {
  it("keeps everything under the Todos filter, newest first", () => {
    expect(ids(visibleApps(apps, { filter: "Todos", q: "", sort: "fecha" }))).toEqual(["b", "c", "a"]);
  });

  it("filters by status", () => {
    expect(ids(visibleApps(apps, { filter: "Postulado", q: "", sort: "fecha" }))).toEqual(["c", "a"]);
  });

  it("searches company, role, source and matched or missing skills ignoring accents and case", () => {
    const f = (q: string) => ids(visibleApps(apps, { filter: "Todos", q, sort: "fecha" }));
    expect(f("ACME")).toEqual(["a"]);
    expect(f("backénd")).toEqual(["b"]);
    expect(f("docker")).toEqual(["a"]);
    expect(f("react")).toEqual(["b"]);
    expect(f("nada")).toEqual([]);
  });

  it("sorts by match with unanalysed offers last", () => {
    expect(ids(visibleApps(apps, { filter: "Todos", q: "", sort: "match" }))).toEqual(["b", "a", "c"]);
  });

  it("does not mutate the input", () => {
    const copy = apps.slice();
    visibleApps(apps, { filter: "Todos", q: "", sort: "match" });
    expect(apps).toEqual(copy);
  });
});

describe("row helpers", () => {
  it("lists missing hard then soft skills", () => {
    expect(missingSkills(match({ hardX: ["A", "B"], softX: ["C"] }))).toEqual(["A", "B", "C"]);
    expect(missingSkills(null)).toEqual([]);
  });

  it("maps the match verdict to a coincidence label", () => {
    expect(coincidence(match({ cumple: "Sí" }))).toEqual({ tone: "ok", label: "Alta" });
    expect(coincidence(match({ cumple: "Parcial" }))).toEqual({ tone: "warn", label: "Media" });
    expect(coincidence(match({ cumple: "No" }))).toEqual({ tone: "bad", label: "Baja" });
    expect(coincidence(null)).toBeNull();
  });

  it("returns the band tone of a percentage", () => {
    expect(pctBand(80)).toBe("ok");
    expect(pctBand(50)).toBe("warn");
    expect(pctBand(10)).toBe("bad");
  });
});
