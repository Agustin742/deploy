// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CONTACT_URL, WHATSAPP_NUMBER } from "@/features/offer/domain/contact";
import { OFERTA } from "@/features/offer/domain/offer";
import { LandingPage } from "./landing-page";

describe("LandingPage", () => {
  afterEach(cleanup);

  it("renders the outcome headline with an access CTA and a sign-in link", () => {
    render(<LandingPage />);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Cargá tus postulaciones rápido y mirá cómo avanza tu búsqueda",
      }),
    ).toBeTruthy();
    expect(screen.getByRole("link", { name: "Cómo conseguir acceso" }).getAttribute("href")).toBe("#acceso");
    expect(screen.getByRole("link", { name: "Ya tengo cuenta → Ingresar" }).getAttribute("href")).toBe("/app");
    expect(screen.getByText("Acceso por invitación · Tus datos en tu cuenta")).toBeTruthy();
  });

  it("has a sticky header with anchors, a quiet sign-in and the purchase action", () => {
    render(<LandingPage />);
    const nav = screen.getByRole("navigation", { name: "Secciones" });
    expect(within(nav).getAllByRole("link").map((l) => l.getAttribute("href"))).toEqual([
      "#producto",
      "#acceso",
      "#preguntas",
    ]);
    const header = screen.getByRole("banner");
    expect(within(header).getByRole("link", { name: "Ingresar" }).getAttribute("href")).toBe("/app");
    const buy = within(header).getByRole("link", { name: "Pedir acceso" });
    expect(buy.getAttribute("href")).toBe(CONTACT_URL);
    expect(buy.getAttribute("target")).toBe("_blank");
    expect(buy.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("makes the tool the one dominant plan with a WhatsApp request link and no prices", () => {
    render(<LandingPage />);
    const tool = OFERTA.productos[0];
    const card = screen.getByRole("heading", { level: 3, name: tool.n }).closest("article")!;
    expect(within(card).getByText("Acceso por 1 año")).toBeTruthy();
    expect(within(card).getAllByRole("listitem")).toHaveLength(tool.inc.length);
    expect(within(card).getByRole("link", { name: "Pedir acceso por WhatsApp" }).getAttribute("href")).toBe(
      CONTACT_URL,
    );
    expect(screen.queryByRole("button", { name: /pagar|comprar/i })).toBeNull();
    expect(document.body.textContent).not.toMatch(/precio|transferencia|medios de pago|borrador|pago único/i);
    expect(document.querySelector("select, [role=combobox]")).toBeNull();
  });

  it("lists the other products as additional services, with the free diagnostic as a banner", () => {
    render(<LandingPage />);
    const services = OFERTA.productos.slice(1).filter((p) => !p.gratis);
    const list = screen.getByRole("heading", { name: "Servicios adicionales" }).nextElementSibling as HTMLElement;
    expect(within(list).getAllByRole("listitem")).toHaveLength(services.length);
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

  it("summarizes how it works in three steps under the plan", () => {
    render(<LandingPage />);
    const steps = screen.getByText("Nos escribís por WhatsApp").closest("ol")!;
    expect(within(steps).getAllByRole("listitem").map((li) => li.textContent?.replace(/→$/, ""))).toEqual([
      "Nos escribís por WhatsApp",
      "Habilitamos tu email",
      "Entrás con Google o con un link por email",
    ]);
  });

  it("puts the FAQ accordion right after the pricing", () => {
    render(<LandingPage />);
    const pricing = document.getElementById("acceso")!;
    const faq = document.getElementById("preguntas")!;
    expect(pricing.nextElementSibling).toBe(faq);
    expect(faq.querySelectorAll("details").length).toBeGreaterThanOrEqual(8);
    expect(within(faq).getByText("¿Cuánto dura el acceso?")).toBeTruthy();
  });

  it("illustrates the product with decorative UI mockups instead of empty boxes", () => {
    render(<LandingPage />);
    const product = document.getElementById("producto")!;
    const mocks = product.querySelectorAll('[aria-hidden="true"]');
    expect(mocks.length).toBe(2);
    expect(mocks[0].textContent).toContain("Cargar postulación");
    expect(mocks[0].textContent).toContain("Guardar");
    expect(mocks[1].textContent).toContain("Postulaciones por mes");
  });

  it("answers each FAQ question in a collapsible panel without payment claims", () => {
    render(<LandingPage />);
    const faq = document.getElementById("preguntas")!;
    for (const item of faq.querySelectorAll("details")) {
      expect(item.querySelector("summary")).toBeTruthy();
      expect(item.querySelector("p")!.textContent!.length).toBeGreaterThan(60);
      expect(item.hasAttribute("open")).toBe(false);
    }
    expect(faq.textContent).toContain("sin contraseñas");
    expect(faq.textContent).toContain("archivo de respaldo");
    expect(faq.textContent).not.toMatch(/transferencia|medios de pago|reembolso|renovaci/i);
  });

  it("shows the legal notice in the footer in every environment", () => {
    render(<LandingPage />);
    const footer = screen.getByRole("contentinfo");
    expect(within(footer).getByText(`© ${new Date().getFullYear()} Deploy your Career. Todos los derechos reservados.`)).toBeTruthy();
    expect(footer.textContent).toContain("no garantiza empleo ni resultados");
    expect(footer.textContent).toContain("se brinda tal como está");
    expect(footer.textContent).toContain("no se venden a terceros");
    expect(footer.textContent).not.toMatch(/En preparación|Borrador/);
  });

  it("shows the hero artwork directly on the page, without a framed box", () => {
    render(<LandingPage />);
    const img = screen.getByRole("img", { name: /Sapito de Deploy your Career/ });
    expect(decodeURIComponent(img.getAttribute("src")!)).toContain("hero-banner.webp");
    expect(img.closest("[class*=border]")).toBeNull();
    expect(img.closest("[class*=bg-surface]")).toBeNull();
  });
});
