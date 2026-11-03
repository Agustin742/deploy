import type { ReactNode } from "react";
import { fmtDate } from "@/shared/lib/dates";
import { Chip, EmptyState, Notice, PageHead, Tag } from "@/shared/ui/primitives";
import { btn, btnGhost, btnPrimary, btnSmall, fieldLabel, fieldsGrid, input, item, modRow, panel, row } from "@/shared/ui/styles";
import type { BoardVariable } from "../domain/board";
import { MAX_VARS } from "../domain/indicators";

export interface WeekVariableOption {
  id: string;
  name: string;
  description?: string;
}

export interface ModuleOption {
  mod: string;
  name: string;
  description: string;
  enabled: boolean;
}

export interface TextBlock {
  key: string;
  label: string;
  value: string;
}

export interface PlanViewProps {
  week: string;
  isCurrentWeek: boolean;
  variables: WeekVariableOption[];
  selected: string[];
  onShiftWeek: (days: number) => void;
  onToggleVariable: (id: string, checked: boolean) => void;

  weeklyObjectives: ReactNode;
  monthlyObjectives: ReactNode;
  onAddObjective: (periodo: "Semanal" | "Mensual") => void;

  board: BoardVariable[];
  metas: Record<string, string>;
  onMeta: (key: string, value: string) => void;
  onGo: (tab: string) => void;

  modules: ModuleOption[];
  onToggleModule: (mod: string, enabled: boolean) => void;

  /** Direction block, shown while the "valores" module is on. */
  direction: TextBlock[] | null;
  onDirection: (key: string, value: string) => void;
  /** Personal brand block, shown while the "marca" module is on. */
  brand: TextBlock[] | null;
  onBrand: (key: string, value: string) => void;
}

const sectionGap = "mt-[22px]";
const h3 = "text-base font-bold";

function TextBlocks({
  blocks,
  onChange,
  title,
  intro,
}: {
  blocks: TextBlock[];
  onChange: (key: string, value: string) => void;
  title: string;
  intro?: string;
}) {
  return (
    <div className={`${panel} mt-4`}>
      <h3 className={h3}>{title}</h3>
      {intro ? <p className="mb-2.5 mt-1 text-xs text-muted">{intro}</p> : null}
      <div className={`${fieldsGrid} ${intro ? "" : "mt-2.5"}`}>
        {blocks.map((b) => (
          <label key={b.key} className={`${fieldLabel} col-span-full`}>
            {b.label}
            <textarea
              className={`${input} resize-y leading-normal`}
              rows={2}
              value={b.value}
              onChange={(e) => onChange(b.key, e.target.value)}
            />
          </label>
        ))}
      </div>
    </div>
  );
}

