import {
  ECOLOR,
  EN_PROCESO,
  ESTADOS,
  SIN_RESPUESTA,
  type ColorToken,
} from "@/features/applications/domain/applications";
import { lastRed, postsWeek, sentApps } from "@/features/plan/domain/metrics";
import type { AppState } from "@/features/state/domain/types";
import { mondayOf, MESES, pad } from "@/shared/lib/dates";

export interface StateCount {
  estado: string;
  count: number;
  tone: ColorToken;
  /** Share of all applications, 0-100. */
  pct: number;
}

export interface SourceCount {
  name: string;
  count: number;
  /** Relative to the most frequent source, 0-100. */
  pct: number;
}

export interface Summary {
  monthLabel: string;
  year: string;
  totalApps: number;
  sentThisMonth: number;
  /** Monthly goal, 0 when not set. */
  goal: number;
  goalPct: number;
  /** Connections of the latest network record, null while there is none. */
  latestConnections: string | null;
  inProgress: number;
  /** Percentage of sent applications that got an answer, null while nothing was sent. */
  responseRate: number | null;
  /** Average match of the analysed applications, null while there are none. */
  avgMatch: number | null;
  week: { posts: number; sent: number; network: number };
  platformsToday: { done: number; total: number; pct: number };
  monthly: { counts: number[]; max: number; currentIndex: number };
  states: StateCount[];
  sources: SourceCount[];
}

/** Everything the Resumen tab shows, derived from the state. `today` replaces the global clock. */
export function computeSummary(state: AppState, today: string): Summary {
  const apps = state.apps;
  const sent = sentApps(state);
  const monthKey = today.slice(0, 7);
  const year = today.slice(0, 4);
  const monday = mondayOf(today);
  const monthIndex = +today.slice(5, 7) - 1;

  const sentThisMonth = sent.filter((a) => a.fecha.slice(0, 7) === monthKey).length;
  const answered = sent.filter((a) => !SIN_RESPUESTA.includes(a.estado)).length;
  const analysed = apps.filter((a) => a.match && a.match.pct != null);
  const goal = state.goal > 0 ? state.goal : 0;

  const counts = Array.from({ length: 12 }, (_, i) =>
    sent.filter((a) => a.fecha.startsWith(`${year}-${pad(i + 1)}`)).length,
  );

  const sourceTotals: Record<string, number> = {};
  sent.forEach((a) => {
    const name = a.fuente || "Sin fuente";
    sourceTotals[name] = (sourceTotals[name] || 0) + 1;
  });
  const topSources = Object.entries(sourceTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  const topSourceCount = Math.max(1, ...topSources.map((x) => x[1]));

  const checks = state.checks[monthKey] || {};
  const day = +today.slice(8);
  const platformsDone = state.platforms.filter((p) => (checks[p.id] || []).includes(day)).length;
  const lastConnections = lastRed(state)?.conexiones;

  return {
    monthLabel: MESES[monthIndex],
    year,
    totalApps: apps.length,
    sentThisMonth,
    goal,
    goalPct: goal ? Math.min(100, Math.round((sentThisMonth / goal) * 100)) : 0,
    latestConnections: lastConnections !== undefined && lastConnections !== "" ? lastConnections : null,
    inProgress: apps.filter((a) => EN_PROCESO.includes(a.estado)).length,
    responseRate: sent.length ? Math.round((answered / sent.length) * 100) : null,
    avgMatch: analysed.length
      ? Math.round(analysed.reduce((s, a) => s + (a.match as { pct: number }).pct, 0) / analysed.length)
      : null,
    week: {
      posts: postsWeek(state, monday),
      sent: sent.filter((a) => a.fecha >= monday).length,
      network: state.red.filter((r) => r.fecha >= monday).length,
    },
    platformsToday: {
      done: platformsDone,
      total: state.platforms.length,
      pct: state.platforms.length ? (platformsDone / state.platforms.length) * 100 : 0,
    },
    monthly: { counts, max: Math.max(1, ...counts), currentIndex: monthIndex },
    states: ESTADOS.map((estado) => {
      const count = apps.filter((a) => a.estado === estado).length;
      return { estado, count, tone: ECOLOR[estado], pct: (count / Math.max(1, apps.length)) * 100 };
    }),
    sources: topSources.map(([name, count]) => ({ name, count, pct: (count / topSourceCount) * 100 })),
  };
}
