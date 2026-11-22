"use client";

import { useState, type ReactNode } from "react";
import { MESES } from "@/shared/lib/dates";
import { Bar, BarRow, Kpi, PageHead } from "@/shared/ui/primitives";
import { buttonClass, cardHero, input, panel } from "@/shared/ui/styles";
import type { Summary } from "../domain/summary";

export interface SummaryViewProps {
  summary: Summary;
  hasCv: boolean;
  onNavigate: (tab: "nueva" | "postulaciones" | "cv" | "busqueda") => void;
  onGoalChange: (raw: string) => void;
}

/** Height in px of the plotting area of the monthly chart. */
const PLOT_PX = 168;

const sectionCaption = "mb-3 text-caption font-semibold uppercase tracking-[0.08em] text-muted";
const panelTitle = "font-display text-section font-bold";
const textLink =
  "cursor-pointer rounded-control text-small font-semibold text-accent underline-offset-4 hover:underline";

export function SummaryView({ summary: s, hasCv, onNavigate, onGoalChange }: SummaryViewProps) {
  return (
    <>
      <PageHead title="Resumen">
        {s.monthLabel} {s.year}
      </PageHead>

      {s.totalApps ? (
        <>
          <h3 className={`${sectionCaption} mt-2`}>Tu mes</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <GoalKpi summary={s} onGoalChange={onGoalChange} />
            <Kpi size="lg" value={s.inProgress} label="Procesos en curso" />
            <Kpi
              size="lg"
              value={s.responseRate === null ? "—" : `${s.responseRate}%`}
              label="Tasa de respuesta"
            />
            <Kpi size="lg" value={s.totalApps} label="Total de postulaciones" />
          </div>

          <h3 className={`${sectionCaption} mt-8`}>Evolución</h3>
          <div className="grid gap-4 lg:grid-cols-3">
            <section className={`${panel} lg:col-span-2`} aria-labelledby="chart-title">
              <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                <h4 id="chart-title" className={panelTitle}>
                  Postulaciones por mes · {s.year}
                </h4>
                <button type="button" className={textLink} onClick={() => onNavigate("postulaciones")}>
                  Ver postulaciones
                </button>
              </div>
              <MonthlyChart monthly={s.monthly} year={s.year} />
            </section>

            <section className={panel} aria-labelledby="states-title">
              <h4 id="states-title" className={`${panelTitle} mb-2`}>
                Por estado
              </h4>
              {s.states.map((st) => (
                <BarRow key={st.estado} label={st.estado} pct={st.pct} tone={st.tone} value={st.count} />
              ))}
            </section>
          </div>

          <h3 className={`${sectionCaption} mt-8`}>Detalle</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <section className={panel} aria-labelledby="sources-title">
              <h4 id="sources-title" className={`${panelTitle} mb-2`}>
                Por fuente
              </h4>
              {s.sources.length ? (
                s.sources.map((src) => (
                  <BarRow key={src.name} label={src.name} title={src.name} pct={src.pct} value={src.count} />
                ))
              ) : (
                <p className="text-muted">Sin postulaciones enviadas todavía.</p>
              )}
            </section>

            <section className={panel} aria-labelledby="next-title">
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                <h4 id="next-title" className={panelTitle}>
                  Lo que sigue
                </h4>
                <button type="button" className={textLink} onClick={() => onNavigate("busqueda")}>
                  Ir a Búsqueda diaria
                </button>
              </div>
              {s.platformsToday.total ? (
                <>
                  <p className="mb-2 text-small text-muted">
                    Plataformas revisadas hoy: {s.platformsToday.done} de {s.platformsToday.total}
                  </p>
                  <Bar pct={s.platformsToday.pct} tone={s.platformsToday.pct >= 100 ? "ok" : "accent"} />
                </>
              ) : (
                <p className="text-small text-muted">Todavía no agregaste plataformas para revisar cada día.</p>
              )}
              {hasCv ? null : (
                <p className="mt-4 text-small text-muted">
                  Para ver el match de cada oferta,{" "}
                  <button type="button" className={textLink} onClick={() => onNavigate("cv")}>
                    cargá tu CV
                  </button>
                  .
                </p>
              )}
            </section>
          </div>
        </>
      ) : (
        <div className={`${cardHero} mx-auto mt-4 max-w-2xl p-8 text-center sm:p-10`}>
          <h3 className="font-display text-title font-extrabold">Todavía no cargaste postulaciones</h3>
          <p className="mx-auto mt-2 max-w-md text-muted">
            Cargá la primera y el tablero se arma solo: estados, respuestas y postulaciones por mes.
          </p>
          <ol className="mx-auto mt-5 grid max-w-md gap-2 text-left text-small text-muted">
            <li className="flex gap-3">
              <StepNumber>1</StepNumber>
              Pegá el link o el texto de la oferta.
            </li>
            <li className="flex gap-3">
              <StepNumber>2</StepNumber>
              Guardá la postulación y seguí su estado desde acá.
            </li>
          </ol>
          <div className="mt-6">
            <button type="button" className={buttonClass("cta", "lg")} onClick={() => onNavigate("nueva")}>
              Cargar mi primera postulación
            </button>
          </div>
          {hasCv ? null : (
            <p className="mt-4 text-small text-muted">
              ¿Querés ver el match con cada oferta?{" "}
              <button type="button" className={textLink} onClick={() => onNavigate("cv")}>
                Cargar mi CV
              </button>
            </p>
          )}
        </div>
      )}
    </>
  );
}

