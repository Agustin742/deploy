import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";
import { proxyRedirect } from "@/features/auth/domain/route-guard";

/** Optimistic check only (cookie presence). The real session check lives in the /app layout and server actions. */
export function proxy(request: NextRequest) {
  const target = proxyRedirect(request.nextUrl.pathname, getSessionCookie(request) !== null);
  return target ? NextResponse.redirect(new URL(target, request.url)) : NextResponse.next();
}

export const config = {
  matcher: ["/app", "/app/:path*"],
};
