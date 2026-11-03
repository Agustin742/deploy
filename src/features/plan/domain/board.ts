import type { AppState } from "@/features/state/domain/types";
import { indicatorValue, type Indicator } from "./indicators";
import { visVars } from "./variables";

export interface BoardRow {
  /** Key under which the person's own goal is stored in `state.metas`, e.g. `networking:a0`. */
  key: string;
  kind: "act" | "res";
  label: string;
  value: string;
  fixedGoal?: string;
}

export interface BoardVariable {
  id: string;
  name: string;
  tab: string;
  /** True for proposals still to validate. */
  proposal: boolean;
  rows: BoardRow[];
}

/** Indicators of the selected variables for the week board: activity first, then results. */
export function buildBoard(state: AppState, ids: readonly string[], today: string): BoardVariable[] {
  const ctx = { state, today };
  return visVars(state)
    .filter((v) => ids.includes(v.id))
    .map((v) => {
      const row = (kind: "act" | "res", i: number, [label, fn, fixedGoal]: Indicator): BoardRow => ({
        key: `${v.id}:${kind[0]}${i}`,
        kind,
        label,
        value: String(indicatorValue(fn, ctx)),
        fixedGoal,
      });
      return {
        id: v.id,
        name: v.n,
        tab: v.tab,
        proposal: v.t === "prop",
        rows: [...v.act.map((x, i) => row("act", i, x)), ...v.res.map((x, i) => row("res", i, x))],
      };
    });
}
