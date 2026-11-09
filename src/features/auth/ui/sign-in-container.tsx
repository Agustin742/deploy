"use client";

import { useState } from "react";
import { APP_PATH } from "../domain/route-guard";
import { authClient } from "./auth-client";
import { SignInView, type SignInStatus } from "./sign-in-view";

export function SignInContainer({ googleEnabled }: { googleEnabled: boolean }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<SignInStatus>("idle");

  const requestLink = async () => {
    const address = email.trim();
    if (!address || status === "sending") return;
    setStatus("sending");
    try {
      const { error } = await authClient.signIn.magicLink({ email: address, callbackURL: APP_PATH });
      setStatus(error ? "error" : "sent");
    } catch {
      setStatus("error");
    }
  };

  const withGoogle = () => {
    void authClient.signIn.social({ provider: "google", callbackURL: APP_PATH });
  };

  return (
    <SignInView
      email={email}
      status={status}
      googleEnabled={googleEnabled}
      onEmailChange={(value) => {
        setEmail(value);
        if (status === "error") setStatus("idle");
      }}
      onSubmit={requestLink}
      onGoogle={withGoogle}
    />
  );
}
