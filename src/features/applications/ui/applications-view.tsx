import type { CSSProperties } from "react";
import type { Application } from "@/features/state/domain/types";
import { fmtDate } from "@/shared/lib/dates";
import { Chip, EmptyState, PageHead } from "@/shared/ui/primitives";
import { btnPrimary, input, row } from "@/shared/ui/styles";
import { ECOLOR, ESTADOS } from "../domain/applications";
import { coincidence, missingSkills, pctBand, type SortKey } from "../domain/list";

const TONE_VAR = { neutral: "muted", info: "info", warn: "warn", ok: "ok", bad: "bad" } as const;

const th =
  "whitespace-nowrap border-b border-line px-3 py-2.5 text-left font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-muted";
const td = "border-b border-line px-3 py-2.5 align-middle group-last:border-b-0";

export interface ApplicationsViewProps {
  /** Applications already filtered and sorted. */
  apps: readonly Application[];
  total: number;
  filter: string;
  q: string;
  sort: SortKey;
  onFilter: (filter: string) => void;
  onQuery: (q: string) => void;
  onSort: (sort: SortKey) => void;
  onOpen: (id: string) => void;
  onStatus: (id: string, estado: string) => void;
  onNew: () => void;
}

export function ApplicationsView({
  apps,
  total,
  filter,
  q,
  sort,
  onFilter,
  onQuery,
  onSort,
  onOpen,
  onStatus,
  onNew,
}: ApplicationsViewProps) {
  return (
    <>
      <PageHead
        title="Postulaciones"
        action={
          <button type="button" className={btnPrimary} onClick={onNew}>
            + Nueva oferta
          </button>
        }
      >
        Tocá una fila para ver el detalle, el informe y la ficha de la empresa.
      </PageHead>
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        {["Todos", ...ESTADOS].map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={filter === c}
            onClick={() => onFilter(c)}
            className={`cursor-pointer rounded-full border px-3 py-1 text-[13px] ${
              filter === c ? "border-lime bg-lime font-semibold text-lime-ink" : "border-line bg-surface"
            }`}
          >
            {c}
          </button>
        ))}
      </div>
      <div className={`${row} mb-3`}>
        <input
          className={`${input} max-w-[320px]`}
          placeholder="Buscar empresa, puesto o skill"
          aria-label="Buscar"
          value={q}
          onChange={(e) => onQuery(e.target.value)}
        />
        <label className={`${row} text-xs text-muted`}>
          Ordenar
          <select className={`${input} !w-auto`} value={sort} onChange={(e) => onSort(e.target.value as SortKey)}>
            <option value="fecha">Fecha</option>
            <option value="match">Match</option>
          </select>
        </label>
      </div>
      <div className="overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full min-w-[860px] border-collapse">
          <thead>
            <tr>
              {["Match", "Empresa y puesto", "Fuente", "Estado", "Fecha", "Coincidencia", "Skills que faltan"].map((h) => (
                <th key={h} className={th}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {apps.length ? (
              apps.map((a) => <Row key={a.id} app={a} onOpen={onOpen} onStatus={onStatus} />)
            ) : (
              <tr>
                <td colSpan={7}>
                  {total ? (
                    <EmptyState title="Nada con ese filtro">Probá con otro estado o borrá la búsqueda.</EmptyState>
                  ) : (
                    <EmptyState title="No hay postulaciones">Cargá la primera desde “Nueva oferta”.</EmptyState>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Row({
  app: a,
  onOpen,
  onStatus,
}: {
  app: Application;
  onOpen: (id: string) => void;
  onStatus: (id: string, estado: string) => void;
}) {
  const m = a.match;
  const co = coincidence(m);
  const miss = missingSkills(m);
  const tone = ECOLOR[a.estado as keyof typeof ECOLOR] ?? "neutral";
  return (
    <tr className="group cursor-pointer hover:[&>td]:bg-soft" onClick={() => onOpen(a.id)}>
      <td className={td}>
        {m && m.pct != null ? (
          <span
            className="inline-block min-w-[52px] rounded-md bg-[color-mix(in_srgb,var(--c)_15%,transparent)] px-2 py-[3px] text-center font-mono text-[13px] font-semibold text-[var(--c)]"
            style={{ "--c": `var(--${pctBand(m.pct)})` } as CSSProperties}
          >
            {m.pct}%
          </span>
        ) : (
          <span className="font-mono text-muted">—</span>
        )}
      </td>
      <td className={td}>
        <b className="block font-semibold">{a.empresa || "Sin empresa"}</b>
        <span className="text-[13px] text-muted">{a.puesto || "Sin puesto"}</span>
      </td>
      <td className={td}>{a.fuente || <span className="text-muted">—</span>}</td>
      <td className={td}>
        <select
          aria-label="Estado"
          value={a.estado}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => onStatus(a.id, e.target.value)}
          className="max-w-[130px] cursor-pointer rounded-full border border-[color-mix(in_srgb,var(--c)_35%,transparent)] bg-[color-mix(in_srgb,var(--c)_12%,transparent)] px-2 py-[3px] text-xs font-medium text-[var(--c)]"
          style={{ "--c": `var(--${TONE_VAR[tone]})` } as CSSProperties}
        >
          {ESTADOS.map((e) => (
            <option key={e} value={e} className="bg-surface text-ink">
              {e}
            </option>
          ))}
        </select>
      </td>
      <td className={`${td} font-mono text-xs`}>{fmtDate(a.fecha)}</td>
      <td className={td}>{co ? <Chip tone={co.tone}>{co.label}</Chip> : <span className="text-muted">—</span>}</td>
      <td className={td}>
        {miss.slice(0, 3).map((s) => (
          <Chip key={s} tone="bad">
            {s}
          </Chip>
        ))}
        {miss.length > 3 ? <span className="text-xs text-muted">+{miss.length - 3}</span> : null}
      </td>
    </tr>
  );
}
