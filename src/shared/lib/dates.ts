export const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
] as const;

export const pad = (n: number): string => String(n).padStart(2, "0");

/** Formats a local date as YYYY-MM-DD. */
export const iso = (d: Date): string =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const todayIso = (): string => iso(new Date());

/** Parses YYYY-MM-DD at local midnight. */
export const parseD = (s: string): Date => new Date(`${s}T00:00:00`);

export const addDays = (s: string, n: number): string => {
  const x = parseD(s);
  x.setDate(x.getDate() + n);
  return iso(x);
};

export const mondayOf = (s: string): string => {
  const x = parseD(s);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return iso(x);
};

/** Inclusive range check; an empty bound is open-ended. */
export const inRange = (d: string | undefined | null, a?: string, b?: string): boolean =>
  !!d && (!a || d >= a) && (!b || d <= b);

export const fmtDate = (s?: string | null): string => {
  if (!s) return "";
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y.slice(2)}`;
};

export const minTxt = (m?: number | null): string => {
  const total = Math.round(m || 0);
  return total >= 60
    ? `${Math.floor(total / 60)} h${total % 60 ? " " + (total % 60) + " min" : ""}`
    : `${total} min`;
};
