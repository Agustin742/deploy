import { ESTADOS } from "@/features/applications/domain/applications";
import { MatchView } from "@/features/matching/ui/match-view";
import type { Draft, MatchResult } from "@/features/state/domain/types";
import { PageHead } from "@/shared/ui/primitives";
import { btn, btnGhost, btnPrimary, fieldLabel, fieldsGrid, gridTwo, input, panel, row } from "@/shared/ui/styles";

export interface NewOfferViewProps {
  draft: Draft;
  sources: readonly string[];
  match: MatchResult;
  /** `immediate` is true for selects, which save right away. */
  onField: (key: keyof Draft, value: string, immediate: boolean) => void;
  onExample: () => void;
  onClear: () => void;
  onSave: () => void;
  onGoCv: () => void;
}

export function NewOfferView({ draft, sources, match, onField, onExample, onClear, onSave, onGoCv }: NewOfferViewProps) {
  return (
    <>
      <PageHead title="Nueva oferta">Pegá el texto de la oferta y el match se calcula mientras escribís.</PageHead>
      <div className={`${gridTwo}`}>
        <div className={panel}>
          <div className={fieldsGrid}>
            <label className={fieldLabel}>
              Empresa
              <input className={input} value={draft.empresa} placeholder="Ej. Mercado Libre" onChange={(e) => onField("empresa", e.target.value, false)} />
            </label>
            <label className={fieldLabel}>
              Puesto
              <input className={input} value={draft.puesto} placeholder="Ej. Frontend Developer" onChange={(e) => onField("puesto", e.target.value, false)} />
            </label>
            <label className={fieldLabel}>
              Link de la oferta
              <input
                className={input}
                value={draft.link}
                placeholder="https://www.linkedin.com/jobs/view/…"
                onChange={(e) => onField("link", e.target.value, false)}
              />
            </label>
            <label className={fieldLabel}>
              Fuente
              <select className={input} value={draft.fuente} onChange={(e) => onField("fuente", e.target.value, true)}>
                <option value="">Elegir…</option>
                {sources.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className={fieldLabel}>
              Estado
              <select className={input} value={draft.estado} onChange={(e) => onField("estado", e.target.value, true)}>
                {ESTADOS.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className={`${fieldLabel} mt-3`}>
            Descripción del puesto (job description)
            <textarea
              className={`${input} resize-y leading-normal`}
              rows={14}
              value={draft.jd}
              placeholder="Pegá acá los requisitos y responsabilidades de la oferta…"
              onChange={(e) => onField("jd", e.target.value, false)}
            />
          </label>
          <p className="mt-1.5 text-xs text-muted">
            El link se guarda y la fuente se detecta sola. La página no puede abrir el link para leerlo, por eso el cálculo usa el texto que pegues.
          </p>
          <div className={`${row} mt-3.5`}>
            <button type="button" className={btnPrimary} onClick={onSave}>
              Guardar postulación
            </button>
            <button type="button" className={btn} onClick={onExample}>
              Probar con una oferta de ejemplo
            </button>
            <button type="button" className={btnGhost} onClick={onClear}>
              Limpiar
            </button>
          </div>
        </div>
        <div className={`${panel} self-start`}>
          <h3 className="mb-3 text-base font-bold">Match con tu CV</h3>
          <MatchView match={match} onGoCv={onGoCv} />
        </div>
      </div>
    </>
  );
}
