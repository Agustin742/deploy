import { Suspense, type ReactNode } from "react";
import { redirect } from "next/navigation";
import { EMAIL_NOT_ALLOWED } from "@/features/access/domain/access-error";
import { SIGN_IN_PATH } from "@/features/auth/domain/route-guard";
import { getAccess } from "@/features/auth/infrastructure/session";

/** Session + allowlist gate. Runs per request (reads headers), so it sits inside Suspense with cache components. */
async function SessionGate({ children }: { children: ReactNode }) {
  const access = await getAccess();
  if (access.state === "anonymous") redirect(SIGN_IN_PATH);
  if (access.state === "denied") redirect(`${SIGN_IN_PATH}?error=${EMAIL_NOT_ALLOWED}`);
  return children;
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<p className="text-muted">Cargando…</p>}>
      <SessionGate>{children}</SessionGate>
    </Suspense>
  );
}