function StepNumber({ children }: { children: ReactNode }) {
  return (
    <span
      aria-hidden="true"
      className="grid size-6 shrink-0 place-items-center rounded-full bg-soft font-mono text-caption font-semibold text-ink"
    >
      {children}
    </span>
  );
}

/** Hero KPI: applications sent this month against the goal, with the goal editable in place. */
function GoalKpi({ summary: s, onGoalChange }: { summary: Summary; onGoalChange: (raw: string) => void }) {
  const [editing, setEditing] = useState(false);
  const showInput = editing || !s.goal;

  return (
    <div className="rounded-card border border-line bg-surface px-5 py-4 shadow-card">
      <div className="font-display text-[2.75rem] font-extrabold leading-[1.1] tabular-nums">
        {s.sentThisMonth}
        {s.goal ? <span className="text-section font-bold text-muted"> / {s.goal}</span> : null}
      </div>
      <div className="mt-1 text-small text-muted">Postuladas este mes</div>
      {s.goal ? <Bar className="mt-3" pct={s.goalPct} tone={s.goalPct >= 100 ? "ok" : "accent"} /> : null}
      <div className="mt-2.5 min-h-8 text-small text-muted">
        {showInput ? (
          <label className="flex flex-wrap items-center gap-2">
            Meta del mes
            <input
              className={`${input} w-24 min-h-8 font-mono`}
              type="number"
              min={1}
              max={500}
              placeholder="a definir"
              value={s.goal || ""}
              onChange={(e) => {
                setEditing(true);
                onGoalChange(e.target.value);
              }}
              onBlur={() => setEditing(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setEditing(false);
              }}
            />
          </label>
        ) : (
          <span className="flex flex-wrap items-center gap-x-2">
            {s.goalPct}% de la meta
            <button type="button" className={textLink} onClick={() => setEditing(true)}>
              editar meta
            </button>
          </span>
        )}
      </div>
    </div>
  );
}

/** Bar chart of applications per month; the current month is solid, the others are tinted. */
function MonthlyChart({ monthly, year }: { monthly: Summary["monthly"]; year: string }) {
  const max = monthly.max > 0 ? monthly.max : 1;
  const summaryText = monthly.counts.map((n, i) => `${MESES[i]}: ${n}`).join(", ");
  const grid = [0, 0.5, 1];

  return (
    <figure className="m-0">
      <div role="img" aria-label={`Postulaciones por mes en ${year}. ${summaryText}.`}>
        <div className="relative h-[200px]" aria-hidden="true">
          {grid.map((g) => (
            <div
              key={g}
              className="absolute inset-x-0 border-t border-dashed border-line"
              style={{ bottom: `${g * PLOT_PX}px` }}
            >
              <span className="absolute -top-2.5 left-0 bg-surface pr-1 font-mono text-caption text-muted">
                {Math.round(g * max * 10) / 10}
              </span>
            </div>
          ))}
          <div className="absolute inset-x-0 bottom-0 flex h-full items-end gap-1.5 pl-7 sm:gap-2.5">
            {monthly.counts.map((n, i) => {
              const current = i === monthly.currentIndex;
              return (
                <div key={i} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end" title={`${MESES[i]}: ${n}`}>
                  {n ? (
                    <em className={`mb-1 font-mono text-caption not-italic ${current ? "font-semibold text-ink" : "text-muted"}`}>
                      {n}
                    </em>
                  ) : null}
                  <i
                    className={`block w-full max-w-9 rounded-t ${current ? "bg-accent" : "bg-accent/45"}`}
                    style={{ height: n ? `${Math.max(4, (n / max) * PLOT_PX)}px` : "2px" }}
                  />
                </div>
              );
            })}
          </div>
        </div>
        <div className="mt-1.5 flex gap-1.5 pl-7 sm:gap-2.5" aria-hidden="true">
          {MESES.map((m, i) => (
            <span
              key={m}
              className={`flex-1 text-center text-caption ${i === monthly.currentIndex ? "font-semibold text-ink" : "text-muted"}`}
            >
              {m.slice(0, 3)}
            </span>
          ))}
        </div>
      </div>
    </figure>
  );
}
