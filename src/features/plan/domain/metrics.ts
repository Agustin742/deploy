import type { AppState, Application, RedRecord } from "@/features/state/domain/types";
import { addDays, inRange } from "@/shared/lib/dates";

/** Minimum weekly frequency defined by the program (post / take part). */
export const MIN_SEMANAL = 3;

/** Applications already sent (anything but "Por postular"). */
export const sentApps = (state: AppState): Application[] =>
  state.apps.filter((a) => a.estado !== "Por postular");

/** True when the company research sheet has at least one filled field. */
export const fichaOk = (a: Application): boolean =>
  Object.values(a.ficha || {}).some((x) => String(x || "").trim());

/** The three skills missing most often across analyzed offers, as a comma separated text. */
export const topMissingSkills = (state: AppState): string => {
  const counts: Record<string, number> = {};
  state.apps.forEach((a) => {
    if (a.match && a.match.pct != null) {
      a.match.hardX.concat(a.match.softX).forEach((k) => {
        counts[k] = (counts[k] || 0) + 1;
      });
    }
  });
  return (
    Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map((x) => x[0])
      .join(", ") || "—"
  );
};

export const redSorted = (state: AppState): RedRecord[] =>
  state.red.slice().sort((a, b) => (b.fecha || "").localeCompare(a.fecha || ""));

export const lastRed = (state: AppState): RedRecord | undefined => redSorted(state)[0];

type RedMetric = "conexiones" | "paginas";

/** Signed difference of a network metric between the last two records, or an em dash. */
export const redDiff = (state: AppState, k: RedMetric): string => {
  const list = redSorted(state);
  const a = list[0];
  const b = list[1];
  if (a && b && a[k] !== "" && b[k] !== "") {
    const d = +a[k] - +b[k];
    return (d >= 0 ? "+" : "") + d;
  }
  return "—";
};

/** Posts or participations in the week that starts on the given Monday. */
export const postsWeek = (state: AppState, monday: string): number =>
  state.posts.filter((p) => inRange(p.fecha, monday, addDays(monday, 6))).length;
