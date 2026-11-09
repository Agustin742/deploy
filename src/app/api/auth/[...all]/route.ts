import { toNextJsHandler } from "better-auth/next-js";
import { getAuth } from "@/features/auth/infrastructure/auth";

// The auth instance is created lazily per request so the build never needs the env.
export function GET(request: Request) {
  return toNextJsHandler(getAuth()).GET(request);
}

export function POST(request: Request) {
  return toNextJsHandler(getAuth()).POST(request);
}
