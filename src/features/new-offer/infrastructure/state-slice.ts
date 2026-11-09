import { eq } from "drizzle-orm";
import { str } from "@/shared/db/rows";
import type { StateSlice } from "@/features/state/infrastructure/state-slice";
import { drafts } from "./schema";

/** The unsaved new-offer form ("draft"). */
export const draftSlice: StateSlice = {
  async read(db, userId) {
    const [d] = await db.select().from(drafts).where(eq(drafts.userId, userId));
    if (!d) return {};
    return {
      draft: {
        empresa: d.empresa,
        puesto: d.puesto,
        link: d.link,
        fuente: d.fuente,
        estado: d.estado,
        jd: d.jd,
      },
    };
  },

  async clear(tx, userId) {
    await tx.delete(drafts).where(eq(drafts.userId, userId));
  },

  async write(tx, userId, s) {
    await tx.insert(drafts).values({
      userId,
      empresa: str(s.draft.empresa),
      puesto: str(s.draft.puesto),
      link: str(s.draft.link),
      fuente: str(s.draft.fuente),
      estado: str(s.draft.estado),
      jd: str(s.draft.jd),
    });
  },
};
