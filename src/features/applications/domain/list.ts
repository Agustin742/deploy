import { band, type BandToken } from "@/features/matching/domain/engine";
import type { Application, MatchSuccess } from "@/features/state/domain/types";
import { norm } from "@/shared/lib/text";

export type SortKey = "fecha" | "match";
export type StatusFilter = string;

export interface ListQuery {
  /** "Todos" or one status. */
  filter: StatusFilter;
  q: string;
  sort: SortKey;
}

/** Applications after status filter, search and sort. Never mutates the input. */
export function visibleApps(apps: readonly Application[], { filter, q, sort }: ListQuery): Application[] {
  let list = apps.slice();
  if (filter !== "Todos") list = list.filter((a) => a.estado === filter);
  if (q) {
    const needle = norm(q);
    list = list.filter((a) =>
      norm([a.empresa, a.puesto, a.fuente, (a.match?.hardM ?? []).join(" "), (a.match?.hardX ?? []).join(" ")].join(" ")).includes(needle),
    );
  }
  list.sort(
    sort === "match"
      ? (a, b) => (b.match?.pct ?? -1) - (a.match?.pct ?? -1)
      : (a, b) => b.fecha.localeCompare(a.fecha),
  );
  return list;
}

/** Number of applications per status. */
export function countByStatus(apps: readonly Application[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const a of apps) counts[a.estado] = (counts[a.estado] ?? 0) + 1;
  return counts;
}

/** Hard then soft skills the offer asks for and the CV lacks. */
export const missingSkills = (match: MatchSuccess | null | undefined): string[] =>
  match ? match.hardX.concat(match.softX) : [];

const COINCIDENCE = {
  "Sí": { tone: "ok", label: "Alta" },
  Parcial: { tone: "warn", label: "Media" },
  No: { tone: "bad", label: "Baja" },
} as const;

export const coincidence = (match: MatchSuccess | null | undefined) =>
  match ? COINCIDENCE[match.cumple] : null;

/** Tone token of a match percentage. */
export const pctBand = (pct: number): BandToken => band(pct)[0];
