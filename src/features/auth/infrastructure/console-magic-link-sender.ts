import type { MagicLinkSender } from "../domain/magic-link-sender";

/** Development adapter: prints the link instead of emailing it. */
export const consoleMagicLinkSender: MagicLinkSender = {
  async send({ email, url }) {
    console.log(`[magic-link] ${email} -> ${url}`);
  },
};
