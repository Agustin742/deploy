import { ESTADOS } from "@/features/applications/domain/applications";
import { MatchView } from "@/features/matching/ui/match-view";
import type { Draft, MatchResult } from "@/features/state/domain/types";
import { PageHead, Select } from "@/shared/ui/primitives";
import { buttonClass, fieldLabel, input, panel } from "@/shared/ui/styles";

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

const textLink =
  "cursor-pointer rounded-control text-small font-semibold text-accent underline underline-offset-4 hover:no-underline";

/** One-line result shown in the closed match block. */
function matchSummary(match: MatchResult): string {
  if (!match) return "Pegá la oferta para calcularlo";
  if ("err" in match) return match.err === "cv" ? "Falta tu CV" : "Falta la descripción";
  return `${match.pct}%`;
}

export function NewOfferView({ draft, sources, match, onField, onExample, onClear, onSave, onGoCv }: NewOfferViewProps) {
  const firstUse = !draft.link && !draft.jd && !draft.empresa && !draft.puesto;

  return (
    <>
      <PageHead title="Cargar postulación">
        Pegá el link o el texto de la oferta. La fuente se detecta sola y el match se calcula mientras escribís.
      </PageHead>

      <div
        className={`${panel} grid gap-4`}
        onKeyDown={(e) => {
          // Ctrl/Cmd+Enter saves from any field, including the multi-line description.
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            onSave();
          }
        }}
      >
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
          Descripción del puesto (job description)
          <textarea
            className={`${input} resize-y leading-normal`}
            rows={10}
            value={draft.jd}
            placeholder="Pegá acá los requisitos y responsabilidades de la oferta…"
            onChange={(e) => onField("jd", e.target.value, false)}
          />
          <span className="text-caption font-normal">
            La página no puede abrir el link para leerlo: el cálculo usa el texto que pegues.
          </span>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className={fieldLabel}>
            Empresa
            <input
              className={input}
              value={draft.empresa}
              placeholder="Ej. Mercado Libre"
              onChange={(e) => onField("empresa", e.target.value, false)}
            />
          </label>
          <label className={fieldLabel}>
            Puesto
            <input
              className={input}
              value={draft.puesto}
              placeholder="Ej. Frontend Developer"
              onChange={(e) => onField("puesto", e.target.value, false)}
            />
          </label>
        </div>

        <details className="group rounded-card border border-line">
          <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between px-4 text-small font-semibold [&::-webkit-details-marker]:hidden">
            Más detalles
            <span aria-hidden="true" className="font-mono after:content-['+'] group-open:after:content-['–']" />
          </summary>
          <div className="grid gap-4 border-t border-line p-4 sm:grid-cols-2">
            <label className={fieldLabel}>
              Fuente
              <Select value={draft.fuente} onChange={(e) => onField("fuente", e.target.value, true)}>
                <option value="">Elegir…</option>
                {sources.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </label>
            <label className={fieldLabel}>
              Estado
              <Select value={draft.estado} onChange={(e) => onField("estado", e.target.value, true)}>
                {ESTADOS.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </Select>
            </label>
          </div>
        </details>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <button type="button" className={buttonClass("cta", "lg")} onClick={onSave}>
            Guardar postulación
          </button>
          <span className="hidden text-caption text-muted sm:inline">o Ctrl/⌘ + Enter</span>
          <button type="button" className={`${textLink} sm:ml-auto`} onClick={onClear}>
            Limpiar
          </button>
        </div>

        {firstUse ? (
          <p className="text-small text-muted">
            ¿Primera vez?{" "}
            <button type="button" className={textLink} onClick={onExample}>
              Probar con una oferta de ejemplo
            </button>
          </p>
        ) : null}
      </div>

      <details className="group mt-4 rounded-card border border-line bg-surface">
        <summary className="flex min-h-12 cursor-pointer list-none flex-wrap items-center justify-between gap-2 px-4 py-2 [&::-webkit-details-marker]:hidden">
          <span className="font-display text-section font-bold">Match con tu CV</span>
          <span className="flex items-center gap-2 font-mono text-small text-muted">
            {matchSummary(match)}
            <span aria-hidden="true" className="after:content-['+'] group-open:after:content-['–']" />
          </span>
        </summary>
        <div className="border-t border-line p-4">
          <MatchView match={match} onGoCv={onGoCv} />
        </div>
      </details>
    </>
  );
}
