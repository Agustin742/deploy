import { eq } from "drizzle-orm";
import { flag, str } from "@/shared/db/rows";
import type { StateSlice } from "@/features/state/infrastructure/state-slice";
import { careerBase, personalBrand, profiles } from "./schema";

/**
 * Profile, weekly goal, review frequency, career base and personal brand.
 * The profiles row marks that the user has saved state at all.
 */
export const profileSlice: StateSlice = {
  async read(db, userId) {
    const [p] = await db.select().from(profiles).where(eq(profiles.userId, userId));
    if (!p) return {};
    const [b] = await db.select().from(careerBase).where(eq(careerBase.userId, userId));
    const [m] = await db.select().from(personalBrand).where(eq(personalBrand.userId, userId));
    return {
      profile: {
        name: p.name,
        nameAuto: p.nameAuto,
        shareName: p.shareName,
        headline: p.headline,
        years: p.years,
        english: p.english,
        extraSkills: p.extraSkills,
        cv: p.cv,
      },
      goal: p.goal,
      goalSet: p.goalSet,
      revFreq: p.revFreq,
      base: b && {
        activos: b.activos,
        aspiraciones: b.aspiraciones,
        mercado: b.mercado,
        sintesis: b.sintesis,
        objetivoLaboral: b.objetivoLaboral,
      },
      marca: m && {
        promesa: m.promesa,
        audiencia: m.audiencia,
        historia: m.historia,
        titular: m.titular,
      },
    };
  },

  async clear(tx, userId) {
    await tx.delete(profiles).where(eq(profiles.userId, userId));
    await tx.delete(careerBase).where(eq(careerBase.userId, userId));
    await tx.delete(personalBrand).where(eq(personalBrand.userId, userId));
  },

  async write(tx, userId, s) {
    await tx.insert(profiles).values({
      userId,
      name: str(s.profile.name),
      nameAuto: flag(s.profile.nameAuto),
      shareName: flag(s.profile.shareName),
      headline: str(s.profile.headline),
      years: str(s.profile.years),
      english: str(s.profile.english),
      extraSkills: str(s.profile.extraSkills),
      cv: str(s.profile.cv),
      goal: Number.isFinite(s.goal) ? Math.trunc(s.goal) : 0,
      goalSet: flag(s.goalSet),
      revFreq: str(s.revFreq),
    });
    await tx.insert(careerBase).values({
      userId,
      activos: str(s.base.activos),
      aspiraciones: str(s.base.aspiraciones),
      mercado: str(s.base.mercado),
      sintesis: str(s.base.sintesis),
      objetivoLaboral: str(s.base.objetivoLaboral),
    });
    await tx.insert(personalBrand).values({
      userId,
      promesa: str(s.marca.promesa),
      audiencia: str(s.marca.audiencia),
      historia: str(s.marca.historia),
      titular: str(s.marca.titular),
    });
  },
};
