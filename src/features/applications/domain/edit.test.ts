import { describe, expect, it } from "vitest";
import { blank } from "@/features/state/domain/state";
import type { AppState } from "@/features/state/domain/types";
import { newApp } from "./applications";
import {
  addInterview,
  applyAppEdit,
  recalcAll,
  recalcOne,
  refreshMatchFromJd,
  removeApp,
  removeInterview,
} from "./edit";

const TODAY = "2026-11-03";
const CV = "Ana Pérez\nFrontend developer con experiencia en React, TypeScript, HTML y CSS. Trabajo en equipo y git.";
const JD = "Buscamos desarrollador con React y TypeScript, conocimientos de Docker y trabajo en equipo en un equipo remoto.";

const withApp = (patch = {}): AppState => {
  const s = blank();
  return { ...s, profile: { ...s.profile, cv: CV }, apps: [newApp({ id: "x", ...patch }, TODAY)] };
};
const first = (s: AppState) => s.apps[0];

describe("applyAppEdit", () => {
  it("sets a plain field without touching other applications", () => {
    const base = withApp();
    const s = { ...base, apps: [...base.apps, newApp({ id: "y" }, TODAY)] };
    const next = applyAppEdit(s, "x", "empresa", "Acme");
    expect(next.apps[0].empresa).toBe("Acme");
    expect(next.apps[1]).toBe(s.apps[1]);
    expect(s.apps[0].empresa).toBe("");
  });

  it("sets nested company profile fields", () => {
    expect(first(applyAppEdit(withApp(), "x", "ficha.cultura", "Remota")).ficha.cultura).toBe("Remota");
  });

  it("sets pre-interview checklist entries", () => {
    let s = applyAppEdit(withApp(), "x", "pre:quien:ok", true);
    s = applyAppEdit(s, "x", "pre:quien:txt", "Marta");
    expect(first(s).pre).toEqual({ quien: { ok: true, txt: "Marta" } });
  });

  it("sets interview fields by interview id", () => {
    const s0 = addInterview(withApp(), "x", TODAY, () => "e1");
    const s1 = applyAppEdit(s0, "x", "ent:e1:etapa", "RR.HH.");
    expect(first(s1).entrevistas[0].etapa).toBe("RR.HH.");
  });

  it("detects the source from the link only while the source is empty", () => {
    const s = applyAppEdit(withApp(), "x", "link", "https://www.linkedin.com/jobs/1");
    expect(first(s).fuente).toBe("LinkedIn");
    const kept = applyAppEdit(withApp({ fuente: "Referido" }), "x", "link", "https://indeed.com/1");
    expect(first(kept).fuente).toBe("Referido");
  });

  it("ignores an unknown id", () => {
    const s = withApp();
    expect(applyAppEdit(s, "nope", "empresa", "Z")).toEqual(s);
  });
});

describe("interviews", () => {
  it("adds an empty interview dated today at the top and removes it by id", () => {
    let s = addInterview(withApp(), "x", TODAY, () => "e1");
    s = addInterview(s, "x", TODAY, () => "e2");
    expect(first(s).entrevistas.map((e) => e.id)).toEqual(["e2", "e1"]);
    expect(first(s).entrevistas[0]).toEqual({
      id: "e2",
      fecha: TODAY,
      etapa: "",
      preguntas: "",
      respondi: "",
      prep: "",
      feedback: "",
      aprendi: "",
      proximo: "",
    });
    expect(first(removeInterview(s, "x", "e2")).entrevistas.map((e) => e.id)).toEqual(["e1"]);
  });
});

describe("removeApp", () => {
  it("drops the application", () => {
    expect(removeApp(withApp(), "x").apps).toEqual([]);
  });
});

describe("match recalculation", () => {
  it("recalcOne computes the match from the job description", () => {
    const s = recalcOne(withApp({ jd: JD }), "x", TODAY);
    expect(first(s).match?.pct).toBeGreaterThan(0);
  });

  it("recalcAll counts and recalculates only applications with a description", () => {
    const s0 = withApp({ jd: JD });
    const s = { ...s0, apps: [...s0.apps, newApp({ id: "y" }, TODAY)] };
    const r = recalcAll(s, TODAY);
    expect(r.count).toBe(1);
    expect(r.state.apps[0].match).not.toBeNull();
    expect(r.state.apps[1].match).toBeNull();
  });

  it("refreshMatchFromJd clears the match when the description is emptied and recalculates otherwise", () => {
    const s = recalcOne(withApp({ jd: JD }), "x", TODAY);
    expect(first(refreshMatchFromJd(applyAppEdit(s, "x", "jd", ""), "x", TODAY)).match).toBeNull();
    expect(first(refreshMatchFromJd(s, "x", TODAY)).match?.pct).toBe(first(s).match?.pct);
  });

  it("stores no match while the description is too short", () => {
    expect(first(refreshMatchFromJd(withApp({ jd: "corto" }), "x", TODAY)).match).toBeNull();
  });
});
