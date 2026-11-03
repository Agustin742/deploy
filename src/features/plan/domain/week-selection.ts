import type { AppState } from "@/features/state/domain/types";
import { addDays } from "@/shared/lib/dates";
import { MAX_VARS } from "./indicators";
import { weekVars } from "./variables";

export interface ToggleResult {
  /** False when the change was refused because the week already has the maximum of variables. */
  ok: boolean;
  state: AppState;
}

/** Selects or unselects a variable for the week that starts on `week`. */
export function toggleWeekVar(state: AppState, week: string, id: string, checked: boolean): ToggleResult {
  const current = weekVars(state, week);
  if (checked && current.length >= MAX_VARS) return { ok: false, state };
  const next = checked ? [...current, id] : current.filter((x) => x !== id);
  return { ok: true, state: { ...state, planVars: { ...state.planVars, [week]: next } } };
}

export const shiftWeek = (week: string, days: number): string => addDays(week, days);
