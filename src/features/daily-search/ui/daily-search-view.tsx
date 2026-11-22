"use client";

import { useState, type FormEvent } from "react";
import type { Platform } from "@/features/state/domain/types";
import { MESES } from "@/shared/lib/dates";
import { Chip, PageHead } from "@/shared/ui/primitives";
import { btn, btnDanger, btnGhost, btnPrimary, btnSmall, input, panel, row } from "@/shared/ui/styles";
import type { MonthView } from "../domain/daily-search";

export interface DailySearchViewProps {
  month: string;
  view: MonthView;
  editId: string | null;
  deleteId: string | null;
  onToggle: (platformId: string, day: number) => void;
  onMarkAll: () => void;
  onShiftMonth: (delta: number) => void;
  onEdit: (id: string) => void;
  onAskDelete: (id: string) => void;
  onCancelRow: () => void;
  onSave: (id: string, name: string, url: string) => void;
  onDelete: (id: string) => void;
  /** Returns true when the page was added (the form then clears). */
  onAdd: (name: string, url: string) => boolean;
  onReset: () => void;
}

const stickyName = "sticky left-0 z-[1] min-w-[176px] border-r border-line bg-surface px-3 py-1.5 text-left";

type RowHandlers = Pick<DailySearchViewProps, "onEdit" | "onAskDelete" | "onCancelRow" | "onSave" | "onDelete">;

