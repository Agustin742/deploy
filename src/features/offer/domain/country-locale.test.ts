import { describe, expect, it } from "vitest";
import { OFERTA } from "./offer";
import { countryFromLocale, normalizeForSearch } from "./country-locale";

describe("countryFromLocale", () => {
  it("maps the region of a browser locale to a country of the offer", () => {
    expect(countryFromLocale("es-CL", OFERTA.paises)).toBe("Chile");
    expect(countryFromLocale("es_MX", OFERTA.paises)).toBe("México");
    expect(countryFromLocale("pt-BR", OFERTA.paises)).toBe("Brasil");
  });

  it("gives nothing for locales without a region, or outside the offer", () => {
    expect(countryFromLocale("es", OFERTA.paises)).toBeNull();
    expect(countryFromLocale("es-ES", OFERTA.paises)).toBeNull();
    expect(countryFromLocale("", OFERTA.paises)).toBeNull();
    expect(countryFromLocale(undefined, OFERTA.paises)).toBeNull();
  });

  it("only returns countries that are available", () => {
    expect(countryFromLocale("es-CL", ["Argentina"])).toBeNull();
  });
});

describe("normalizeForSearch", () => {
  it("ignores case and accents", () => {
    expect(normalizeForSearch("Panamá")).toBe("panama");
    expect(normalizeForSearch("PERÚ")).toBe("peru");
  });
});
