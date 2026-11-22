import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import type { MagicLinkMessage, MagicLinkSender } from "../domain/magic-link-sender";
import type { SmtpConfig } from "./smtp-env";

const SUBJECT = "Tu link para ingresar a Deploy your Career";

const escapeHtml = (value: string): string =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

export function buildMagicLinkMail({ url }: MagicLinkMessage): { subject: string; text: string; html: string } {
  const safeUrl = escapeHtml(url);
  const text = [
    "Hola,",
    "",
    "Usá este link para ingresar a Deploy your Career:",
    url,
    "",
    "El link vence en poco tiempo y sirve una sola vez.",
    "Si no lo pediste vos, ignorá este mensaje.",
  ].join("\n");
  const html = `<!doctype html>
<html lang="es"><body style="margin:0;padding:24px;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;color:#1e1e1e">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:100%;background:#ffffff;border-radius:12px;padding:32px">
<tr><td>
<h1 style="margin:0 0 16px;font-size:20px">Deploy your Career</h1>
<p style="margin:0 0 24px;line-height:1.5">Usá este botón para ingresar:</p>
<p style="margin:0 0 24px"><a href="${safeUrl}" style="display:inline-block;background:#253ff6;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:8px">Ingresar</a></p>
<p style="margin:0 0 8px;font-size:13px;color:#4c4c4c;line-height:1.5">Si el botón no funciona, copiá y pegá este link en tu navegador:<br><a href="${safeUrl}" style="color:#253ff6;word-break:break-all">${safeUrl}</a></p>
<p style="margin:16px 0 0;font-size:13px;color:#4c4c4c;line-height:1.5">El link vence en poco tiempo y sirve una sola vez. Si no lo pediste vos, ignorá este mensaje.</p>
</td></tr></table></td></tr></table></body></html>`;
  return { subject: SUBJECT, text, html };
}

type Mailer = Pick<Transporter, "sendMail">;

/**
 * Production adapter: sends the magic link over SMTP. Failures are logged here with their detail
 * and surface to the client as a generic error, so SMTP internals never leak.
 */
export function createSmtpMagicLinkSender(
  config: SmtpConfig,
  mailer: Mailer = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.pass },
  }),
): MagicLinkSender {
  return {
    async send(message) {
      try {
        await mailer.sendMail({ from: config.from, to: message.email, ...buildMagicLinkMail(message) });
      } catch (error) {
        console.error("[magic-link] SMTP delivery failed", error);
        throw new Error("No pudimos enviar el email. Probá de nuevo en unos minutos.");
      }
    },
  };
}
