"use client";

import { useEffect } from "react";
import { AnalysisTab } from "@/features/analysis/ui/analysis-tab";
import { ApplicationsTab } from "@/features/applications/ui/applications-tab";
import { applicationsUi } from "@/features/applications/store/applications-ui";
import { DailySearchTab } from "@/features/daily-search/ui/daily-search-tab";
import { EmployersTab } from "@/features/employers/ui/employers-tab";
import { ExperimentsTab } from "@/features/experiments/ui/experiments-tab";
import { NewOfferTab } from "@/features/new-offer/ui/new-offer-tab";
import { NetworkTab } from "@/features/network/ui/network-tab";
import { PlanTab } from "@/features/plan/ui/plan-tab";
import { appStore, useAppStore } from "@/features/state/store/use-app-store";
import { SummaryTab } from "@/features/summary/ui/summary-tab";
import { VisibilityTab } from "@/features/visibility/ui/visibility-tab";
import { EmptyState } from "@/shared/ui/primitives";
import { SiteFooter } from "@/shared/ui/site-footer";
import { isTabId, resolveTab, tabCount, visibleTabs, whoLine, type TabId } from "../domain/tabs";
import { shellUi, useShellUi } from "../store/ui-store";
import { AppHeader } from "./app-header";

/** Tabs that belong to a later migration task: the bar keeps its structure, the panel is a stub. */
function ComingSoon({ label }: { label: string }) {
  return (
    <EmptyState title="Próximamente">
      La sección «{label}» todavía no está disponible en esta versión.
    </EmptyState>
  );
}

export function AppShell() {
  const loaded = useAppStore((s) => s.loaded);
  const mods = useAppStore((s) => s.state.mods);
  const profile = useAppStore((s) => s.state.profile);
  const appCount = useAppStore((s) => s.state.apps.length);
  const storedTab = useShellUi((s) => s.tab);
  const planWeek = useShellUi((s) => s.planWeek);
  const toast = useShellUi((s) => s.toast);

  // The state lives in localStorage: read it once after mount so the server render matches the first client render.
  useEffect(() => {
    appStore.getState().load();
  }, []);

  const tabs = loaded ? visibleTabs(mods) : null;
  const active = resolveTab(storedTab, mods);

  const go = (tab: TabId) => {
    shellUi.getState().setTab(tab);
    applicationsUi.getState().close();
    window.scrollTo(0, 0);
  };
  const navigate = (tab: string) => {
    if (isTabId(tab)) go(tab);
  };

  const notify = (message: string) => shellUi.getState().showToast(message);

  const panel = () => {
    switch (active) {
      case "resumen":
        return <SummaryTab onNavigate={navigate} />;
      case "plan":
        return (
          <PlanTab
            planWeek={planWeek}
            onPlanWeekChange={(w) => shellUi.getState().setPlanWeek(w)}
            onNavigate={navigate}
            onNotify={(m) => shellUi.getState().showToast(m)}
          />
        );
      case "postulaciones":
        return <ApplicationsTab onNavigate={navigate} onNotify={notify} />;
      case "nueva":
        return (
          <NewOfferTab
            onNavigate={navigate}
            onNotify={notify}
            onSaved={(id) => {
              go("postulaciones");
              applicationsUi.getState().open(id);
            }}
          />
        );
      case "red":
        return <NetworkTab />;
      case "visibilidad":
        return <VisibilityTab />;
      case "empleadores":
        return <EmployersTab />;
      case "experimentos":
        return <ExperimentsTab />;
      case "analisis":
        return <AnalysisTab onNavigate={navigate} />;
      case "busqueda":
        return <DailySearchTab onNotify={notify} />;
      default:
        return <ComingSoon label={visibleTabs(mods).find((t) => t.id === active)?.label ?? ""} />;
    }
  };

  return (
    <div className="mx-auto max-w-[1180px]">
      <AppHeader
        who={loaded ? whoLine(profile) : ""}
        tabs={tabs?.map((t) => ({ ...t, count: tabCount(t.id, appCount) })) ?? null}
        active={active}
        onSelect={go}
      />
      <main aria-busy={!loaded}>{loaded ? panel() : <p className="text-muted">Cargando…</p>}</main>
      <SiteFooter />
      {toast ? (
        <div
          role="status"
          className="fixed bottom-5 left-1/2 z-40 max-w-[calc(100%-32px)] -translate-x-1/2 rounded-lg bg-ink px-4 py-[9px] text-[13px] text-bg"
        >
          {toast}
        </div>
      ) : null}
    </div>
  );
}
