// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { newApp } from "@/features/applications/domain/applications";
import type { Application, MatchSuccess } from "@/features/state/domain/types";
import { resetAppStore } from "@/features/state/store/testing";
import { appStore } from "@/features/state/store/use-app-store";
import { AnalysisTab } from "./analysis-tab";

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

const app = (id: string, m: MatchSuccess | null): Application => newApp({ id, match: m }, "2026-11-03");

function seed(apps: Application[], cv = "") {
  const store = appStore.getState();
  store.update((s) => ({ ...s, apps, profile: { ...s.profile, cv } }), { immediate: true });
}

describe("AnalysisTab", () => {
  beforeEach(() => {
    resetAppStore();
  });
  afterEach(() => {
    cleanup();
  });

  it("explains that there are no analysed offers and offers shortcuts", () => {
    seed([app("a", null)]);
    const onNavigate = vi.fn();
    render(<AnalysisTab onNavigate={onNavigate} />);
    expect(screen.getByText("Todavía no hay ofertas analizadas")).toBeTruthy();
    expect(screen.getByText(/Tenés 1 sin descripción\./)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Ir a postulaciones" }));
    expect(onNavigate).toHaveBeenCalledWith("postulaciones");
    fireEvent.click(screen.getByRole("button", { name: "Cargar mi CV" }));
    expect(onNavigate).toHaveBeenCalledWith("cv");
  });

  it("hides the CV shortcut when the CV is loaded", () => {
    seed([], "x".repeat(60));
    render(<AnalysisTab onNavigate={() => {}} />);
    expect(screen.queryByRole("button", { name: "Cargar mi CV" })).toBeNull();
  });

  it("shows the indicators, English levels, missing tools and most requested skills", () => {
    seed([
      app("a", match({ pct: 80, hardM: ["React"], hardX: ["Docker"], eng: { req: 3, cv: 3, status: "Cumple" } })),
      app("b", match({ pct: 40, hardM: ["React"], hardX: ["Docker", "AWS"] })),
      app("c", null),
    ]);
    render(<AnalysisTab onNavigate={() => {}} />);
    expect(screen.getByText("Sobre 2 ofertas con descripción · 1 sin descripción no cuentan.")).toBeTruthy();
    expect(screen.getByText("Piden inglés (50%)")).toBeTruthy();
    expect(screen.getByText("Inglés que cumplís").previousSibling?.textContent).toBe("1 / 1");
    expect(screen.getByText("Skill que más te falta").previousSibling?.textContent).toBe("Docker");
    expect(screen.getByText("Match promedio").previousSibling?.textContent).toBe("60%");

    const missing = screen.getByText("Herramientas que más te faltan").closest("div")!;
    expect(within(missing).getByText("Docker")).toBeTruthy();
    expect(within(missing).getByText("AWS")).toBeTruthy();
    const english = screen.getByText("Nivel de inglés pedido").closest("div")!;
    expect(within(english).getByText("Avanzado (C1+)")).toBeTruthy();
    expect(within(english).getByText("No piden")).toBeTruthy();
    const requested = screen.getByText("Lo que más piden").closest("div")!;
    expect(within(requested).getByText("React")).toBeTruthy();
  });

  it("says no recognised skill is missing when there are none", () => {
    seed([app("a", match({ hardM: ["React"] }))]);
    render(<AnalysisTab onNavigate={() => {}} />);
    expect(screen.getByText("No te falta ninguna skill reconocida.")).toBeTruthy();
  });
});
