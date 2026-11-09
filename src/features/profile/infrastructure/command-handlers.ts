import { eq } from "drizzle-orm";
import type { CommandHandlers } from "@/features/sync/infrastructure/command-handler";
import { careerBase, personalBrand, profiles } from "./schema";

/** Profile, weekly goal, career base and personal brand: singleton rows that always exist before a command runs. */
export const profileHandlers = {
  "profile.setFields": async (tx, userId, { fields }) => {
    await tx.update(profiles).set(fields).where(eq(profiles.userId, userId));
  },
  "goal.set": async (tx, userId, { goal, goalSet }) => {
    await tx.update(profiles).set({ goal: Math.trunc(goal), goalSet }).where(eq(profiles.userId, userId));
  },
  "base.setFields": async (tx, userId, { fields }) => {
    await tx.update(careerBase).set(fields).where(eq(careerBase.userId, userId));
  },
  "brand.setFields": async (tx, userId, { fields }) => {
    await tx.update(personalBrand).set(fields).where(eq(personalBrand.userId, userId));
  },
} satisfies CommandHandlers;
