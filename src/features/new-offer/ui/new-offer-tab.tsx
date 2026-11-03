"use client";

import { useState } from "react";
import { sources } from "@/features/applications/domain/applications";
import { computeMatch } from "@/features/matching/domain/engine";
import { appStore, useAppStore } from "@/features/state/store/use-app-store";
import { todayIso } from "@/shared/lib/dates";
import { useDebouncedValue } from "@/shared/lib/use-debounced-value";
import { clearDraft, fillExample, saveDraft, setDraftField } from "../domain/draft";
import { NewOfferView } from "./new-offer-view";

const MATCH_DEBOUNCE_MS = 250;

export interface NewOfferTabProps {
  onNavigate: (tab: string) => void;
  onNotify: (message: string) => void;
  /** Called with the id of the application just created (the shell opens it). */
  onSaved: (id: string) => void;
}

export function NewOfferTab({ onNavigate, onNotify, onSaved }: NewOfferTabProps) {
  const draft = useAppStore((s) => s.state.draft);
  const profile = useAppStore((s) => s.state.profile);
  const platforms = useAppStore((s) => s.state.platforms);
  const [today] = useState(todayIso);
  const jd = useDebouncedValue(draft.jd, MATCH_DEBOUNCE_MS);
  const update = appStore.getState().update;

  return (
    <NewOfferView
      draft={draft}
      sources={sources(platforms)}
      match={computeMatch(jd, profile, today)}
      onField={(key, value, immediate) => update((s) => setDraftField(s, key, value), { immediate })}
      onExample={() => update(fillExample, { immediate: true })}
      onClear={() => update(clearDraft, { immediate: true })}
      onSave={() => {
        const result = saveDraft(appStore.getState().state, today);
        if (!result.ok) {
          onNotify(result.message);
          return;
        }
        update(() => result.state, { immediate: true });
        onSaved(result.appId);
        onNotify("Postulación guardada");
      }}
      onGoCv={() => onNavigate("cv")}
    />
  );
}
