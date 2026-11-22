import { OFERTA_DATA } from "./data";

export interface Product {
  n: string;
  d: string;
  inc: string[];
  gratis?: boolean;
}

export interface Offer {
  productos: Product[];
}

export const OFERTA: Offer = OFERTA_DATA;
