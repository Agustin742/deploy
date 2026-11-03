"use client";

import { useState } from "react";
import { appStore, useAppStore } from "@/features/state/store/use-app-store";
import { todayIso } from "@/shared/lib/dates";
import { applyAppEdit } from "../domain/edit";
import { visibleApps } from "../domain/list";
import { applicationsUi, useApplicationsUi } from "../store/applications-ui";
import { ApplicationDrawer } from "./application-drawer";
import { ApplicationsView } from "./applications-view";

export interface ApplicationsTabProps {
  onNavigate: (tab: string) => void;
  onNotify: (message: string) => void;
}

export function ApplicationsTab({ onNavigate, onNotify }: ApplicationsTabProps) {
  const apps = useAppStore((s) => s.state.apps);
  const filter = useApplicationsUi((s) => s.filter);
  const q = useApplicationsUi((s) => s.q);
  const sort = useApplicationsUi((s) => s.sort);
  const [today] = useState(todayIso);
  const ui = applicationsUi.getState();

  return (
    <>
      <ApplicationsView
        apps={visibleApps(apps, { filter, q, sort })}
        total={apps.length}
        filter={filter}
        q={q}
        sort={sort}
        onFilter={ui.setFilter}
        onQuery={ui.setQ}
        onSort={ui.setSort}
        onOpen={ui.open}
        onStatus={(id, estado) =>
          appStore.getState().update((s) => applyAppEdit(s, id, "estado", estado), { immediate: true })
        }
        onNew={() => onNavigate("nueva")}
      />
      <ApplicationDrawer today={today} onNavigate={onNavigate} onNotify={onNotify} />
    </>
  );
}
