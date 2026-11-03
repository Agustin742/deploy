import type { CSSProperties, ReactNode } from "react";

export type Tone = "ok" | "warn" | "bad" | "info" | "neutral";
export type BarTone = Tone | "accent";

/** CSS color variable of a tone ("neutral" uses the muted color). */
const toneVar = (tone: BarTone): string =>
  `var(--${tone === "neutral" ? "muted" : tone})`;

const colorVar = (tone: BarTone): CSSProperties => ({ "--c": toneVar(tone) }) as CSSProperties;

export function Chip({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className="my-0.5 mr-1 inline-block rounded-full border border-[color-mix(in_srgb,var(--c)_30%,transparent)] bg-[color-mix(in_srgb,var(--c)_14%,transparent)] px-[9px] py-0.5 text-xs text-[var(--c)]"
      style={colorVar(tone)}
    >
      {children}
    </span>
  );
}

export function Tag({ result = false, children }: { result?: boolean; children: ReactNode }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full border px-[7px] py-px font-mono text-[10px] font-medium uppercase tracking-[0.06em] ${
        result ? "border-accent/40 text-accent" : "border-line text-muted"
      }`}
    >
      {children}
    </span>
  );
}

/** Horizontal progress bar; `pct` is 0-100. */
export function Bar({ pct, tone = "accent", className = "" }: { pct: number; tone?: BarTone; className?: string }) {
  const width = Number.isFinite(pct) ? Math.max(0, Math.min(100, pct)) : 0;
  return (
    <div className={`h-2 overflow-hidden rounded-full bg-soft ${className}`}>
      <i className="block h-full rounded-full" style={{ width: `${width}%`, background: toneVar(tone) }} />
    </div>
  );
}

/** Label, bar and value on one line (the legacy `.hrow`). */
export function BarRow({
  label,
  pct,
  value,
  tone = "accent",
  title,
  mono = false,
}: {
  label: string;
  pct: number;
  value: ReactNode;
  tone?: BarTone;
  title?: string;
  mono?: boolean;
}) {
  return (
    <div className="my-[7px] grid grid-cols-[120px_1fr_28px] items-center gap-2.5 text-[13px] max-[560px]:grid-cols-[90px_1fr_24px]">
      <span className={`truncate ${mono ? "font-mono text-xs" : ""}`} title={title}>
        {label}
      </span>
      <Bar pct={pct} tone={tone} />
      <span className="font-mono tabular-nums">{value}</span>
    </div>
  );
}

export function Notice({ tone = "neutral", children }: { tone?: "info" | "warn" | "neutral"; children: ReactNode }) {
  return (
    <div
      className="mb-3.5 rounded-[10px] border border-[color-mix(in_srgb,var(--c)_30%,transparent)] bg-[color-mix(in_srgb,var(--c)_10%,transparent)] px-3 py-2.5 text-[13px]"
      style={colorVar(tone)}
    >
      {children}
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-line px-5 py-7 text-center text-muted">
      <b className="mb-1 block font-display text-[17px] font-extrabold text-ink">{title}</b>
      {children}
    </div>
  );
}

export function PageHead({
  title,
  action,
  children,
  as: Heading = "h2",
}: {
  title: string;
  action?: ReactNode;
  children?: ReactNode;
  as?: "h2" | "h3";
}) {
  return (
    <div className="mb-4 mt-3.5 flex flex-wrap items-end justify-between gap-2.5">
      <div>
        <Heading className={Heading === "h2" ? "text-2xl font-extrabold" : "text-base font-bold"}>{title}</Heading>
        {children ? <p className="mt-0.5 text-muted">{children}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Kpi({
  value,
  label,
  kind,
  valueClassName = "text-[32px]",
}: {
  value: ReactNode;
  label: ReactNode;
  kind?: "act" | "res";
  valueClassName?: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface px-4 py-3.5">
      <div className={`font-display font-extrabold leading-[1.1] tabular-nums ${valueClassName}`}>{value}</div>
      <div className="text-xs text-muted">{label}</div>
      {kind ? (
        <div className="mt-1.5">
          <Tag result={kind === "res"}>{kind === "res" ? "Resultado" : "Actividad"}</Tag>
        </div>
      ) : null}
    </div>
  );
}
