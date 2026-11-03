import { describe, expect, it } from "vitest";
import { blank } from "@/features/state/domain/state";
import { isTabId, resolveTab, tabCount, visibleTabs, whoLine } from "./tabs";

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

describe("resolveTab", () => {
  it("keeps a visible tab", () => {
    expect(resolveTab("red", blank().mods)).toBe("red");
  });

  it("falls back to Plan when the tab is hidden", () => {
    expect(resolveTab("empleadores", blank().mods)).toBe("plan");
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

describe("tabCount", () => {
  it("shows the number of applications only on Postulaciones, and only when above zero", () => {
    expect(tabCount("postulaciones", 3)).toBe(3);
    expect(tabCount("postulaciones", 0)).toBeNull();
    expect(tabCount("plan", 3)).toBeNull();
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
