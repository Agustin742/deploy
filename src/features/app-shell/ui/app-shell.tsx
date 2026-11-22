"use client";

import { useEffect } from "react";
import { AnalysisTab } from "@/features/analysis/ui/analysis-tab";
import { ApplicationsTab } from "@/features/applications/ui/applications-tab";
import { applicationsUi } from "@/features/applications/store/applications-ui";
import { CvTab } from "@/features/cv/ui/cv-tab";
import { DailySearchTab } from "@/features/daily-search/ui/daily-search-tab";
import { EmployersTab } from "@/features/employers/ui/employers-tab";
import { ExperimentsTab } from "@/features/experiments/ui/experiments-tab";
import { NewOfferTab } from "@/features/new-offer/ui/new-offer-tab";
import { NetworkTab } from "@/features/network/ui/network-tab";
import { PlanTab } from "@/features/plan/ui/plan-tab";
import { appStore, useAppStore } from "@/features/state/store/use-app-store";
import { SummaryTab } from "@/features/summary/ui/summary-tab";
import { VisibilityTab } from "@/features/visibility/ui/visibility-tab";
import { SiteFooter } from "@/shared/ui/site-footer";
import { useMediaQuery } from "@/shared/lib/use-media-query";
import { btn } from "@/shared/ui/styles";
import {
  initialsOf,
  isTabId,
  MOBILE_TAB_IDS,
  mobileMoreTabs,
  moreTabs,
  primaryTabs,
  resolveTab,
  whoLine,
  type TabId,
} from "../domain/tabs";
import { shellUi, useShellUi } from "../store/ui-store";
import { AppHeader, type HeaderNav } from "./app-header";
import { AppSkeleton } from "./app-skeleton";
import { MobileNav } from "./mobile-nav";

export function AppShell({ isOwner = false }: { isOwner?: boolean }) {
  const loaded = useAppStore((s) => s.loaded);
  const status = useAppStore((s) => s.status);
  const mods = useAppStore((s) => s.state.mods);
  const profile = useAppStore((s) => s.state.profile);
  const storedTab = useShellUi((s) => s.tab);
  const planWeek = useShellUi((s) => s.planWeek);
  const toast = useShellUi((s) => s.toast);

  // The state lives on the server, per account. It is read once after mount (the server render never has it)
  // and the edits still waiting are sent when the page is hidden or closed.
  useEffect(() => {
    void appStore.getState().load();
    const flush = () => void appStore.getState().flush();
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", flush);
    };
  }, []);

  const wide = useMediaQuery("(min-width: 768px)");
  const nav: HeaderNav | null = loaded ? { primary: primaryTabs(mods), more: moreTabs(mods) } : null;
  const mobileItems = nav ? nav.primary.filter((t) => MOBILE_TAB_IDS.includes(t.id)) : [];
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
      case "cv":
        return <CvTab onNotify={notify} />;
    }
  };

  return (
    <div className="min-h-screen pb-24 md:pb-12">
      <AppHeader
        who={loaded ? whoLine(profile) : ""}
        initials={loaded ? initialsOf(profile.name) : ""}
        nav={nav}
        active={active}
        onSelect={go}
        onNewApplication={() => go("nueva")}
        wide={wide}
        isOwner={isOwner}
      />
      <div className="mx-auto max-w-[1180px] px-4">
        <main aria-busy={!loaded && status !== "error"}>
          {loaded ? (
            panel()
          ) : status === "error" ? (
            <div role="alert" className="text-muted">
              <p>No pudimos cargar tus datos.</p>
              <button type="button" className={`${btn} mt-2`} onClick={() => void appStore.getState().load()}>
                Reintentar
              </button>
            </div>
          ) : (
            <AppSkeleton />
          )}
        </main>
        <SiteFooter />
      </div>
      {!wide && nav ? (
        <MobileNav
          items={mobileItems}
          more={mobileMoreTabs(mods).map(({ id, label }) => ({ id, label }))}
          active={active}
          onSelect={go}
          onNewApplication={() => go("nueva")}
        />
      ) : null}
      {toast ? (
        <div
          role="status"
          className="fixed bottom-24 left-1/2 z-40 max-w-[calc(100%-32px)] -translate-x-1/2 rounded-control bg-ink px-4 py-2.5 text-small text-bg md:bottom-6"
        >
          {toast}
        </div>
      ) : null}
    </div>
  );
}
