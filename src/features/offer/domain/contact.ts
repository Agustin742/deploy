/**
 * Where "Comprar acceso" and "Consultar" lead. Payment is a manual transfer coordinated over
 * WhatsApp, so there is no checkout: every purchase and contact action opens a prefilled chat.
 */
export const WHATSAPP_NUMBER = "5491124074603";
export const WHATSAPP_DISPLAY = "+54 11 2407-4603";

export const PURCHASE_MESSAGE = "Hola, quiero comprar el acceso a Deploy your Career";

export const whatsappUrl = (message: string): string =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

export const CONTACT_URL: string = whatsappUrl(PURCHASE_MESSAGE);

/** Anchor attributes for an external contact link: always a new tab, never leaking the opener. */
export interface ContactLink {
  href: string;
  target: "_blank";
  rel: "noopener noreferrer";
}

const toLink = (href: string): ContactLink => ({ href, target: "_blank", rel: "noopener noreferrer" });

/** Link for buying access. */
export const contactLink = (url: string = CONTACT_URL): ContactLink => toLink(url);

/** Link that asks about one service by name. */
export const consultLink = (serviceName: string): ContactLink =>
  toLink(whatsappUrl(`Hola, quiero consultar por ${serviceName}`));
