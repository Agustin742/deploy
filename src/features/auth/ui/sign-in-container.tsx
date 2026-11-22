"use client";

import { useState } from "react";
import { EMAIL_NOT_ALLOWED } from "@/features/access/domain/access-error";
import { APP_PATH, SIGN_IN_PATH } from "../domain/route-guard";
import { authClient } from "./auth-client";
import { SignInView, type SignInStatus } from "./sign-in-view";

export interface SignInContainerProps {
  googleEnabled: boolean;
  /** The page was reached after a rejected sign-in (Google error redirect) or a revoked session. */
  initialNoAccess?: boolean;
}

export function SignInContainer({ googleEnabled, initialNoAccess = false }: SignInContainerProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<SignInStatus>(initialNoAccess ? "noAccess" : "idle");

  const requestLink = async () => {
    const address = email.trim();
    if (!address || status === "sending") return;
    setStatus("sending");
    try {
      const { error } = await authClient.signIn.magicLink({ email: address, callbackURL: APP_PATH });
      setStatus(error ? (error.code === EMAIL_NOT_ALLOWED ? "noAccess" : "error") : "sent");
    } catch {
      setStatus("error");
    }
  };

  const withGoogle = () => {
    void authClient.signIn.social({ provider: "google", callbackURL: APP_PATH, errorCallbackURL: SIGN_IN_PATH });
  };

  return (
    <SignInView
      email={email}
      status={status}
      googleEnabled={googleEnabled}
      onEmailChange={(value) => {
        setEmail(value);
        if (status === "error" || status === "noAccess") setStatus("idle");
      }}
      onSubmit={requestLink}
      onGoogle={withGoogle}
    />
  );
}
