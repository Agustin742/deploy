import { getAccess } from "@/features/auth/infrastructure/session";
import { AppShell } from "@/features/app-shell/ui/app-shell";

export default async function AppPage() {
  const access = await getAccess();
  // Only decides whether the owner link is shown; the admin route and its actions re-check ownership on the server.
  return <AppShell isOwner={access.state === "allowed" && access.isOwner} />;
}
