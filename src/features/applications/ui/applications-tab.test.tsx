// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JD_EXAMPLE } from "@/features/matching/domain/example";
import type { Application, Profile } from "@/features/state/domain/types";
import { appStore } from "@/features/state/store/use-app-store";
import { todayIso } from "@/shared/lib/dates";
import { newApp } from "../domain/applications";
import { recalcOne } from "../domain/edit";
import { applicationsUi } from "../store/applications-ui";
import { ApplicationsTab } from "./applications-tab";

const TODAY = todayIso();
const CV = "Ana Pérez\nFrontend developer con experiencia en React, TypeScript, HTML y CSS. Trabajo en equipo y git.";

function seed(apps: Application[], profile: Partial<Profile> = { cv: CV }) {
  const store = appStore.getState();
  store.load();
  store.update((s) => ({ ...s, apps, profile: { ...s.profile, ...profile } }), { immediate: true });
  if (apps.some((a) => a.jd)) {
    store.update((s) => apps.reduce((acc, a) => recalcOne(acc, a.id, TODAY), s), { immediate: true });
  }
}

const state = () => appStore.getState().state;
const drawer = () => screen.getByRole("complementary", { name: "Detalle de postulación" });

const acme = () => newApp({ id: "a", empresa: "Acme", puesto: "Frontend", fecha: "2026-10-01", estado: "Postulado", jd: JD_EXAMPLE }, TODAY);
const beta = () => newApp({ id: "b", empresa: "Beta", puesto: "Backend", fecha: "2026-10-20", estado: "Entrevista" }, TODAY);

function renderTab() {
  const onNavigate = vi.fn();
  const onNotify = vi.fn();
  render(<ApplicationsTab onNavigate={onNavigate} onNotify={onNotify} />);
  return { onNavigate, onNotify };
}

