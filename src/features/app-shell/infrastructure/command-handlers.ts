import { eq } from "drizzle-orm";
import type { CommandHandlers } from "@/features/sync/infrastructure/command-handler";
import { userModules } from "./schema";

export const modulesHandlers = {
  "module.set": async (tx, userId, { mod, enabled }) => {
    await tx
      .update(userModules)
      .set({ [mod]: enabled })
      .where(eq(userModules.userId, userId));
  },
} satisfies CommandHandlers;
