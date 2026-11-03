import type { ReactNode } from "react";
import { BarRow, EmptyState, Kpi, PageHead } from "@/shared/ui/primitives";
import { btn, btnPrimary, gridTwo, kpiGrid, panel, row } from "@/shared/ui/styles";
import type { Analysis } from "../domain/analysis";

const HEAD = "Inglés pedido y herramientas que más te faltan, sobre todas tus ofertas.";

export interface AnalysisViewProps {
  /** Null while no offer has a computed match. */
  analysis: Analysis | null;
  /** Offers without a match, shown in the empty state. */
  withoutMatch: number;
  hasCv: boolean;
  onNavigate: (tab: string) => void;
}

function Panel({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <div className={panel}>
      <h3 className="text-base font-bold">{title}</h3>
      {hint ? <p className="mb-2 mt-0.5 text-xs text-muted">{hint}</p> : null}
      {children}
    </div>
  );
}

export function AnalysisView({ analysis: a, withoutMatch, hasCv, onNavigate }: AnalysisViewProps) {
  if (!a) {
    return (
      <>
        <PageHead title="Análisis">{HEAD}</PageHead>
        <EmptyState title="Todavía no hay ofertas analizadas">
          Cada oferta necesita su descripción pegada y tu CV cargado.
          {withoutMatch ? ` Tenés ${withoutMatch} sin descripción.` : ""}
          <div className={`${row} mt-3.5 justify-center`}>
            <button type="button" className={btnPrimary} onClick={() => onNavigate("postulaciones")}>
              Ir a postulaciones
            </button>
            {hasCv ? null : (
              <button type="button" className={btn} onClick={() => onNavigate("cv")}>
                Cargar mi CV
              </button>
            )}
          </div>
        </EmptyState>
      </>
    );
  }

  const { english: eng } = a;
  const topCount = Math.max(1, ...a.topMissing.map((x) => x[1]));
  const reqMax = a.requested[0]?.count ?? 1;

  return (
    <>
      <PageHead title="Análisis">
        Sobre {a.analyzed} ofertas con descripción{a.withoutMatch ? ` · ${a.withoutMatch} sin descripción no cuentan` : ""}.
      </PageHead>
      <div className={kpiGrid}>
        <Kpi
          value={
            <>
              {eng.asking}
              <span className="text-base text-muted"> / {a.analyzed}</span>
            </>
          }
          label={`Piden inglés (${eng.askingPct}%)`}
        />
        <Kpi value={eng.asking ? `${eng.met} / ${eng.asking}` : "—"} label="Inglés que cumplís" />
        <Kpi value={a.topMissingName ?? "—"} label="Skill que más te falta" />
        <Kpi value={`${a.avgPct}%`} label="Match promedio" />
      </div>
      <div className={`${gridTwo} mt-4`}>
        <Panel title="Nivel de inglés pedido" hint={`Sobre las ${eng.asking} ofertas que lo piden`}>
          {eng.levels.map(([label, count]) => (
            <BarRow key={label} label={label} pct={eng.asking ? (count / eng.asking) * 100 : 0} value={count} />
          ))}
          <BarRow label="No piden" pct={(eng.notAsking / a.analyzed) * 100} value={eng.notAsking} tone="neutral" />
        </Panel>
        <Panel title="Herramientas que más te faltan" hint="En cuántas ofertas aparecen y no están en tu CV">
          {a.topMissing.length ? (
            a.topMissing.map(([skill, count]) => (
              <BarRow key={skill} label={skill} title={skill} pct={(count / topCount) * 100} value={count} tone="bad" />
            ))
          ) : (
            <p className="text-muted">No te falta ninguna skill reconocida.</p>
          )}
        </Panel>
        <Panel title="Lo que más piden" hint="Verde: ya lo tenés · rojo: te falta">
          {a.requested.map((r) => (
            <BarRow key={r.skill} label={r.skill} title={r.skill} pct={(r.count / reqMax) * 100} value={r.count} tone={r.have ? "ok" : "bad"} />
          ))}
        </Panel>
      </div>
    </>
  );
}
