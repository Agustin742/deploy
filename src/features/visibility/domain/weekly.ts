import { MIN_SEMANAL, postsWeek } from "@/features/plan/domain/metrics";
import type { AppState } from "@/features/state/domain/types";
import { addDays, mondayOf } from "@/shared/lib/dates";

export interface WeekCount {
  monday: string;
  count: number;
  meetsMinimum: boolean;
}

export interface WeeklyPosts {
  /** Last 8 weeks, oldest first. */
  weeks: WeekCount[];
  /** Posts in the current week. */
  current: number;
  /** Scale for the bars: the busiest week, never below the weekly minimum. */
  max: number;
}

export function weeklyPosts(state: AppState, today: string): WeeklyPosts {
  const monday = mondayOf(today);
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const m = addDays(monday, -7 * i);
    const count = postsWeek(state, m);
    return { monday: m, count, meetsMinimum: count >= MIN_SEMANAL };
  }).reverse();
  return {
    weeks,
    current: weeks[weeks.length - 1].count,
    max: Math.max(MIN_SEMANAL, ...weeks.map((w) => w.count)),
  };
}
