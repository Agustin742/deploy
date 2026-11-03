import { describe, expect, it } from "vitest";
import { newApp } from "@/features/applications/domain/applications";
import { JD_EXAMPLE } from "@/features/matching/domain/example";
import { blank } from "@/features/state/domain/state";
import type { AppState } from "@/features/state/domain/types";
import { clearDraft, fillExample, saveDraft, setDraftField } from "./draft";

const TODAY = "2026-11-03";
const CV = "Ana Pérez\nFrontend developer con experiencia en React, TypeScript, HTML y CSS. Trabajo en equipo y git.";
const base = (): AppState => ({ ...blank(), profile: { ...blank().profile, cv: CV } });

describe("setDraftField", () => {
  it("sets a draft field", () => {
    expect(setDraftField(base(), "empresa", "Acme").draft.empresa).toBe("Acme");
  });

  it("detects the source from the link only while the source is empty", () => {
    const s = setDraftField(base(), "link", "https://www.linkedin.com/jobs/view/1");
    expect(s.draft.fuente).toBe("LinkedIn");
    const withSource = { ...base(), draft: { ...base().draft, fuente: "Referido" } };
    expect(setDraftField(withSource, "link", "https://indeed.com/x").draft.fuente).toBe("Referido");
  });
});

describe("fillExample / clearDraft", () => {
  it("fills the example offer and a default role only when the role is empty", () => {
    const s = fillExample(base());
    expect(s.draft.jd).toBe(JD_EXAMPLE);
    expect(s.draft.puesto).toBe("Frontend Developer");
    expect(fillExample(setDraftField(base(), "puesto", "QA")).draft.puesto).toBe("QA");
  });

  it("clears the draft back to its blank form", () => {
    expect(clearDraft(fillExample(base())).draft).toEqual(blank().draft);
  });
});

describe("saveDraft", () => {
  it("refuses a draft with neither company nor role", () => {
    expect(saveDraft(base(), TODAY, () => "id1")).toEqual({ ok: false, message: "Completá al menos empresa o puesto" });
    const spaces = setDraftField(setDraftField(base(), "empresa", "  "), "puesto", " ");
    expect(saveDraft(spaces, TODAY, () => "id1").ok).toBe(false);
  });

  it("creates the application on top with trimmed values and a computed match, then clears the draft", () => {
    let s: AppState = { ...base(), apps: [newApp({ id: "old" }, TODAY)] };
    s = setDraftField(s, "empresa", "  Acme ");
    s = setDraftField(s, "puesto", "Frontend");
    s = setDraftField(s, "link", " https://x.com/1 ");
    s = setDraftField(s, "estado", "Por postular");
    s = setDraftField(s, "jd", JD_EXAMPLE);
    const r = saveDraft(s, TODAY, () => "id1");
    if (!r.ok) throw new Error("expected ok");
    expect(r.appId).toBe("id1");
    expect(r.state.apps[0]).toMatchObject({
      id: "id1",
      empresa: "Acme",
      puesto: "Frontend",
      link: "https://x.com/1",
      estado: "Por postular",
      fecha: TODAY,
    });
    expect(r.state.apps[0].match?.pct).toBeGreaterThan(0);
    expect(r.state.apps.map((a) => a.id)).toEqual(["id1", "old"]);
    expect(r.state.draft).toEqual(blank().draft);
  });
});