export function PlanView(p: PlanViewProps) {
  const full = p.selected.length >= MAX_VARS;

  return (
    <>
      <PageHead title="Plan">
        Elegí tus variables de la semana y definí objetivos SMART semanales y mensuales.
      </PageHead>

      <div className={panel}>
        <div className={`${row} justify-between`}>
          <h3 className={h3}>Variables de la semana</h3>
          <div className={row}>
            <button type="button" className={btn} aria-label="Semana anterior" onClick={() => p.onShiftWeek(-7)}>
              ←
            </button>
            <b className="min-w-[150px] text-center font-display">Semana del {fmtDate(p.week)}</b>
            <button type="button" className={btn} aria-label="Semana siguiente" onClick={() => p.onShiftWeek(7)}>
              →
            </button>
          </div>
        </div>
        <p className="mb-1 mt-1.5 text-xs text-muted">
          Elegí hasta {MAX_VARS} variables para trabajar esta semana.{" "}
          <Chip tone={full ? "warn" : "info"}>
            {p.selected.length} de {MAX_VARS}
          </Chip>
        </p>
        {p.variables.map((v) => {
          const on = p.selected.includes(v.id);
          return (
            <label key={v.id} className={`${modRow} ${!on && full ? "opacity-55" : ""}`}>
              <input
                className="mt-1"
                type="checkbox"
                checked={on}
                onChange={(e) => p.onToggleVariable(v.id, e.target.checked)}
              />
              <span>
                <b>{v.name}</b>
                {v.description ? (
                  <>
                    <br />
                    <span className="text-xs text-muted">{v.description}</span>
                  </>
                ) : null}
              </span>
            </label>
          );
        })}
      </div>

      <PageHead title="Objetivos SMART" as="h2">
        Formato: <b>S</b> específico, <b>M</b> con sentido, <b>A</b> adaptativo, <b>R</b> realista y <b>T</b>{" "}
        con plazo. Los semanales se vinculan a las variables que elegiste para esa semana.
      </PageHead>
      <PageHead
        title="Semanales"
        as="h3"
        action={
          <button type="button" className={btnPrimary} onClick={() => p.onAddObjective("Semanal")}>
            + Objetivo semanal
          </button>
        }
      />
      {p.weeklyObjectives}
      <div className={sectionGap}>
        <PageHead
          title="Mensuales"
          as="h3"
          action={
            <button type="button" className={btnPrimary} onClick={() => p.onAddObjective("Mensual")}>
              + Objetivo mensual
            </button>
          }
        />
      </div>
      {p.monthlyObjectives}

      <div className={sectionGap}>
        <PageHead title="Tablero de la semana">
          Actividad (lo que hiciste) y resultado (lo que avanzó) son cosas distintas: mirá las dos.
        </PageHead>
      </div>
      {!p.selected.length ? (
        <EmptyState title="Todavía no elegiste variables">
          Marcá arriba hasta {MAX_VARS} variables y acá aparecen sus indicadores.
        </EmptyState>
      ) : p.isCurrentWeek ? (
        p.board.map((v) => (
          <div key={v.id} className={item}>
            <div className="mb-2.5 flex items-start justify-between gap-2.5">
              <div className="min-w-0">
                <b>{v.name}</b> {v.proposal ? <Chip>Propuesta a validar</Chip> : null}
              </div>
              <button type="button" className={`${btnGhost} ${btnSmall}`} onClick={() => p.onGo(v.tab)}>
                Ir al registro →
              </button>
            </div>
            {v.rows.map((r) => (
              <div
                key={r.key}
                className="grid grid-cols-[auto_1fr_auto] items-center gap-x-2.5 gap-y-1.5 border-t border-line py-2 text-[13px]"
              >
                <Tag result={r.kind === "res"}>{r.kind === "res" ? "Resultado" : "Actividad"}</Tag>
                <span>{r.label}</span>
                <b className="font-mono tabular-nums">{r.value}</b>
                {r.fixedGoal ? (
                  <span className="col-span-full text-xs text-muted">Meta: {r.fixedGoal}</span>
                ) : (
                  <input
                    className={`${input} col-span-full !px-2 !py-[5px] text-xs`}
                    value={p.metas[r.key] ?? ""}
                    placeholder="Meta"
                    aria-label={`Meta de ${r.label}`}
                    onChange={(e) => p.onMeta(r.key, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>
        ))
      ) : (
        <Notice tone="info">
          El tablero con los números se muestra para la semana actual. Volvé a esta semana para verlo.
        </Notice>
      )}

      <div className={`${panel} mt-4`}>
        <h3 className={h3}>Propuestas a validar</h3>
        <p className="mb-2.5 mt-1 text-xs text-muted">
          Activá solo las que quieras probar. No forman parte definitiva del programa hasta que se validen.
        </p>
        {p.modules.map((m) => (
          <label key={m.mod} className={modRow}>
            <input
              className="mt-1"
              type="checkbox"
              checked={m.enabled}
              onChange={(e) => p.onToggleModule(m.mod, e.target.checked)}
            />
            <span>
              <b>{m.name}</b> <Chip>Propuesta a validar</Chip>
              <br />
              <span className="text-xs text-muted">{m.description}</span>
            </span>
          </label>
        ))}
      </div>

      {p.direction ? (
        <TextBlocks
          title="Dirección: valores y objetivo laboral"
          intro="Tres piezas y su síntesis."
          blocks={p.direction}
          onChange={p.onDirection}
        />
      ) : null}
      {p.brand ? (
        <TextBlocks title="Marca personal y propuesta de valor" blocks={p.brand} onChange={p.onBrand} />
      ) : null}
    </>
  );
}
