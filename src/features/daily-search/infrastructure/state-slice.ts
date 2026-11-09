import { asc, eq } from "drizzle-orm";
import { insertRows, str } from "@/shared/db/rows";
import type { AppState, Platform } from "@/features/state/domain/types";
import type { StateSlice } from "@/features/state/infrastructure/state-slice";
import { platforms, searchChecks } from "./schema";

const MONTH = /^\d{4}-\d{2}$/;

/** Search pages and the days checked per month ("platforms" and "checks"). */
export const dailySearchSlice: StateSlice = {
  async read(db, userId) {
    const pages = await db
      .select()
      .from(platforms)
      .where(eq(platforms.userId, userId))
      .orderBy(asc(platforms.position));
    const rows = await db
      .select()
      .from(searchChecks)
      .where(eq(searchChecks.userId, userId))
      .orderBy(asc(searchChecks.month), asc(searchChecks.platformId), asc(searchChecks.day));

    const checks: AppState["checks"] = {};
    for (const r of rows) ((checks[r.month] ??= {})[r.platformId] ??= []).push(r.day);

    return {
      platforms: pages.map((p): Platform => {
        const page: Platform = { id: p.id, name: p.name, url: p.url };
        if (p.custom) page.custom = true;
        return page;
      }),
      checks,
    };
  },

  // Search checks go with their platform (ON DELETE CASCADE).
  async clear(tx, userId) {
    await tx.delete(platforms).where(eq(platforms.userId, userId));
  },

  async write(tx, userId, s) {
    const pages = [...new Map(s.platforms.map((p) => [p.id, p])).values()];
    await insertRows(
      tx,
      platforms,
      pages.map((p, position) => ({
        userId,
        id: p.id,
        name: str(p.name),
        url: str(p.url),
        custom: p.custom === true,
        position,
      })),
    );

    // Checks of a platform that no longer exists would violate the FK: drop them.
    const known = new Set(pages.map((p) => p.id));
    const rows = Object.entries(s.checks ?? {}).flatMap(([month, byPlatform]) =>
      !MONTH.test(month) || !byPlatform
        ? []
        : Object.entries(byPlatform)
            .filter(([platformId]) => known.has(platformId))
            .flatMap(([platformId, days]) =>
              [...new Set(Array.isArray(days) ? days : [])]
                .filter((d) => Number.isInteger(d) && d >= 1 && d <= 31)
                .map((day) => ({ userId, month, platformId, day })),
            ),
    );
    await insertRows(tx, searchChecks, rows);
  },
};
