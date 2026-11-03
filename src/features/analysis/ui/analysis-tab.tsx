"use client";

import { hasCv } from "@/features/matching/domain/engine";
import { useAppStore } from "@/features/state/store/use-app-store";
import { analyze } from "../domain/analysis";
import { AnalysisView } from "./analysis-view";

export function AnalysisTab({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const apps = useAppStore((s) => s.state.apps);
  const profile = useAppStore((s) => s.state.profile);
  const analysis = analyze(apps);

  return (
    <AnalysisView
      analysis={analysis}
      withoutMatch={apps.length - (analysis?.analyzed ?? 0)}
      hasCv={hasCv(profile)}
      onNavigate={onNavigate}
    />
  );
}
