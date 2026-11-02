import { describe, expect, it } from "vitest";
import { OFERTA, offerPrice, resolveCountry } from "./offer";

describe("offer data", () => {
  it("is still a draft with the supported countries", () => {
    expect(OFERTA.borrador).toBe(true);
    expect(OFERTA.paises).toHaveLength(14);
    expect(OFERTA.paises[0]).toBe("Argentina");
    expect(OFERTA.paises).toContain("República Dominicana");
    expect(OFERTA.paises).toContain("Perú");
  });

  it("lists the six products", () => {
    expect(OFERTA.productos.map((p) => p.n)).toEqual([
      "Herramienta Deploy your Career",
      "Diagnóstico inicial de CV y LinkedIn",
      "Optimización de CV",
      "Optimización de LinkedIn",
      "Preparación para entrevistas",
      "Estrategia de networking",
    ]);
    expect(OFERTA.productos[0].tipo).toBe("Producto digital · Pago único");
    expect(OFERTA.productos[0].inc).toHaveLength(5);
    expect(OFERTA.productos[1].gratis).toBe(true);
    expect(OFERTA.productos.filter((p) => p.gratis)).toHaveLength(1);
  });
});

describe("resolveCountry", () => {
  it("keeps supported countries and falls back to Argentina", () => {
    expect(resolveCountry("Chile")).toBe("Chile");
    expect(resolveCountry("Narnia")).toBe("Argentina");
    expect(resolveCountry(undefined)).toBe("Argentina");
  });
});

describe("offerPrice", () => {
  const paid = { ...OFERTA.productos[0], precios: { Chile: "CLP 30.000" } };

  it("returns the price for the country", () => {
    expect(offerPrice(paid, "Chile")).toBe("CLP 30.000");
  });

  it("returns a placeholder when the price is not set", () => {
    expect(offerPrice(paid, "Perú")).toBe("Precio a confirmar");
  });

  it("returns Gratis for free products", () => {
    expect(offerPrice(OFERTA.productos[1], "Chile")).toBe("Gratis");
  });
});
