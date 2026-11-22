/**
 * Where "Comprar acceso" and "Consultar" lead. Payment is a manual transfer coordinated by contact,
 * so there is no checkout: the landing sends people to its contact section.
 *
 * TODO(owner): set the URL of the Deploy your Career services page on LinkedIn.
 * While it is null the links point to the contact section of the landing itself.
 */
export const CONTACT_URL: string | null = null;

export const CONTACT_ANCHOR = "#contacto";

export interface ContactLink {
  href: string;
  /** External links open in a new tab. */
  external: boolean;
}

export const contactLink = (url: string | null = CONTACT_URL): ContactLink =>
  url ? { href: url, external: true } : { href: CONTACT_ANCHOR, external: false };
