export interface SmtpConfig {
  host: string;
  port: number;
  /** Implicit TLS: true only for port 465 (other ports upgrade with STARTTLS). */
  secure: boolean;
  user: string;
  pass: string;
  from: string;
}

const clean = (value: string | undefined): string => value?.trim() ?? "";

/**
 * Reads the SMTP settings. Optional but all-or-nothing like the Google credentials: host, user and
 * password go together, and a half-configured mailer is a mistake worth failing loudly on.
 * Returns null when SMTP is not configured (the app falls back to the console sender).
 */
export function readSmtpEnv(env: Record<string, string | undefined> = process.env): SmtpConfig | null {
  const host = clean(env.SMTP_HOST);
  const user = clean(env.SMTP_USER);
  const pass = clean(env.SMTP_PASS);
  if (!host && !user && !pass) return null;

  const missing = [
    ["SMTP_HOST", host],
    ["SMTP_USER", user],
    ["SMTP_PASS", pass],
  ].filter(([, value]) => !value);
  if (missing.length > 0) {
    throw new Error(`${missing.map(([name]) => name).join(", ")} required when SMTP is configured`);
  }

  const rawPort = clean(env.SMTP_PORT);
  const port = rawPort ? Number(rawPort) : 465;
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("SMTP_PORT must be a port number (e.g. 465)");
  }

  return { host, port, secure: port === 465, user, pass, from: clean(env.SMTP_FROM) || user };
}
