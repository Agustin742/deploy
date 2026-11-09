export interface GoogleCredentials {
  clientId: string;
  clientSecret: string;
}

export interface AuthEnv {
  secret: string;
  baseURL: string;
  /** Null when Google sign-in is not configured: the app runs without it. */
  google: GoogleCredentials | null;
}

const MIN_SECRET_LENGTH = 32;

const clean = (value: string | undefined): string => value?.trim() ?? "";

/**
 * Validates the auth environment. Plain validator on purpose (no schema library in the project).
 * Google credentials are optional but all-or-nothing: a half-configured provider is a mistake.
 */
export function readAuthEnv(env: Record<string, string | undefined> = process.env): AuthEnv {
  const secret = clean(env.BETTER_AUTH_SECRET);
  if (secret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `BETTER_AUTH_SECRET is required and must be at least ${MIN_SECRET_LENGTH} characters (generate one with: openssl rand -base64 32)`,
    );
  }

  const baseURL = clean(env.BETTER_AUTH_URL);
  let url: URL | null = null;
  try {
    url = new URL(baseURL);
  } catch {
    // handled below
  }
  if (!url || (url.protocol !== "http:" && url.protocol !== "https:")) {
    throw new Error("BETTER_AUTH_URL is required and must be an http(s) URL (e.g. http://localhost:3000)");
  }

  const clientId = clean(env.GOOGLE_CLIENT_ID);
  const clientSecret = clean(env.GOOGLE_CLIENT_SECRET);
  if (clientId && !clientSecret) throw new Error("GOOGLE_CLIENT_SECRET is required when GOOGLE_CLIENT_ID is set");
  if (clientSecret && !clientId) throw new Error("GOOGLE_CLIENT_ID is required when GOOGLE_CLIENT_SECRET is set");

  return {
    secret,
    baseURL: url.origin + url.pathname.replace(/\/$/, ""),
    google: clientId && clientSecret ? { clientId, clientSecret } : null,
  };
}
