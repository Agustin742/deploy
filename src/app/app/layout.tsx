import { Suspense, type ReactNode } from "react";
import { redirect } from "next/navigation";
import { SIGN_IN_PATH } from "@/features/auth/domain/route-guard";
import { getSession } from "@/features/auth/infrastructure/session";

/** Session gate. Runs per request (reads headers), so it sits inside Suspense with cache components. */
async function SessionGate({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) redirect(SIGN_IN_PATH);
  return children;
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<p className="text-muted">Cargando…</p>}>
      <SessionGate>{children}</SessionGate>
    </Suspense>
  );
}
