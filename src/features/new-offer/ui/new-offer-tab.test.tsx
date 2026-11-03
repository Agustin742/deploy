// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
    window.localStorage.clear();
    appStore.setState(appStore.getInitialState(), true);
    appStore.getState().load();
    appStore.getState().update((s) => ({ ...s, profile: { ...s.profile, cv: CV } }), { immediate: true });
  });
  afterEach(() => {
    appStore.getState().saveNow();
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders the form and asks to paste the offer text", () => {
    renderTab();
    expect(screen.getByRole("heading", { level: 2, name: "Nueva oferta" })).toBeTruthy();
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

  it("saves the application, clears the draft and hands over the new id", () => {
    const { onNotify, onSaved } = renderTab();
    fireEvent.change(screen.getByLabelText("Empresa"), { target: { value: "Acme" } });
    fireEvent.click(screen.getByRole("button", { name: "Probar con una oferta de ejemplo" }));
    fireEvent.click(screen.getByRole("button", { name: "Guardar postulación" }));
    expect(state().apps).toHaveLength(1);
    expect(state().apps[0]).toMatchObject({ empresa: "Acme", puesto: "Frontend Developer", estado: "Postulado" });
    expect(state().apps[0].match?.pct).toBeGreaterThan(0);
    expect(state().draft.empresa).toBe("");
    expect(onSaved).toHaveBeenCalledWith(state().apps[0].id);
    expect(onNotify).toHaveBeenCalledWith("Postulación guardada");
    expect(JSON.parse(window.localStorage.getItem("radar-postulaciones-v1") ?? "{}").apps).toHaveLength(1);
  });

  it("clears the draft", () => {
    renderTab();
    fireEvent.change(screen.getByLabelText("Empresa"), { target: { value: "Acme" } });
    fireEvent.click(screen.getByRole("button", { name: "Limpiar" }));
    expect(state().draft.empresa).toBe("");
    expect((screen.getByLabelText("Empresa") as HTMLInputElement).value).toBe("");
  });
});
