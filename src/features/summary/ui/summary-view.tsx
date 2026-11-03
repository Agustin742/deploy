import { MIN_SEMANAL } from "@/features/plan/domain/metrics";
import { MESES } from "@/shared/lib/dates";
import { Bar, BarRow, EmptyState, Kpi, PageHead } from "@/shared/ui/primitives";
import { btn, btnPrimary, gridTwo, input, kpiGrid, panel, row } from "@/shared/ui/styles";
import type { Summary } from "../domain/summary";

export interface SummaryViewProps {
  summary: Summary;
  hasCv: boolean;
  onNavigate: (tab: "nueva" | "plan" | "cv" | "busqueda") => void;
  onGoalChange: (raw: string) => void;
}

const heading = "text-base font-bold";

export function SummaryView({ summary: s, hasCv, onNavigate, onGoalChange }: SummaryViewProps) {
  const weekRows: [string, string | number][] = [
    ["Publicaciones o participaciones", `${s.week.posts} de ${MIN_SEMANAL}`],
    ["Postulaciones enviadas", s.week.sent],
    ["Registros de la red", s.week.network],
  ];

  return (
    <>
      <PageHead
        title="Resumen"
        action={
          <button type="button" className={btnPrimary} onClick={() => onNavigate("nueva")}>
            + Nueva oferta
          </button>
        }
      >
        {s.monthLabel} {s.year}
      </PageHead>

      {s.totalApps ? (
        <div className={kpiGrid}>
          <Kpi value={s.totalApps} label="Ofertas cargadas" kind="act" />
          <Kpi
            value={
              <>
                {s.sentThisMonth}
                {s.goal ? <span className="text-base text-muted"> / {s.goal}</span> : null}
              </>
            }
            label="Postuladas este mes"
            kind="act"
          />
          <Kpi value={s.latestConnections ?? "—"} label="Conexiones en la red" kind="res" />
          <Kpi value={s.inProgress} label="Procesos en curso" kind="res" />
          <Kpi value={s.responseRate === null ? "—" : `${s.responseRate}%`} label="Respondieron" kind="res" />
          <Kpi
            value={s.avgMatch === null ? "—" : `${s.avgMatch}%`}
            label="Coincidencia promedio (orientativa)"
          />
        </div>
      ) : (
        <EmptyState title="Todavía no cargaste postulaciones">
          Pegá una oferta y el porcentaje de match se calcula solo contra tu CV. También podés empezar por el
          Plan.
          <div className={`${row} mt-3.5 justify-center`}>
            <button type="button" className={btnPrimary} onClick={() => onNavigate("nueva")}>
              Cargar primera oferta
            </button>
            <button type="button" className={btn} onClick={() => onNavigate("plan")}>
              Armar mi plan
            </button>
            {hasCv ? null : (
              <button type="button" className={btn} onClick={() => onNavigate("cv")}>
                Cargar mi CV
              </button>
            )}
          </div>
        </EmptyState>
      )}

      <div className={`${gridTwo} mt-4`}>
        <div className={panel}>
          <h3 className={heading}>Esta semana</h3>
          <p className="mb-2 mt-0.5 text-xs text-muted">
            Solo actividad: lo que hiciste. Los resultados están en el tablero del Plan.
          </p>
          {weekRows.map(([label, value]) => (
            <div key={label} className="my-[7px] flex items-center justify-between gap-2.5 text-[13px]">
              <span>{label}</span>
              <b className="font-mono tabular-nums">{value}</b>
            </div>
          ))}
          <button type="button" className={`${btn} mt-2.5`} onClick={() => onNavigate("plan")}>
            Ver tablero del Plan
          </button>
        </div>

        <div className={panel}>
          <div className={`${row} justify-between`}>
            <h3 className={heading}>Meta del mes</h3>
            <label className="flex flex-wrap items-center gap-2 text-xs text-muted">
              Meta
              <input
                className={`${input} w-[90px] !px-2 !py-1 font-mono`}
                type="number"
                min={1}
                max={500}
                placeholder="a definir"
                value={s.goal || ""}
                onChange={(e) => onGoalChange(e.target.value)}
              />
            </label>
          </div>
          {s.goal ? (
            <>
              <Bar className="mb-1.5 mt-3" pct={s.goalPct} tone={s.goalPct >= 100 ? "ok" : "accent"} />
              <div className="text-xs text-muted">
                {s.sentThisMonth} postulaciones de {s.goal} · {s.goalPct}%
              </div>
            </>
          ) : (
            <p className="mt-2.5 text-xs text-muted">
              Sin meta definida. La definís vos o tu coach: no hay un número recomendado.
            </p>
          )}
          <hr className="my-4 border-0 border-t border-line" />
          <h3 className={heading}>Plataformas de hoy</h3>
          <p className="mb-2 mt-0.5 text-xs text-muted">
            {s.platformsToday.done} de {s.platformsToday.total} revisadas
          </p>
          <Bar pct={s.platformsToday.pct} />
          <button type="button" className={`${btn} mt-3`} onClick={() => onNavigate("busqueda")}>
            Abrir tracker de plataformas
          </button>
        </div>

        {s.totalApps ? (
          <>
            <div className={panel}>
              <h3 className={heading}>Postulaciones por mes · {s.year}</h3>
              <div className="flex h-[140px] items-end gap-1.5 border-b border-line pt-2">
                {s.monthly.counts.map((n, i) => (
                  <div key={i} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end">
                    {n ? <em className="mb-[3px] font-mono text-[11px] not-italic">{n}</em> : null}
                    <i
                      className={`block min-h-[2px] w-full max-w-[34px] rounded-t bg-accent ${
                        i === s.monthly.currentIndex ? "opacity-100" : "opacity-85"
                      }`}
                      style={{ height: `${(n / s.monthly.max) * 100 * 0.8}%` }}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-1 flex gap-1.5">
                {MESES.map((m) => (
                  <span key={m} className="flex-1 text-center text-[11px] text-muted">
                    {m.slice(0, 3)}
                  </span>
                ))}
              </div>
            </div>

            <div className={panel}>
              <h3 className={heading}>Por estado</h3>
              {s.states.map((st) => (
                <BarRow key={st.estado} label={st.estado} pct={st.pct} tone={st.tone} value={st.count} />
              ))}
            </div>

            <div className={panel}>
              <h3 className={heading}>Por fuente</h3>
              {s.sources.length ? (
                s.sources.map((src) => (
                  <BarRow key={src.name} label={src.name} title={src.name} pct={src.pct} value={src.count} />
                ))
              ) : (
                <p className="text-muted">Sin postulaciones enviadas todavía.</p>
              )}
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}
