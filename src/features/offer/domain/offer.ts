import { OFERTA_DATA } from "./data";

export interface Product {
  n: string;
  tipo: string;
  d: string;
  inc: string[];
  gratis?: boolean;
  /** Price text per country, e.g. { Chile: "CLP 30.000" }. */
  precios: Record<string, string>;
}

export interface Offer {
  borrador: boolean;
  paises: string[];
  productos: Product[];
}

export const OFERTA: Offer = OFERTA_DATA;

/** Draft notices (unconfirmed prices and legal texts) are shown outside production only. */
export const SHOW_DRAFT_NOTICE: boolean = OFERTA.borrador && process.env.NODE_ENV !== "production";

const DEFAULT_COUNTRY = "Argentina";

export const resolveCountry = (pais: string | undefined | null): string =>
  pais && OFERTA.paises.includes(pais) ? pais : DEFAULT_COUNTRY;

export const offerPrice = (product: Product, pais: string): string =>
  product.gratis ? "Gratis" : product.precios[pais] || "Precio a confirmar";
