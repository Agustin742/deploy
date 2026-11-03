import { Bar, Chip, EmptyState } from "@/shared/ui/primitives";
import { band, ENG_TXT } from "../domain/engine";
import type { MatchResult } from "@/features/state/domain/types";

const CIRCUMFERENCE = 2 * Math.PI * 44;

const sectionLabel = "mb-1 mt-3 font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-muted";

export interface MatchViewProps {
  /** Null when nothing was calculated yet. */
  match: MatchResult | null;
  /** Called by the "Cargalo acá" link shown when the CV is missing. */
  onGoCv?: () => void;
}

/** Result of the match engine: ring, components, skills and keywords. Presentational. */
export function MatchView({ match, onGoCv }: MatchViewProps) {
  if (!match) {
    return <EmptyState title="Todavía no hay porcentaje">Pegá el texto de la oferta y el cálculo aparece acá.</EmptyState>;
  }
  if ("err" in match) {
    return match.err === "cv" ? (
      <EmptyState title="Falta tu CV">
        El porcentaje se calcula contra tu CV.{" "}
        <a
          href="#cv"
          className="text-accent"
          onClick={(e) => {
            e.preventDefault();
            onGoCv?.();
          }}
        >
          Cargalo acá
        </a>
        .
      </EmptyState>
    ) : (
      <EmptyState title="Pegá el texto de la oferta">
        Con el link solo no se puede leer la página. Copiá la descripción del puesto en el cuadro de texto y el cálculo se hace solo.
      </EmptyState>
    );
  }

  const [tone, label] = band(match.pct);
  const have = match.hardM.concat(match.softM);
  const missing = match.hardX.concat(match.softX);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-[18px]">
        <div>
          <div className="relative size-[104px] flex-none">
            <svg width="104" height="104" viewBox="0 0 104 104" className="-rotate-90" aria-hidden="true">
              <circle cx="52" cy="52" r="44" fill="none" stroke="var(--soft)" strokeWidth="9" />
              <circle
                cx="52"
                cy="52"
                r="44"
                fill="none"
                stroke={`var(--${tone})`}
                strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={`${((match.pct / 100) * CIRCUMFERENCE).toFixed(1)} ${CIRCUMFERENCE.toFixed(1)}`}
              />
            </svg>
            <b className="absolute inset-0 grid place-items-center font-display text-[26px] font-semibold">{match.pct}%</b>
          </div>
          <small className="-mt-3.5 block text-center text-[11px] font-medium text-muted">Match {label.toLowerCase()}</small>
        </div>
        <div className="min-w-0 flex-[1_1_220px]">
          {match.comps.map((c) =>
            c.s === null ? (
              <div key={c.k} className="my-[5px] grid grid-cols-[130px_1fr_40px] items-center gap-2 text-xs text-muted max-[560px]:grid-cols-[96px_1fr_38px]">
                <span>{c.k}</span>
                <span>{c.d}</span>
                <span />
              </div>
            ) : (
              <div key={c.k}>
                <div className="my-[5px] grid grid-cols-[130px_1fr_40px] items-center gap-2 text-xs max-[560px]:grid-cols-[96px_1fr_38px]">
                  <span>{c.k}</span>
                  <Bar pct={Math.round(c.s * 100)} tone={band(c.s * 100)[0]} />
                  <span className="text-right font-mono tabular-nums">{Math.round(c.s * 100)}%</span>
                </div>
                <div className="-mt-[3px] mb-1 ml-[138px] text-xs text-muted">{c.d}</div>
              </div>
            ),
          )}
        </div>
      </div>
      {match.hardM.length ? (
        <>
          <div className={sectionLabel}>Skills que ya tenés y piden</div>
          {have.map((s) => (
            <Chip key={s} tone="ok">
              {s}
            </Chip>
          ))}
        </>
      ) : null}
      {missing.length ? (
        <>
          <div className={sectionLabel}>Skills que te faltan</div>
          {missing.map((s) => (
            <Chip key={s} tone="bad">
              {s}
            </Chip>
          ))}
        </>
      ) : null}
      {match.kwX.length ? (
        <>
          <div className={sectionLabel}>Palabras de la oferta que no aparecen en tu CV</div>
          {match.kwX.map((s) => (
            <Chip key={s}>{s}</Chip>
          ))}
        </>
      ) : null}
      <div className={sectionLabel}>
        Inglés · {match.eng.status}
        {match.eng.req ? ` (piden ${ENG_TXT[match.eng.req]})` : ""}
      </div>
      <p className="mt-3 text-xs text-muted">
        Estimación orientativa con reglas propias de esta herramienta. Sirve para ordenar tu lectura; la decisión de postularte es tuya.
      </p>
    </div>
  );
}
