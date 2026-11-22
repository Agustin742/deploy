// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CONTACT_URL, WHATSAPP_NUMBER } from "@/features/offer/domain/contact";
import { OFERTA } from "@/features/offer/domain/offer";
import { LandingPage } from "./landing-page";

describe("LandingPage", () => {
  afterEach(cleanup);

  it("renders the outcome headline with a price CTA and a sign-in link", () => {
    render(<LandingPage />);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Cargá tus postulaciones rápido y mirá cómo avanza tu búsqueda",
      }),
    ).toBeTruthy();
    expect(screen.getByRole("link", { name: "Ver precios" }).getAttribute("href")).toBe("#precios");
    expect(screen.getByRole("link", { name: "Ya tengo cuenta → Ingresar" }).getAttribute("href")).toBe("/app");
    expect(screen.getByText("Acceso por 1 año · Pago con medios de tu país")).toBeTruthy();
  });

  it("has a sticky header with anchors, a quiet sign-in and the purchase action", () => {
    render(<LandingPage />);
    const nav = screen.getByRole("navigation", { name: "Secciones" });
    expect(within(nav).getAllByRole("link").map((l) => l.getAttribute("href"))).toEqual([
      "#producto",
      "#precios",
      "#preguntas",
    ]);
    const header = screen.getByRole("banner");
    expect(within(header).getByRole("link", { name: "Ingresar" }).getAttribute("href")).toBe("/app");
    const buy = within(header).getByRole("link", { name: "Comprar acceso" });
    expect(buy.getAttribute("href")).toBe(CONTACT_URL);
    expect(buy.getAttribute("target")).toBe("_blank");
    expect(buy.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("makes the tool the one dominant plan, with a purchase link instead of a payment button", () => {
    render(<LandingPage />);
    const tool = OFERTA.productos[0];
    const card = screen.getByRole("heading", { level: 3, name: tool.n }).closest("article")!;
    expect(within(card).getByText("Acceso por 1 año")).toBeTruthy();
    expect(within(card).getByText("Precio a confirmar")).toBeTruthy();
    expect(within(card).getByText("Precio para Argentina · Pago único")).toBeTruthy();
    expect(within(card).getAllByRole("listitem")).toHaveLength(tool.inc.length);
    expect(within(card).getByRole("link", { name: "Comprar acceso" }).getAttribute("href")).toBe(CONTACT_URL);
    expect(screen.queryByRole("button", { name: /pagar|comprar/i })).toBeNull();
  });

  it("lists the other products as additional services, with the free diagnostic as a banner", () => {
    render(<LandingPage />);
    const services = OFERTA.productos.slice(1).filter((p) => !p.gratis);
    const list = screen.getByRole("heading", { name: "Servicios adicionales" }).nextElementSibling as HTMLElement;
    expect(within(list).getAllByRole("listitem")).toHaveLength(services.length);
    expect(within(list).getAllByText("Precio a confirmar")).toHaveLength(services.length);
    expect(screen.getByText("Gratis")).toBeTruthy();
    expect(screen.getAllByRole("link", { name: /^Consultar:/ })).toHaveLength(services.length + 1);
  });

  it("routes every purchase and contact action to WhatsApp in a new tab", () => {
    render(<LandingPage />);
    expect(CONTACT_URL).toBe(
      `https://wa.me/${WHATSAPP_NUMBER}?text=Hola%2C%20quiero%20comprar%20el%20acceso%20a%20Deploy%20your%20Career`,
    );
    const links = screen.getAllByRole("link").filter((l) => l.getAttribute("href")?.startsWith("https://wa.me/"));
    expect(links.length).toBeGreaterThanOrEqual(6);
    for (const l of links) {
      expect(l.getAttribute("target")).toBe("_blank");
      expect(l.getAttribute("rel")).toBe("noopener noreferrer");
    }
    const consult = screen.getByRole("link", { name: `Consultar: ${OFERTA.productos[2].n}` });
    expect(decodeURIComponent(consult.getAttribute("href")!)).toContain(
      `Hola, quiero consultar por ${OFERTA.productos[2].n}`,
    );
    expect(screen.getByRole("link", { name: "WhatsApp +54 11 2407-4603" })).toBeTruthy();
  });

  it("changes the country from a searchable listbox instead of a native select", () => {
    render(<LandingPage />);
    expect(document.querySelector("select")).toBeNull();
    expect(screen.getByText("Mostrando precios para", { exact: false }).textContent).toContain("Argentina");
    fireEvent.click(screen.getByRole("button", { name: "Cambiar" }));
    const search = screen.getByRole("combobox", { name: "Buscar país" });
    fireEvent.change(search, { target: { value: "peru" } });
    const options = screen.getAllByRole("option");
    expect(options.map((o) => o.textContent)).toEqual(["Perú"]);
    fireEvent.keyDown(search, { key: "Enter" });
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(screen.getByText("Precio para Perú · Pago único")).toBeTruthy();
  });

  it("opens the country list with the keyboard and closes it with Escape", () => {
    render(<LandingPage />);
    const trigger = screen.getByRole("button", { name: "Cambiar" });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    const search = screen.getByRole("combobox", { name: "Buscar país" });
    fireEvent.keyDown(search, { key: "ArrowDown" });
    fireEvent.keyDown(search, { key: "Escape" });
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(screen.getByText("Precio para Argentina · Pago único")).toBeTruthy();
  });

  it("summarizes how it works in three steps under the plan", () => {
    render(<LandingPage />);
    const steps = screen.getByText("Elegís tu país").closest("ol")!;
    expect(within(steps).getAllByRole("listitem").map((li) => li.textContent?.replace(/→$/, ""))).toEqual([
      "Elegís tu país",
      "Pagás",
      "Recibís tu invitación",
    ]);
  });

  it("puts the FAQ accordion right after the pricing", () => {
    render(<LandingPage />);
    const pricing = document.getElementById("precios")!;
    const faq = document.getElementById("preguntas")!;
    expect(pricing.nextElementSibling).toBe(faq);
    expect(faq.querySelectorAll("details").length).toBeGreaterThanOrEqual(3);
    expect(within(faq).getByText("¿Cuánto dura el acceso a la herramienta?")).toBeTruthy();
  });

  it("shows the draft notices outside production only", () => {
    render(<LandingPage />);
    expect(screen.getByText(/Faltan confirmar los precios/)).toBeTruthy();
    expect(screen.getByText(/En preparación: términos y condiciones/)).toBeTruthy();
    expect(screen.getByText(/no garantiza empleo ni resultados/)).toBeTruthy();
  });
});
