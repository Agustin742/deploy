import { asc, eq } from "drizzle-orm";
import { insertRows, str } from "@/shared/db/rows";
import type { Objetivo } from "@/features/state/domain/types";
import type { StateSlice } from "@/features/state/infrastructure/state-slice";
import { objectives, planTargets, planWeekVars } from "./schema";

/** Objectives, targets ("metas") and the indicator variables picked per week ("planVars"). */
export const planSlice: StateSlice = {
  async read(db, userId) {
    const objs = await db
      .select()
      .from(objectives)
      .where(eq(objectives.userId, userId))
      .orderBy(asc(objectives.position));
    const targets = await db.select().from(planTargets).where(eq(planTargets.userId, userId));
    const vars = await db
      .select()
      .from(planWeekVars)
      .where(eq(planWeekVars.userId, userId))
      .orderBy(asc(planWeekVars.week), asc(planWeekVars.position));

    const metas: Record<string, string> = {};
    for (const t of targets) metas[t.targetKey] = t.value;
    const planVars: Record<string, string[]> = {};
    for (const v of vars) (planVars[v.week] ??= []).push(v.varId);

    return {
      objetivos: objs.map(
        (o): Objetivo => ({
          id: o.id,
          periodo: o.periodo as Objetivo["periodo"],
          semana: o.semana,
          mes: o.mes,
          variable: o.variable,
          objetivo: o.objetivo,
          valor: o.valor,
          adapt: o.adapt,
          recursos: o.recursos,
          plazo: o.plazo,
          prioridad: o.prioridad,
          indicador: o.indicador,
          tipoInd: o.tipoInd,
          meta: o.meta,
          estado: o.estado,
          doneAt: o.doneAt,
        }),
      ),
      metas,
      planVars,
    };
  },

  async clear(tx, userId) {
    await tx.delete(objectives).where(eq(objectives.userId, userId));
    await tx.delete(planTargets).where(eq(planTargets.userId, userId));
    await tx.delete(planWeekVars).where(eq(planWeekVars.userId, userId));
  },

  async write(tx, userId, s) {
    const objs = [...new Map(s.objetivos.map((o) => [o.id, o])).values()];
    await insertRows(
      tx,
      objectives,
      objs.map((o, position) => ({
        userId,
        id: o.id,
        periodo: str(o.periodo),
        semana: str(o.semana),
        mes: str(o.mes),
        variable: str(o.variable),
        objetivo: str(o.objetivo),
        valor: str(o.valor),
        adapt: str(o.adapt),
        recursos: str(o.recursos),
        plazo: str(o.plazo),
        prioridad: str(o.prioridad),
        indicador: str(o.indicador),
        tipoInd: str(o.tipoInd),
        meta: str(o.meta),
        estado: str(o.estado),
        doneAt: str(o.doneAt),
        position,
      })),
    );
    await insertRows(
      tx,
      planTargets,
      Object.entries(s.metas ?? {}).map(([targetKey, value]) => ({ userId, targetKey, value: str(value) })),
    );
    await insertRows(
      tx,
      planWeekVars,
      Object.entries(s.planVars ?? {}).flatMap(([week, ids]) =>
        [...new Set(Array.isArray(ids) ? ids : [])].map((varId, position) => ({ userId, week, varId, position })),
      ),
    );
  },
};
