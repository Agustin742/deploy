"use client";

import { useState } from "react";
import { hasCv } from "@/features/matching/domain/engine";
import { appStore, useAppStore } from "@/features/state/store/use-app-store";
import { todayIso } from "@/shared/lib/dates";
import { parseGoal } from "../domain/goal";
import { computeSummary } from "../domain/summary";
import { SummaryView, type SummaryViewProps } from "./summary-view";

export function SummaryTab({ onNavigate }: Pick<SummaryViewProps, "onNavigate">) {
  const state = useAppStore((s) => s.state);
  const [today] = useState(todayIso);

  return (
    <SummaryView
      summary={computeSummary(state, today)}
      hasCv={hasCv(state.profile)}
      onNavigate={onNavigate}
      onGoalChange={(raw) => appStore.getState().update((s) => ({ ...s, ...parseGoal(raw) }))}
    />
  );
}
