"use client";

import { useState } from "react";
import { menuItemClass } from "@/shared/ui/menu";
import { btn } from "@/shared/ui/styles";
import { SIGN_IN_PATH } from "../domain/route-guard";
import { authClient } from "./auth-client";

export interface SignOutButtonProps {
  /** Injectable for tests. */
  signOut?: () => Promise<unknown>;
  goTo?: (path: string) => void;
  /** "menuitem" renders a row of the account menu. */
  variant?: "button" | "menuitem";
}

export function SignOutButton({
  signOut = () => authClient.signOut(),
  // A full navigation also drops any client-side state of the previous session.
  goTo = (path) => window.location.assign(path),
  variant = "button",
}: SignOutButtonProps) {
  const [busy, setBusy] = useState(false);

  const onClick = async () => {
    setBusy(true);
    try {
      await signOut();
      goTo(SIGN_IN_PATH);
    } catch {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      role={variant === "menuitem" ? "menuitem" : undefined}
      tabIndex={variant === "menuitem" ? -1 : undefined}
      className={variant === "menuitem" ? `${menuItemClass} text-bad` : btn}
      disabled={busy}
      aria-busy={busy || undefined}
      onClick={onClick}
    >
      Salir
    </button>
  );
}
