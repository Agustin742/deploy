import { describe, expect, it } from "vitest";
import { blank } from "@/features/state/domain/state";
import { initialsOf, isTabId, mobileMoreTabs, moreTabs, primaryTabs, resolveTab, visibleTabs, whoLine } from "./tabs";

const ids = (mods: Partial<ReturnType<typeof blank>["mods"]> = {}) =>
  visibleTabs({ ...blank().mods, ...mods }).map((t) => t.id);

describe("visibleTabs", () => {
  it("lists the base tabs in the legacy order", () => {
    expect(ids()).toEqual([
      "resumen",
      "plan",
      "postulaciones",
      "nueva",
      "red",
      "visibilidad",
      "analisis",
      "cv",
      "busqueda",
    ]);
  });

  it("adds Empleadores and Experimentos after Visibilidad only when their modules are on", () => {
    expect(ids({ empleadores: true })).toContain("empleadores");
    expect(ids({ experimentos: true })).not.toContain("empleadores");
    const all = ids({ empleadores: true, experimentos: true });
    expect(all.slice(5, 9)).toEqual(["visibilidad", "empleadores", "experimentos", "analisis"]);
  });

  it("uses the legacy Spanish labels", () => {
    const labels = visibleTabs({ ...blank().mods, empleadores: true }).map((t) => t.label);
    expect(labels).toContain("Búsqueda diaria");
    expect(labels).toContain("Nueva oferta");
    expect(labels).toContain("Empleadores");
  });
});

describe("navigation split", () => {
  const mods = (patch: Partial<ReturnType<typeof blank>["mods"]> = {}) => ({ ...blank().mods, ...patch });
  const idsOf = (tabs: { id: string }[]) => tabs.map((t) => t.id);

  it("keeps five primary tabs and moves the rest behind \"Más\"", () => {
    expect(idsOf(primaryTabs(mods()))).toEqual(["resumen", "postulaciones", "analisis", "plan", "cv"]);
    expect(idsOf(moreTabs(mods()))).toEqual(["red", "visibilidad", "busqueda"]);
  });

  it("never lists the new-application view in the navigation", () => {
    const all = [...primaryTabs(mods({ empleadores: true, experimentos: true })), ...moreTabs(mods({ empleadores: true, experimentos: true }))];
    expect(idsOf(all)).not.toContain("nueva");
  });

  it("adds Empleadores and Experimentos to \"Más\" only while their modules are on", () => {
    expect(idsOf(moreTabs(mods({ empleadores: true, experimentos: true })))).toEqual([
      "red",
      "visibilidad",
      "busqueda",
      "empleadores",
      "experimentos",
    ]);
  });

  it("gives the mobile sheet the primary tabs without a bar slot, then the \"Más\" tabs", () => {
    expect(idsOf(mobileMoreTabs(mods()))).toEqual(["plan", "cv", "red", "visibilidad", "busqueda"]);
  });
});

describe("resolveTab", () => {
  it("keeps a visible tab", () => {
    expect(resolveTab("red", blank().mods)).toBe("red");
  });

  it("falls back to Resumen when the tab is hidden", () => {
    expect(resolveTab("empleadores", blank().mods)).toBe("resumen");
    expect(resolveTab("empleadores", { ...blank().mods, empleadores: true })).toBe("empleadores");
  });
});

describe("whoLine", () => {
  it("asks for the CV when there is no name", () => {
    expect(whoLine({ name: "", headline: "" })).toBe("Cargá tu CV para ver tu nombre");
  });

  it("joins name and headline", () => {
    expect(whoLine({ name: "Ana Pérez", headline: "Frontend" })).toBe("Ana Pérez · Frontend");
  });

  it("shows the headline after the placeholder when only the headline exists", () => {
    expect(whoLine({ name: "", headline: "Frontend" })).toBe("Cargá tu CV para ver tu nombre · Frontend");
  });
});

describe("initialsOf", () => {
  it("takes up to two initials", () => {
    expect(initialsOf("ana pérez gómez")).toBe("AP");
    expect(initialsOf("  Ana ")).toBe("A");
  });

  it("is empty without a name", () => {
    expect(initialsOf("")).toBe("");
  });
});

describe("isTabId", () => {
  it("recognizes every tab id, including the optional ones", () => {
    expect(isTabId("busqueda")).toBe(true);
    expect(isTabId("empleadores")).toBe(true);
    expect(isTabId("experimentos")).toBe(true);
  });

  it("rejects anything else", () => {
    expect(isTabId("")).toBe(false);
    expect(isTabId("settings")).toBe(false);
  });
});
