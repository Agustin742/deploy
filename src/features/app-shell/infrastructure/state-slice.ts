import { eq } from "drizzle-orm";
import { flag } from "@/shared/db/rows";
import type { StateSlice } from "@/features/state/infrastructure/state-slice";
import { userModules } from "./schema";

/** Optional modules switched on by the user ("mods"). */
export const modsSlice: StateSlice = {
  async read(db, userId) {
    const [m] = await db.select().from(userModules).where(eq(userModules.userId, userId));
    if (!m) return {};
    return {
      mods: {
        valores: m.valores,
        marca: m.marca,
        empleadores: m.empleadores,
        seguimiento: m.seguimiento,
        informativas: m.informativas,
        experimentos: m.experimentos,
        visibilidad: m.visibilidad,
        ia: m.ia,
      },
    };
  },

  async clear(tx, userId) {
    await tx.delete(userModules).where(eq(userModules.userId, userId));
  },

  async write(tx, userId, s) {
    const m = s.mods;
    await tx.insert(userModules).values({
      userId,
      valores: flag(m.valores),
      marca: flag(m.marca),
      empleadores: flag(m.empleadores),
      seguimiento: flag(m.seguimiento),
      informativas: flag(m.informativas),
      experimentos: flag(m.experimentos),
      visibilidad: flag(m.visibilidad),
      ia: flag(m.ia),
    });
  },
};
