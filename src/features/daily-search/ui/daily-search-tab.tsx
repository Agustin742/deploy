"use client";

import { useState } from "react";
import { appStore, useAppStore } from "@/features/state/store/use-app-store";
import { todayIso } from "@/shared/lib/dates";
import {
  addPlatform,
  markAllToday,
  monthView,
  removePlatform,
  resetPlatforms,
  shiftMonth,
  toggleCheck,
  updatePlatform,
  type PlatformResult,
} from "../domain/daily-search";
import { dailySearchUi, useDailySearchUi } from "../store/daily-search-ui";
import { DailySearchView } from "./daily-search-view";

export interface DailySearchTabProps {
  onNotify: (message: string) => void;
  /** Today (YYYY-MM-DD); defaults to the current date. */
  today?: string;
}

export function DailySearchTab({ onNotify, today: todayProp }: DailySearchTabProps) {
  const state = useAppStore((s) => s.state);
  const monthOverride = useDailySearchUi((s) => s.month);
  const editId = useDailySearchUi((s) => s.editId);
  const deleteId = useDailySearchUi((s) => s.deleteId);
  const [defaultToday] = useState(todayIso);
  const today = todayProp ?? defaultToday;
  const month = monthOverride ?? today.slice(0, 7);
  const ui = dailySearchUi.getState();
  const update = appStore.getState().update;

  /** Applies a platform edit that may be refused with a message. */
  const apply = (result: PlatformResult): boolean => {
    if (result.message) onNotify(result.message);
    if (!result.ok) return false;
    update(() => result.state, { immediate: true });
    ui.clearRow();
    return true;
  };

  return (
    <DailySearchView
      month={month}
      view={monthView(state, month, today)}
      editId={editId}
      deleteId={deleteId}
      onToggle={(id, day) => update((s) => toggleCheck(s, month, id, day), { immediate: true })}
      onMarkAll={() => update((s) => markAllToday(s, month, Number(today.slice(8))), { immediate: true })}
      onShiftMonth={(delta) => ui.setMonth(shiftMonth(month, delta))}
      onEdit={ui.edit}
      onAskDelete={ui.askDelete}
      onCancelRow={ui.clearRow}
      onSave={(id, name, url) => void apply(updatePlatform(appStore.getState().state, id, name, url))}
      onDelete={(id) => {
        update((s) => removePlatform(s, id), { immediate: true });
        ui.clearRow();
        onNotify("Página quitada");
      }}
      onAdd={(name, url) => apply(addPlatform(appStore.getState().state, name, url))}
      onReset={() => {
        const r = resetPlatforms(appStore.getState().state);
        update(() => r.state, { immediate: true });
        onNotify(r.message);
      }}
    />
  );
}
