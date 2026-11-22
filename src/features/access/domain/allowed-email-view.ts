/** An allowlist entry as the admin UI sees it (serializable: dates travel as ISO strings). */
export interface AllowedEmailView {
  email: string;
  addedBy: string | null;
  createdAt: string;
}

export type AdminError = "forbidden" | "invalid_email" | "failed";

export type AdminResult = { ok: true; emails: AllowedEmailView[] } | { ok: false; error: AdminError };
