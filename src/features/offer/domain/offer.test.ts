import { describe, expect, it } from "vitest";
import { OFERTA } from "./offer";

describe("offer data", () => {
  it("lists the six products", () => {
    expect(OFERTA.productos.map((p) => p.n)).toEqual([
      "Herramienta Deploy your Career",
      "Diagnóstico inicial de CV y LinkedIn",
      "Optimización de CV",
      "Optimización de LinkedIn",
      "Preparación para entrevistas",
      "Estrategia de networking",
    ]);
    expect(OFERTA.productos[0].inc).toHaveLength(5);
    expect(OFERTA.productos[1].gratis).toBe(true);
    expect(OFERTA.productos.filter((p) => p.gratis)).toHaveLength(1);
  });

  it("carries no prices or payment terms", () => {
    expect(JSON.stringify(OFERTA)).not.toMatch(/precio|pago|transferencia/i);
  });
});
