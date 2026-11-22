import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { listAllowed } from "@/features/access/infrastructure/allowlist-repository";
import { readOwnerEmails } from "@/features/access/infrastructure/owner-env";
import { AccessAdminContainer } from "@/features/access/ui/access-admin-container";
import { APP_PATH } from "@/features/auth/domain/route-guard";
import { requireOwnerSession } from "@/features/auth/infrastructure/session";
import { getDb } from "@/shared/db/get-db";

export const metadata: Metadata = { title: "Accesos · Deploy your Career" };

export default async function AdminPage() {
  // Owners only; anyone else gets a plain 404 (the /app layout already required a signed-in, allowed user).
  if (!(await requireOwnerSession())) notFound();
  const rows = await listAllowed(getDb());
  return (
    <>
      <Link href={APP_PATH} className="text-sm text-muted hover:text-ink">
        ← Volver a la app
      </Link>
      <AccessAdminContainer
        owners={readOwnerEmails()}
        initialEmails={rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }))}
      />
    </>
  );
}
