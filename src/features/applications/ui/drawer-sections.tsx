import type { ReactNode } from "react";
import type { Application, Interview } from "@/features/state/domain/types";
import { fmtDate } from "@/shared/lib/dates";
import { btn, btnGhost, btnSmall, fieldLabel, fieldsGrid, input, item, panel, row } from "@/shared/ui/styles";
import { PRE } from "../domain/applications";

/** Called with the edit path of the field (see `applyAppEdit`) and whether to save right away. */
export type FieldChange = (path: string, value: string | boolean, immediate: boolean) => void;

export const section = `${panel} mt-3.5`;

export function Collapsible({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className={`${section} group !p-0`}>
      <summary className="cursor-pointer list-none px-4 py-3 font-display text-[15px] font-semibold after:float-right after:font-mono after:content-['+'] group-open:after:content-['–']">
        {title}
      </summary>
      <div className="px-4 pb-4">{children}</div>
    </details>
  );
}

export function PreInterview({ app, onChange }: { app: Application; onChange: FieldChange }) {
  const pre = app.pre ?? {};
  const done = PRE.filter(([k]) => pre[k]?.ok).length;
  return (
    <Collapsible title={`Pre-entrevista: cosas para averiguar (${done} de ${PRE.length})`}>
      <p className="mb-1.5 text-xs text-muted">Marcá lo que ya averiguaste y anotá lo que encontraste.</p>
      {PRE.map(([k, label]) => {
        const v = pre[k] ?? {};
        return (
          <div key={k} className="grid grid-cols-[auto_1fr] items-center gap-x-2.5 gap-y-1.5 border-t border-line py-2 text-[13px]">
            <input
              type="checkbox"
              checked={Boolean(v.ok)}
              aria-label={`Averiguado: ${label}`}
              onChange={(e) => onChange(`pre:${k}:ok`, e.target.checked, true)}
            />
            <span>{label}</span>
            <input
              className={`${input} col-span-full !px-2 !py-[5px] text-xs`}
              value={v.txt ?? ""}
              placeholder="Lo que averigüé"
              aria-label={label}
              onChange={(e) => onChange(`pre:${k}:txt`, e.target.value, false)}
            />
          </div>
        );
      })}
    </Collapsible>
  );
}

const INTERVIEW_FIELDS: ReadonlyArray<readonly [keyof Interview, string, "text" | "date" | "area"]> = [
  ["fecha", "Fecha", "date"],
  ["etapa", "Etapa o tipo", "text"],
  ["preguntas", "Preguntas que me hicieron (una por línea)", "area"],
  ["respondi", "Cómo respondí y qué respondería distinto", "area"],
  ["prep", "Cómo me preparé", "area"],
  ["feedback", "Feedback recibido", "area"],
  ["aprendi", "¿Qué me resultó más útil de esta entrevista?", "area"],
  ["proximo", "Próximo paso", "text"],
];

export function Interviews({
  app,
  onChange,
  onAdd,
  onRemove,
}: {
  app: Application;
  onChange: FieldChange;
  onAdd: () => void;
  onRemove: (interviewId: string) => void;
}) {
  const list = (app.entrevistas ?? []).slice().sort((x, y) => (y.fecha ?? "").localeCompare(x.fecha ?? ""));
  return (
    <div className={section}>
      <div className={`${row} justify-between`}>
        <h3 className="text-base font-bold">Entrevistas</h3>
        <button type="button" className={btn} onClick={onAdd}>
          + Agregar entrevista
        </button>
      </div>
      {list.length ? (
        list.map((e) => (
          <div key={e.id} className={`${item} mb-0 mt-3`}>
            <div className="mb-2.5 flex items-start justify-between gap-2.5">
              <b>
                {e.etapa || "Entrevista"}
                {e.fecha ? ` · ${fmtDate(e.fecha)}` : ""}
              </b>
              <button type="button" className={`${btnGhost} ${btnSmall}`} onClick={() => onRemove(e.id)}>
                Eliminar
              </button>
            </div>
            <div className={fieldsGrid}>
              {INTERVIEW_FIELDS.map(([key, label, kind]) => {
                const path = `ent:${e.id}:${key}`;
                const value = e[key] ?? "";
                return kind === "area" ? (
                  <label key={key} className={`${fieldLabel} col-span-full`}>
                    {label}
                    <textarea className={`${input} resize-y leading-normal`} rows={2} value={value} onChange={(ev) => onChange(path, ev.target.value, false)} />
                  </label>
                ) : (
                  <label key={key} className={fieldLabel}>
                    {label}
                    <input className={input} type={kind} value={value} onChange={(ev) => onChange(path, ev.target.value, kind === "date")} />
                  </label>
                );
              })}
            </div>
          </div>
        ))
      ) : (
        <p className="mt-2 text-xs text-muted">Todavía no registraste entrevistas para esta postulación.</p>
      )}
    </div>
  );
}
