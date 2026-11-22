import type { ReactNode } from "react";

/** Decorative stage: a soft panel that frames a mini UI and never overflows on narrow screens. */
function Stage({ children }: { children: ReactNode }) {
  return (
    <div
      aria-hidden="true"
      className="lift w-full min-w-0 select-none overflow-hidden rounded-hero border border-line bg-soft p-4 sm:p-6"
    >
      <div className="rounded-card border border-line bg-surface p-4 shadow-card sm:p-5">{children}</div>
    </div>
  );
}

function FieldMock({ label, value, filled = true }: { label: string; value: string; filled?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="text-caption font-medium text-muted">{label}</div>
      <div
        className={`mt-1 truncate rounded-control border border-line-strong bg-surface px-3 py-2 text-small ${
          filled ? "text-ink" : "text-muted"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

/** Mini "Cargar postulación" form: link filled, company and role, match badge and the lime save button. */
export function ApplicationFormMock() {
  return (
    <Stage>
      <div className="flex items-center justify-between gap-3">
        <b className="font-display text-section font-bold">Cargar postulación</b>
        <span className="rounded-full border border-line px-2 py-px text-caption text-muted">Ejemplo</span>
      </div>
      <div className="mt-4 grid gap-3">
        <FieldMock label="Link de la oferta" value="https://empresa.com/empleos/frontend-dev" />
        <div className="grid grid-cols-2 gap-3">
          <FieldMock label="Empresa" value="Acme Tech" />
          <FieldMock label="Puesto" value="Frontend Developer" />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-ok/40 bg-ok/10 px-2.5 py-1 text-caption font-semibold text-ok">
          <span className="size-1.5 rounded-full bg-ok" />
          Match 82%
        </span>
        <span className="inline-flex min-h-10 items-center rounded-control border border-lime bg-lime px-5 text-body font-bold text-lime-ink shadow-card">
          Guardar
        </span>
      </div>
    </Stage>
  );
}

const MONTHS = [
  ["Jun", 8],
  ["Jul", 11],
  ["Ago", 9],
  ["Sep", 14],
  ["Oct", 16],
  ["Nov", 18],
] as const;

const STATUSES = [
  ["Enviadas", 18, "bg-accent"],
  ["Con respuesta", 8, "bg-info"],
  ["Entrevista", 4, "bg-ok"],
  ["Oferta", 1, "bg-lime"],
] as const;

/** Mini dashboard: KPI row, monthly bars and status bars with plausible sample numbers. */
export function DashboardMock() {
  const max = Math.max(...MONTHS.map(([, n]) => n));
  return (
    <Stage>
      <div className="flex items-center justify-between gap-3">
        <b className="font-display text-section font-bold">Resumen</b>
        <span className="rounded-full border border-line px-2 py-px text-caption text-muted">Ejemplo</span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
        {[
          ["18/20", "Este mes"],
          ["9", "En curso"],
          ["44%", "Respuesta"],
        ].map(([value, label]) => (
          <div key={label} className="min-w-0 rounded-control border border-line p-2.5 sm:p-3">
            <div className="font-display text-section font-extrabold tabular-nums sm:text-title">{value}</div>
            <div className="truncate text-caption text-muted">{label}</div>
          </div>
        ))}
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="min-w-0 rounded-control border border-line p-3">
          <div className="text-caption font-medium text-muted">Postulaciones por mes</div>
          <div className="mt-3 flex h-24 items-end gap-1.5">
            {MONTHS.map(([month, n], i) => (
              <div key={month} className="flex h-full min-w-0 flex-1 flex-col justify-end gap-1">
                <div
                  className={`rounded-t ${i === MONTHS.length - 1 ? "bg-accent" : "bg-accent/40"}`}
                  style={{ height: `${(n / max) * 100}%` }}
                />
                <span className="text-center text-[0.625rem] leading-none text-muted">{month}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="min-w-0 rounded-control border border-line p-3">
          <div className="text-caption font-medium text-muted">Por estado</div>
          <ul className="mt-3 grid gap-2.5">
            {STATUSES.map(([label, n, tone]) => (
              <li key={label} className="grid grid-cols-[4.5rem_1fr_1.25rem] items-center gap-2 text-caption">
                <span className="truncate text-muted">{label}</span>
                <span className="h-2 rounded-full bg-soft">
                  <span className={`block h-full rounded-full ${tone}`} style={{ width: `${(n / 18) * 100}%` }} />
                </span>
                <span className="text-right tabular-nums">{n}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Stage>
  );
}
