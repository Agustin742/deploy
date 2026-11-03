"use client";

import { useEffect, useRef } from "react";
import { MatchView } from "@/features/matching/ui/match-view";
import type { Application, MatchResult } from "@/features/state/domain/types";
import { Notice } from "@/shared/ui/primitives";
import { btn, btnDanger, btnGhostDanger, btnPrimary, fieldLabel, fieldsGrid, input, panel, row } from "@/shared/ui/styles";
import { ESTADOS } from "../domain/applications";
import { Collapsible, Interviews, PreInterview, section, type FieldChange } from "./drawer-sections";
import { ReportView } from "./report-view";

export interface ApplicationDrawerViewProps {
  app: Application;
  match: MatchResult;
  sources: readonly string[];
  /** The AI module is on: reports can be marked as reviewed. */
  iaModule: boolean;
  /** The "before sharing with an AI" notice is showing. */
  aiAsk: boolean;
  shareName: boolean;
  confirmDel: boolean;
  /** Prompt text to copy by hand when the clipboard is not available. */
  fallbackText: string | null;
  onField: FieldChange;
  onClose: () => void;
  onRecalc: () => void;
  onCopyPrompt: () => void;
  onAiGo: () => void;
  onAiNo: () => void;
  onCopyReport: () => void;
  onAddInterview: () => void;
  onRemoveInterview: (id: string) => void;
  onDelAsk: () => void;
  onDelNo: () => void;
  onDelYes: () => void;
  onGoCv: () => void;
}

function Text({ app, path, label, placeholder, onField }: { app: Application; path: keyof Application; label: string; placeholder?: string; onField: FieldChange }) {
  return (
    <label className={fieldLabel}>
      {label}
      <input className={input} value={String(app[path] ?? "")} placeholder={placeholder} onChange={(e) => onField(path, e.target.value, false)} />
    </label>
  );
}

function FichaText({ app, k, label, placeholder, area, onField }: { app: Application; k: keyof Application["ficha"]; label: string; placeholder?: string; area?: boolean; onField: FieldChange }) {
  const value = app.ficha?.[k] ?? "";
  const path = `ficha.${k}`;
  return (
    <label className={fieldLabel}>
      {label}
      {area ? (
        <textarea className={`${input} resize-y leading-normal`} rows={2} value={value} placeholder={placeholder} onChange={(e) => onField(path, e.target.value, false)} />
      ) : (
        <input className={input} value={value} placeholder={placeholder} onChange={(e) => onField(path, e.target.value, false)} />
      )}
    </label>
  );
}

