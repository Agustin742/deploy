"use client";

import { useState, type ReactNode } from "react";
import { lastRed, redDiff } from "@/features/plan/domain/metrics";
import { RegistryContainer, addRegistryItem } from "@/features/registries/ui/registry-container";
import { useAppStore } from "@/features/state/store/use-app-store";
import { todayIso } from "@/shared/lib/dates";
import { Kpi, PageHead } from "@/shared/ui/primitives";
import { btnPrimary, kpiGrid } from "@/shared/ui/styles";

export interface NetworkViewProps {
  /** Connections and pages of the latest record, null while the record has none. */
  connections: string | null;
  pages: string | null;
  connectionsChange: string;
  pagesChange: string;
  onAdd: () => void;
  records: ReactNode;
}

export function NetworkView({
  connections,
  pages,
  connectionsChange,
  pagesChange,
  onAdd,
  records,
}: NetworkViewProps) {
  return (
    <>
      <PageHead
        title="Red"
        action={
          <button type="button" className={btnPrimary} onClick={onAdd}>
            + Nuevo registro
          </button>
        }
      >
        Registrá cada tanto el número de conexiones y de páginas.
      </PageHead>
      <div className={`${kpiGrid} mb-4`}>
        <Kpi value={connections ?? "—"} label="Conexiones (último registro)" />
        <Kpi value={pages ?? "—"} label="Páginas (último registro)" />
        <Kpi value={connectionsChange} label="Cambio de conexiones" />
        <Kpi value={pagesChange} label="Cambio de páginas" />
      </div>
      {records}
    </>
  );
}

export function NetworkTab() {
  const state = useAppStore((s) => s.state);
  const [today] = useState(todayIso);
  const last = lastRed(state);

  return (
    <NetworkView
      connections={last && last.conexiones !== "" ? last.conexiones : null}
      pages={last && last.paginas !== "" ? last.paginas : null}
      connectionsChange={redDiff(state, "conexiones")}
      pagesChange={redDiff(state, "paginas")}
      onAdd={() => addRegistryItem("red", today)}
      records={<RegistryContainer registry="red" today={today} />}
    />
  );
}