describe("ApplicationsTab", () => {
  beforeEach(() => {
    window.localStorage.clear();
    appStore.setState(appStore.getInitialState(), true);
    applicationsUi.setState(applicationsUi.getInitialState(), true);
  });
  afterEach(() => {
    appStore.getState().saveNow();
    cleanup();
    vi.restoreAllMocks();
  });

  describe("list", () => {
    it("shows the empty state when there are no applications", () => {
      seed([]);
      renderTab();
      expect(screen.getByText("No hay postulaciones")).toBeTruthy();
      expect(screen.getByText(/Cargá la primera desde “Nueva oferta”/)).toBeTruthy();
    });

    it("lists the applications newest first with match, status and missing skills", () => {
      seed([acme(), beta()]);
      renderTab();
      const rows = screen.getAllByRole("row").slice(1);
      expect(rows).toHaveLength(2);
      expect(within(rows[0]).getByText("Beta")).toBeTruthy();
      expect(within(rows[1]).getByText("Acme")).toBeTruthy();
      expect(within(rows[1]).getByText(/^\d+%$/)).toBeTruthy();
      expect((within(rows[0]).getByLabelText("Estado") as HTMLSelectElement).value).toBe("Entrevista");
    });

    it("filters by status and explains an empty result", () => {
      seed([acme(), beta()]);
      renderTab();
      fireEvent.click(screen.getByRole("button", { name: "Entrevista" }));
      expect(screen.getAllByRole("row")).toHaveLength(2);
      fireEvent.click(screen.getByRole("button", { name: "Oferta" }));
      expect(screen.getByText("Nada con ese filtro")).toBeTruthy();
    });

    it("searches by company", () => {
      seed([acme(), beta()]);
      renderTab();
      fireEvent.change(screen.getByLabelText("Buscar"), { target: { value: "acm" } });
      const rows = screen.getAllByRole("row").slice(1);
      expect(rows).toHaveLength(1);
      expect(within(rows[0]).getByText("Acme")).toBeTruthy();
    });

    it("sorts by match", () => {
      seed([beta(), acme()]);
      renderTab();
      fireEvent.change(screen.getByLabelText("Ordenar"), { target: { value: "match" } });
      expect(within(screen.getAllByRole("row")[1]).getByText("Acme")).toBeTruthy();
    });

    it("changes the status from the row and saves it right away", () => {
      seed([acme()]);
      renderTab();
      const row = screen.getAllByRole("row")[1];
      fireEvent.change(within(row).getByLabelText("Estado"), { target: { value: "Oferta" } });
      expect(state().apps[0].estado).toBe("Oferta");
      expect(JSON.parse(window.localStorage.getItem("radar-postulaciones-v1") ?? "{}").apps[0].estado).toBe("Oferta");
      expect(screen.queryByRole("complementary")).toBeNull();
    });

    it("navigates to Nueva oferta from the header button", () => {
      seed([]);
      const { onNavigate } = renderTab();
      fireEvent.click(screen.getByRole("button", { name: "+ Nueva oferta" }));
      expect(onNavigate).toHaveBeenCalledWith("nueva");
    });
  });

  describe("detail drawer", () => {
    const open = () => {
      seed([acme()]);
      const handlers = renderTab();
      fireEvent.click(screen.getByText("Acme"));
      return handlers;
    };

    it("opens on a row click with the match, and closes with the button, the overlay and Escape", () => {
      open();
      const d = within(drawer());
      expect(d.getByRole("heading", { level: 2, name: "Acme" })).toBeTruthy();
      expect(d.getByText("Match con tu CV")).toBeTruthy();
      fireEvent.click(d.getByRole("button", { name: "Cerrar" }));
      expect(screen.queryByRole("complementary")).toBeNull();

      fireEvent.click(screen.getByText("Acme"));
      fireEvent.click(screen.getByTestId("drawer-overlay"));
      expect(screen.queryByRole("complementary")).toBeNull();

      fireEvent.click(screen.getByText("Acme"));
      fireEvent.keyDown(document, { key: "Escape" });
      expect(screen.queryByRole("complementary")).toBeNull();
    });

    it("edits the fields and the status reaching the store", () => {
      open();
      const d = within(drawer());
      fireEvent.change(d.getByLabelText("Empresa"), { target: { value: "Acme SA" } });
      fireEvent.change(d.getByLabelText("Estado"), { target: { value: "Rechazado" } });
      fireEvent.change(d.getByLabelText("Comentarios"), { target: { value: "Llamar el lunes" } });
      expect(state().apps[0]).toMatchObject({ empresa: "Acme SA", estado: "Rechazado", comentarios: "Llamar el lunes" });
      expect(d.getByRole("heading", { level: 2, name: "Acme SA" })).toBeTruthy();
    });

    it("detects the source from a pasted link", () => {
      open();
      fireEvent.change(within(drawer()).getByLabelText("Link de la oferta"), {
        target: { value: "https://www.linkedin.com/jobs/view/9" },
      });
      expect(state().apps[0].fuente).toBe("LinkedIn");
      expect(within(drawer()).getByRole("link", { name: /Abrir la oferta/ })).toBeTruthy();
    });

    it("recalculates the match after the job description changes, and clears it when emptied", async () => {
      open();
      const jd = within(drawer()).getByPlaceholderText("Pegá la job description para calcular el match");
      fireEvent.change(jd, { target: { value: "" } });
      await waitFor(() => expect(state().apps[0].match).toBeNull());
      fireEvent.change(jd, { target: { value: JD_EXAMPLE } });
      await waitFor(() => expect(state().apps[0].match?.pct).toBeGreaterThan(0));
    });

    it("recalculates on demand and confirms with a toast", () => {
      const { onNotify } = open();
      fireEvent.click(within(drawer()).getByRole("button", { name: "Recalcular" }));
      expect(onNotify).toHaveBeenCalledWith("Match actualizado");
    });

    it("tracks the pre-interview checklist", () => {
      open();
      const d = within(drawer());
      fireEvent.click(d.getByText(/Pre-entrevista: cosas para averiguar \(0 de 8\)/));
      fireEvent.click(d.getByLabelText("Averiguado: ¿Quién me entrevista? (nombre, cargo, LinkedIn)"));
      expect(state().apps[0].pre?.quien?.ok).toBe(true);
      expect(d.getByText(/\(1 de 8\)/)).toBeTruthy();
    });

    it("adds and removes interviews", () => {
      open();
      const d = within(drawer());
      expect(d.getByText("Todavía no registraste entrevistas para esta postulación.")).toBeTruthy();
      fireEvent.click(d.getByRole("button", { name: "+ Agregar entrevista" }));
      expect(state().apps[0].entrevistas).toHaveLength(1);
      fireEvent.change(d.getByLabelText("Etapa o tipo"), { target: { value: "RR.HH." } });
      expect(state().apps[0].entrevistas[0].etapa).toBe("RR.HH.");
      fireEvent.click(d.getByRole("button", { name: "Eliminar" }));
      expect(state().apps[0].entrevistas).toHaveLength(0);
    });

    it("edits the company profile", () => {
      open();
      const d = within(drawer());
      fireEvent.click(d.getByText("Ficha de la empresa (antes de la entrevista)"));
      fireEvent.change(d.getByLabelText("Industria / sector"), { target: { value: "Fintech" } });
      expect(state().apps[0].ficha.industria).toBe("Fintech");
    });

    it("asks for confirmation before deleting, and can cancel", () => {
      const { onNotify } = open();
      const d = within(drawer());
      fireEvent.click(d.getByRole("button", { name: "Eliminar postulación" }));
      expect(d.getByText("¿Eliminar esta postulación?")).toBeTruthy();
      fireEvent.click(d.getByRole("button", { name: "Cancelar" }));
      expect(state().apps).toHaveLength(1);

      fireEvent.click(d.getByRole("button", { name: "Eliminar postulación" }));
      fireEvent.click(d.getByRole("button", { name: "Sí, eliminar" }));
      expect(state().apps).toHaveLength(0);
      expect(screen.queryByRole("complementary")).toBeNull();
      expect(onNotify).toHaveBeenCalledWith("Postulación eliminada");
    });

    it("does not offer to generate the AI report", () => {
      open();
      expect(within(drawer()).queryByRole("button", { name: /Generar informe/ })).toBeNull();
      expect(
        within(drawer()).getByText("En esta vista no se puede generar el informe dentro de la página. Copiá el prompt y pegalo en Claude."),
      ).toBeTruthy();
    });

    it("warns what is shared before copying the prompt, then copies it", async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
      const { onNotify } = open();
      const d = within(drawer());
      fireEvent.click(d.getByRole("button", { name: "Copiar prompt completo" }));
      expect(d.getByText("Antes de compartir con una IA")).toBeTruthy();
      expect(d.getByText(/Tu nombre no se incluye/)).toBeTruthy();
      fireEvent.click(d.getByRole("button", { name: "Entiendo, copiar prompt" }));
      await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
      expect(writeText.mock.calls[0][0]).toContain("Prompt de Job Matching");
      expect(onNotify).toHaveBeenCalledWith("Prompt copiado. Pegalo solo en la IA que elijas.");
    });

    it("explains what is missing instead of asking when there is no CV or description", () => {
      seed([newApp({ id: "a", empresa: "Acme", jd: "" }, TODAY)], { cv: "" });
      const { onNotify } = renderTab();
      fireEvent.click(screen.getByText("Acme"));
      fireEvent.click(within(drawer()).getByRole("button", { name: "Copiar prompt completo" }));
      expect(onNotify).toHaveBeenCalledWith("Pegá primero la descripción del puesto");
      expect(within(drawer()).queryByText("Antes de compartir con una IA")).toBeNull();
    });

    it("shows a stored report rendered, with the verification fields while the AI module is on", () => {
      const withReport = { ...acme(), report: "### Resumen\n- **Fuerte** en React\n\nTexto *final*" };
      seed([withReport]);
      appStore.getState().update((s) => ({ ...s, mods: { ...s.mods, ia: true } }), { immediate: true });
      renderTab();
      fireEvent.click(screen.getByText("Acme"));
      const d = within(drawer());
      expect(d.getByRole("heading", { level: 3, name: "Resumen" })).toBeTruthy();
      expect(d.getByText("Fuerte").tagName).toBe("B");
      expect(d.getByRole("button", { name: "Copiar informe" })).toBeTruthy();
      fireEvent.click(d.getByLabelText(/Revisé el informe contra mi CV/));
      expect(state().apps[0].revisado).toBe(true);
    });
  });
});
