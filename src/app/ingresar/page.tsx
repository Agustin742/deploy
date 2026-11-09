import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { APP_PATH } from "@/features/auth/domain/route-guard";
import { isGoogleEnabled } from "@/features/auth/infrastructure/auth";
import { getSession } from "@/features/auth/infrastructure/session";
import { SignInContainer } from "@/features/auth/ui/sign-in-container";

export const metadata: Metadata = { title: "Ingresar · Deploy your Career" };

/** Signed-in visitors skip the form. Reads the session and env per request. */
async function SignIn() {
  if (await getSession()) redirect(APP_PATH);
  return <SignInContainer googleEnabled={isGoogleEnabled()} />;
}

export default function SignInPage() {
  return (
    <Suspense fallback={<p className="pt-16 text-center text-muted">Cargando…</p>}>
      <SignIn />
    </Suspense>
  );
}
