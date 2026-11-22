"use client";

import type { CSSProperties } from "react";
import type { Application } from "@/features/state/domain/types";
import { fmtDate } from "@/shared/lib/dates";
import { useMediaQuery } from "@/shared/lib/use-media-query";
import { EmptyState, PageHead, Select } from "@/shared/ui/primitives";
import { btnPrimary, input } from "@/shared/ui/styles";
import { ECOLOR, ESTADOS } from "../domain/applications";
import { pctBand, type SortKey } from "../domain/list";

const TONE_VAR = { neutral: "muted", info: "info", warn: "warn", ok: "ok", bad: "bad" } as const;

const th =
  "whitespace-nowrap border-b border-line px-3 py-2.5 text-left font-mono text-caption font-medium uppercase tracking-[0.04em] text-muted";
const td = "border-b border-line px-3 py-2 align-middle group-last:border-b-0";

export interface ApplicationsViewProps {
  /** Applications already filtered and sorted. */
  apps: readonly Application[];
  total: number;
  /** Applications per status over the whole list, for the filter labels. */
  counts: Readonly<Record<string, number>>;
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
  counts,
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
  const table = useMediaQuery("(min-width: 768px)");

  return (
    <>
      <PageHead title="Postulaciones">Tocá una postulación para ver el detalle, el informe y la ficha de la empresa.</PageHead>

      <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
        <input
          className={input}
          type="search"
          placeholder="Buscar empresa, puesto o skill"
          aria-label="Buscar"
          value={q}
          onChange={(e) => onQuery(e.target.value)}
        />
        <Select
          aria-label="Filtrar por estado"
          value={filter}
          onChange={(e) => onFilter(e.target.value)}
          wrapperClassName="sm:w-52"
        >
          <option value="Todos">Todos ({total})</option>
          {ESTADOS.map((e) => (
            <option key={e} value={e}>
              {e} ({counts[e] ?? 0})
            </option>
          ))}
        </Select>
        <label className="flex items-center gap-2 text-small text-muted">
          Ordenar
          <Select value={sort} onChange={(e) => onSort(e.target.value as SortKey)} wrapperClassName="flex-1 sm:w-36">
            <option value="fecha">Fecha</option>
            <option value="match">Match</option>
          </Select>
        </label>
      </div>

      {apps.length === 0 ? (
        total ? (
          <EmptyState title="Nada con ese filtro">Probá con otro estado o borrá la búsqueda.</EmptyState>
        ) : (
          <EmptyState title="No hay postulaciones">
            Cargá la primera y acá vas a poder seguir su estado.
            <div className="mt-3.5">
              <button type="button" className={btnPrimary} onClick={onNew}>
                Cargar postulación
              </button>
            </div>
          </EmptyState>
        )
      ) : table ? (
        <div className="rounded-card border border-line bg-surface">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className={th}>Empresa y puesto</th>
                <th className={th}>Estado</th>
                <th className={th}>Fecha</th>
                <th className={th}>Match</th>
                <th className={`${th} hidden lg:table-cell`}>Fuente</th>
              </tr>
            </thead>
            <tbody>
              {apps.map((a) => (
                <Row key={a.id} app={a} onOpen={onOpen} onStatus={onStatus} />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <ul className="grid gap-3">
          {apps.map((a) => (
            <ApplicationCard key={a.id} app={a} onOpen={onOpen} onStatus={onStatus} />
          ))}
        </ul>
      )}
    </>
  );
}

function MatchBadge({ app: a }: { app: Application }) {
  const m = a.match;
  return m && m.pct != null ? (
    <span
      className="inline-block min-w-[3.25rem] rounded-md bg-[color-mix(in_srgb,var(--c)_15%,transparent)] px-2 py-1 text-center font-mono text-small font-semibold text-[var(--c)]"
      style={{ "--c": `var(--${pctBand(m.pct)})` } as CSSProperties}
    >
      {m.pct}%
    </span>
  ) : (
    <span className="font-mono text-muted" aria-label="Sin match">
      —
    </span>
  );
}

function StatusSelect({
  app: a,
  onStatus,
  className = "",
}: {
  app: Application;
  onStatus: (id: string, estado: string) => void;
  className?: string;
}) {
  const tone = ECOLOR[a.estado as keyof typeof ECOLOR] ?? "neutral";
  return (
    <Select
      aria-label="Estado"
      value={a.estado}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => onStatus(a.id, e.target.value)}
      wrapperClassName={`relative z-10 ${className}`}
      className="border-[color-mix(in_srgb,var(--c)_45%,transparent)] bg-[color-mix(in_srgb,var(--c)_12%,var(--surface))] text-small font-medium text-[var(--c)]"
      style={{ "--c": `var(--${TONE_VAR[tone]})` } as CSSProperties}
    >
      {ESTADOS.map((e) => (
        <option key={e} value={e} className="bg-surface text-ink">
          {e}
        </option>
      ))}
    </Select>
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
  return (
    <tr className="group cursor-pointer hover:[&>td]:bg-soft" onClick={() => onOpen(a.id)}>
      <td className={td}>
        <button
          type="button"
          onClick={() => onOpen(a.id)}
          className="block max-w-full cursor-pointer rounded-control text-left"
        >
          <b className="block font-semibold">{a.empresa || "Sin empresa"}</b>
          <span className="text-small text-muted">{a.puesto || "Sin puesto"}</span>
        </button>
      </td>
      <td className={td}>
        <StatusSelect app={a} onStatus={onStatus} className="w-44" />
      </td>
      <td className={`${td} whitespace-nowrap font-mono text-small`}>{fmtDate(a.fecha)}</td>
      <td className={td}>
        <MatchBadge app={a} />
      </td>
      <td className={`${td} hidden text-small lg:table-cell`}>{a.fuente || <span className="text-muted">—</span>}</td>
    </tr>
  );
}

function ApplicationCard({
  app: a,
  onOpen,
  onStatus,
}: {
  app: Application;
  onOpen: (id: string) => void;
  onStatus: (id: string, estado: string) => void;
}) {
  return (
    <li className="relative rounded-card border border-line bg-surface p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={() => onOpen(a.id)}
          className="min-w-0 cursor-pointer rounded-control text-left after:absolute after:inset-0 after:content-['']"
        >
          <b className="block truncate font-semibold">{a.empresa || "Sin empresa"}</b>
          <span className="block truncate text-small text-muted">{a.puesto || "Sin puesto"}</span>
        </button>
        <MatchBadge app={a} />
      </div>
      <div className="mt-3">
        <StatusSelect app={a} onStatus={onStatus} />
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 text-small text-muted">
        <span className="font-mono">{fmtDate(a.fecha)}</span>
        {a.fuente ? <span>{a.fuente}</span> : null}
      </div>
    </li>
  );
}
