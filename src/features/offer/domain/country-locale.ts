/** ISO region (from a browser locale such as "es-CL") to the country names of the offer. */
const REGION_TO_COUNTRY: Record<string, string> = {
  AR: "Argentina",
  BO: "Bolivia",
  BR: "Brasil",
  CL: "Chile",
  CO: "Colombia",
  CR: "Costa Rica",
  EC: "Ecuador",
  GT: "Guatemala",
  MX: "México",
  PY: "Paraguay",
  PA: "Panamá",
  DO: "República Dominicana",
  PE: "Perú",
  UY: "Uruguay",
};

/** Country of the offer that matches a browser locale, or null when there is none. */
export function countryFromLocale(locale: string | undefined | null, available: readonly string[]): string | null {
  const region = locale?.split(/[-_]/)[1]?.toUpperCase();
  const country = region ? REGION_TO_COUNTRY[region] : undefined;
  return country && available.includes(country) ? country : null;
}

/** Lowercase text without accents, to match what people type against country names. */
export const normalizeForSearch = (text: string): string =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
