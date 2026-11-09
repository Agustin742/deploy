export const SIGN_IN_PATH = "/ingresar";
export const APP_PATH = "/app";

/** The signed-in area: /app and everything below it. */
export function isProtectedPath(pathname: string): boolean {
  return pathname === APP_PATH || pathname.startsWith(`${APP_PATH}/`);
}

/**
 * Optimistic gate used by the proxy: only checks that a session cookie exists.
 * It is a UX shortcut, not a security boundary: the real session is validated on the server.
 * Returns the path to redirect to, or null to let the request through.
 */
export function proxyRedirect(pathname: string, hasSessionCookie: boolean): string | null {
  return isProtectedPath(pathname) && !hasSessionCookie ? SIGN_IN_PATH : null;
}
