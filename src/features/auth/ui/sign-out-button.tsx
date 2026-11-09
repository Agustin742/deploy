"use client";

import { useState } from "react";
import { btn } from "@/shared/ui/styles";
import { SIGN_IN_PATH } from "../domain/route-guard";
import { authClient } from "./auth-client";

export interface SignOutButtonProps {
  /** Injectable for tests. */
  signOut?: () => Promise<unknown>;
  goTo?: (path: string) => void;
}

export function SignOutButton({
  signOut = () => authClient.signOut(),
  // A full navigation also drops any client-side state of the previous session.
  goTo = (path) => window.location.assign(path),
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
    <button type="button" className={btn} disabled={busy} onClick={onClick}>
      Salir
    </button>
  );
}
