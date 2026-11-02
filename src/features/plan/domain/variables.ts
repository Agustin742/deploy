import type { AppState, Objetivo } from "@/features/state/domain/types";
import { mondayOf } from "@/shared/lib/dates";
import { VARS, type IndicatorVar } from "./indicators";

/** Variables available to the person: the program's own plus the proposals they enabled. */
export const visVars = (state: AppState): IndicatorVar[] =>
  VARS.filter((v) => !v.mod || state.mods[v.mod]);

export const varNames = (state: AppState): string[] =>
  VARS.filter((v) => v.id !== "bienestar" && (!v.mod || state.mods[v.mod])).map((v) => v.n);

/** Ids of the variables selected for the week that starts on `week`, ignoring hidden or unknown ones. */
export const weekVars = (state: AppState, week: string): string[] => {
  const ids = visVars(state).map((v) => v.id);
  return ((state.planVars || {})[week] || []).filter((id) => ids.includes(id));
};

/** Variable names an objective can be linked to. Weekly objectives prefer the week's selection. */
export const varOpts = (
  state: AppState,
  it: Pick<Objetivo, "periodo" | "semana">,
  today: string,
): string[] => {
  if (it.periodo === "Mensual") return varNames(state);
  const names = weekVars(state, it.semana || mondayOf(today)).map(
    (id) => (VARS.find((v) => v.id === id) as IndicatorVar).n,
  );
  return names.length ? names : varNames(state);
};
