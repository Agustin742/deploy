import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { EMAIL_NOT_ALLOWED } from "@/features/access/domain/access-error";
import { APP_PATH } from "@/features/auth/domain/route-guard";
import { isGoogleEnabled } from "@/features/auth/infrastructure/auth";
import { getAccess } from "@/features/auth/infrastructure/session";
import { SignInContainer } from "@/features/auth/ui/sign-in-container";

export const metadata: Metadata = { title: "Ingresar · Deploy your Career" };

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

/** Allowed visitors skip the form. Reads the session, the error param and env per request. */
async function SignIn({ searchParams }: { searchParams: SearchParams }) {
  const access = await getAccess();
  if (access.state === "allowed") redirect(APP_PATH);
  const { error } = await searchParams;
  // A removed user still has a session cookie: show them the same "no access" message.
  const noAccess = access.state === "denied" || error === EMAIL_NOT_ALLOWED;
  return <SignInContainer googleEnabled={isGoogleEnabled()} initialNoAccess={noAccess} />;
}

export default function SignInPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<p className="pt-16 text-center text-muted">Cargando…</p>}>
      <SignIn searchParams={searchParams} />
    </Suspense>
  );
}
