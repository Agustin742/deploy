"use client";

import { useState } from "react";
import type { AdminError, AdminResult, AllowedEmailView } from "../domain/allowed-email-view";
import { addAllowedEmail, removeAllowedEmail } from "../infrastructure/admin-actions";
import { AccessAdminView } from "./access-admin-view";

export interface AccessAdminContainerProps {
  owners: string[];
  initialEmails: AllowedEmailView[];
}

export function AccessAdminContainer({ owners, initialEmails }: AccessAdminContainerProps) {
  const [emails, setEmails] = useState(initialEmails);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<AdminError | null>(null);

  const run = async (action: () => Promise<AdminResult>, onSuccess?: () => void) => {
    setBusy(true);
    setError(null);
    try {
      const result = await action();
      if (result.ok) {
        setEmails(result.emails);
        onSuccess?.();
      } else {
        setError(result.error);
      }
    } catch {
      setError("failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AccessAdminView
      owners={owners}
      emails={emails}
      draft={draft}
      busy={busy}
      error={error}
      onDraftChange={(value) => {
        setDraft(value);
        setError(null);
      }}
      onAdd={() => {
        if (draft.trim() && !busy) void run(() => addAllowedEmail(draft), () => setDraft(""));
      }}
      onRemove={(email) => {
        if (!busy) void run(() => removeAllowedEmail(email));
      }}
    />
  );
}
