import { ENG_TXT } from "@/features/matching/domain/engine";
import type { Application } from "@/features/state/domain/types";

export interface RequestedSkill {
  skill: string;
  count: number;
  /** The CV already has it. */
  have: boolean;
}

export interface Analysis {
  /** Offers with a computed match. */
  analyzed: number;
  /** Offers without one (no description, or no CV when it was computed). */
  withoutMatch: number;
  avgPct: number;
  english: {
    asking: number;
    askingPct: number;
    met: number;
    levels: Array<[label: string, count: number]>;
    notAsking: number;
  };
  /** Most missing skills, most frequent first. */
  topMissing: Array<[skill: string, count: number]>;
  topMissingName: string | null;
  requested: RequestedSkill[];
}

const TOP_MISSING = 15;
const TOP_REQUESTED = 10;

/** Aggregates the stored matches of all offers; null when none has been analysed. */
export function analyze(apps: readonly Application[]): Analysis | null {
  const matches = apps.flatMap((a) => (a.match && a.match.pct != null ? [a.match] : []));
  if (!matches.length) return null;
  const n = matches.length;

  const asking = matches.filter((m) => m.eng && m.eng.req > 0);
  const missCount = new Map<string, number>();
  const haveCount = new Map<string, number>();
  const bump = (map: Map<string, number>, k: string) => map.set(k, (map.get(k) ?? 0) + 1);
  matches.forEach((m) => {
    m.hardX.concat(m.softX).forEach((k) => bump(missCount, k));
    m.hardM.concat(m.softM).forEach((k) => bump(haveCount, k));
  });

  const topMissing = [...missCount.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, TOP_MISSING);

  const totals = new Map<string, number>();
  [...missCount.keys(), ...haveCount.keys()].forEach((k) => totals.set(k, (missCount.get(k) ?? 0) + (haveCount.get(k) ?? 0)));
  const requested = [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_REQUESTED)
    .map(([skill, count]) => ({ skill, count, have: haveCount.has(skill) }));

  return {
    analyzed: n,
    withoutMatch: apps.length - n,
    avgPct: Math.round(matches.reduce((t, m) => t + m.pct, 0) / n),
    english: {
      asking: asking.length,
      askingPct: Math.round((asking.length / n) * 100),
      met: asking.filter((m) => m.eng.status === "Cumple").length,
      levels: [1, 2, 3].map((i) => [ENG_TXT[i], asking.filter((m) => m.eng.req === i).length]),
      notAsking: n - asking.length,
    },
    topMissing,
    topMissingName: topMissing[0]?.[0] ?? null,
    requested,
  };
}
