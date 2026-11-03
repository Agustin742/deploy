"use client";

import { useEffect, useMemo, useState } from "react";
import { computeMatch, hasCv } from "@/features/matching/domain/engine";
import { buildPrompt } from "@/features/matching/domain/prompt";
import { appStore, useAppStore } from "@/features/state/store/use-app-store";
import { debounce } from "@/shared/lib/debounce";
import { copyToClipboard } from "@/shared/lib/clipboard";
import { sources } from "../domain/applications";
import { addInterview, applyAppEdit, recalcOne, refreshMatchFromJd, removeApp, removeInterview } from "../domain/edit";
import { applicationsUi, useApplicationsUi } from "../store/applications-ui";
import { ApplicationDrawerView } from "./application-drawer-view";

const JD_RECALC_MS = 350;
const MIN_JD_LENGTH = 40;

export interface ApplicationDrawerProps {
  today: string;
  onNavigate: (tab: string) => void;
  onNotify: (message: string) => void;
}

/** Detail of the open application: reads the store, writes every edit back. */
export function ApplicationDrawer({ today, onNavigate, onNotify }: ApplicationDrawerProps) {
  const openId = useApplicationsUi((s) => s.openId);
  const confirmDel = useApplicationsUi((s) => s.confirmDel);
  const aiAskId = useApplicationsUi((s) => s.aiAskId);
  const app = useAppStore((s) => s.state.apps.find((a) => a.id === openId));
  const profile = useAppStore((s) => s.state.profile);
  const platforms = useAppStore((s) => s.state.platforms);
  const iaModule = useAppStore((s) => s.state.mods.ia);
  const [fallback, setFallback] = useState<{ id: string; text: string } | null>(null);

  const ui = applicationsUi.getState();
  const update = appStore.getState().update;

  const recalcSoon = useMemo(
    () =>
      debounce((id: string) => update((s) => refreshMatchFromJd(s, id, today), { immediate: true }), JD_RECALC_MS),
    [update, today],
  );

  useEffect(() => {
    if (!openId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") applicationsUi.getState().close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [openId]);

  if (!openId || !app) return null;

  const copy = async (text: string, okMessage: string) => {
    if (await copyToClipboard(text)) {
      setFallback(null);
      onNotify(okMessage);
    } else {
      setFallback({ id: app.id, text });
      onNotify("No se pudo copiar solo. El texto quedó seleccionado para que lo copies.");
    }
  };

  return (
    <>
      <div data-testid="drawer-overlay" className="fixed inset-0 z-20 bg-[rgba(10,16,22,0.5)]" onClick={ui.close} />
      <aside
        aria-label="Detalle de postulación"
        className="fixed bottom-0 right-0 top-0 z-[21] w-[min(620px,100%)] overflow-y-auto bg-bg p-4 pb-8 shadow-[var(--shadow)]"
      >
        <ApplicationDrawerView
          app={app}
          match={app.match ?? computeMatch(app.jd ?? "", profile, today)}
          sources={sources(platforms)}
          iaModule={iaModule}
          aiAsk={aiAskId === app.id}
          shareName={profile.shareName}
          confirmDel={confirmDel}
          fallbackText={fallback?.id === app.id ? fallback.text : null}
          onField={(path, value, immediate) => {
            update((s) => applyAppEdit(s, app.id, path, value), { immediate });
            if (path === "jd") recalcSoon(app.id);
          }}
          onClose={ui.close}
          onRecalc={() => {
            update((s) => recalcOne(s, app.id, today), { immediate: true });
            onNotify("Match actualizado");
          }}
          onCopyPrompt={() => {
            if ((app.jd ?? "").trim().length < MIN_JD_LENGTH) return onNotify("Pegá primero la descripción del puesto");
            if (!hasCv(profile)) return onNotify("Cargá tu CV en la pestaña Mi CV");
            applicationsUi.getState().setAiAsk(app.id);
          }}
          onAiGo={() => {
            applicationsUi.getState().setAiAsk(null);
            void copy(buildPrompt(app, profile), "Prompt copiado. Pegalo solo en la IA que elijas.");
          }}
          onAiNo={() => applicationsUi.getState().setAiAsk(null)}
          onCopyReport={() => void copy(app.report, "Informe copiado")}
          onAddInterview={() => update((s) => addInterview(s, app.id, today), { immediate: true })}
          onRemoveInterview={(eid) => update((s) => removeInterview(s, app.id, eid), { immediate: true })}
          onDelAsk={() => applicationsUi.getState().setConfirmDel(true)}
          onDelNo={() => applicationsUi.getState().setConfirmDel(false)}
          onDelYes={() => {
            update((s) => removeApp(s, app.id), { immediate: true });
            applicationsUi.getState().close();
            onNotify("Postulación eliminada");
          }}
          onGoCv={() => onNavigate("cv")}
        />
      </aside>
    </>
  );
}