/** Inline form; mounted only while editing so it always starts from the saved values. */
function PlatformEditor({ platform: p, onSave, onCancelRow }: { platform: Platform } & Pick<RowHandlers, "onSave" | "onCancelRow">) {
  const [name, setName] = useState(p.name);
  const [url, setUrl] = useState(p.url === "#" ? "" : p.url);
  return (
    <div className="grid gap-1.5">
      <input className={input} aria-label="Nombre" value={name} onChange={(e) => setName(e.target.value)} />
      <input className={input} aria-label="Link" placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} />
      <div className={row}>
        <button type="button" className={`${btnPrimary} ${btnSmall}`} onClick={() => onSave(p.id, name, url)}>
          Guardar
        </button>
        <button type="button" className={`${btn} ${btnSmall}`} onClick={onCancelRow}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

function PlatformCell({
  platform: p,
  editing,
  deleting,
  ...h
}: {
  platform: Platform;
  editing: boolean;
  deleting: boolean;
} & RowHandlers) {
  if (editing) return <PlatformEditor platform={p} onSave={h.onSave} onCancelRow={h.onCancelRow} />;
  if (deleting) {
    return (
      <div className="text-xs">
        <b>¿Quitar {p.name}?</b>
        <div className={`${row} mt-1`}>
          <button type="button" className={`${btnDanger} ${btnSmall}`} onClick={() => h.onDelete(p.id)}>
            Sí, quitar
          </button>
          <button type="button" className={`${btn} ${btnSmall}`} onClick={h.onCancelRow}>
            Cancelar
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between gap-2">
      <a href={p.url} target="_blank" rel="noopener" className="font-medium text-ink no-underline hover:underline">
        {p.name} ↗
      </a>
      <span className="flex">
        <button type="button" className={`${btnGhost} ${btnSmall} px-1.5`} title="Editar" aria-label={`Editar ${p.name}`} onClick={() => h.onEdit(p.id)}>
          ✎
        </button>
        <button type="button" className={`${btnGhost} ${btnSmall} px-1.5`} title="Quitar página" aria-label={`Quitar ${p.name}`} onClick={() => h.onAskDelete(p.id)}>
          ×
        </button>
      </span>
    </div>
  );
}

export function DailySearchView(p: DailySearchViewProps) {
  const [y, m] = p.month.split("-").map(Number);
  const { view } = p;
  const days = Array.from({ length: view.daysInMonth }, (_, i) => i + 1);
  const [pageName, setPageName] = useState("");
  const [pageUrl, setPageUrl] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (p.onAdd(pageName, pageUrl)) {
      setPageName("");
      setPageUrl("");
    }
  };

  return (
    <>
      <PageHead
        title="Búsqueda diaria"
        action={
          <div className={row}>
            <button type="button" className={btn} aria-label="Mes anterior" onClick={() => p.onShiftMonth(-1)}>
              ←
            </button>
            <b className="min-w-[130px] text-center font-display">
              {MESES[m - 1]} {y}
            </b>
            <button type="button" className={btn} aria-label="Mes siguiente" onClick={() => p.onShiftMonth(1)}>
              →
            </button>
          </div>
        }
      >
        Marcá cada plataforma que revisaste. Incluye LinkedIn e Indeed junto a las de trabajo remoto.
      </PageHead>
      <div className={`${row} mb-3`}>
        <Chip tone="info">{view.total} revisiones en el mes</Chip>
        {view.doneToday !== null ? (
          <>
            <Chip tone={view.doneToday === view.rows.length ? "ok" : "neutral"}>
              Hoy: {view.doneToday} de {view.rows.length}
            </Chip>
            <button type="button" className={btn} onClick={p.onMarkAll}>
              Marcar todas hoy
            </button>
          </>
        ) : null}
      </div>
      <div className="overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-max border-separate border-spacing-0">
          <thead>
            <tr>
              <th className={`${stickyName} border-b border-line font-mono text-[10px] font-medium uppercase tracking-[0.06em] text-muted`}>Plataforma</th>
              {days.map((d) => (
                <th
                  key={d}
                  className={`min-w-[30px] border-b border-line py-2 text-center font-mono text-[10px] font-medium ${
                    view.isCurrent && d === view.today ? "font-semibold text-accent" : "text-muted"
                  }`}
                >
                  {d}
                </th>
              ))}
              <th className="border-b border-line px-2 text-center font-mono text-[10px] font-medium uppercase text-muted">Total</th>
            </tr>
          </thead>
          <tbody>
            {view.rows.map(({ platform, days: checked }) => (
              <tr key={platform.id}>
                <td className={`${stickyName} border-b`}>
                  <PlatformCell
                    platform={platform}
                    editing={p.editId === platform.id}
                    deleting={p.deleteId === platform.id}
                    onEdit={p.onEdit}
                    onAskDelete={p.onAskDelete}
                    onCancelRow={p.onCancelRow}
                    onSave={p.onSave}
                    onDelete={p.onDelete}
                  />
                </td>
                {days.map((d) => {
                  const on = checked.includes(d);
                  const isToday = view.isCurrent && d === view.today;
                  return (
                    <td key={d} className="border-b border-line p-0 text-center">
                      <button
                        type="button"
                        aria-pressed={on}
                        aria-label={`${platform.name} día ${d}`}
                        onClick={() => p.onToggle(platform.id, d)}
                        className={`relative h-8 w-[30px] cursor-pointer border-0 bg-transparent after:absolute after:inset-2 after:rounded-[5px] after:border-[1.5px] after:content-[''] ${
                          on ? "after:border-ok after:bg-ok" : isToday ? "after:border-accent" : "after:border-line"
                        }`}
                      />
                    </td>
                  );
                })}
                <td className="border-b border-l border-line px-2 text-center font-mono text-xs">{checked.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={`${panel} mt-3.5`}>
        <h3 className="text-base font-bold">Páginas de la búsqueda</h3>
        <p className="mb-2.5 mt-0.5 text-xs text-muted">
          Agregá las páginas que usás. Con ✎ editás el nombre o el link y con × la quitás de la lista.
        </p>
        <form className={row} onSubmit={submit}>
          <input
            className={`${input} max-w-[220px]`}
            placeholder="Nombre de la página"
            aria-label="Nombre de la página"
            value={pageName}
            onChange={(e) => setPageName(e.target.value)}
            required
          />
          <input className={`${input} max-w-[280px]`} placeholder="https://…" aria-label="Link" value={pageUrl} onChange={(e) => setPageUrl(e.target.value)} />
          <button type="submit" className={btnPrimary}>
            + Agregar página
          </button>
        </form>
        <div className={`${row} mt-2.5`}>
          <button type="button" className={`${btn} ${btnSmall}`} onClick={p.onReset}>
            Restaurar las páginas iniciales
          </button>
        </div>
      </div>
    </>
  );
}