export function ApplicationDrawerView(p: ApplicationDrawerViewProps) {
  const { app: a, onField } = p;
  const fallbackRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (p.fallbackText !== null) fallbackRef.current?.select();
  }, [p.fallbackText]);

  const fuentes = p.sources.includes(a.fuente) || !a.fuente ? p.sources : [...p.sources, a.fuente];

  return (
    <>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-2xl font-extrabold">{a.empresa || "Sin empresa"}</h2>
          <div className="text-muted">{a.puesto || "Sin puesto"}</div>
        </div>
        <button type="button" className={btn} aria-label="Cerrar" onClick={p.onClose}>
          Cerrar
        </button>
      </div>

      <div className={panel}>
        <h3 className="mb-3 text-base font-bold">Match con tu CV</h3>
        <MatchView match={p.match} onGoCv={p.onGoCv} />
        <div className={`${row} mt-3`}>
          <button type="button" className={btn} onClick={p.onRecalc}>
            Recalcular
          </button>
        </div>
      </div>

      <div className={section}>
        <h3 className="mb-2 text-base font-bold">Informe de Job Matching</h3>
        <p className="mb-3 mt-1 text-xs text-muted">
          Análisis FODA, porcentaje de matching y recomendaciones para postularte, a partir de tu CV y esta oferta.
        </p>
        <div className={row}>
          <button type="button" className={btn} onClick={p.onCopyPrompt}>
            Copiar prompt completo
          </button>
          {a.report ? (
            <button type="button" className={btn} onClick={p.onCopyReport}>
              Copiar informe
            </button>
          ) : null}
        </div>
        <p className="mt-2 text-xs text-muted">
          En esta vista no se puede generar el informe dentro de la página. Copiá el prompt y pegalo en Claude.
        </p>
        {p.aiAsk ? (
          <div className="mt-3">
            <Notice tone="warn">
              <b>Antes de compartir con una IA</b>
              <br />
              Se va a copiar esto: el texto de tu CV (sin emails ni teléfonos detectados), tu titular, años de experiencia, inglés, skills adicionales y la
              descripción de esta oferta{p.shareName ? ", y tu nombre" : ". Tu nombre no se incluye"}. Revisá tu CV por datos que prefieras no compartir
              (dirección, documentos, etc.). La IA sugiere; la decisión es tuya.
              <div className={`${row} mt-2.5`}>
                <button type="button" className={btnPrimary} onClick={p.onAiGo}>
                  Entiendo, copiar prompt
                </button>
                <button type="button" className={btn} onClick={p.onAiNo}>
                  Cancelar
                </button>
              </div>
            </Notice>
          </div>
        ) : null}
        {p.fallbackText !== null ? (
          <textarea ref={fallbackRef} className={`${input} mt-2.5 font-mono`} rows={6} readOnly value={p.fallbackText} aria-label="Texto para copiar" />
        ) : null}
        {a.report ? (
          <>
            <div className="mt-2.5">
              <ReportView source={a.report} />
            </div>
            <p className="mt-2.5 text-xs text-muted">
              La IA sugiere; vos decidís. Verificá el informe antes de usarlo: puede contener errores o datos inventados.
            </p>
            {p.iaModule ? (
              <>
                <label className={`${fieldLabel} mt-2 justify-end`}>
                  <span className="flex items-center gap-2 text-[13px] text-ink">
                    <input type="checkbox" checked={a.revisado} onChange={(e) => onField("revisado", e.target.checked, true)} /> Revisé el informe contra mi CV y la
                    oferta; la decisión es mía
                  </span>
                </label>
                <label className={`${fieldLabel} mt-2`}>
                  Qué corregí o descarté
                  <textarea className={`${input} resize-y leading-normal`} rows={2} value={a.hallazgos} onChange={(e) => onField("hallazgos", e.target.value, false)} />
                </label>
              </>
            ) : null}
          </>
        ) : null}
      </div>

      <div className={section}>
        <h3 className="mb-3 text-base font-bold">Postulación</h3>
        <div className={fieldsGrid}>
          <Text app={a} path="empresa" label="Empresa" onField={onField} />
          <Text app={a} path="puesto" label="Puesto" onField={onField} />
          <Text app={a} path="link" label="Link de la oferta" placeholder="https://…" onField={onField} />
          <label className={fieldLabel}>
            Fuente
            <select className={input} value={a.fuente} onChange={(e) => onField("fuente", e.target.value, true)}>
              <option value="">—</option>
              {fuentes.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className={fieldLabel}>
            Estado
            <select className={input} value={a.estado} onChange={(e) => onField("estado", e.target.value, true)}>
              {ESTADOS.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </label>
          <label className={fieldLabel}>
            Fecha de postulación
            <input className={input} type="date" value={a.fecha} onChange={(e) => onField("fecha", e.target.value, true)} />
          </label>
          <Text app={a} path="respuesta" label="Respuesta recibida" onField={onField} />
          <Text app={a} path="reclutador" label="Reclutador/a" onField={onField} />
          <Text app={a} path="contacto" label="Contacto (LinkedIn o email)" onField={onField} />
        </div>
        {a.link ? (
          <p className="mt-2.5">
            <a href={a.link} target="_blank" rel="noopener" className="text-accent">
              Abrir la oferta ↗
            </a>
          </p>
        ) : null}
        <label className={`${fieldLabel} mt-3`}>
          Próximos pasos
          <textarea className={`${input} resize-y leading-normal`} rows={2} value={a.proximos} onChange={(e) => onField("proximos", e.target.value, false)} />
        </label>
        <label className={`${fieldLabel} mt-3`}>
          Comentarios
          <textarea className={`${input} resize-y leading-normal`} rows={3} value={a.comentarios} onChange={(e) => onField("comentarios", e.target.value, false)} />
        </label>
      </div>

      <PreInterview app={a} onChange={onField} />
      <Interviews app={a} onChange={onField} onAdd={p.onAddInterview} onRemove={p.onRemoveInterview} />

      <div className={section}>
        <h3 className="mb-2 text-base font-bold">Descripción del puesto</h3>
        <textarea
          className={`${input} resize-y leading-normal`}
          rows={9}
          value={a.jd}
          placeholder="Pegá la job description para calcular el match"
          onChange={(e) => onField("jd", e.target.value, false)}
        />
      </div>

      <Collapsible title="Ficha de la empresa (antes de la entrevista)">
        <div className="grid gap-4">
          <div className={fieldsGrid}>
            <FichaText app={a} k="industria" label="Industria / sector" onField={onField} />
            <FichaText app={a} k="tamano" label="Tamaño" onField={onField} />
            <FichaText app={a} k="modalidad" label="Modalidad" placeholder="Remoto, híbrido…" onField={onField} />
          </div>
          <FichaText app={a} k="valores" label="Misión, visión y valores declarados" area onField={onField} />
          <FichaText app={a} k="cultura" label="Cultura laboral (Glassdoor, LinkedIn)" area onField={onField} />
          <FichaText app={a} k="notas" label="Notas: recruiters, novedades, gente conocida" area onField={onField} />
        </div>
      </Collapsible>

      <div className={`${row} mt-3.5`}>
        {p.confirmDel ? (
          <>
            <span>¿Eliminar esta postulación?</span>
            <button type="button" className={btnDanger} onClick={p.onDelYes}>
              Sí, eliminar
            </button>
            <button type="button" className={btn} onClick={p.onDelNo}>
              Cancelar
            </button>
          </>
        ) : (
          <button type="button" className={btnGhostDanger} onClick={p.onDelAsk}>
            Eliminar postulación
          </button>
        )}
      </div>
    </>
  );
}
