import { asc, eq } from "drizzle-orm";
import { flag, insertRows, str } from "@/shared/db/rows";
import type { Application, Interview, MatchSuccess } from "@/features/state/domain/types";
import type { StateSlice } from "@/features/state/infrastructure/state-slice";
import { applicationChecklist, applications, interviews } from "./schema";

/** Applications with their interviews and preparation checklist ("pre"). */
export const applicationsSlice: StateSlice = {
  async read(db, userId) {
    const apps = await db
      .select()
      .from(applications)
      .where(eq(applications.userId, userId))
      .orderBy(asc(applications.position));
    const ivs = await db
      .select()
      .from(interviews)
      .where(eq(interviews.userId, userId))
      .orderBy(asc(interviews.position));
    const items = await db
      .select()
      .from(applicationChecklist)
      .where(eq(applicationChecklist.userId, userId));

    const interviewsByApp = new Map<string, Interview[]>();
    for (const i of ivs) {
      const list = interviewsByApp.get(i.applicationId) ?? [];
      list.push({
        id: i.id,
        fecha: i.fecha,
        etapa: i.etapa,
        preguntas: i.preguntas,
        respondi: i.respondi,
        prep: i.prep,
        feedback: i.feedback,
        aprendi: i.aprendi,
        proximo: i.proximo,
      });
      interviewsByApp.set(i.applicationId, list);
    }
    const preByApp = new Map<string, NonNullable<Application["pre"]>>();
    for (const c of items) {
      const pre = preByApp.get(c.applicationId) ?? {};
      pre[c.itemKey] = { ok: c.ok, txt: c.txt };
      preByApp.set(c.applicationId, pre);
    }

    return {
      apps: apps.map((a): Application => {
        const app: Application = {
          id: a.id,
          fecha: a.fecha,
          empresa: a.empresa,
          puesto: a.puesto,
          link: a.link,
          fuente: a.fuente,
          estado: a.estado,
          respuesta: a.respuesta,
          reclutador: a.reclutador,
          contacto: a.contacto,
          proximos: a.proximos,
          comentarios: a.comentarios,
          jd: a.jd,
          match: (a.match as MatchSuccess | null) ?? null,
          report: a.report,
          entrevistas: interviewsByApp.get(a.id) ?? [],
          revisado: a.revisado,
          hallazgos: a.hallazgos,
          ficha: {
            industria: a.fichaIndustria,
            tamano: a.fichaTamano,
            modalidad: a.fichaModalidad,
            valores: a.fichaValores,
            cultura: a.fichaCultura,
            notas: a.fichaNotas,
          },
        };
        const pre = preByApp.get(a.id);
        if (pre) app.pre = pre;
        return app;
      }),
    };
  },

  // Interviews and checklist rows go with their application (ON DELETE CASCADE).
  async clear(tx, userId) {
    await tx.delete(applications).where(eq(applications.userId, userId));
  },

  async write(tx, userId, s) {
    // Duplicate ids can exist in old backups; the primary key keeps the first one.
    const apps = [...new Map(s.apps.map((a) => [a.id, a])).values()];
    await insertRows(
      tx,
      applications,
      apps.map((a, position) => ({
        userId,
        id: a.id,
        fecha: str(a.fecha),
        empresa: str(a.empresa),
        puesto: str(a.puesto),
        link: str(a.link),
        fuente: str(a.fuente),
        estado: str(a.estado),
        respuesta: str(a.respuesta),
        reclutador: str(a.reclutador),
        contacto: str(a.contacto),
        proximos: str(a.proximos),
        comentarios: str(a.comentarios),
        jd: str(a.jd),
        match: a.match ?? null,
        report: str(a.report),
        revisado: flag(a.revisado),
        hallazgos: str(a.hallazgos),
        fichaIndustria: str(a.ficha?.industria),
        fichaTamano: str(a.ficha?.tamano),
        fichaModalidad: str(a.ficha?.modalidad),
        fichaValores: str(a.ficha?.valores),
        fichaCultura: str(a.ficha?.cultura),
        fichaNotas: str(a.ficha?.notas),
        position,
      })),
    );

    await insertRows(
      tx,
      interviews,
      apps.flatMap((a) =>
        [...new Map((a.entrevistas ?? []).map((i) => [i.id, i])).values()].map((i, position) => ({
          userId,
          applicationId: a.id,
          id: i.id,
          fecha: str(i.fecha),
          etapa: str(i.etapa),
          preguntas: str(i.preguntas),
          respondi: str(i.respondi),
          prep: str(i.prep),
          feedback: str(i.feedback),
          aprendi: str(i.aprendi),
          proximo: str(i.proximo),
          position,
        })),
      ),
    );

    await insertRows(
      tx,
      applicationChecklist,
      apps.flatMap((a) =>
        Object.entries(a.pre ?? {}).map(([itemKey, item]) => ({
          userId,
          applicationId: a.id,
          itemKey,
          ok: flag(item?.ok),
          txt: str(item?.txt),
        })),
      ),
    );
  },
};
