export interface MagicLinkMessage {
  email: string;
  /** Full sign-in URL the user must open. */
  url: string;
}

/**
 * Port for delivering magic links. Dev uses the console adapter; production uses the SMTP adapter
 * behind this same interface.
 */
export interface MagicLinkSender {
  send(message: MagicLinkMessage): Promise<void>;
}
