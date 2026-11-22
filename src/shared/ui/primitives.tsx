import type { ButtonHTMLAttributes, CSSProperties, ReactNode, SelectHTMLAttributes } from "react";
import { buttonClass, type ButtonSize, type ButtonVariant } from "./styles";

export type Tone = "ok" | "warn" | "bad" | "info" | "neutral";
export type BarTone = Tone | "accent";

/** CSS color variable of a tone ("neutral" uses the muted color). */
const toneVar = (tone: BarTone): string =>
  `var(--${tone === "neutral" ? "muted" : tone})`;

const colorVar = (tone: BarTone): CSSProperties => ({ "--c": toneVar(tone) }) as CSSProperties;

export function Chip({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className="inline-block rounded-full border border-[color-mix(in_srgb,var(--c)_30%,transparent)] bg-[color-mix(in_srgb,var(--c)_14%,transparent)] px-2.5 py-0.5 text-caption text-[var(--c)]"
      style={colorVar(tone)}
    >
      {children}
    </span>
  );
}

export function Tag({ result = false, children }: { result?: boolean; children: ReactNode }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full border px-2 py-px font-mono text-caption font-medium uppercase tracking-[0.04em] ${
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
    <div className="my-[7px] grid grid-cols-[120px_1fr_32px] items-center gap-2.5 text-small max-[560px]:grid-cols-[90px_1fr_28px]">
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
      className="mb-3.5 rounded-card border border-[color-mix(in_srgb,var(--c)_30%,transparent)] bg-[color-mix(in_srgb,var(--c)_10%,transparent)] px-3 py-2.5 text-small"
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
        <Heading className={Heading === "h2" ? "text-title font-extrabold" : "text-section font-bold"}>{title}</Heading>
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
  size = "md",
  valueClassName,
}: {
  value: ReactNode;
  label: ReactNode;
  kind?: "act" | "res";
  /** "lg" is for the hero row of a screen; "md" for supporting figures. */
  size?: "md" | "lg";
  valueClassName?: string;
}) {
  const large = size === "lg";
  return (
    <div className={`rounded-card border border-line bg-surface ${large ? "px-5 py-4 shadow-card" : "px-4 py-3.5"}`}>
      <div
        className={`font-display font-extrabold leading-[1.1] tabular-nums ${
          valueClassName ?? (large ? "text-[2.75rem]" : "text-[2rem]")
        }`}
      >
        {value}
      </div>
      <div className={`text-muted ${large ? "mt-1 text-small" : "text-caption"}`}>{label}</div>
      {kind ? (
        <div className="mt-2">
          <Tag result={kind === "res"}>{kind === "res" ? "Resultado" : "Actividad"}</Tag>
        </div>
      ) : null}
    </div>
  );
}

export type CardLevel = "hero" | "standard" | "quiet";

const cardClass: Record<CardLevel, string> = {
  hero: "card card-hero",
  standard: "card card-standard",
  quiet: "card card-quiet",
};

/** Surface with a visual weight: hero (elevated, accent border), standard panel, quiet (soft fill). */
export function Card({
  level = "standard",
  className = "",
  children,
  ...rest
}: { level?: CardLevel; className?: string; children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`${cardClass[level]} ${className}`.trim()} {...rest}>
      {children}
    </div>
  );
}

export function Button({
  variant = "secondary",
  size = "md",
  busy = false,
  className = "",
  type = "button",
  disabled,
  children,
  ...rest
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Marks the button as working: sets aria-busy and ignores clicks. */
  busy?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={`${buttonClass(variant, size)} ${className}`.trim()}
      aria-busy={busy || undefined}
      disabled={disabled || busy}
      {...rest}
    >
      {children}
    </button>
  );
}

/** Native select without the platform chrome: same 40px field as the inputs plus a chevron. */
export function Select({
  className = "",
  wrapperClassName = "",
  children,
  ...rest
}: { wrapperClassName?: string } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className={`relative min-w-0 ${wrapperClassName}`.trim()}>
      <select className={`field-input cursor-pointer appearance-none pr-9 ${className}`.trim()} {...rest}>
        {children}
      </select>
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m5 8 5 5 5-5" />
      </svg>
    </div>
  );
}
