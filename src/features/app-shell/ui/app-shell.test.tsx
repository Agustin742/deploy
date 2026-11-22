// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { newApp } from "@/features/applications/domain/applications";
import { blank } from "@/features/state/domain/state";
import type { AppState } from "@/features/state/domain/types";
import { resetAppStore, sentCommands } from "@/features/state/store/testing";
import { appStore } from "@/features/state/store/use-app-store";
import { loadMyState } from "@/features/sync/infrastructure/actions";
import { mondayOf, todayIso } from "@/shared/lib/dates";
import { shellUi } from "../store/ui-store";
import { AppShell } from "./app-shell";

const stored = (patch: Partial<AppState>) => resetAppStore(patch);

const state = () => appStore.getState().state;
const tab = (name: string) => screen.getByRole("button", { name });

describe("AppShell", () => {
  beforeEach(() => {
    resetAppStore();
    shellUi.setState(shellUi.getInitialState(), true);
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe("shell", () => {
    it("shows the access admin link only to owners", () => {
      const { unmount } = render(<AppShell />);
      expect(screen.queryByRole("link", { name: "Accesos" })).toBeNull();
      unmount();
      render(<AppShell isOwner />);
      expect(screen.getByRole("link", { name: "Accesos" }).getAttribute("href")).toBe("/app/admin");
    });

    it("renders the base tab bar, with Resumen active by default", () => {
      render(<AppShell />);
      const nav = screen.getByRole("navigation", { name: "Secciones" });
      expect(within(nav).getAllByRole("button").map((b) => b.textContent)).toEqual([
        "Resumen",
        "Plan",
        "Postulaciones",
        "Nueva oferta",
        "Red",
        "Visibilidad",
        "Análisis",
        "Mi CV",
        "Búsqueda diaria",
      ]);
      expect(tab("Resumen").getAttribute("aria-current")).toBe("page");
      expect(screen.getByRole("heading", { level: 2, name: "Resumen" })).toBeTruthy();
      expect(screen.getByRole("button", { name: "Salir" })).toBeTruthy();
      expect(screen.getByRole("button", { name: /Modo/ })).toBeTruthy();
      expect(screen.getByText(/no garantiza empleo ni resultados/)).toBeTruthy();
    });

    it("shows the person from the saved state and the application count on Postulaciones", () => {
      stored({
        profile: { ...blank().profile, name: "Ana Pérez", headline: "Frontend", nameAuto: false },
        apps: [newApp({ empresa: "Acme" }, todayIso()), newApp({ empresa: "Beta" }, todayIso())],
      });
      render(<AppShell />);
      expect(screen.getByText("Ana Pérez · Frontend")).toBeTruthy();
      expect(screen.getByRole("button", { name: /^Postulaciones\s*2$/ })).toBeTruthy();
    });

    it("asks for the CV while there is no name", () => {
      render(<AppShell />);
      expect(screen.getByText("Cargá tu CV para ver tu nombre")).toBeTruthy();
    });

    it("switches tabs, marking the active one and scrolling to the top", () => {
      render(<AppShell />);
      fireEvent.click(tab("Plan"));
      expect(screen.getByRole("heading", { level: 2, name: "Plan" })).toBeTruthy();
      expect(tab("Plan").getAttribute("aria-current")).toBe("page");
      expect(tab("Resumen").getAttribute("aria-current")).toBeNull();
      expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
      fireEvent.click(tab("Red"));
      expect(screen.getByRole("heading", { level: 2, name: "Red" })).toBeTruthy();
    });

    it("keeps the active tab while the shell is remounted", () => {
      const first = render(<AppShell />);
      fireEvent.click(tab("Red"));
      first.unmount();
      render(<AppShell />);
      expect(tab("Red").getAttribute("aria-current")).toBe("page");
    });

    it("renders a real panel for every tab", () => {
      render(<AppShell />);
      const headings: Record<string, string> = {
        Postulaciones: "Postulaciones",
        "Nueva oferta": "Nueva oferta",
        Análisis: "Análisis",
        "Mi CV": "Mi CV",
        "Búsqueda diaria": "Búsqueda diaria",
      };
      for (const [name, heading] of Object.entries(headings)) {
        fireEvent.click(tab(name));
        expect(screen.getByRole("heading", { level: 2, name: heading })).toBeTruthy();
        expect(screen.queryByText("Próximamente")).toBeNull();
      }
    });

    it("opens the new application in its drawer after saving an offer, and closes the drawer when changing tab", () => {
      render(<AppShell />);
      fireEvent.click(tab("Nueva oferta"));
      fireEvent.change(screen.getByLabelText("Empresa"), { target: { value: "Acme" } });
      fireEvent.click(screen.getByRole("button", { name: "Guardar postulación" }));
      expect(screen.getByRole("complementary", { name: "Detalle de postulación" })).toBeTruthy();
      expect(screen.getByRole("status").textContent).toBe("Postulación guardada");
      fireEvent.click(tab("Plan"));
      expect(screen.queryByRole("complementary")).toBeNull();
    });

    it("lets the summary shortcuts navigate", () => {
      render(<AppShell />);
      fireEvent.click(screen.getByRole("button", { name: "Armar mi plan" }));
      expect(screen.getByRole("heading", { level: 2, name: "Plan" })).toBeTruthy();
    });
  });

  describe("Resumen", () => {
    it("shows the empty state, then the figures once there are applications", () => {
      const { unmount } = render(<AppShell />);
      expect(screen.getByText("Todavía no cargaste postulaciones")).toBeTruthy();
      unmount();

      stored({ apps: [newApp({ empresa: "Acme", fuente: "LinkedIn" }, todayIso())] });
      render(<AppShell />);
      expect(screen.getByText("Ofertas cargadas")).toBeTruthy();
      expect(screen.getByText("Por fuente")).toBeTruthy();
    });

    it("writes the monthly goal to the store", () => {
      render(<AppShell />);
      fireEvent.change(screen.getByLabelText("Meta"), { target: { value: "20" } });
      expect(state().goal).toBe(20);
      expect(state().goalSet).toBe(true);
      expect(screen.getByText(/Meta del mes/)).toBeTruthy();
    });
  });

  describe("Plan", () => {
    it("selects variables for the week and shows their board", () => {
      render(<AppShell />);
      fireEvent.click(tab("Plan"));
      expect(screen.getByText("Todavía no elegiste variables")).toBeTruthy();
      fireEvent.click(screen.getByRole("checkbox", { name: /Red de contactos/ }));
      const week = mondayOf(todayIso());
      expect(state().planVars[week]).toEqual(["networking"]);
      expect(screen.getByText("Registros de la red cargados")).toBeTruthy();
    });

    it("refuses a sixth variable with a notice", () => {
      render(<AppShell />);
      fireEvent.click(tab("Plan"));
      for (const name of [
        /^Red de contactos/,
        /^Investigación de empresas/,
        /^Investigación de puestos/,
        /^Investigación de plataformas/,
        /^Postulaciones \(directas/,
      ]) {
        fireEvent.click(screen.getByRole("checkbox", { name }));
      }
      fireEvent.click(screen.getByRole("checkbox", { name: /^Entrevistas/ }));
      expect(state().planVars[mondayOf(todayIso())]).toHaveLength(5);
      expect(screen.getByRole("status").textContent).toBe(
        "Máximo 5 variables por semana. Sacá una para elegir otra.",
      );
    });

    it("moves between weeks and keeps the chosen week across tabs", () => {
      render(<AppShell />);
      fireEvent.click(tab("Plan"));
      fireEvent.click(screen.getByRole("button", { name: "Semana siguiente" }));
      expect(screen.getByText(/El tablero con los números|Todavía no elegiste variables/)).toBeTruthy();
      const label = screen.getByText(/^Semana del /).textContent;
      fireEvent.click(tab("Red"));
      fireEvent.click(tab("Plan"));
      expect(screen.getByText(/^Semana del /).textContent).toBe(label);
    });

    it("adds a weekly objective for the planned week, with its deadline", () => {
      render(<AppShell />);
      fireEvent.click(tab("Plan"));
      fireEvent.click(screen.getByRole("button", { name: "+ Objetivo semanal" }));
      expect(state().objetivos).toHaveLength(1);
      expect(state().objetivos[0].periodo).toBe("Semanal");
      expect(state().objetivos[0].semana).toBe(mondayOf(todayIso()));
      expect(state().objetivos[0].plazo).not.toBe("");
      expect(screen.getByText("Objetivo sin redactar")).toBeTruthy();
    });

    it("warns about a written objective without indicator, and edits it", () => {
      render(<AppShell />);
      fireEvent.click(tab("Plan"));
      fireEvent.click(screen.getByRole("button", { name: "+ Objetivo semanal" }));
      fireEvent.change(screen.getByLabelText(/^S · Específico/), { target: { value: "Postular a 5 ofertas" } });
      expect(state().objetivos[0].objetivo).toBe("Postular a 5 ofertas");
      expect(screen.getByText(/Falta el indicador/)).toBeTruthy();
      fireEvent.change(screen.getByLabelText("Estado"), { target: { value: "Hecho" } });
      expect(state().objetivos[0].estado).toBe("Hecho");
      expect(state().objetivos[0].doneAt).toBe(todayIso());
    });

    it("deletes an objective only after confirming", () => {
      render(<AppShell />);
      fireEvent.click(tab("Plan"));
      fireEvent.click(screen.getByRole("button", { name: "+ Objetivo mensual" }));
      expect(state().objetivos[0].periodo).toBe("Mensual");
      fireEvent.click(screen.getByRole("button", { name: "Eliminar" }));
      expect(state().objetivos).toHaveLength(1);
      fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
      expect(state().objetivos).toHaveLength(1);
      fireEvent.click(screen.getByRole("button", { name: "Eliminar" }));
      fireEvent.click(screen.getByRole("button", { name: "Eliminar" }));
      expect(state().objetivos).toHaveLength(0);
      expect(screen.getByText("Sin objetivos mensuales")).toBeTruthy();
    });

    it("enabling a proposal adds its tab, and the direction block", () => {
      render(<AppShell />);
      fireEvent.click(tab("Plan"));
      expect(screen.queryByRole("button", { name: "Empleadores" })).toBeNull();
      fireEvent.click(screen.getByRole("checkbox", { name: /Lista de empleadores objetivo/ }));
      expect(state().mods.empleadores).toBe(true);
      expect(tab("Empleadores")).toBeTruthy();

      fireEvent.click(screen.getByRole("checkbox", { name: /Valores y objetivo laboral Propuesta/ }));
      fireEvent.change(screen.getByLabelText("Mi objetivo laboral"), { target: { value: "Ser dev" } });
      expect(state().base.objetivoLaboral).toBe("Ser dev");
    });

    it("stores a personal goal typed on the board", () => {
      render(<AppShell />);
      fireEvent.click(tab("Plan"));
      fireEvent.click(screen.getByRole("checkbox", { name: /^Red de contactos/ }));
      fireEvent.change(screen.getByLabelText("Meta de Registros de la red cargados"), {
        target: { value: "4" },
      });
      expect(state().metas["networking:a0"]).toBe("4");
    });

    it("jumps to the register of a variable from the board", () => {
      render(<AppShell />);
      fireEvent.click(tab("Plan"));
      fireEvent.click(screen.getByRole("checkbox", { name: /^Red de contactos/ }));
      fireEvent.click(screen.getByRole("button", { name: "Ir al registro →" }));
      expect(screen.getByRole("heading", { level: 2, name: "Red" })).toBeTruthy();
    });
  });

  describe("Red", () => {
    it("adds a record, edits it and updates the figures", () => {
      render(<AppShell />);
      fireEvent.click(tab("Red"));
      expect(screen.getByText("Sin registros todavía")).toBeTruthy();
      fireEvent.click(screen.getByRole("button", { name: "+ Nuevo registro" }));
      expect(state().red).toHaveLength(1);
      expect(state().red[0].fecha).toBe(todayIso());
      fireEvent.change(screen.getByLabelText("Número en la red (conexiones)"), { target: { value: "250" } });
      expect(state().red[0].conexiones).toBe("250");
      expect(screen.getByText("250 conexiones")).toBeTruthy();
      expect(screen.getAllByText("250").length).toBeGreaterThan(0);
    });

    it("shows the change against the previous record", () => {
      stored({
        red: [
          { id: "a", fecha: "2026-10-01", conexiones: "100", paginas: "", nota: "" },
          { id: "b", fecha: "2026-11-01", conexiones: "130", paginas: "", nota: "" },
        ],
      });
      render(<AppShell />);
      fireEvent.click(tab("Red"));
      expect(screen.getByText("+30")).toBeTruthy();
    });
  });

  describe("Visibilidad", () => {
    it("registers a post and counts it in the current week", () => {
      render(<AppShell />);
      fireEvent.click(tab("Visibilidad"));
      expect(screen.getByText("0 de 3")).toBeTruthy();
      fireEvent.click(screen.getByRole("button", { name: "+ Registrar" }));
      expect(state().posts).toHaveLength(1);
      expect(screen.getByText("1 de 3")).toBeTruthy();
      fireEvent.change(screen.getByLabelText("Tema"), { target: { value: "React 19" } });
      expect(state().posts[0].tema).toBe("React 19");
    });

    it("shows the LinkedIn metrics block only while its proposal is enabled", () => {
      render(<AppShell />);
      fireEvent.click(tab("Visibilidad"));
      expect(screen.queryByText("Indicadores de visibilidad")).toBeNull();
      act(() => appStore.getState().update((s) => ({ ...s, mods: { ...s.mods, visibilidad: true } })));
      fireEvent.click(screen.getByRole("button", { name: "+ Nueva medición" }));
      expect(state().metricas).toHaveLength(1);
    });
  });

  describe("Empleadores y Experimentos", () => {
    it("adds an employer once the module is on", () => {
      stored({ mods: { ...blank().mods, empleadores: true, experimentos: true } });
      render(<AppShell />);
      fireEvent.click(tab("Empleadores"));
      fireEvent.click(screen.getByRole("button", { name: "+ Agregar empresa" }));
      fireEvent.change(screen.getByLabelText("Empresa"), { target: { value: "Acme" } });
      expect(state().empleadores[0].empresa).toBe("Acme");
      expect(screen.getByText("Acme")).toBeTruthy();
    });

    it("adds an experiment and records its decision", () => {
      stored({ mods: { ...blank().mods, experimentos: true } });
      render(<AppShell />);
      fireEvent.click(tab("Experimentos"));
      fireEvent.click(screen.getByRole("button", { name: "+ Nuevo experimento" }));
      fireEvent.change(screen.getByLabelText("Decisión"), { target: { value: "Seguir" } });
      expect(state().experimentos[0].decision).toBe("Seguir");
    });

    it("falls back to Plan when the active tab disappears", () => {
      stored({ mods: { ...blank().mods, empleadores: true } });
      render(<AppShell />);
      fireEvent.click(tab("Empleadores"));
      act(() => appStore.getState().update((s) => ({ ...s, mods: { ...s.mods, empleadores: false } })));
      expect(screen.getByRole("heading", { level: 2, name: "Plan" })).toBeTruthy();
    });
  });

  describe("sync with the server", () => {
    const notLoaded = () => appStore.setState(appStore.getInitialState(), true);

    it("loads the state from the server on mount, showing a loading message meanwhile", async () => {
      notLoaded();
      vi.mocked(loadMyState).mockResolvedValueOnce({
        ok: true,
        state: { ...blank(), profile: { ...blank().profile, name: "Ana Pérez", headline: "Frontend", nameAuto: false } },
      });
      render(<AppShell />);
      expect(screen.getByText("Cargando…")).toBeTruthy();
      expect(await screen.findByText("Ana Pérez · Frontend")).toBeTruthy();
      expect(loadMyState).toHaveBeenCalledTimes(1);
    });

    it("explains a failed load and retries on request", async () => {
      notLoaded();
      vi.mocked(loadMyState).mockResolvedValueOnce({ ok: false, error: "failed" });
      render(<AppShell />);
      expect(await screen.findByText("No pudimos cargar tus datos.")).toBeTruthy();
      fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
      expect(await screen.findByRole("heading", { level: 2, name: "Resumen" })).toBeTruthy();
      expect(loadMyState).toHaveBeenCalledTimes(2);
    });

    it("goes to the sign-in page when the session is gone", async () => {
      notLoaded();
      const assign = vi.fn();
      vi.stubGlobal("location", { ...window.location, assign });
      vi.mocked(loadMyState).mockResolvedValueOnce({ ok: false, error: "unauthorized" });
      render(<AppShell />);
      await waitFor(() => expect(assign).toHaveBeenCalledWith("/ingresar"));
      vi.unstubAllGlobals();
    });

    it("sends edits to the server as commands and never writes the app state to localStorage", () => {
      const setItem = vi.spyOn(Storage.prototype, "setItem");
      render(<AppShell />);
      fireEvent.click(tab("Red"));
      fireEvent.click(screen.getByRole("button", { name: "+ Nuevo registro" }));
      expect(state().red).toHaveLength(1);
      expect(sentCommands().map((c) => c.type)).toEqual(["registry.add"]);
      expect(setItem.mock.calls.filter(([key]) => key.startsWith("radar-postulaciones"))).toEqual([]);
    });

    it("sends the edits still waiting when the page is hidden", () => {
      render(<AppShell />);
      fireEvent.click(tab("Resumen"));
      act(() => appStore.getState().update((s) => ({ ...s, goal: 7, goalSet: true })));
      expect(sentCommands()).toEqual([]);
      act(() => {
        window.dispatchEvent(new Event("pagehide"));
      });
      expect(sentCommands()).toEqual([{ type: "goal.set", goal: 7, goalSet: true }]);
    });
  });
});
