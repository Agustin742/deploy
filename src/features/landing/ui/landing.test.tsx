// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { OFERTA } from "@/features/offer/domain/offer";
import { LandingPage } from "./landing-page";

describe("LandingPage", () => {
  afterEach(cleanup);

  it("renders the hero with a CTA into the app", () => {
    render(<LandingPage />);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Organizá tu búsqueda laboral IT y avanzá con un plan claro",
      }),
    ).toBeTruthy();
    const cta = screen.getByRole("link", { name: "Ingresar a la herramienta" });
    expect(cta.getAttribute("href")).toBe("/app");
    expect(
      screen.getByRole("link", { name: "Ver planes y precios" }).getAttribute("href"),
    ).toBe("#planes-lista");
  });

  it("lists every product with the pending price for the default country", () => {
    render(<LandingPage />);
    const list = document.getElementById("planes-lista")!;
    expect(within(list).getAllByRole("heading", { level: 3 })).toHaveLength(OFERTA.productos.length);
    expect(within(list).getAllByText("Precio a confirmar").length).toBeGreaterThan(0);
    expect(within(list).getByText("Gratis")).toBeTruthy();
    expect(within(list).getAllByText("Argentina").length).toBe(OFERTA.productos.length);
  });

  it("switches the country shown on every card", () => {
    render(<LandingPage />);
    fireEvent.change(screen.getByLabelText("Precios para"), { target: { value: "Chile" } });
    const list = document.getElementById("planes-lista")!;
    expect(within(list).getAllByText("Chile").length).toBe(OFERTA.productos.length);
  });

  it("shows the draft notice and does not process payments", () => {
    render(<LandingPage />);
    expect(screen.getByText(/Faltan confirmar los precios/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /pagar|comprar/i })).toBeNull();
  });
});
