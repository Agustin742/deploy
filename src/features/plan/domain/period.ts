import type { AppState, Revision } from "@/features/state/domain/types";
import { inRange, minTxt } from "@/shared/lib/dates";
import { sum } from "@/shared/lib/numbers";
import { sentApps } from "./metrics";

export interface PeriodSummary {
  sent: number;
  network: number;
  posts: number;
  interviews: number;
  realMinutes: number;
  estimatedMinutes: number;
}

/** Activity logged between `desde` and `hasta`, or null while the period is incomplete. */
export function periodSummary(
  state: AppState,
  period: Pick<Revision, "desde" | "hasta">,
): PeriodSummary | null {
  const { desde, hasta } = period;
  if (!desde || !hasta) return null;
  const within = (d: string | undefined) => inRange(d, desde, hasta);
  const times = state.tiempos.filter((x) => within(x.fecha));
  return {
    sent: sentApps(state).filter((a) => within(a.fecha)).length,
    network: state.red.filter((x) => within(x.fecha)).length,
    posts: state.posts.filter((x) => within(x.fecha)).length,
    interviews: sum(state.apps.map((a) => (a.entrevistas || []).filter((x) => within(x.fecha)).length)),
    realMinutes: sum(times.map((x) => x.real)),
    estimatedMinutes: sum(times.map((x) => x.est)),
  };
}

export const formatPeriodSummary = (s: PeriodSummary | null): string =>
  s
    ? `Actividad del período (calculada con lo que registraste): ${s.sent} postulaciones enviadas · ${s.network} registros de la red · ${s.posts} publicaciones o participaciones · ${s.interviews} entrevistas · tiempo real ${minTxt(s.realMinutes)} (estimado ${minTxt(s.estimatedMinutes)}).`
    : "Indicá el período (desde y hasta) y acá aparece el resumen de lo que hiciste.";
