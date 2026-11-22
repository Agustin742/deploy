// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { blank } from "@/features/state/domain/state";
import { resetAppStore, sentCommands } from "@/features/state/store/testing";
import { appStore } from "@/features/state/store/use-app-store";
import { NewOfferTab } from "./new-offer-tab";

const CV = "Ana Pérez\nFrontend developer con experiencia en React, TypeScript, HTML y CSS. Trabajo en equipo y git.";
const state = () => appStore.getState().state;

function renderTab() {
  const handlers = { onNavigate: vi.fn(), onNotify: vi.fn(), onSaved: vi.fn() };
  render(<NewOfferTab {...handlers} />);
  return handlers;
}

describe("NewOfferTab", () => {
  beforeEach(() => {
    resetAppStore({ profile: { ...blank().profile, cv: CV } });
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders the form and asks to paste the offer text", () => {
    renderTab();
    expect(screen.getByRole("heading", { level: 2, name: "Cargar postulación" })).toBeTruthy();
    expect(screen.getByLabelText("Empresa")).toBeTruthy();
    expect(screen.getByLabelText("Fuente")).toBeTruthy();
    expect(screen.getByText("Pegá el texto de la oferta")).toBeTruthy();
  });

  it("keeps the draft in the store while typing", () => {
    renderTab();
    fireEvent.change(screen.getByLabelText("Empresa"), { target: { value: "Acme" } });
    expect(state().draft.empresa).toBe("Acme");
  });

  it("detects the source from the link", () => {
    renderTab();
    fireEvent.change(screen.getByLabelText("Link de la oferta"), { target: { value: "https://www.linkedin.com/jobs/view/1" } });
    expect((screen.getByLabelText("Fuente") as HTMLSelectElement).value).toBe("LinkedIn");
  });

  it("fills the example and shows the computed match", async () => {
    renderTab();
    fireEvent.click(screen.getByRole("button", { name: "Probar con una oferta de ejemplo" }));
    expect((screen.getByLabelText("Puesto") as HTMLInputElement).value).toBe("Frontend Developer");
    await waitFor(() => expect(screen.getByText(/^Match (alto|medio|bajo)$/)).toBeTruthy());
    expect(screen.getByText("Skills que ya tenés y piden")).toBeTruthy();
  });

  it("points to Mi CV when the CV is missing", () => {
    appStore.getState().update((s) => ({ ...s, profile: { ...s.profile, cv: "" }, draft: { ...s.draft, jd: "x".repeat(60) } }), {
      immediate: true,
    });
    const { onNavigate } = renderTab();
    fireEvent.click(screen.getByRole("link", { name: "Cargalo acá" }));
    expect(onNavigate).toHaveBeenCalledWith("cv");
  });

  it("refuses to save an empty draft", () => {
    const { onNotify, onSaved } = renderTab();
    fireEvent.click(screen.getByRole("button", { name: "Guardar postulación" }));
    expect(onNotify).toHaveBeenCalledWith("Completá al menos empresa o puesto");
    expect(onSaved).not.toHaveBeenCalled();
    expect(state().apps).toHaveLength(0);
  });

  it("saves the application, clears the draft and hands over the new id", async () => {
    const { onNotify, onSaved } = renderTab();
    fireEvent.click(screen.getByRole("button", { name: "Probar con una oferta de ejemplo" }));
    fireEvent.change(screen.getByLabelText("Empresa"), { target: { value: "Acme" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar postulación" }));
    expect(state().apps).toHaveLength(1);
    expect(state().apps[0]).toMatchObject({ empresa: "Acme", puesto: "Frontend Developer", estado: "Postulado" });
    expect(state().apps[0].match?.pct).toBeGreaterThan(0);
    expect(state().draft.empresa).toBe("");
    expect(onSaved).toHaveBeenCalledWith(state().apps[0].id);
    expect(onNotify).toHaveBeenCalledWith("Postulación guardada");
    await waitFor(() => expect(sentCommands().map((c) => c.type).slice(-2)).toEqual(["draft.clear", "app.create"]));
  });

  it("offers the example only while the form is empty, and keeps it out of the main actions", () => {
    renderTab();
    expect(screen.getByRole("button", { name: "Probar con una oferta de ejemplo" })).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Empresa"), { target: { value: "Acme" } });
    expect(screen.queryByRole("button", { name: "Probar con una oferta de ejemplo" })).toBeNull();
  });

  it("saves with Ctrl+Enter from the description", () => {
    const { onSaved } = renderTab();
    fireEvent.change(screen.getByLabelText("Empresa"), { target: { value: "Acme" } });
    fireEvent.keyDown(screen.getByLabelText(/Descripción del puesto/), { key: "Enter", ctrlKey: true });
    expect(state().apps).toHaveLength(1);
    expect(onSaved).toHaveBeenCalledWith(state().apps[0].id);
  });

  it("asks for the link and description first, with the secondary fields under \"Más detalles\"", () => {
    renderTab();
    const positions = [
      screen.getByLabelText("Link de la oferta"),
      screen.getByPlaceholderText(/Pegá acá los requisitos/),
      screen.getByLabelText("Empresa"),
      screen.getByLabelText("Puesto"),
      screen.getByLabelText("Fuente"),
    ];
    for (let i = 1; i < positions.length; i++) {
      expect(positions[i - 1].compareDocumentPosition(positions[i]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
    expect(screen.getByText("Más detalles").closest("details")?.contains(screen.getByLabelText("Fuente"))).toBe(true);
  });

  it("clears the draft", () => {
    renderTab();
    fireEvent.change(screen.getByLabelText("Empresa"), { target: { value: "Acme" } });
    fireEvent.click(screen.getByRole("button", { name: "Limpiar" }));
    expect(state().draft.empresa).toBe("");
    expect((screen.getByLabelText("Empresa") as HTMLInputElement).value).toBe("");
  });
});
