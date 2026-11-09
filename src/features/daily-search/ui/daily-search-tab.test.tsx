// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetAppStore } from "@/features/state/store/testing";
import { appStore } from "@/features/state/store/use-app-store";
import { shiftMonth } from "../domain/daily-search";
import { dailySearchUi } from "../store/daily-search-ui";
import { DailySearchTab } from "./daily-search-tab";

const TODAY = "2026-11-03";
const MONTH = "2026-11";
const state = () => appStore.getState().state;

function renderTab() {
  const onNotify = vi.fn();
  render(<DailySearchTab today={TODAY} onNotify={onNotify} />);
  return { onNotify };
}

describe("DailySearchTab", () => {
  beforeEach(() => {
    resetAppStore();
    dailySearchUi.setState({ ...dailySearchUi.getInitialState(), month: MONTH }, true);
  });
  afterEach(() => {
    cleanup();
  });

  it("renders the month grid with one row per platform and a counter", () => {
    renderTab();
    expect(screen.getByRole("heading", { level: 2, name: "Búsqueda diaria" })).toBeTruthy();
    expect(screen.getByText("Noviembre 2026")).toBeTruthy();
    expect(screen.getByText("0 revisiones en el mes")).toBeTruthy();
    expect(screen.getByText("Hoy: 0 de 19")).toBeTruthy();
    expect(screen.getByRole("button", { name: "LinkedIn día 30" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "LinkedIn día 31" })).toBeNull();
  });

  it("checks a day, updating the store, the counters and the total", () => {
    renderTab();
    const cell = screen.getByRole("button", { name: "LinkedIn día 3" });
    fireEvent.click(cell);
    expect(state().checks[MONTH].linkedin).toEqual([3]);
    expect(cell.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByText("1 revisiones en el mes")).toBeTruthy();
    expect(screen.getByText("Hoy: 1 de 19")).toBeTruthy();
    fireEvent.click(cell);
    expect(state().checks[MONTH].linkedin).toEqual([]);
  });

  it("marks all platforms for today", () => {
    renderTab();
    fireEvent.click(screen.getByRole("button", { name: "Marcar todas hoy" }));
    expect(screen.getByText("Hoy: 19 de 19")).toBeTruthy();
    expect(state().checks[MONTH].indeed).toEqual([3]);
  });

  it("changes month, hiding the today actions on other months", () => {
    renderTab();
    fireEvent.click(screen.getByRole("button", { name: "Mes siguiente" }));
    expect(screen.getByText("Diciembre 2026")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Marcar todas hoy" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Mes anterior" }));
    fireEvent.click(screen.getByRole("button", { name: "Mes anterior" }));
    expect(screen.getByText("Octubre 2026")).toBeTruthy();
    expect(shiftMonth(MONTH, -1)).toBe("2026-10");
  });

  it("adds a page, rejects duplicates and ignores an empty name", () => {
    const { onNotify } = renderTab();
    fireEvent.change(screen.getByLabelText("Nombre de la página"), { target: { value: "Mi Sitio" } });
    fireEvent.change(screen.getByLabelText("Link"), { target: { value: "misitio.com" } });
    fireEvent.click(screen.getByRole("button", { name: "+ Agregar página" }));
    expect(state().platforms.at(-1)).toMatchObject({ id: "mi-sitio", url: "https://misitio.com" });
    expect(onNotify).toHaveBeenCalledWith("Página agregada");
    expect((screen.getByLabelText("Nombre de la página") as HTMLInputElement).value).toBe("");

    fireEvent.change(screen.getByLabelText("Nombre de la página"), { target: { value: "mi sitio" } });
    fireEvent.click(screen.getByRole("button", { name: "+ Agregar página" }));
    expect(onNotify).toHaveBeenLastCalledWith("Esa página ya está en la lista");
    expect(state().platforms.filter((p) => p.id === "mi-sitio")).toHaveLength(1);
  });

  it("edits a page in place", () => {
    const { onNotify } = renderTab();
    fireEvent.click(screen.getByRole("button", { name: "Editar Indeed" }));
    const row = screen.getByLabelText("Nombre").closest("td")!;
    fireEvent.change(within(row).getByLabelText("Nombre"), { target: { value: "Indeed AR" } });
    fireEvent.click(within(row).getByRole("button", { name: "Guardar" }));
    expect(state().platforms.find((p) => p.id === "indeed")?.name).toBe("Indeed AR");
    expect(onNotify).toHaveBeenCalledWith("Página actualizada");
  });

  it("asks before removing a page, then removes it with its checks", () => {
    const { onNotify } = renderTab();
    fireEvent.click(screen.getByRole("button", { name: "LinkedIn día 3" }));
    fireEvent.click(screen.getByRole("button", { name: "Quitar LinkedIn" }));
    expect(screen.getByText("¿Quitar LinkedIn?")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(state().platforms.some((p) => p.id === "linkedin")).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Quitar LinkedIn" }));
    fireEvent.click(screen.getByRole("button", { name: "Sí, quitar" }));
    expect(state().platforms.some((p) => p.id === "linkedin")).toBe(false);
    expect(state().checks[MONTH].linkedin).toBeUndefined();
    expect(onNotify).toHaveBeenCalledWith("Página quitada");
  });

  it("restores the initial pages", () => {
    const { onNotify } = renderTab();
    fireEvent.click(screen.getByRole("button", { name: "Restaurar las páginas iniciales" }));
    expect(onNotify).toHaveBeenCalledWith("Ya están todas las páginas iniciales");
    fireEvent.click(screen.getByRole("button", { name: "Quitar Indeed" }));
    fireEvent.click(screen.getByRole("button", { name: "Sí, quitar" }));
    fireEvent.click(screen.getByRole("button", { name: "Restaurar las páginas iniciales" }));
    expect(onNotify).toHaveBeenLastCalledWith("1 página restaurada");
    expect(state().platforms.some((p) => p.id === "indeed")).toBe(true);
  });
});
