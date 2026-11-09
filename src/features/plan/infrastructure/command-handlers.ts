import { and, eq } from "drizzle-orm";
import { insertRows } from "@/shared/db/rows";
import type { CommandHandlers } from "@/features/sync/infrastructure/command-handler";
import { planTargets, planWeekVars } from "./schema";

/** Weekly indicator variables and targets. Objectives are a registry (see the registries feature). */
export const planHandlers = {
  "plan.setWeekVars": async (tx, userId, { week, varIds }) => {
    await tx.delete(planWeekVars).where(and(eq(planWeekVars.userId, userId), eq(planWeekVars.week, week)));
    await insertRows(
      tx,
      planWeekVars,
      [...new Set(varIds)].map((varId, position) => ({ userId, week, varId, position })),
    );
  },
  "plan.setTarget": async (tx, userId, { key, value }) => {
    await tx
      .insert(planTargets)
      .values({ userId, targetKey: key, value })
      .onDuplicateKeyUpdate({ set: { value } });
  },
} satisfies CommandHandlers;
