import { describe, expect, it, vi } from "vitest";

import { readSmtpEnv } from "./smtp-env";
import { buildMagicLinkMail, createSmtpMagicLinkSender } from "./smtp-magic-link-sender";

const full = { SMTP_HOST: "smtp.example.com", SMTP_USER: "me@example.com", SMTP_PASS: "pw" };

describe("readSmtpEnv", () => {
  it("is null when nothing is configured", () => {
    expect(readSmtpEnv({})).toBeNull();
    expect(readSmtpEnv({ SMTP_HOST: " ", SMTP_PASS: "" })).toBeNull();
  });

  it("applies defaults: port 465 with implicit TLS and from = user", () => {
    expect(readSmtpEnv(full)).toEqual({ ...{ host: "smtp.example.com", user: "me@example.com", pass: "pw" }, port: 465, secure: true, from: "me@example.com" });
  });

  it("uses STARTTLS for other ports and honors SMTP_FROM", () => {
    const cfg = readSmtpEnv({ ...full, SMTP_PORT: "587", SMTP_FROM: "Deploy <hi@example.com>" });
    expect(cfg).toMatchObject({ port: 587, secure: false, from: "Deploy <hi@example.com>" });
  });

  it("rejects partial configuration and bad ports", () => {
    expect(() => readSmtpEnv({ SMTP_HOST: "h" })).toThrow(/SMTP_USER, SMTP_PASS/);
    expect(() => readSmtpEnv({ ...full, SMTP_PORT: "abc" })).toThrow(/SMTP_PORT/);
  });
});

describe("SMTP magic link sender", () => {
  const config = readSmtpEnv(full)!;

  it("escapes the URL in the HTML body and keeps it raw in the text body", () => {
    const url = 'https://x.test/a?b=1&c="2"<s>';
    const mail = buildMagicLinkMail({ email: "a@b.c", url });
    expect(mail.subject).toBe("Tu link para ingresar a Deploy your Career");
    expect(mail.text).toContain(url);
    expect(mail.html).toContain("b=1&amp;c=&quot;2&quot;&lt;s&gt;");
    expect(mail.html).not.toContain("<s>");
  });

  it("sends to the recipient from the configured address", async () => {
    const sendMail = vi.fn().mockResolvedValue({});
    await createSmtpMagicLinkSender(config, { sendMail }).send({ email: "a@b.c", url: "https://x.test" });
    expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({ from: "me@example.com", to: "a@b.c" }));
  });

  it("logs the SMTP failure and throws a generic error", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const sendMail = vi.fn().mockRejectedValue(new Error("535 auth failed for me@example.com"));
    await expect(createSmtpMagicLinkSender(config, { sendMail }).send({ email: "a@b.c", url: "u" })).rejects.toThrow(
      /No pudimos enviar el email/,
    );
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
