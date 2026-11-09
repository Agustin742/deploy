import { eq } from "drizzle-orm";
import { blank } from "@/features/state/domain/state";
import type { CommandHandlers } from "@/features/sync/infrastructure/command-handler";
import { drafts } from "./schema";

export const draftHandlers = {
  "draft.setFields": async (tx, userId, { fields }) => {
    await tx.update(drafts).set(fields).where(eq(drafts.userId, userId));
  },
  "draft.clear": async (tx, userId) => {
    await tx.update(drafts).set(blank().draft).where(eq(drafts.userId, userId));
  },
} satisfies CommandHandlers;
