import { asc, eq } from "drizzle-orm";
import { flag, insertRows, str } from "@/shared/db/rows";
import type { StateSlice } from "@/features/state/infrastructure/state-slice";
import {
  employers,
  experiments,
  metrics,
  networkRecords,
  posts,
  restDays,
  reviews,
  timeLogs,
} from "./schema";

/** Drops repeated ids (old backups) so the (user, id) primary key never rejects the insert. */
const unique = <T extends { id: string }>(items: T[] | undefined): T[] => [
  ...new Map((items ?? []).map((i) => [i.id, i])).values(),
];

/** The registries: network, posts, time, reviews, employers, experiments, metrics and rest days. */
export const registriesSlice: StateSlice = {
  async read(db, userId) {
    const [red, post, tiempos, revisiones, empleadores, experimentos, metricas, descansos] = await Promise.all([
      db.select().from(networkRecords).where(eq(networkRecords.userId, userId)).orderBy(asc(networkRecords.position)),
      db.select().from(posts).where(eq(posts.userId, userId)).orderBy(asc(posts.position)),
      db.select().from(timeLogs).where(eq(timeLogs.userId, userId)).orderBy(asc(timeLogs.position)),
      db.select().from(reviews).where(eq(reviews.userId, userId)).orderBy(asc(reviews.position)),
      db.select().from(employers).where(eq(employers.userId, userId)).orderBy(asc(employers.position)),
      db.select().from(experiments).where(eq(experiments.userId, userId)).orderBy(asc(experiments.position)),
      db.select().from(metrics).where(eq(metrics.userId, userId)).orderBy(asc(metrics.position)),
      db.select().from(restDays).where(eq(restDays.userId, userId)).orderBy(asc(restDays.position)),
    ]);
    // Row shape = domain shape plus the owner and position columns, which are stripped here.
    const strip = <T extends { userId: string; position: number }>(row: T): Omit<T, "userId" | "position"> => {
      const rest: Partial<T> = { ...row };
      delete rest.userId;
      delete rest.position;
      return rest as Omit<T, "userId" | "position">;
    };
    return {
      red: red.map(strip),
      posts: post.map(strip),
      tiempos: tiempos.map(strip),
      revisiones: revisiones.map(strip),
      empleadores: empleadores.map(strip),
      experimentos: experimentos.map(strip),
      metricas: metricas.map(strip),
      descansos: descansos.map(strip),
    };
  },

  async clear(tx, userId) {
    await tx.delete(networkRecords).where(eq(networkRecords.userId, userId));
    await tx.delete(posts).where(eq(posts.userId, userId));
    await tx.delete(timeLogs).where(eq(timeLogs.userId, userId));
    await tx.delete(reviews).where(eq(reviews.userId, userId));
    await tx.delete(employers).where(eq(employers.userId, userId));
    await tx.delete(experiments).where(eq(experiments.userId, userId));
    await tx.delete(metrics).where(eq(metrics.userId, userId));
    await tx.delete(restDays).where(eq(restDays.userId, userId));
  },

  async write(tx, userId, s) {
    await insertRows(
      tx,
      networkRecords,
      unique(s.red).map((r, position) => ({
        userId,
        id: r.id,
        fecha: str(r.fecha),
        conexiones: str(r.conexiones),
        paginas: str(r.paginas),
        nota: str(r.nota),
        position,
      })),
    );
    await insertRows(
      tx,
      posts,
      unique(s.posts).map((p, position) => ({
        userId,
        id: p.id,
        fecha: str(p.fecha),
        tipo: str(p.tipo),
        tema: str(p.tema),
        url: str(p.url),
        interacciones: str(p.interacciones),
        position,
      })),
    );
    await insertRows(
      tx,
      timeLogs,
      unique(s.tiempos).map((t, position) => ({
        userId,
        id: t.id,
        fecha: str(t.fecha),
        actividad: str(t.actividad),
        est: str(t.est),
        real: str(t.real),
        nota: str(t.nota),
        position,
      })),
    );
    await insertRows(
      tx,
      reviews,
      unique(s.revisiones).map((r, position) => ({
        userId,
        id: r.id,
        fecha: str(r.fecha),
        desde: str(r.desde),
        hasta: str(r.hasta),
        avanzo: str(r.avanzo),
        hice: str(r.hice),
        aprendi: str(r.aprendi),
        ajuste: str(r.ajuste),
        no: str(r.no),
        aplicado: flag(r.aplicado),
        position,
      })),
    );
    await insertRows(
      tx,
      employers,
      unique(s.empleadores).map((e, position) => ({
        userId,
        id: e.id,
        empresa: str(e.empresa),
        quien: str(e.quien),
        motivacion: str(e.motivacion),
        posting: str(e.posting),
        prioridad: str(e.prioridad),
        notas: str(e.notas),
        position,
      })),
    );
    await insertRows(
      tx,
      experiments,
      unique(s.experimentos).map((e, position) => ({
        userId,
        id: e.id,
        rol: str(e.rol),
        pregunta: str(e.pregunta),
        accion: str(e.accion),
        inicio: str(e.inicio),
        fin: str(e.fin),
        aprendi: str(e.aprendi),
        decision: str(e.decision),
        position,
      })),
    );
    await insertRows(
      tx,
      metrics,
      unique(s.metricas).map((m, position) => ({
        userId,
        id: m.id,
        fecha: str(m.fecha),
        fortaleza: str(m.fortaleza),
        conexiones: str(m.conexiones),
        seguidores: str(m.seguidores),
        vistas: str(m.vistas),
        interaccion: str(m.interaccion),
        articulos: str(m.articulos),
        ssi: str(m.ssi),
        notas: str(m.notas),
        position,
      })),
    );
    await insertRows(
      tx,
      restDays,
      unique(s.descansos).map((d, position) => ({
        userId,
        id: d.id,
        fecha: str(d.fecha),
        nota: str(d.nota),
        cumplido: flag(d.cumplido),
        position,
      })),
    );
  },
};
