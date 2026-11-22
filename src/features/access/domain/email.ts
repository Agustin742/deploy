/** Canonical form of an email for comparing and storing: trimmed and lowercase. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Longest address the `allowed_emails` primary key (and the `user.email` column) can hold. */
export const MAX_EMAIL_LENGTH = 255;

const EMAIL_SHAPE = /^[^\s@]+@[^\s@.][^\s@]*\.[^\s@.]+$/;

/** Pragmatic shape check (something@domain.tld). Real ownership is proven by the sign-in itself. */
export function isValidEmail(email: string): boolean {
  const normalized = normalizeEmail(email);
  return normalized.length <= MAX_EMAIL_LENGTH && EMAIL_SHAPE.test(normalized);
}

/** Parses a comma/semicolon/whitespace separated list of emails (the `OWNER_EMAILS` format), normalized and de-duplicated. */
export function parseEmailList(raw: string | undefined): string[] {
  const items = (raw ?? "")
    .split(/[,;\s]+/)
    .map(normalizeEmail)
    .filter((item) => item !== "");
  return [...new Set(items)];
}
